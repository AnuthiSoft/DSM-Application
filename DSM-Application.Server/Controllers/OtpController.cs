using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Claims;


namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OtpController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public OtpController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        private string GenerateOtp()
        {
            return new Random().Next(100000, 999999).ToString();
        }

        // ---------------- SEND OTP ----------------
        [HttpPost("send")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest("Phone number is required");

            string otp = GenerateOtp();

            var update = Builders<Otp>.Update
                .Set(o => o.Code, otp)
                .Set(o => o.PhoneNumber, dto.PhoneNumber)
                .Set(o => o.ExpiresAt, DateTime.UtcNow.AddMinutes(5));

            await _mongo.Otps.UpdateOneAsync(
                o => o.PhoneNumber == dto.PhoneNumber,
                update,
                new UpdateOptions { IsUpsert = true }
            );

            return Ok(new
            {
                message = "OTP sent successfully",
                otp = otp   //  THIS LINE
            });

            //return Ok(new { otp, message = "OTP generated and saved to MongoDB" });
        }

        // ---------------- VERIFY OTP ----------------
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var entry = await _mongo.Otps
                .Find(o => o.PhoneNumber == dto.PhoneNumber)
                .FirstOrDefaultAsync();

            if (entry == null)
                return BadRequest(new { success = false, message = "OTP not found" });

            if (entry.ExpiresAt < DateTime.UtcNow)
                return BadRequest(new { success = false, message = "OTP expired" });

            if (entry.Code != dto.Code)
                return BadRequest(new { success = false, message = "Invalid OTP" });

            await _mongo.Otps.DeleteOneAsync(o => o.PhoneNumber == dto.PhoneNumber);

            return Ok(new { success = true, message = "Phone number verified successfully" });
        }
    }
}