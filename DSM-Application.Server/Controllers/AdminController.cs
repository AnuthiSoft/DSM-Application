using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;

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

        //[HttpPost("distributors")]
        //public async Task<IActionResult> AddDistributor([FromBody] Distributor distributor)
        //{

        //    // ✅ Check for duplicate email or phone number
        //    var existingDistributor = await _db.Distributors
        //        .Find(d => d.Email == distributor.Email || d.PhoneNumber == distributor.PhoneNumber)
        //        .FirstOrDefaultAsync();

        //    if (existingDistributor != null)
        //    {
        //        if (existingDistributor.Email == distributor.Email)
        //            return BadRequest("A distributor with this email already exists.");
        //        if (existingDistributor.PhoneNumber == distributor.PhoneNumber)
        //            return BadRequest("A distributor with this phone number already exists.");
        //    }

        //    // ✅ Optionally, check in Users collection too (to avoid cross-role duplicates)
        //    var existingUser = await _db.Users
        //        .Find(u => u.Email == distributor.Email || u.PhoneNumber == distributor.PhoneNumber)
        //        .FirstOrDefaultAsync();

        //    if (existingUser != null)
        //    {
        //        if (existingUser.Email == distributor.Email)
        //            return BadRequest("This email is already used by another user.");
        //        if (existingUser.PhoneNumber == distributor.PhoneNumber)
        //            return BadRequest("This phone number is already used by another user.");
        //    }

        //    // ✅ Generate DistributorId if missing
        //    if (string.IsNullOrEmpty(distributor.DistributorId))
        //    {
        //        distributor.DistributorId = ObjectId.GenerateNewId().ToString();
        //    }
        //    distributor.Categories ??= new List<string>(); // ✅ Ensure categories is never null
        //    await _db.Distributors.InsertOneAsync(distributor);

        //    // create distributor login with temporary username
        //    var user = new User
        //    {

        //        PasswordHash = string.Empty, // no password yet
        //        Role = "Distributor",
        //        DistributorId = distributor.DistributorId,
        //        Name = distributor.Name,
        //        Email = distributor.Email,
        //        PhoneNumber = distributor.PhoneNumber,
        //        IsRegistered = false,

        //    };
        //    await _db.Users.InsertOneAsync(user);

        //    return Ok(new { distributor, message = "Distributor added successfully. They can sign up to create password." });
        //}


        [HttpPost("distributors")]
        public async Task<IActionResult> AddDistributor([FromBody] DistributorCreateDto dto)
        {
            if (dto == null)
                return BadRequest("Invalid data");
            



            // Check duplicate email/phone
            var existing = await _db.Distributors
                .Find(d => d.Email == dto.Email || d.PhoneNumber == dto.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existing != null)
                return BadRequest("Distributor already exists with this email or phone.");

            // Create distributor object
            var distributor = new Distributor
            {
                Id = null,
                DistributorId = ObjectId.GenerateNewId().ToString(),
                CompanyName = dto.CompanyName!,
                Name = dto.Name!,
                Email = dto.Email!,
                PhoneNumber = dto.PhoneNumber!,
                GST = dto.GST!,
                Address = dto.Address!,
                Categories = dto.Categories ?? new List<string>(),

                // Default system values
                IsActive = true,
                IsPremium = false,
                CreatedAt = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                Status = "Active"
            };

            await _db.Distributors.InsertOneAsync(distributor);

            // Create a user login for distributor
            var user = new User
            {
                Id = null!,
                Role = "Distributor",
                Email = dto.Email!,
                PhoneNumber = dto.PhoneNumber!,
                DistributorId = distributor.DistributorId,
                IsRegistered = false,
                PasswordHash = ""
            };

            await _db.Users.InsertOneAsync(user);

            return Ok(new
            {
                message = "Distributor created successfully.",
                distributor
            });
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
            if (result.DeletedCount == 0) return NotFound("Distributor not found");
            return Ok("Distributor deleted successfully");
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

        [HttpPost("seed-gst-master")]
        public async Task<IActionResult> SeedGstMaster()
        {
            var existing = await _db.GstMaster.CountDocumentsAsync(_ => true);

            if (existing > 0)
                return BadRequest("GST Master already exists — skipping seeding");

            var gstList = new List<GstMaster>
    {
        new GstMaster { Hsn="0401", Description="Milk & Dairy Fresh", Gst=0 },
        new GstMaster { Hsn="0402", Description="Milk Powder", Gst=5 },
        new GstMaster { Hsn="0403", Description="Yogurt, Buttermilk", Gst=5 },
        new GstMaster { Hsn="0406", Description="Cheese & Paneer", Gst=5 },

        new GstMaster { Hsn="0901", Description="Coffee Beans / Powder", Gst=18 },
        new GstMaster { Hsn="0902", Description="Tea", Gst=5 },

        new GstMaster { Hsn="1701", Description="Sugar", Gst=5 },
        new GstMaster { Hsn="1704", Description="Chocolates, Candies", Gst=18 },

        new GstMaster { Hsn="1905", Description="Bakery Products", Gst=18 },
        new GstMaster { Hsn="2009", Description="Fruit Juices", Gst=12 },

        new GstMaster { Hsn="2106", Description="Protein Powder, Supplements", Gst=18 },

        new GstMaster { Hsn="2201", Description="Mineral Water", Gst=18 },
        new GstMaster { Hsn="2202", Description="Soft Drinks", Gst=28 },

        new GstMaster { Hsn="2309", Description="Pet Food", Gst=18 },

        new GstMaster { Hsn="3004", Description="Medicines", Gst=5 },
        new GstMaster { Hsn="3003", Description="Ayurvedic Medicines", Gst=12 },

        new GstMaster { Hsn="3303", Description="Perfumes", Gst=28 },
        new GstMaster { Hsn="3304", Description="Beauty Products", Gst=18 },
        new GstMaster { Hsn="3305", Description="Shampoo, Hair Oil", Gst=18 },
        new GstMaster { Hsn="3306", Description="Toothpaste, Oral Care", Gst=18 },

        new GstMaster { Hsn="3401", Description="Soap", Gst=18 },
        new GstMaster { Hsn="3402", Description="Detergents", Gst=18 },

        new GstMaster { Hsn="3923", Description="Plastic Bottles", Gst=18 },
        new GstMaster { Hsn="3926", Description="Plastic Household Items", Gst=18 },

        new GstMaster { Hsn="4202", Description="Bags & Wallets", Gst=18 },

        new GstMaster { Hsn="4802", Description="Paper & Stationery", Gst=12 },
        new GstMaster { Hsn="4901", Description="Books", Gst=0 },

        new GstMaster { Hsn="5601", Description="Cotton Wadding", Gst=5 },

        new GstMaster { Hsn="6109", Description="T-Shirts", Gst=5 },
        new GstMaster { Hsn="6203", Description="Men Clothing", Gst=5 },
        new GstMaster { Hsn="6204", Description="Women Clothing", Gst=5 },

        new GstMaster { Hsn="6404", Description="Footwear < 1000", Gst=5 },
        new GstMaster { Hsn="6404A", Description="Footwear > 1000", Gst=18 },

        new GstMaster { Hsn="6810", Description="Cement Articles", Gst=28 },

        new GstMaster { Hsn="7013", Description="Glassware", Gst=18 },

        new GstMaster { Hsn="7308", Description="Steel Structures", Gst=18 },

        new GstMaster { Hsn="7310", Description="Gas Cylinders", Gst=18 },

        new GstMaster { Hsn="8415", Description="Air Conditioners", Gst=28 },
        new GstMaster { Hsn="8450", Description="Washing Machines", Gst=18 },
        new GstMaster { Hsn="8504", Description="Power Supplies", Gst=18 },
        new GstMaster { Hsn="8507", Description="Batteries", Gst=18 },

        new GstMaster { Hsn="8517", Description="Mobile Phones", Gst=18 },
        new GstMaster { Hsn="8528", Description="Televisions", Gst=28 },

        new GstMaster { Hsn="8703", Description="Motor Vehicles", Gst=28 },
        new GstMaster { Hsn="8714", Description="Vehicle Parts", Gst=28 },

        new GstMaster { Hsn="9004", Description="Sunglasses", Gst=12 },

        new GstMaster { Hsn="9503", Description="Toys", Gst=12 },
        new GstMaster { Hsn="9506", Description="Sports Goods", Gst=12 },

        new GstMaster { Hsn="9603", Description="Brushes & Brooms", Gst=18 },
        new GstMaster { Hsn="9608", Description="Pens", Gst=12 }
    };

            await _db.GstMaster.InsertManyAsync(gstList);

            return Ok("GST Master seeded successfully!");
        }


    }
}
