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

            // ✅ Check for duplicate email or phone number
            var existingDistributor = await _db.Distributors
                .Find(d => d.Email == distributor.Email || d.PhoneNumber == distributor.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existingDistributor != null)
            {
                if (existingDistributor.Email == distributor.Email)
                    return BadRequest("A distributor with this email already exists.");
                if (existingDistributor.PhoneNumber == distributor.PhoneNumber)
                    return BadRequest("A distributor with this phone number already exists.");
            }

            // ✅ Optionally, check in Users collection too (to avoid cross-role duplicates)
            var existingUser = await _db.Users
                .Find(u => u.Email == distributor.Email || u.PhoneNumber == distributor.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existingUser != null)
            {
                if (existingUser.Email == distributor.Email)
                    return BadRequest("This email is already used by another user.");
                if (existingUser.PhoneNumber == distributor.PhoneNumber)
                    return BadRequest("This phone number is already used by another user.");
            }

            // ✅ Generate DistributorId if missing
            if (string.IsNullOrEmpty(distributor.DistributorId))
            {
                distributor.DistributorId = ObjectId.GenerateNewId().ToString();
            }
            distributor.Categories ??= new List<string>(); // ✅ Ensure categories is never null
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
                IsRegistered = false,
                
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
            if (existing == null)
                return NotFound("Distributor not found");

            // ✅ Check if email or phone is already used by another distributor
            var duplicate = await _db.Distributors
                .Find(d => (d.Email == update.Email || d.PhoneNumber == update.PhoneNumber) && d.DistributorId != id)
                .FirstOrDefaultAsync();

            if (duplicate != null)
            {
                if (duplicate.Email == update.Email)
                    return BadRequest("A distributor with this email already exists.");
                if (duplicate.PhoneNumber == update.PhoneNumber)
                    return BadRequest("A distributor with this phone number already exists.");
            }

            // ✅ Optionally check in Users collection to avoid cross-role duplicates
            var existingUser = await _db.Users
                .Find(u => (u.Email == update.Email || u.PhoneNumber == update.PhoneNumber)
                         && u.DistributorId != id)
                .FirstOrDefaultAsync();

            if (existingUser != null)
            {
                if (existingUser.Email == update.Email)
                    return BadRequest("This email is already used by another user.");
                if (existingUser.PhoneNumber == update.PhoneNumber)
                    return BadRequest("This phone number is already used by another user.");
            }
            update.Categories ??= new List<string>();

            var updateDef = Builders<Distributor>.Update
                .Set(d => d.CompanyName, update.CompanyName)
                .Set(d => d.Email, update.Email)
                .Set(d => d.PhoneNumber, update.PhoneNumber)
                .Set(d => d.GST, update.GST)
                .Set(d => d.Address, update.Address)
                .Set(d => d.Categories, update.Categories); // ✅ Include categories

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

            if (result.DeletedCount == 0)
                return NotFound(new { message = "Distributor not found" });

            return Ok(new { message = "Distributor deleted successfully" });
        }



        [HttpPut("distributors/{id}/set-premium")]
        public async Task<IActionResult> SetPremium(string id)
        {
            var existing = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (existing == null) return NotFound("Distributor not found");

            await _db.Distributors.UpdateOneAsync(
                d => d.DistributorId == id,
                Builders<Distributor>.Update.Set(d => d.IsPremium, true)
            );

            return Ok(new { distributorId = id, isPremium = true });
        }

        // Remove premium status
        [HttpPut("distributors/{id}/remove-premium")]
        public async Task<IActionResult> RemovePremium(string id)
        {
            var existing = await _db.Distributors.Find(d => d.DistributorId == id).FirstOrDefaultAsync();
            if (existing == null) return NotFound("Distributor not found");

            await _db.Distributors.UpdateOneAsync(
                d => d.DistributorId == id,
                Builders<Distributor>.Update.Set(d => d.IsPremium, false)
            );

            return Ok(new { distributorId = id, isPremium = false });
        }
    }
}
