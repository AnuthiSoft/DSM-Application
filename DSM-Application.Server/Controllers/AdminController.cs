using System.Security.Cryptography;
using System.Text;
using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly MongoDbService _db;

        public AdminController(MongoDbService db)
        {
            _db = db;
        }

        [HttpGet("distributors")]
        public async Task<IActionResult> GetDistributors()
        {
            var list = await _db.Distributors.Find(_ => true).ToListAsync();
            return Ok(list);
        }

        [HttpPost("distributors")]
        public async Task<IActionResult> AddDistributor([FromBody] Distributor distributor)
        {

            if (string.IsNullOrEmpty(distributor.DistributorId))
            {
                distributor.DistributorId = ObjectId.GenerateNewId().ToString();
            }
            await _db.Distributors.InsertOneAsync(distributor);

            // create distributor login with temporary username
            var user = new User
            {

                PasswordHash = string.Empty, // no password yet
                Role = "Distributor",
                DistributorId = distributor.DistributorId,
                Name = distributor.Name,
                Email = distributor.Email,
                PhoneNumber = distributor.PhoneNumber,
                IsRegistered = false
            };
            await _db.Users.InsertOneAsync(user);

            return Ok(new { distributor, message = "Distributor added successfully. They can sign up to create password." });
        }
        // Get distributor by ID
        [HttpGet("distributors/{id}")]
        public async Task<IActionResult> GetDistributor(string id)
        {
            var distributor = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (distributor == null) return NotFound("Distributor not found");
            return Ok(distributor);
        }

        // Update distributor details
        [HttpPut("distributors/{id}")]
        public async Task<IActionResult> UpdateDistributor(string id, [FromBody] Distributor update)
        {
            var existing = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (existing == null) return NotFound("Distributor not found");

            var updateDef = Builders<Distributor>.Update
                .Set(d => d.CompanyName, update.CompanyName)
                .Set(d => d.Email, update.Email)
                .Set(d => d.PhoneNumber, update.PhoneNumber)
                .Set(d => d.GST, update.GST)
                .Set(d => d.Address, update.Address);

            await _db.Distributors.UpdateOneAsync(d => d.DistributorId == id, updateDef);
            return Ok("Distributor updated successfully");
        }

        // Deactivate distributor
        [HttpPut("distributors/{id}/deactivate")]
        public async Task<IActionResult> DeactivateDistributor(string id)
        {
            var existing = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (existing == null) return NotFound("Distributor not found");

            await _db.Distributors.UpdateOneAsync(
                d => d.DistributorId == id,
                Builders<Distributor>.Update.Set(d => d.IsActive, false)
            );
            //return Ok("Distributor deactivated successfully");
            return Ok(new { isActive = existing.IsActive });
        }

        // Reactivate distributor
        [HttpPut("distributors/{id}/reactivate")]
        public async Task<IActionResult> ReactivateDistributor(string id)
        {
            var existing = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (existing == null) return NotFound("Distributor not found");

            await _db.Distributors.UpdateOneAsync(
                d => d.DistributorId == id,
                Builders<Distributor>.Update.Set(d => d.IsActive, true)
            );
            //return Ok("Distributor reactivated successfully");
            return Ok(new { isActive = existing.IsActive });
        }

        // Delete distributor
        [HttpDelete("distributors/{id}")]
        public async Task<IActionResult> DeleteDistributor(string id)
        {
            var result = await _db.Distributors.DeleteOneAsync(d => d.DistributorId == id);
            if (result.DeletedCount == 0) return NotFound("Distributor not found");
            return Ok("Distributor deleted successfully");
        }
    }
}
