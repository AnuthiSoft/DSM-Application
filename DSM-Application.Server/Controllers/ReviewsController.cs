using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
 namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ReviewService _reviewService;
        public ReviewsController(ReviewService reviewService) { _reviewService = reviewService; }

        [HttpPost]
        //[Authorize] // any authenticated user
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] AddReviewDto dto)
        {
            var review = new Review
            {
                ReviewerId = dto.ReviewerId,
                TargetId = dto.TargetId,
                TargetType = dto.TargetType,
                Title = dto.Title,
                Description = dto.Description,
                Rating = dto.Rating
            };
            await _reviewService.AddAsync(review);
            return Ok(new { message = "Review submitted (pending admin approval)" });
        }

        // Admin: list pending reviews
        [HttpGet("pending")]
        //[Authorize(Roles = "Admin")]
        [AllowAnonymous]
        public async Task<IActionResult> Pending() => Ok(await _reviewService.GetPendingAsync());

        // Admin approve/reject
        [HttpPost("{id}/action")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Action(string id, [FromQuery] string action)
        {
            action = action switch { "approve" => "Approved", "reject" => "Rejected", _ => null };
            if (action == null) return BadRequest("action must be 'approve' or 'reject'");

            await _reviewService.UpdateStatusAsync(id, action);
            if (action == "Approved")
            {
                var rev = await _reviewService.GetByIdAsync(id);
                await _reviewService.RecalculateRatingAsync(rev.TargetId);
            }
            return Ok(new { message = $"Review {action.ToLower()}" });
        }
        [HttpGet("all")]
 

        public async Task<IActionResult> History()
        {
            var all = await _reviewService.GetAllAsync();
            return Ok(all);
        }
      

    }
}
