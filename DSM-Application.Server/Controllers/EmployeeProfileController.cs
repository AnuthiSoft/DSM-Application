using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
[ApiController]
[Route("api/employee-profile")]
[Authorize]
public class EmployeeProfileController : ControllerBase
{
    private readonly EmployeeProfileService _profileService;

    public EmployeeProfileController(EmployeeProfileService profileService)
    {
        _profileService = profileService;
    }

    // ===========================
    // GET MY PROFILE
    [HttpGet("my-profile")]
    public async Task<IActionResult> GetMyProfile()
    {
        var email = User.Identity?.Name
            ?? User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
            return Unauthorized();

        var profile = await _profileService.GetProfileByEmailAsync(email);

        return Ok(new
        {
            name = profile.Name,
            email = profile.Email,
            phoneNumber = profile.PhoneNumber,

            // 🔥 CRITICAL FIX — camelCase
            street = profile.Street,
            city = profile.City,
            state = profile.State,
            pincode = profile.Pincode,
            country = profile.Country,

            createdDate = profile.CreatedDate,
            updatedDate = profile.UpdatedDate,
            isActive = profile.IsActive
        });
    }




    // ===========================
    // UPDATE MY PROFILE
    // ===========================
    [HttpPut("my-profile")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromForm] UpdateEmployeeProfileDto dto,
        [FromForm] IFormFile? profileImage
    )
    {
        var email = User.Identity?.Name
                    ?? User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
            return Unauthorized("Invalid token");

        await _profileService.UpdateProfileByEmailAsync(
            email,
            dto,
            profileImage
        );

        return Ok(new { message = "Profile updated successfully" });
    }
}
