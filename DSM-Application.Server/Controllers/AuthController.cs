using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
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
        [HttpPost("employee-login")]// me added this
        public async Task<IActionResult> EmployeeLogin([FromBody] LoginRequest request)
        {
            // Find user
            var user = await _db.Users
                .Find(u => u.Email == request.Email || u.PhoneNumber == request.Email)
                .FirstOrDefaultAsync();

            if (user == null)
                return Unauthorized("User not found");

            // Only employees allowed
            if (user.Role != "Employee")
                return Unauthorized("Only employees can login here.");

            if (!user.IsActive)
                return Unauthorized("Your account is deactivated. Contact distributor.");

            if (!user.IsRegistered)
                return Unauthorized("Please sign up first.");

            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // Auto assign employee ID if missing
            if (string.IsNullOrEmpty(user.EmployeeId))
            {
                user.EmployeeId = ObjectId.GenerateNewId().ToString();
                var update = Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId);
                await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
            }

            var token = _jwt.GenerateToken(user);
            var refreshToken = _jwt.GenerateRefreshToken();

            await _db.RefreshTokens.InsertOneAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                token,
                refreshToken,
                role = user.Role,
                employeeId = user.EmployeeId,
                distributorId = user.DistributorId
            });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromQuery] string portal = null)
        {
            // Basic request validation
            if (request == null || (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.PhoneNumber)))
                return BadRequest("Email or PhoneNumber is required.");

            const string adminEmail = "admin@gmail.com";
            const string adminPassword = "admin123";

            // Normalize portal: default to "distributor" for backward compatibility
            portal = (portal ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(portal))
                portal = "distributor";

            // --------- 1) Admin (hard-coded) ----------
            // Keep admin flow first (unchanged). Admin logs in regardless of portal.
            if (!string.IsNullOrWhiteSpace(request.Email) &&
                request.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                if (request.Password != adminPassword)
                    return Unauthorized("Invalid password");

                var adminUser = new User
                {
                    Email = adminEmail,
                    Role = "Admin",
                    IsRegistered = true,
                    Username = "Administrator",
                    DistributorId = ""
                };

                var tokenc = _jwt.GenerateToken(adminUser);
                var refreshToken = _jwt.GenerateRefreshToken();
                await _db.RefreshTokens.InsertOneAsync(new RefreshToken
                {
                    UserId = adminUser.Email,
                    Token = refreshToken,
                    ExpiryDate = DateTime.UtcNow.AddDays(7)
                });

                return Ok(new { tokenc, refreshToken, role = adminUser.Role });
            }

            // --------- 2) Find user by email or phone ----------
            // Use request.Email or request.PhoneNumber to find user.
            string lookup = string.IsNullOrWhiteSpace(request.Email) ? request.PhoneNumber : request.Email;
            var user = await _db.Users
                .Find(u => u.Email == lookup || u.PhoneNumber == lookup)
                .FirstOrDefaultAsync();

            if (user == null)
                return Unauthorized("User not found");

            // --------- 3) Portal gating ----------
            // Allow Employee logins ONLY when portal == "employee"
            if (user.Role == "Employee" && portal != "employee")
                return Unauthorized("Employees must login using the employee portal.");

            // If desired, restrict Admin logins from non-admin portals (optional)
            // if (user.Role == "Admin" && portal != "admin") { ... }

            // --------- 4) Distributor-specific checks ----------
            if (user.Role == "Distributor")
            {
                var distributor = await _db.Distributors
                    .Find(d => d.Email == user.Email || d.PhoneNumber == user.PhoneNumber)
                    .FirstOrDefaultAsync();

                if (distributor == null)
                    return Unauthorized("Distributor record not found");

                if (!distributor.IsActive)
                    return Unauthorized("Your account is deactivated. Contact admin.");
            }

            // --------- 5) Employee active check ----------
            //if (user.Role == "Employee" && !user.IsActive)
            //    return Unauthorized("Your employee account is deactivated. Contact distributor.");

            // --------- 6) Registration & password checks ----------
            if (!user.IsRegistered)
                return Unauthorized("Please sign up first to create password");

            // ComputeHash might be null-safe in your environment — keep same method
            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // --------- 7) Auto-assign EmployeeId if missing ----------
            if (user.Role == "Employee" && string.IsNullOrEmpty(user.EmployeeId))
            {
                user.EmployeeId = ObjectId.GenerateNewId().ToString();
                var update = Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId);
                await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
            }

            // --------- 8) Token generation ----------
            var token = _jwt.GenerateToken(user);
            var newRefreshToken = _jwt.GenerateRefreshToken();

            await _db.RefreshTokens.InsertOneAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                token,
                refreshToken = newRefreshToken,
                role = user.Role,
                distributorId = user.DistributorId,
                employeeId = user.EmployeeId
            });
        }


        //[HttpPost("login")]
        //public async Task<IActionResult> Login(LoginRequest request)

        //{
        //    const string adminEmail = "admin@gmail.com";
        //    const string adminPassword = "admin123";

        //    // ✅ Admin Login
        //    if (request.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase))
        //    {
        //        if (request.Password != adminPassword)
        //            return Unauthorized("Invalid password");

        //        var adminUser = new User
        //        {
        //            Email = adminEmail,
        //            Role = "Admin",
        //            IsRegistered = true,
        //            Username = "Administrator",
        //            DistributorId = ""
        //        };

        //        var tokenc = _jwt.GenerateToken(adminUser);
        //        var refreshToken = _jwt.GenerateRefreshToken();
        //        await _db.RefreshTokens.InsertOneAsync(new RefreshToken
        //        {
        //            UserId = adminUser.Email,
        //            Token = refreshToken,
        //            ExpiryDate = DateTime.UtcNow.AddDays(7)
        //        });

        //        return Ok(new { tokenc, refreshToken, role = adminUser.Role });
        //    }

        //    // ✅ Allow login using either email or phone number
        //    var user = await _db.Users
        //        .Find(u => u.Email == request.Email || u.PhoneNumber == request.Email)
        //        .FirstOrDefaultAsync();

        //    if (user == null)
        //        return Unauthorized("User not found");

        //    // ⛔ BLOCK EMPLOYEE LOGIN IN THIS PORTAL
        //    //if (user.Role == "Employee")
        //    //    return Unauthorized("Employees cannot login from this portal. Use employee dashboard.");// me added this


        //    // Distributor-specific check
        //    if (user.Role == "Distributor")
        //    {
        //        var distributor = await _db.Distributors
        //            .Find(d => d.Email == user.Email || d.PhoneNumber == user.PhoneNumber)
        //            .FirstOrDefaultAsync();

        //        if (distributor == null)
        //            return Unauthorized("Distributor record not found");

        //        if (!distributor.IsActive)
        //            return Unauthorized("Your account is deactivated. Contact admin.");
        //    }

        //    // Employee-specific check
        //    if (user.Role == "Employee" && !user.IsActive)
        //        return Unauthorized("Your employee account is deactivated. Contact distributor.");

        //    if (!user.IsRegistered)
        //        return Unauthorized("Please sign up first to create password");

        //    if (user.PasswordHash != ComputeHash(request.Password))
        //        return Unauthorized("Invalid password");

        //    // Auto-assign EmployeeId if missing
        //    if (user.Role == "Employee" && string.IsNullOrEmpty(user.EmployeeId))
        //    {
        //        user.EmployeeId = ObjectId.GenerateNewId().ToString();
        //        var update = Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId);
        //        await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
        //    }


        //    var token = _jwt.GenerateToken(user);
        //    var newRefreshToken = _jwt.GenerateRefreshToken();

        //    await _db.RefreshTokens.InsertOneAsync(new RefreshToken
        //    {
        //        UserId = user.Id,
        //        Token = newRefreshToken,
        //        ExpiryDate = DateTime.UtcNow.AddDays(7)
        //    });
        //    return Ok(new
        //    {

        //        token,
        //        refreshToken = newRefreshToken,

        //        role = user.Role,
        //        distributorId = user.DistributorId,
        //        employeeId = user.EmployeeId
        //    });
        //}

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] Models.LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest(new { message = "Email or Phone Number and Password are required" });
            //return BadRequest("Email or Phone Number and Password are required");

            if (string.IsNullOrEmpty(request.Password))
                return BadRequest("Password is required");

            // Find user by email OR phone number
            var user = await _db.Users
                .Find(u => u.Email == request.Email || u.PhoneNumber == request.PhoneNumber)
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "No user found with this email/phone. Please contact your distributor." });
            //return NotFound("No user found with this email/phone. Please contact your distributor.");

            if (user.IsRegistered)
                return BadRequest(new { message = "Password already created, please login" });
            //return BadRequest("Password already created, please login");

            // Set password
            user.PasswordHash = ComputeHash(request.Password);
            user.IsRegistered = true;

            var update = Builders<User>.Update
                .Set(u => u.PasswordHash, user.PasswordHash)
                .Set(u => u.IsRegistered, true);

            await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
            return Ok(new { message = "Password created successfully. You can now login." });
            //return Ok("Password created successfully. You can now login.");
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
                _emailService.SendOtpEmailAsync(request.Email, otp);
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
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var refreshToken = await _db.RefreshTokens
                .Find(rt => rt.Token == request.RefreshToken && !rt.IsRevoked)
                .FirstOrDefaultAsync();

            if (refreshToken == null || refreshToken.ExpiryDate < DateTime.UtcNow)
                return Unauthorized("Invalid or expired refresh token");

            var user = await _db.Users.Find(u => u.Id == refreshToken.UserId).FirstOrDefaultAsync();
            if (user == null) return Unauthorized("User not found");

            // Generate new tokens
            var newJwt = _jwt.GenerateToken(user);
            var newRefreshToken = _jwt.GenerateRefreshToken();

            // Revoke old token
            var update = Builders<RefreshToken>.Update
                .Set(r => r.IsRevoked, true);
            await _db.RefreshTokens.UpdateOneAsync(r => r.Id == refreshToken.Id, update);

            // Save new token
            await _db.RefreshTokens.InsertOneAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { token = newJwt, refreshToken = newRefreshToken });
        }
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            var update = Builders<RefreshToken>.Update
                .Set(r => r.IsRevoked, true);
            await _db.RefreshTokens.UpdateOneAsync(r => r.Token == request.RefreshToken, update);
            return Ok("Logged out successfully");
        }


        public class RefreshTokenRequest
        {
            public string RefreshToken { get; set; }
        }

        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }
    }

}


