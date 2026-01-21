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
    public class FraudController : ControllerBase
    {
        private readonly FraudService _fraudService;
        public FraudController(FraudService fraudService) { _fraudService = fraudService; }

        //[HttpPost]
        ////[Authorize]
        //public async Task<IActionResult> Report([FromBody] AddFraudReportDto dto)
        //{
        //    var r = new FraudReport
        //    {
        //        ReportedById = dto.ReportedById,
        //        TargetId = dto.TargetId,
        //        TargetType = dto.TargetType,
        //        Reason = dto.Reason,
        //        EvidenceUrl = dto.EvidenceUrl
        //    };
        //    await _fraudService.AddAsync(r);
        //    return Ok(new { message = "Fraud report submitted (pending admin review)" });
        //}

        [HttpPost]
        public async Task<IActionResult> Report([FromBody] AddFraudReportDto dto)
        {
            if (string.IsNullOrEmpty(dto.TargetId) || string.IsNullOrEmpty(dto.TargetType))
            {
                return BadRequest("Invalid fraud target");
            }

            var report = new FraudReport
            {
                ReportedById = dto.ReportedById,
                TargetId = dto.TargetId,
                TargetType = dto.TargetType,
                Reason = dto.Reason,
                EvidenceUrl = dto.EvidenceUrl,
                Status = "Pending"
            };

            await _fraudService.AddAsync(report);

            return Ok(new { message = "Fraud report submitted (pending admin review)" });
        }




        [HttpGet("pending")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Pending() => Ok(await _fraudService.GetPendingAsync());

        [HttpPost("{id}/action")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Action(string id, [FromQuery] string action)
        {
            action = action switch { "approve" => "Approved", "reject" => "Rejected", _ => null };
            if (action == null) return BadRequest("action must be 'approve' or 'reject'");

            await _fraudService.UpdateStatusAsync(id, action);

            if (action == "Approved")
            {
                await _fraudService.OnFraudApprovedAsync(id);
            }
            return Ok(new { message = $"Fraud report {action.ToLower()}" });
        }
        [HttpGet("all")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllReports()
        {
            return Ok(await _fraudService.GetAllAsync());
        }

    }
}
