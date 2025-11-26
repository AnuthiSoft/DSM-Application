using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
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

        // ============================================================
        // GET MY PROFILE (EMPLOYEE PORTAL)
        // ============================================================
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing in token");

            var user = await _db.Users.Find(u => u.EmployeeId == employeeId)
                                      .FirstOrDefaultAsync();

            if (user == null)
                return NotFound("Employee profile not found");

            return Ok(new
            {
                name = user.Name,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                address = user.Address
            });
        }

        // ============================================================
        // UPDATE MY PROFILE (EMPLOYEE PORTAL)
        // ============================================================
        [HttpPut("my-profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] EmployeeUpdateDto dto)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing in token");

            var update = Builders<User>.Update
                .Set(u => u.Name, dto.Name)
                .Set(u => u.Email, dto.Email)           // duplicates allowed
                .Set(u => u.PhoneNumber, dto.PhoneNumber)
                .Set(u => u.Address, dto.Address);

            var result = await _db.Users.UpdateOneAsync(
                u => u.EmployeeId == employeeId, update);

            if (result.ModifiedCount == 0)
                return NotFound("Employee not found or unchanged");

            return Ok(new { message = "Profile updated successfully" });
        }

        // ============================================================
        // GET EMPLOYEES OF DISTRIBUTOR
        // ============================================================
        [HttpGet("{distributorId:length(24)}")]
        public async Task<IActionResult> GetEmployees(string distributorId)
        {
            var employees = await _service.GetEmployeesAsync(distributorId);
            return Ok(employees);
        }

        // ============================================================
        // ADD EMPLOYEE  (EMPLOYEE DUPLICATES ALLOWED!)
        // ============================================================
        [HttpPost("{distributorId}")]
        public async Task<IActionResult> Add(string distributorId, [FromBody] Employee emp)
        {
            // Employee duplicates allowed → no duplicate checks here

            if (string.IsNullOrEmpty(emp.EmployeeId))
                emp.EmployeeId = ObjectId.GenerateNewId().ToString();

            emp.DistributorId = distributorId;
            emp.IsActive = true;
            emp.IsRegistered = false;

            // Insert into Employees
            var addedEmployee = await _service.AddEmployeeAsync(emp);

            // Insert/Sync into Users
            var newUser = new User
            {
                Email = emp.Email,
                PhoneNumber = emp.PhoneNumber,
                Role = "Employee",
                DistributorId = distributorId,
                Username = emp.Name,
                IsRegistered = false,
                IsActive = true,
                EmployeeId = emp.EmployeeId,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Users.InsertOneAsync(newUser);

            return Ok(new
            {
                message = "Employee added successfully",
                employee = addedEmployee
            });
        }

        // ============================================================
        // UPDATE EMPLOYEE (NO DUPLICATE CHECK REQUIRED)
        // ============================================================
        [HttpPut("{distributorId}/{employeeId}")]
        public async Task<IActionResult> Update(string distributorId, string employeeId, [FromBody] Employee emp)
        {
            // Update Employee record
            var updated = await _service.UpdateEmployeeAsync(distributorId, employeeId, emp);
            if (updated == null) return NotFound("Employee not found");

            // Sync into Users
            await _db.Users.UpdateOneAsync(
                u => u.EmployeeId == updated.EmployeeId,
                Builders<User>.Update
                    .Set(u => u.Username, updated.Name)
                    .Set(u => u.Email, updated.Email)
                    .Set(u => u.PhoneNumber, updated.PhoneNumber)
                    .Set(u => u.IsActive, updated.IsActive));

            return Ok(new
            {
                message = "Employee updated successfully",
                employee = updated
            });
        }

        // ============================================================
        // DELETE EMPLOYEE
        // ============================================================
        [HttpDelete("{distributorId}/{employeeId}")]
        public async Task<IActionResult> Delete(string distributorId, string employeeId)
        {
            var employees = await _service.GetEmployeesAsync(distributorId);
            var emp = employees.FirstOrDefault(e => e.EmployeeId == employeeId);

            if (emp == null) return NotFound("Employee not found");

            await _service.DeleteEmployeeAsync(distributorId, employeeId);

            await _db.Users.DeleteOneAsync(
                u => u.EmployeeId == emp.EmployeeId);

            return Ok("Employee deleted successfully");
        }

        // ============================================================
        // TOGGLE ACTIVE / INACTIVE
        // ============================================================
        [HttpPatch("toggle/{distributorId}/{employeeId}")]
        public async Task<IActionResult> ToggleActive(string distributorId, string employeeId)
        {
            var updated = await _service.ToggleActiveAsync(distributorId, employeeId);
            if (updated == null) return NotFound("Employee not found");

            await _db.Users.UpdateOneAsync(
                u => u.EmployeeId == updated.EmployeeId,
                Builders<User>.Update.Set(u => u.IsActive, updated.IsActive));

            return Ok(updated);
        }

        // ============================================================
        // GET MY ORDERS
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? status = null)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing");

            var filter = Builders<Order>.Filter.Eq(o => o.EmployeeId, employeeId);

            if (!string.IsNullOrEmpty(status))
                filter &= Builders<Order>.Filter.Eq(o => o.Status, status);

            var orders = await _db.Orders.Find(filter)
                                         .SortByDescending(o => o.OrderDate)
                                         .ToListAsync();

            return Ok(orders);
        }

        // ============================================================
        // UPDATE ORDER STATUS
        // ============================================================
        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> UpdateOrderStatus(string orderId, [FromBody] EmployeeUpdateStatusDto dto)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            var employeeName = User.FindFirst("Name")?.Value
                            ?? User.FindFirst("username")?.Value;

            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing");

            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Forbid();

            var requestedStatus = dto.Status?.Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            var update = Builders<Order>.Update
                .Set(o => o.Status, requestedStatus)
                .Set(o => o.DeliveryRemarks, dto.Remarks)
                .Set(o => o.Name, employeeName);

            if (requestedStatus == "Delivered")
            {
                update = update.Set(o => o.DeliveredOn, DateTime.UtcNow);

                if (dto.PaymentCollected)
                {
                    update = update
                        .Set(o => o.PaymentCollectedByEmployee, true)
                        .Set(o => o.CollectedAmount, dto.CollectedAmount ?? order.TotalAmount)
                        .Set(o => o.PaymentMethod, dto.PaymentMethod ?? "COD")
                        .Set(o => o.CollectedOn, DateTime.UtcNow);
                }
            }

            await _db.Orders.UpdateOneAsync(o => o.Id == orderId, update);

            return Ok(new { message = "Order status updated", requestedStatus });
        }

        // ============================================================
        // PICKUP ORDER
        // ============================================================
        [HttpPut("{orderId}/pickup")]
        public async Task<IActionResult> PickupOrder(string orderId)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing");

            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Forbid();

            var update = Builders<Order>.Update
                .Set(o => o.Status, "Shipped")
                .Set(o => o.AssignedOn, order.AssignedOn ?? DateTime.UtcNow);

            await _db.Orders.UpdateOneAsync(o => o.Id == orderId, update);

            return Ok(new { message = "Order picked up (Shipped)" });
        }

        // ============================================================
        // UPLOAD PROFILE IMAGE
        // ============================================================
        [HttpPost("my-profile/upload-image")]
        public async Task<IActionResult> UploadProfileImage([FromForm] IFormFile file)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing");

            if (file == null || file.Length == 0)
                return BadRequest("Empty file");

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var update = Builders<User>.Update
                .Set(u => u.ProfileImageData, ms.ToArray())
                .Set(u => u.ProfileImageName, file.FileName)
                .Set(u => u.ProfileImageType, file.ContentType);

            await _db.Users.UpdateOneAsync(u => u.EmployeeId == employeeId, update);

            return Ok(new { message = "Image uploaded successfully" });
        }

        // ============================================================
        // GET PROFILE IMAGE
        // ============================================================
        [HttpGet("my-profile/image")]
        public async Task<IActionResult> GetMyProfileImage()
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing");

            var user = await _db.Users.Find(u => u.EmployeeId == employeeId)
                                      .FirstOrDefaultAsync();

            if (user?.ProfileImageData == null)
                return NotFound("No image found");

            return File(user.ProfileImageData, user.ProfileImageType ?? "image/jpeg", user.ProfileImageName);
        }
    }
}
