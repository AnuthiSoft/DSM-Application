using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;
using LoginRequest = DistributorManagementSystem.Server.Models.LoginRequest;

namespace DistributorManagementSystem.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly JwtService _jwt;
        private readonly EmailService _emailService;

        public AuthController(MongoDbService db, JwtService jwt, EmailService emailService)
        {
            _db = db;
            _jwt = jwt;
            _emailService = emailService;
        }
        //private string GenerateAlphanumericOtp(int length = 6)
        //{
        //    const string chars = "ABCDEFGHIJKLMNOPQRS01234TUVWXYZ56789"; // A-Z + 0-9
        //    var result = new char[length];

        //    using var rng = RandomNumberGenerator.Create();
        //    var randomBytes = new byte[length];

        //    for (int i = 0; i < length; i++)
        //    {
        //        rng.GetBytes(randomBytes, i, 1); // get 1 random byte
        //        int index = randomBytes[i] % chars.Length; // map to available characters
        //        result[i] = chars[index];
        //    }

        //    return new string(result);
        //}

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
                    IsRegistered = true,
                    Username = "Administrator",
              
                    DistributorId = ""
                };

                var tokenc = _jwt.GenerateToken(adminUser);
                return Ok(new { tokenc, role = adminUser.Role});
            }
            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null)
                return Unauthorized("User not found");
            if (user.Role == "Distributor")
            {
                var distributor = await _db.Distributors
                    .Find(d => d.Email == request.Email)
                    .FirstOrDefaultAsync();

                if (distributor == null)
                    return Unauthorized("Distributor record not found");

                if (!distributor.IsActive)
                    return Unauthorized("Your account is deactivated. Contact admin.");
            }
            // 4️⃣ If Employee -> just check IsActive flag in user itself
            if (user.Role == "Employee" && !user.IsActive)
                return Unauthorized("Your employee account is deactivated. Contact distributor.");




            if (!user.IsRegistered)
                return Unauthorized("Please sign up first to create password");

            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            var token = _jwt.GenerateToken(user);
            return Ok(new { token, role = user.Role,
                distributorId = user.DistributorId,  });
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



        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] DSM_Application.Server.Models.ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("Email is required");

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null) return NotFound("User not found");


            var otp = new Random().Next(100000, 999999).ToString(); // 6-digit OTP
            OtpStore.SaveOtp(request.Email, otp);
            //var otp = GenerateAlphanumericOtp(6);
            //    OtpStore.SaveOtp(request.Email, otp);


            try
            {
                _emailService.SendOtpEmail(request.Email, otp);
                return Ok("OTP sent to your email.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to send OTP: {ex.Message}");
            }
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (OtpStore.VerifyOtp(request.Email, request.Otp))
                return Ok("OTP verified successfully.");
            return BadRequest("Invalid or expired OTP.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] DSM_Application.Server.Models.ResetPasswordRequest request)
        {
            if (!OtpStore.VerifyOtp(request.Email, request.Otp))
                return BadRequest("Invalid or expired OTP.");

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null) return NotFound("User not found");

            user.PasswordHash = ComputeHash(request.NewPassword);
            user.IsRegistered = true;

            var update = Builders<User>.Update
                .Set(u => u.PasswordHash, user.PasswordHash)
                .Set(u => u.IsRegistered, true);

            await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);

            // ✅ Remove OTP only after successful password reset
            OtpStore.RemoveOtp(request.Email);

            return Ok("Password reset successfully. You can now login.");
        }
        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }
    }

}


