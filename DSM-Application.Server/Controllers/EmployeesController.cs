using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    //[Route("api/[controller]")]
    [Route("api/employees")]
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
                return Unauthorized("EmployeeId missing");

            var employee = await _db.Employees
                .Find(e => e.EmployeeId == employeeId)
                .FirstOrDefaultAsync();

            if (employee == null)
                return NotFound("Employee not found");

            return Ok(new
            {
                name = employee.Name,
                email = employee.Email,
                phoneNumber = employee.PhoneNumber,

                // ✅ ADDRESS FIELDS
                street = employee.Street,
                city = employee.City,
                state = employee.State,
                pincode = employee.Pincode,
                country = employee.Country,

                role = employee.Role,
                isActive = employee.IsActive,
                createdDate = employee.CreatedDate,
                updatedDate = employee.UpdatedDate
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
                return Unauthorized("EmployeeId missing");

            var update = Builders<Employee>.Update
                .Set(e => e.Name, dto.Name)
                .Set(e => e.PhoneNumber, dto.PhoneNumber)
                .Set(e => e.Street, dto.Street)
                .Set(e => e.City, dto.City)
                .Set(e => e.State, dto.State)
                .Set(e => e.Pincode, dto.Pincode)
                .Set(e => e.Country, dto.Country)
                .Set(e => e.UpdatedDate, DateTime.UtcNow);

            var result = await _db.Employees.UpdateOneAsync(
                e => e.EmployeeId == employeeId,
                update
            );

            if (result.MatchedCount == 0)
                return NotFound("Employee not found");

            return Ok(new { message = "Profile updated successfully" });
        }



        // ============================================================
        // GET EMPLOYEES OF DISTRIBUTOR
        // ============================================================
        // using MongoDB.Bson; // ensure at top of the file

        // using MongoDB.Bson; // ensure at top of the file

        [HttpGet("{distributorId}")]
        public async Task<IActionResult> GetEmployees(string distributorId)
        {
            Console.WriteLine($"Incoming distributorId: '{distributorId}'");

            var employees = await _db.Employees
                .Find(e => e.DistributorId == distributorId)
                .ToListAsync();

            Console.WriteLine($"Employees found: {employees.Count}");

            return Ok(employees);
        }











        //       [HttpGet("{distributorId}")]
        //       public async Task<IActionResult> GetEmployees(string distributorId)
        //       {
        //Console.WriteLine($"Incoming distributorId: '{distributorId}'");

        //           // 1) String match (most common)
        //           var employees = await _db.Employees
        //               .Find(e => e.DistributorId == distributorId)
        //               .ToListAsync();

        //           Console.WriteLine($"String match found: {employees.Count}");

        //           if (employees.Count > 0)
        //               return Ok(employees);

        //           // 2) Fallback: ObjectId match
        //           try
        //           {
        //               var objId = new ObjectId(distributorId);

        //               var filter = Builders<DSM_Application.Server.Models.Employee>
        //                   .Filter.Eq("DistributorId", objId);

        //               employees = await _db.Employees.Find(filter).ToListAsync();

        //               Console.WriteLine($"ObjectId match found: {employees.Count}");

        //               if (employees.Count > 0)
        //                   return Ok(employees);
        //           }
        //           catch (FormatException)
        //           {
        //               Console.WriteLine("DistributorId is not a valid ObjectId. Skipping ObjectId lookup.");
        //           }

        //           // Debug total count (to detect wrong DB/collection)
        //           long total = await _db.Employees
        //               .CountDocumentsAsync(Builders<DSM_Application.Server.Models.Employee>.Filter.Empty);

        //           Console.WriteLine($"Total employees stored: {total}");

        //           return Ok(new List<object>());        }

        // ============================================================


        // ADD EMPLOYEE  (EMPLOYEE DUPLICATES ALLOWED!)


        // ============================================================


        [HttpPost("{distributorId}")]


        public async Task<IActionResult> Add(string distributorId, [FromBody] Employee emp)
    {
            // ✅ Step 1: Validate Designation (NEW CODE ADDED)
            var allowedDesignations = new List<string>
                {
                    "Delivery Boy",
                    "Cash Collector",
                    "Manager",
                 
                    "Sales Representative"
                };

            if (!allowedDesignations.Contains(emp.Designation))
            {
                return BadRequest("Invalid designation. Allowed: Delivery Boy, Cash Collector, Manager, Sales Representative");
            }

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


                CreatedAt = DateTime.UtcNow,
                Designation = emp.Designation

            };

            await _db.Users.InsertOneAsync(newUser);

            return Ok(new


            {


                message = "Employee added successfully",


                employee = addedEmployee


            });


        }

        // ✅ Update employee
        [HttpPut("{distributorId}/{employeeId}")]


        public async Task<IActionResult> Update(string distributorId, string employeeId, [FromBody] Employee emp)
     {

            // ✅ Step 1: Validate Designation (NEW CODE ADDED)
            var allowedDesignations = new List<string>
                {
                    "Delivery Boy",
                    "Cash Collector",
                    "Manager",
                    
                    "Sales Representative"
                };

            if (!allowedDesignations.Contains(emp.Designation))
            {
                return BadRequest("Invalid designation. Allowed: Delivery Boy, Cash Collector, Manager,  Sales Representative");
            }

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


            if (updated == null) return NotFound("Employee not found");

            // Sync into Users


            await _db.Users.UpdateOneAsync(


                u => u.EmployeeId == updated.EmployeeId,


                Builders<User>.Update


                    .Set(u => u.Username, updated.Name)


                    .Set(u => u.Email, updated.Email)


                    .Set(u => u.PhoneNumber, updated.PhoneNumber)


                    .Set(u => u.IsActive, updated.IsActive)

                    .Set(u => u.Designation, updated.Designation));

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
        [Authorize(Roles = "Employee")]
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

                //if (dto.PaymentCollected)
                //{
                //    updates = updates
                //        .Set(o => o.PaymentCollectedByEmployee, true)
                //        .Set(o => o.CollectedAmount, dto.CollectedAmount ?? order.TotalAmount)
                //        .Set(o => o.PaymentMethod, dto.PaymentMethod ?? "COD")
                //        .Set(o => o.CollectedOn, DateTime.UtcNow);
                //}
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

        //[HttpGet("by-distributor/{distributorId}")]
        //public async Task<IActionResult> GetEmployeesByDistributor(string distributorId)
        //{
        //    var employees = await _service.GetEmployeesAsync(distributorId);

        //    // SHOW ONLY DELIVERY BOY
        //    var deliveryBoys = employees
        //        .Where(e => e.Designation != null &&
        //                    e.Designation.ToLower().Contains("delivery boy"))
        //        .ToList();

        //    return Ok(deliveryBoys);
        //}
        [HttpGet("by-distributor/{distributorId}")]
        public async Task<IActionResult> GetEmployeesByDistributor(string distributorId)
        {
            var istToday = DateTime.UtcNow.AddHours(5).AddMinutes(30).Date;

            var employees = await _service.GetEmployeesAsync(distributorId);

            var deliveryEmployees = employees
                .Where(e =>
                    e.Designation != null &&
                    e.Designation.ToLower().Contains("delivery"))
                .ToList();

            var result = new List<object>();

            foreach (var emp in deliveryEmployees)
            {
                var availability = await _db.EmployeeAvailability
                    .Find(a => a.EmployeeId == emp.EmployeeId && a.Date == istToday)
                    .FirstOrDefaultAsync();

                result.Add(new
                {
                    emp.EmployeeId,
                    emp.Name,
                    emp.Designation,
                    IsAvailable = availability?.IsAvailable ?? true,
                    Reason = availability?.Reason
                });
            }

            return Ok(result);
        }






        [HttpGet("available-today/{distributorId}")]
        public async Task<IActionResult> GetAvailableEmployeesToday(string distributorId)
        {
            // IST day range
            var istToday = DateTime.UtcNow.AddHours(5).AddMinutes(30).Date;
            var start = istToday.AddHours(-5).AddMinutes(-30);
            var end = start.AddDays(1);

            var employees = await _service.GetEmployeesAsync(distributorId);

            var deliveryEmployees = employees
                .Where(e =>
                    e.Designation != null &&
                    e.Designation.ToLower().Contains("delivery"))
                .ToList();

            var employeeIds = deliveryEmployees
                .Select(e => e.EmployeeId)
                .ToList();

            var availability = await _db.EmployeeAvailability
                .Find(a =>
                    employeeIds.Contains(a.EmployeeId) &&
                    a.Date >= start &&
                    a.Date < end
                )
                .SortByDescending(a => a.Date)
                .ToListAsync();

            var availableEmployeeIds = availability
                .GroupBy(a => a.EmployeeId)
                .Select(g => g.First())      // ✅ latest record only
                .Where(a => a.IsAvailable)   // ✅ NOT available excluded
                .Select(a => a.EmployeeId)
                .ToHashSet();

            var result = deliveryEmployees
                .Where(e => availableEmployeeIds.Contains(e.EmployeeId))
                .ToList();

            return Ok(result);
        }



        [HttpGet("email-exists/{email}")]
        public async Task<IActionResult> EmailExists(string email)
        {
            var exists = await _db.Employees
                .Find(e => e.Email == email)
                .AnyAsync();

            return Ok(exists);
        }

        [HttpGet("phone-exists/{phone}")]
        public async Task<IActionResult> PhoneExists(string phone)
        {
            var exists = await _db.Employees
                .Find(e => e.PhoneNumber == phone)
                .AnyAsync();

            return Ok(exists);
        }

        // ============================================================
        // GET ALL DELIVERY EMPLOYEES (FOR DISTRIBUTOR DROPDOWN)
        // ============================================================
        [HttpGet("dropdown/{distributorId}")]
        public async Task<IActionResult> GetEmployeesForDropdown(string distributorId)
        {
            var employees = await _db.Employees
                .Find(e =>
                    e.DistributorId == distributorId &&
                    e.IsActive &&
                    e.Designation.ToLower().Contains("delivery"))
                .Project(e => new
                {
                    employeeId = e.EmployeeId,
                    name = e.Name
                })
                .ToListAsync();

            return Ok(employees);
        }

        // ============================================================
        // DISTRIBUTOR → MARK EMPLOYEE AVAILABILITY
        // ============================================================

        [HttpPost("mark-availability-by-distributor")]
        public async Task<IActionResult> MarkAvailabilityByDistributor(
            [FromBody] EmployeeAvailability dto)
        {
            if (string.IsNullOrEmpty(dto.EmployeeId))
                return BadRequest("EmployeeId required");

            // Today (IST)
            var istToday = DateTime.UtcNow.AddHours(5).AddMinutes(30).Date;

            dto.Date = istToday;

            // Remove old record for today (if exists)
            await _db.EmployeeAvailability.DeleteManyAsync(a =>
                a.EmployeeId == dto.EmployeeId &&
                a.Date == istToday
            );

            // Insert new record
            await _db.EmployeeAvailability.InsertOneAsync(dto);

            return Ok(new
            {
                message = "Availability updated by distributor"
            });
        }
    }
}
