using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Distributor")]
    public class EmployeeController : ControllerBase
    {
        private readonly MongoDbService _db;

        public EmployeeController(MongoDbService db)
        {
            _db = db;
        }

        // GET all employees for this distributor
        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            // Get distributorId from JWT claims (safer than from body)
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var list = await _db.Employees
                .Find(e => e.DistributorId == distributorId)
                .ToListAsync();

            return Ok(list);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployeeById(string id)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var employee = await _db.Employees
                .Find(e => e.EmployeeId == id && e.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (employee == null)
                return NotFound("Employee not found");

            return Ok(employee);
        }


        // CREATE new employee
        [HttpPost]
        public async Task<IActionResult> AddEmployee([FromBody] Employee employee)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            if (string.IsNullOrEmpty(employee.EmployeeId))
                employee.EmployeeId = ObjectId.GenerateNewId().ToString();

            employee.DistributorId = distributorId;
            employee.IsActive = true;

            await _db.Employees.InsertOneAsync(employee);
            // ✅ Also create user record for login/signup
            var user = new User
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Email = employee.Email,
                Name = employee.Name,
                Role = "Employee",  // 🔑 role for authorization
                DistributorId = distributorId,
                PasswordHash = string.Empty,  // will be set during signup
                IsRegistered = false
            };
            await _db.Users.InsertOneAsync(user);

            return Ok(new { employee, message = "Employee added successfully." });
        }

        // UPDATE employee
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(string id, [FromBody] Employee update)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var existing = await _db.Employees
                .Find(e => e.EmployeeId == id && e.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (existing == null)
                return NotFound("Employee not found");

            var updateDef = Builders<Employee>.Update
                .Set(e => e.Name, update.Name)
                .Set(e => e.Email, update.Email)
                .Set(e => e.PhoneNumber, update.PhoneNumber)
                .Set(e => e.Designation, update.Designation);

            await _db.Employees.UpdateOneAsync(e => e.EmployeeId == id, updateDef);
            return Ok("Employee updated successfully");
        }

        // DEACTIVATE employee
        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> DeactivateEmployee(string id)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var result = await _db.Employees.UpdateOneAsync(
                e => e.EmployeeId == id && e.DistributorId == distributorId,
                Builders<Employee>.Update.Set(e => e.IsActive, false)
            );

            if (result.MatchedCount == 0)
                return NotFound("Employee not found");

            return Ok("Employee deactivated successfully");
        }

        // REACTIVATE employee
        [HttpPut("{id}/reactivate")]
        public async Task<IActionResult> ReactivateEmployee(string id)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var result = await _db.Employees.UpdateOneAsync(
                e => e.EmployeeId == id && e.DistributorId == distributorId,
                Builders<Employee>.Update.Set(e => e.IsActive, true)
            );

            if (result.MatchedCount == 0)
                return NotFound("Employee not found");

            return Ok("Employee reactivated successfully");
        }

        // DELETE employee
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(string id)
        {
            var distributorId = User.Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;

            var result = await _db.Employees.DeleteOneAsync(e => e.EmployeeId == id && e.DistributorId == distributorId);
            if (result.DeletedCount == 0)
                return NotFound("Employee not found");

            return Ok("Employee deleted successfully");
        }
    }
}

