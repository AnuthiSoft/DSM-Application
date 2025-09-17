using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        // ✅ Get all employees for a distributor
        [HttpGet("{distributorId}")]
        public async Task<IActionResult> Get(string distributorId)
        {
            var employees = await _service.GetEmployeesAsync(distributorId);
            return Ok(employees);
        }

        // ✅ Add employee
        [HttpPost("{distributorId}")]
        public async Task<IActionResult> Add(string distributorId, [FromBody] Employee emp)
        {
            emp.DistributorId = distributorId;
            emp.IsRegistered = false;
            emp.IsActive = true;

            // 1) Add to Employees collection
            var addedEmployee = await _service.AddEmployeeAsync(emp);

            // 2) Add to Users collection (if not already exists)
            var existingUser = await _db.Users.Find(u => u.Email == emp.Email && u.DistributorId == distributorId).FirstOrDefaultAsync();
            if (existingUser == null)
            {
                var newUser = new User
                {
                    Email = emp.Email,
                    Role = "Employee",
                    DistributorId = distributorId,
                    Username = emp.Name,
                    IsRegistered = false,
                    IsActive = emp.IsActive
                };

                await _db.Users.InsertOneAsync(newUser);
            }

            return Ok(addedEmployee);
        }

        // ✅ Update employee
        [HttpPut("{distributorId}/{employeeId}")]
        public async Task<IActionResult> Update(string distributorId, string employeeId, [FromBody] Employee emp)
        {
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

            return Ok(updated);
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
    }
}
