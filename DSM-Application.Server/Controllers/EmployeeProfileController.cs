using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly EmployeeProfileService _profileService;

    public EmployeesController(EmployeeProfileService profileService)
    {
        _profileService = profileService;
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
        // ✅ Get email from JWT
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
