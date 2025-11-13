using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    //[Authorize(Roles = "Distributor")]
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly EmployeeService _service;
        private readonly MongoDbService _db;
        

        public EmployeesController(EmployeeService service, MongoDbService db)
        {
            _service = service;
            _db = db;

        }
        [HttpGet("{distributorId}")]
        public async Task<IActionResult> GetEmployees(string distributorId)
        {
            var employees = await _service.GetEmployeesAsync(distributorId);
            return Ok(employees);
        }

        [HttpPost("{distributorId}")]
        public async Task<IActionResult> Add(string distributorId, [FromBody] Employee emp)
        {
            // ✅ Check if email or phone already exists in Employees
            var existingEmp = await _db.Employees
                .Find(e => e.Email == emp.Email || e.PhoneNumber == emp.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existingEmp != null)
            {
                if (existingEmp.Email == emp.Email)
                    return BadRequest("An employee with this email already exists.");
                if (existingEmp.PhoneNumber == emp.PhoneNumber)
                    return BadRequest("An employee with this phone number already exists.");
            }

            // ✅ Check in Users collection as well to prevent cross-role duplicates
            var existingUser = await _db.Users
                .Find(u => u.Email == emp.Email || u.PhoneNumber == emp.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existingUser != null)
            {
                if (existingUser.Email == emp.Email)
                    return BadRequest("This email is already used by another user.");
                if (existingUser.PhoneNumber == emp.PhoneNumber)
                    return BadRequest("This phone number is already used by another user.");
            }

            // ✅ Ensure EmployeeId exists
            if (string.IsNullOrEmpty(emp.EmployeeId))
            {
                emp.EmployeeId = ObjectId.GenerateNewId().ToString();
            }

            // ✅ Assign required default properties
            emp.DistributorId = distributorId;
            emp.IsRegistered = false;
            emp.IsActive = true;

            // ✅ Add to Employees collection
            var addedEmployee = await _service.AddEmployeeAsync(emp);

            // ✅ Add to Users collection (if not already exists)
            var userExists = await _db.Users
                .Find(u => u.Email == emp.Email && u.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (userExists == null)
            {
                var newUser = new User
                {
                    Email = emp.Email,
                    PhoneNumber = emp.PhoneNumber,
                    Role = "Employee",
                    DistributorId = distributorId,
                    Username = emp.Name,
                    IsRegistered = false,
                    IsActive = emp.IsActive,
                    EmployeeId = emp.EmployeeId
                };

                await _db.Users.InsertOneAsync(newUser);
            }

            return Ok(new
            {
                message = "Employee added successfully. They can register to set password.",
                employee = addedEmployee
            });
        }
        // ✅ Update employee
        [HttpPut("{distributorId}/{employeeId}")]
        public async Task<IActionResult> Update(string distributorId, string employeeId, [FromBody] Employee emp)
        {
            // ✅ Check if email or phone is already used by another employee (excluding current employee)
            var existingEmp = await _db.Employees
                .Find(e => (e.Email == emp.Email || e.PhoneNumber == emp.PhoneNumber) && e.EmployeeId != employeeId)
                .FirstOrDefaultAsync();

            if (existingEmp != null)
            {
                if (existingEmp.Email == emp.Email)
                    return BadRequest("An employee with this email already exists.");
                if (existingEmp.PhoneNumber == emp.PhoneNumber)
                    return BadRequest("An employee with this phone number already exists.");
            }

            // ✅ Check in Users collection as well
            var existingUser = await _db.Users
                .Find(u => (u.Email == emp.Email || u.PhoneNumber == emp.PhoneNumber)
                          && u.DistributorId == distributorId
                          && u.EmployeeId != employeeId)
                .FirstOrDefaultAsync();

            if (existingUser != null)
            {
                if (existingUser.Email == emp.Email)
                    return BadRequest("This email is already used by another user.");
                if (existingUser.PhoneNumber == emp.PhoneNumber)
                    return BadRequest("This phone number is already used by another user.");
            }

            var updated = await _service.UpdateEmployeeAsync(distributorId, employeeId, emp);
            if (updated == null) return NotFound("Employee not found.");

            // Sync user data
            var updateUser = Builders<User>.Update
                .Set(u => u.Username, emp.Name)
                .Set(u => u.Email, emp.Email)
                .Set(u => u.IsActive, emp.IsActive);

            await _db.Users.UpdateOneAsync(
     u => u.DistributorId == distributorId && u.Email == updated.Email,
     updateUser);

            return Ok(new
            {
                message = "Employee updated successfully!",
                employee = updated
            });
        }

        // ✅ Delete employee
        [HttpDelete("{distributorId}/{employeeId}")]
        public async Task<IActionResult> Delete(string distributorId, string employeeId)
        {
            // Get employee first (so we have their email)
            var employees = await _service.GetEmployeesAsync(distributorId);
            var emp = employees.FirstOrDefault(e => e.EmployeeId == employeeId);
            if (emp == null) return NotFound("Employee not found.");

            var deleted = await _service.DeleteEmployeeAsync(distributorId, employeeId);
            if (!deleted) return NotFound("Employee not found.");

            // Delete user record
            await _db.Users.DeleteOneAsync(u => u.DistributorId == distributorId && u.Email == emp.Email);

            return Ok("Employee deleted successfully.");
        }

        // ✅ Toggle employee active/inactive
        [HttpPatch("toggle/{distributorId}/{employeeId}")]
        public async Task<IActionResult> ToggleActive(string distributorId, string employeeId)
        {
            var updated = await _service.ToggleActiveAsync(distributorId, employeeId);
            if (updated == null) return NotFound("Employee not found.");

            // Sync with Users collection
            var filter = Builders<User>.Filter.Eq(u => u.Email, updated.Email) &
                         Builders<User>.Filter.Eq(u => u.DistributorId, distributorId);

            var update = Builders<User>.Update.Set(u => u.IsActive, updated.IsActive);
            await _db.Users.UpdateOneAsync(filter, update);

            return Ok(updated);
        }
        // GET: api/employee/orders
        // Get orders assigned to currently logged-in employee
        [HttpGet]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? status = null)
        {
            // Use a claim to identify the employee (EmployeeId claim expected)
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var filter = Builders<Order>.Filter.Eq(o => o.EmployeeId, employeeId);
            if (!string.IsNullOrEmpty(status))
                filter &= Builders<Order>.Filter.Eq(o => o.Status, status);

            var orders = await _db.Orders.Find(filter).SortByDescending(o => o.OrderDate).ToListAsync();
            return Ok(orders);
        }
       
        // PUT: api/employee/orders/{orderId}/status
        // Employee updates status e.g., Delivered, Shipped (if you allow), FailedDelivery
        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> UpdateOrderStatus(string orderId, [FromBody] EmployeeUpdateStatusDto dto)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            var employeeName = User.FindFirst("Name")?.Value ?? User.FindFirst("username")?.Value;

            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            // Ensure this order is assigned to this employee
            if (order.EmployeeId != employeeId)
                return Forbid("Not authorized to update this order");

            var requestedStatus = (dto?.Status ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            // Allowable transitions: Assigned -> Shipped -> Delivered OR Assigned -> FailedDelivery, etc.
            // Basic guard: don't allow arbitrary change from Delivered to something else
            if (order.Status == "Delivered")
                return BadRequest("Cannot change status of a delivered order");

            var updates = Builders<Order>.Update
                .Set(o => o.Status, requestedStatus)
                .Set(o => o.DeliveryRemarks, dto.Remarks);

            if (requestedStatus == "Delivered")
            {
                updates = updates.Set(o => o.DeliveredOn, DateTime.UtcNow);

                if (dto.PaymentCollected)
                {
                    updates = updates
                        .Set(o => o.PaymentCollectedByEmployee, true)
                        .Set(o => o.CollectedAmount, dto.CollectedAmount ?? order.TotalAmount)
                        .Set(o => o.PaymentMethod, dto.PaymentMethod ?? "COD")
                        .Set(o => o.CollectedOn, DateTime.UtcNow);
                }
            }

            if (requestedStatus == "FailedDelivery" || requestedStatus == "Returned")
            {
                // you can set special fields or notes if needed
                updates = updates.Set(o => o.DeliveryRemarks, dto.Remarks ?? "Failed delivery");
            }

            // persist employee info who updated (optional)
            updates = updates.Set(o => o.Name, employeeName ?? order.Name);

            var res = await _db.Orders.UpdateOneAsync(o => o.Id == orderId, updates);
            if (res.ModifiedCount == 0) return StatusCode(500, "Failed to update order status");

            return Ok(new { message = "Order status updated", status = requestedStatus });
        }

        // Optional: employee mark that they picked up the order from distributor/warehouse (sets status to Shipped or InTransit)
        [HttpPut("{orderId}/pickup")]
        public async Task<IActionResult> PickupOrder(string orderId)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Forbid("Not authorized for this order");

            var update = Builders<Order>.Update
                .Set(o => o.Status, "Shipped")
                .Set(o => o.AssignedOn, order.AssignedOn ?? DateTime.UtcNow);

            var res = await _db.Orders.UpdateOneAsync(o => o.Id == orderId, update);
            if (res.ModifiedCount == 0) return StatusCode(500, "Failed to mark pickup");

            return Ok(new { message = "Order picked up (status=Shipped)" });
        }

       [Authorize(Roles = "Employee")]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var employee = await _db.Employees
                .Find(e => e.EmployeeId == employeeId)
                .FirstOrDefaultAsync();

            if (employee == null)
                return NotFound("Employee not found");

            return Ok(employee);
        }

        [Authorize(Roles = "Employee")]
        [HttpPut("my-profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] EmployeeUpdateDto dto)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var update = Builders<Employee>.Update
                .Set(e => e.PhoneNumber, dto.PhoneNumber)
                .Set(e => e.Address, dto.Address)
                .Set(e => e.Name, dto.Name)
                .Set(e => e.Email, dto.Email);

            var result = await _db.Employees.UpdateOneAsync(e => e.EmployeeId == employeeId, update);

            if (result.ModifiedCount == 0)
                return NotFound("Employee not found or no changes made");

            return Ok(new { message = "Profile updated successfully" });
        }

        [Authorize(Roles = "Employee")]
        [HttpPost("my-profile/upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfileImage([FromForm] IFormFile file)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            if (file == null || file.Length == 0)
                return BadRequest("File is empty");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            var update = Builders<Employee>.Update
                .Set(e => e.ProfileImageData, bytes)
                .Set(e => e.ProfileImageName, file.FileName)
                .Set(e => e.ProfileImageType, file.ContentType);

            var result = await _db.Employees.UpdateOneAsync(
                e => e.EmployeeId == employeeId, update);

            if (result.ModifiedCount == 0)
                return NotFound("Employee not found or image not updated");

            return Ok(new { message = "Profile image uploaded successfully!" });
        }

        [Authorize(Roles = "Employee")]
        [HttpGet("my-profile/image")]
        public async Task<IActionResult> GetMyProfileImage()
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var emp = await _db.Employees
                .Find(e => e.EmployeeId == employeeId)
                .FirstOrDefaultAsync();

            if (emp == null || emp.ProfileImageData == null)
                return NotFound("No image found for this employee");

            return File(emp.ProfileImageData, emp.ProfileImageType ?? "image/jpeg", emp.ProfileImageName);
        }



    }
}
