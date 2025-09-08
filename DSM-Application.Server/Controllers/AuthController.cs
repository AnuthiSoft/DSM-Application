using System.Security.Cryptography;
using System.Text;
using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using LoginRequest = DistributorManagementSystem.Server.Models.LoginRequest;

namespace DistributorManagementSystem.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly JwtService _jwt;

        public AuthController(MongoDbService db, JwtService jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            // Hardcoded admin credentials
            const string adminEmail = "admin@gmail.com";
            const string adminPassword = "admin123";

            // Check if login is for Admin
            if (request.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                if (request.Password != adminPassword)
                    return Unauthorized("Invalid password");

                // Create a dummy admin user object
                var adminUser = new User
                {
                    Email = adminEmail,
                    Role = "Admin",
                    IsRegistered = true
                };

                var tokenc = _jwt.GenerateToken(adminUser);
                return Ok(new { tokenc, role = adminUser.Role });
            }
            var distributor = await _db.Distributors
        .Find(d => d.Email == request.Email)
        .FirstOrDefaultAsync();

            if (!distributor.IsActive)
                return Unauthorized("Your account is deactivated. Contact admin.");
            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null) return Unauthorized("User not found");



            if (!user.IsRegistered)
                return Unauthorized("Please sign up first to create password");

            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            var token = _jwt.GenerateToken(user);
            return Ok(new { token, role = user.Role });
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] Models.LoginRequest request)
        {
            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null) return NotFound("User not found");

            if (user.IsRegistered)
                return BadRequest("Password already created, please login");

            user.PasswordHash = ComputeHash(request.Password);
            user.IsRegistered = true;

            var update = Builders<User>.Update
                .Set(u => u.PasswordHash, user.PasswordHash)
                .Set(u => u.IsRegistered, true);

            await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);

            return Ok("Password created successfully. You can now login.");
        }

        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }
    }
}

