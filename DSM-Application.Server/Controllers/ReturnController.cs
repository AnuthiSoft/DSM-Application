using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace DSM_Application.Server.Controllers
{
    [ApiController]
    [Route("api/returns")]
    public class ReturnController : ControllerBase
    {
        private readonly ReturnService _returnService;

        public ReturnController(ReturnService returnService)
        {
            _returnService = returnService;
        }

        // 1️⃣ CREATE RETURN (ONLY AFTER DELIVERY)
        [Authorize(Roles = "Customer")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateReturn([FromBody] CreateReturnDto dto)
        {
            var createdReturn = await _returnService.CreateReturnAsync(dto);

            return Ok(new
            {
                id = createdReturn.Id,
                orderId = createdReturn.OrderId,
                productId = createdReturn.ProductId,
                status = createdReturn.Status,
                createdAt = createdReturn.CreatedAt
            });
        }


        // 2️⃣ APPROVE RETURN (Distributor)
        [Authorize(Roles = "Distributor")]
        [HttpPut("approve/{returnId}")]
        public async Task<IActionResult> ApproveReturn(string returnId)
        {
            await _returnService.ApproveReturnAsync(returnId);
            return Ok("Return approved");
        }

        // 3️⃣ RECEIVE RETURN (Salesman)
        [Authorize(Roles = "Employee")]
        [HttpPut("receive/{returnId}")]
        public async Task<IActionResult> ReceiveReturn(string returnId)
        {
            await _returnService.ReceiveReturnAsync(returnId);
            return Ok("Return received");
        }

        // 4️⃣ COMPLETE RETURN
        //[Authorize(Roles = "Distributor")]
        //[HttpPut("complete/{returnId}")]
        //public async Task<IActionResult> CompleteReturn(string returnId)
        //{
        //    // 🔐 Get DistributorId from JWT
        //    var distributorId = User.FindFirst("DistributorId")?.Value;

        //    if (string.IsNullOrEmpty(distributorId))
        //        return Unauthorized("Invalid distributor");

        //    // ✅ Pass distributorId to service
        //    await _returnService.CompleteReturnAsync(returnId, distributorId);

        //    return Ok("Return completed");
        //}

        [Authorize(Roles = "Distributor")]
        [HttpPut("complete/{returnId}")]
        public async Task<IActionResult> CompleteReturn(string returnId)
        {
            await _returnService.CompleteReturnAsync(returnId);
            return Ok(new { message = "Return completed" });
        }

        // 5️⃣ REJECT RETURN
        [Authorize(Roles = "Customer,Distributor")]
        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectReturn(
    [FromRoute] string id,
    [FromBody] RejectReasonRequest body
)
        {
            await _returnService.RejectReturnAsync(
                id,
                body.Reason,
                "Distributor"
            );

            return Ok();
        }



        [HttpGet("{id}")]
        public async Task<IActionResult> GetReturnById(string id)
        {
            var result = await _returnService.GetReturnByIdAsync(id);

            if (result == null)
                return NotFound("Return not found");

            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetReturnHistory([FromQuery] string? status)
        {
            var result = await _returnService.GetReturnHistoryAsync(status);
            return Ok(result);
        }



        [Authorize(Roles = "Customer,Employee")]
        [HttpPost("{returnId}/images")]
        public async Task<IActionResult> UploadReturnImages(
      string returnId,
      List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            await _returnService.UploadReturnImagesAsync(returnId, files);
            return Ok(new { message = "Images uploaded" });
        }


        [HttpGet("return-image/{imageId}")]
        public async Task<IActionResult> GetReturnImage(string imageId)
        {
            var stream = await _returnService.GetReturnImageStreamByIdAsync(imageId);

            if (stream == null)
                return NotFound();

            return File(stream, "image/jpeg");
        }







        [Authorize(Roles = "Distributor")]
        [HttpGet("pending/{distributorId}")]
        public async Task<IActionResult> GetPendingReturns(string distributorId)
        {
            var data = await _returnService.GetPendingReturnsForDistributor(distributorId);
            return Ok(data);
        }


        [Authorize(Roles = "Distributor")]
        [HttpPost("{returnId}/schedule-pickup")]
        public async Task<IActionResult> SchedulePickup(string returnId,[FromBody] SchedulePickupDto dto)
        {
            await _returnService.SchedulePickupAsync(returnId, dto);
            return Ok(new { message = "Pickup scheduled" });
        }


        [HttpGet("assigned-to-employee/{employeeId}")]
        public async Task<IActionResult> GetAssignedReturns(string employeeId)
        {
            var returns = await _returnService.GetReturnsForEmployee(employeeId);
            return Ok(returns);
        }


        [Authorize(Roles = "Employee")]
        [HttpPut("picked-up/{returnId}")]
        public async Task<IActionResult> MarkPickedUp(string returnId)
        {
            await _returnService.MarkPickedUpAsync(returnId);
            return Ok(new { message = "Product submitted to distributor" });

        }


        [Authorize(Roles = "Distributor")]
        [HttpGet("distributor/{distributorId}")]
        public async Task<IActionResult> GetReturnHistoryForDistributor(string distributorId)
        {
            var data = await _returnService.GetAllReturnsForDistributorAsync(distributorId);
            return Ok(data);
        }






        [HttpGet("history/filter")]
        public async Task<IActionResult> GetReturnHistoryByStatus(string status)
        {
            var data = await _returnService.GetReturnHistoryByStatusAsync(status);
            return Ok(data);
        }


    }
}
