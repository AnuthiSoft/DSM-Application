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
        private readonly IMongoCollection<DeliverySession> _sessions;

        public AuthController(MongoDbService db, JwtService jwt, EmailService emailService)
        {
            _db = db;
            _jwt = jwt;
            _emailService = emailService;
            _sessions = db.Database.GetCollection<DeliverySession>("DeliverySessions");

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

            // Assign employeeId if missing
            //if (string.IsNullOrEmpty(user.EmployeeId))
            //{
            //    user.EmployeeId = ObjectId.GenerateNewId().ToString();
            //    await _db.Users.UpdateOneAsync(
            //        u => u.Id == user.Id,
            //        Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId));
            //}

            // 🔥 Ensure EmployeeId exists (DO NOT generate new one)
            if (string.IsNullOrEmpty(user.EmployeeId))
            {
                var empRecord = await _db.Employees
                    .Find(e => e.Email == user.Email || e.PhoneNumber == user.PhoneNumber)
                    .FirstOrDefaultAsync();

                if (empRecord == null || string.IsNullOrEmpty(empRecord.EmployeeId))
                    return Unauthorized("EmployeeId not assigned. Contact distributor.");

                user.EmployeeId = empRecord.EmployeeId;

                await _db.Users.UpdateOneAsync(
                    u => u.Id == user.Id,
                    Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId)
                );
            }


            // ⭐ Get employee record (name, designation)
            var employee = await _db.Employees
                .Find(e => e.EmployeeId == user.EmployeeId)
                .FirstOrDefaultAsync();

            var token = _jwt.GenerateToken(user);
            var refreshToken = _jwt.GenerateRefreshToken();

            await _db.RefreshTokens.InsertOneAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });

            // ✅ Fetch employee details from Employees Collection
            var emp = await _db.Employees
                .Find(e => e.EmployeeId == user.EmployeeId)
                .FirstOrDefaultAsync();

            string designation = emp?.Designation ?? "";

            // 🔥 AUTO START DELIVERY SESSION ON LOGIN
            var activeSession = await _sessions
                .Find(s => s.EmployeeId == user.EmployeeId && s.IsActive)
                .FirstOrDefaultAsync();

            if (activeSession == null)
            {
                await _sessions.InsertOneAsync(new DeliverySession
                {
                    Id = ObjectId.GenerateNewId(),
                    EmployeeId = user.EmployeeId,
                    StartTime = DateTime.UtcNow,
                    IsActive = true,
                    Route = new List<LatLongPoint>()
                });
            }


            // Return login response
            return Ok(new
            {
                token,
                refreshToken,
                role = user.Role,
                employeeId = user.EmployeeId,
                distributorId = user.DistributorId,

                // ⭐ Return employee details safely
                designation = employee?.Designation,
                name = employee?.Name
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
            var user = await _db.Users
       .Find(u =>
           (!string.IsNullOrEmpty(request.Email) && u.Email == request.Email) ||
           (!string.IsNullOrEmpty(request.PhoneNumber) && u.PhoneNumber == request.PhoneNumber)
       )
       .SortByDescending(u => u.CreatedAt)
       .FirstOrDefaultAsync();


            //var user = await _db.Users
            //    .Find(u => u.Email == lookup || u.PhoneNumber == lookup)
            //    .SortByDescending(u => u.CreatedAt)
            //    .FirstOrDefaultAsync();

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

            if (!user.IsRegistered || string.IsNullOrEmpty(user.PasswordHash))
                return Unauthorized("Please sign up to create your password.");


            if (user.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // Assign employee ID if missing
            //if (user.Role == "Employee" && string.IsNullOrEmpty(user.EmployeeId))
            //{
            //    user.EmployeeId = ObjectId.GenerateNewId().ToString();
            //    await _db.Users.UpdateOneAsync(
            //        u => u.Id == user.Id,
            //        Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId));

            //    await _db.Employees.UpdateOneAsync(
            //        e => e.Email == user.Email,
            //        Builders<Employee>.Update.Set(e => e.EmployeeId, user.EmployeeId));
            //}

            if (user.Role == "Employee" && string.IsNullOrEmpty(user.EmployeeId))
            {
                var emp = await _db.Employees
                    .Find(e => e.Email == user.Email || e.PhoneNumber == user.PhoneNumber)
                    .FirstOrDefaultAsync();

                if (emp == null || string.IsNullOrEmpty(emp.EmployeeId))
                    return Unauthorized("EmployeeId missing. Contact distributor.");

                user.EmployeeId = emp.EmployeeId;

                await _db.Users.UpdateOneAsync(
                    u => u.Id == user.Id,
                    Builders<User>.Update.Set(u => u.EmployeeId, user.EmployeeId)
                );
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

            return Ok(new
            {
                success = true,
                message = "Password created successfully. You can now login."
            });
        }
        //[HttpPost("signup")]
        //public async Task<IActionResult> SignUp([FromBody] LoginRequest request)
        //{
        //    if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
        //        return BadRequest("Email or Phone is required.");

        //    if (string.IsNullOrEmpty(request.Password))
        //        return BadRequest("Password is required.");

        //    var user = await _db.Users
        //        .Find(u =>
        //            (u.Email == request.Email || u.PhoneNumber == request.PhoneNumber) &&
        //            u.Role == "Distributor"
        //        )
        //        .SortByDescending(u => u.CreatedAt)
        //        .FirstOrDefaultAsync();

        //    if (user == null)
        //        return NotFound("Distributor not found. Contact admin.");

        //    if (user.IsRegistered && !string.IsNullOrEmpty(user.PasswordHash))
        //        return BadRequest("Password already created. Please login.");


        //    // ✅ THIS IS THE FIX
        //    var hashedPassword = ComputeHash(request.Password);

        //    await _db.Users.UpdateOneAsync(
        //        u => u.Id == user.Id,
        //        Builders<User>.Update
        //            .Set(u => u.PasswordHash, hashedPassword) // ✅ CORRECT
        //            .Set(u => u.IsRegistered, true)
        //    );

        //    return Ok(new { message = "Password created successfully. You can now login." });
        //}

        // ============================================================
        // OTP + RESET PASSWORD
        // ============================================================
        //[HttpPost("forgot-password")]
        //public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        //{


        //    if (string.IsNullOrWhiteSpace(request.Email))
        //        return BadRequest("Email is required");

        //    var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
        //    if (user == null)
        //    {
        //        // Do NOT reveal user existence
        //        return Ok("If the email exists, an OTP has been sent.");
        //    }


        //    var otp = new Random().Next(100000, 999999).ToString();
        //    Console.WriteLine($"[OTP] Generated OTP {otp} for {request.Email}");
        //    OtpStore.SaveOtp(request.Email, otp);

        //    try
        //    {
        //        await _emailService.SendOtpEmailAsync(request.Email, otp);
        //        return Ok("OTP sent.");
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, "Failed to send OTP: " + ex.Message);
        //    }
        //}

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required" });

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null)
                return NotFound(new { message = "User not found" });

            var otp = new Random().Next(100000, 999999).ToString();
            Console.WriteLine($"[OTP] Generated OTP {otp} for {request.Email}");

            OtpStore.SaveOtp(request.Email, otp);

            try
            {
                await _emailService.SendOtpEmailAsync(request.Email, otp); // ✅ await
                return Ok(new { message = "OTP sent successfully" });      // ✅ JSON
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to send OTP", error = ex.Message });
            }
        }


        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (OtpStore.VerifyOtp(request.Email, request.Otp))
                return Ok(new { message = "OTP verified successfully" });

            return BadRequest(new { message = "Invalid or expired OTP" });
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!OtpStore.VerifyOtp(request.Email, request.Otp))
                return BadRequest(new { message = "Invalid or expired OTP" });

            var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user != null)
            {
                user.PasswordHash = ComputeHash(request.NewPassword);
                user.IsRegistered = true;

                await _db.Users.UpdateOneAsync(
                    u => u.Id == user.Id,
                    Builders<User>.Update
                        .Set(u => u.PasswordHash, user.PasswordHash)
                        .Set(u => u.IsRegistered, true)
                );
            }

            // ✅ OTP CONSUMED HERE
            OtpStore.RemoveOtp(request.Email);

            return Ok(new { message = "Password reset successfully" });
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
        //[HttpPost("logout")]
        //public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        //{
        //    await _db.RefreshTokens.UpdateOneAsync(
        //        r => r.Token == request.RefreshToken,
        //        Builders<RefreshToken>.Update.Set(r => r.IsRevoked, true));

        //    return Ok("Logged out");
        //}


        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            await _db.RefreshTokens.UpdateOneAsync(
                r => r.Token == request.RefreshToken,
                Builders<RefreshToken>.Update.Set(r => r.IsRevoked, true));

            // 🔥 AUTO STOP DELIVERY SESSION
            //var employeeId = User.FindFirst("EmployeeId")?.Value;
            var employeeId = User.FindFirst("EmployeeId")?.Value
              ?? User.FindFirst("employeeId")?.Value;


            if (!string.IsNullOrEmpty(employeeId))
            {
                await _sessions.UpdateOneAsync(
                    s => s.EmployeeId == employeeId && s.IsActive,
                    Builders<DeliverySession>.Update
                        .Set(s => s.IsActive, false)
                        .Set(s => s.EndTime, DateTime.UtcNow)
                );
            }

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
