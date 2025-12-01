using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
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

        // ============================================================
        // EMPLOYEE LOGIN (Allow duplicate email & phone)
        // ============================================================
        [HttpPost("employee-login")]
        public async Task<IActionResult> EmployeeLogin([FromBody] LoginRequest request)
        {
            string lookup = request.Email ?? request.PhoneNumber;

            var user = await _db.Users
                .Find(u =>
                    (u.Email == lookup || u.PhoneNumber == lookup) &&
                    u.Role == "Employee")
                .SortByDescending(u => u.CreatedAt)
                .FirstOrDefaultAsync();

            if (user == null)
                return Unauthorized("Employee not found.");

            if (!user.IsActive)
                return Unauthorized("Your account is deactivated.");

            if (!user.IsRegistered)
                return Unauthorized("Please sign up first.");

            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            if (string.IsNullOrEmpty(user.EmployeeId))
            {
                user.EmployeeId = ObjectId.GenerateNewId().ToString();
                await _db.Users.UpdateOneAsync(
                    u => u.Id == user.Id,
                    Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId));
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
                user.Role,
                user.EmployeeId,
                user.DistributorId
            });
        }
        [HttpPost("employee-signup")]
        public async Task<IActionResult> EmployeeSignup([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.PhoneNumber))
                return BadRequest("Email or Phone Number is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            string lookup = request.Email ?? request.PhoneNumber;

            // Get ALL matching employee records (duplicates allowed)
            var employees = await _db.Users
                .Find(u =>
                    (u.Email == lookup || u.PhoneNumber == lookup) &&
                    u.Role == "Employee")
                .SortByDescending(u => u.CreatedAt)
                .ToListAsync();

            if (!employees.Any())
                return NotFound("No employee found. Contact your distributor.");

            // Take the newest duplicate record
            var user = employees.First();

            if (user.IsRegistered)
                return BadRequest("Password already created, please login.");

            // Set password
            user.PasswordHash = ComputeHash(request.Password);
            user.IsRegistered = true;

            await _db.Users.UpdateOneAsync(
                u => u.Id == user.Id,
                Builders<User>.Update
                    .Set(u => u.PasswordHash, user.PasswordHash)
                    .Set(u => u.IsRegistered, true)
            );

            return Ok(new
            {
                message = "Password created successfully. You can now login.",
                employeeId = user.EmployeeId
            });
        }
        // ============================================================
        // DISTRIBUTOR / ADMIN LOGIN (Unique email/phone)
        // ============================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromQuery] string portal = null)
        {
            if (request == null || (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.PhoneNumber)))
                return BadRequest("Email or PhoneNumber required.");

            const string adminEmail = "admin@gmail.com";
            const string adminPassword = "admin123";

            portal = (portal ?? "distributor").Trim().ToLower();

            // -------- ADMIN LOGIN --------
            if (!string.IsNullOrWhiteSpace(request.Email) &&
                request.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                if (request.Password != adminPassword)
                    return Unauthorized("Invalid password");

                var admin = new User
                {
                    Email = adminEmail,
                    Role = "Admin",
                    IsRegistered = true,
                    Username = "Admin",
                    DistributorId = ""
                };

                var tokenAdmin = _jwt.GenerateToken(admin);
                var refreshTokenAdmin = _jwt.GenerateRefreshToken();

                await _db.RefreshTokens.InsertOneAsync(new RefreshToken
                {
                    UserId = admin.Email,
                    Token = refreshTokenAdmin,
                    ExpiryDate = DateTime.UtcNow.AddDays(7)
                });

                return Ok(new { token = tokenAdmin, refreshToken = refreshTokenAdmin, role = "Admin" });
            }

            // -------- NORMAL USER LOGIN --------
            string lookup = request.Email ?? request.PhoneNumber;

            var user = await _db.Users
                .Find(u => u.Email == lookup || u.PhoneNumber == lookup)
                .SortByDescending(u => u.CreatedAt)
                .FirstOrDefaultAsync();

            if (user == null)
                return Unauthorized("User not found");

            // Employee protection
            if (user.Role == "Employee" && portal != "employee")
                return Unauthorized("Employees must login using employee portal.");

            // Distributor active check
            if (user.Role == "Distributor")
            {
                var dist = await _db.Distributors
                    .Find(d => d.Email == user.Email || d.PhoneNumber == user.PhoneNumber)
                    .FirstOrDefaultAsync();

                if (dist == null)
                    return Unauthorized("Distributor record not found.");

                if (!dist.IsActive)
                    return Unauthorized("Distributor account is deactivated.");
            }

            if (!user.IsRegistered)
                return Unauthorized("Please sign up first.");

            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // Assign employee ID if missing
            if (user.Role == "Employee" && string.IsNullOrEmpty(user.EmployeeId))
            {
                user.EmployeeId = ObjectId.GenerateNewId().ToString();
                await _db.Users.UpdateOneAsync(
                    u => u.Id == user.Id,
                    Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId));

                await _db.Employees.UpdateOneAsync(
                    e => e.Email == user.Email,
                    Builders<Employee>.Update.Set(e => e.EmployeeId, user.EmployeeId));
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
                user.Role,
                user.DistributorId,
                user.EmployeeId
            });
        }

        // ============================================================
        // SIGN UP (Allow duplicate emails ONLY for EMPLOYEES)
        // ============================================================
        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] Models.LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest("Email/Phone & Password required.");

            if (string.IsNullOrEmpty(request.Password))
                return BadRequest("Password is required.");

            // Find ALL matching records (duplicate emails allowed for employees)
            var matchingUsers = await _db.Users
                .Find(u => u.Email == request.Email || u.PhoneNumber == request.PhoneNumber)
                .SortByDescending(u => u.CreatedAt)
                .ToListAsync();

            if (!matchingUsers.Any())
                return NotFound("No user found with this email/phone.");

            // Take the newest employee record
            var user = matchingUsers.FirstOrDefault(u => u.Role == "Employee") ??
                       matchingUsers.First();

            if (user.IsRegistered)
                return BadRequest("Password already created, please login.");

            user.PasswordHash = ComputeHash(request.Password);
            user.IsRegistered = true;

            await _db.Users.UpdateOneAsync(
                u => u.Id == user.Id,
                Builders<User>.Update
                    .Set(u => u.PasswordHash, user.PasswordHash)
                    .Set(u => u.IsRegistered, true));

            return Ok("Password created successfully. You can now login.");
        }

        // ============================================================
        // OTP + RESET PASSWORD
        // ============================================================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("Email is required");

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null)
                return NotFound("User not found");

            var otp = new Random().Next(100000, 999999).ToString();
            OtpStore.SaveOtp(request.Email, otp);

            try
            {
                _emailService.SendOtpEmailAsync(request.Email, otp);
                return Ok("OTP sent.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to send OTP: " + ex.Message);
            }
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (OtpStore.VerifyOtp(request.Email, request.Otp))
                return Ok("OTP verified.");
            return BadRequest("Invalid/Expired OTP.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!OtpStore.VerifyOtp(request.Email, request.Otp))
                return BadRequest("Invalid or expired OTP.");

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null)
                return NotFound("User not found");

            user.PasswordHash = ComputeHash(request.NewPassword);
            user.IsRegistered = true;

            await _db.Users.UpdateOneAsync(
                u => u.Id == user.Id,
                Builders<User>.Update
                    .Set(u => u.PasswordHash, user.PasswordHash)
                    .Set(u => u.IsRegistered, true));

            OtpStore.RemoveOtp(request.Email);

            return Ok("Password reset successfully.");
        }

        // ============================================================
        // REFRESH TOKEN
        // ============================================================
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var rt = await _db.RefreshTokens
                .Find(r => r.Token == request.RefreshToken && !r.IsRevoked)
                .FirstOrDefaultAsync();

            if (rt == null || rt.ExpiryDate < DateTime.UtcNow)
                return Unauthorized("Invalid token");

            var user = await _db.Users.Find(u => u.Id == rt.UserId).FirstOrDefaultAsync();
            if (user == null)
                return Unauthorized("User not found");

            var newJwt = _jwt.GenerateToken(user);
            var newRefresh = _jwt.GenerateRefreshToken();

            await _db.RefreshTokens.UpdateOneAsync(
                r => r.Id == rt.Id,
                Builders<RefreshToken>.Update.Set(r => r.IsRevoked, true));

            await _db.RefreshTokens.InsertOneAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = newRefresh,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { token = newJwt, refreshToken = newRefresh });
        }

        // ============================================================
        // LOGOUT
        // ============================================================
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            await _db.RefreshTokens.UpdateOneAsync(
                r => r.Token == request.RefreshToken,
                Builders<RefreshToken>.Update.Set(r => r.IsRevoked, true));

            return Ok("Logged out");
        }

        public class RefreshTokenRequest
        {
            public string RefreshToken { get; set; }
        }

        // ============================================================
        // HASHING
        // ============================================================
        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            return Convert.ToBase64String(
                sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }
    }
}
