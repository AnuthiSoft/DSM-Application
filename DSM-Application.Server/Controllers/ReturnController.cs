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
            return Ok("Return completed");
        }

        // 5️⃣ REJECT RETURN
        [Authorize(Roles = "Distributor")]
        [HttpPut("reject/{returnId}")]
        public async Task<IActionResult> RejectReturn(string returnId, [FromBody] string reason)
        {
            await _returnService.RejectReturnAsync(returnId, reason);
            return Ok("Return rejected");
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


        [HttpGet("history/filter")]
        public async Task<IActionResult> GetReturnHistoryByStatus(string status)
        {
            var data = await _returnService.GetReturnHistoryByStatusAsync(status);
            return Ok(data);
        }

        [Authorize(Roles = "Distributor")]
        [HttpPut("complete-exchange/{returnId}")]
        public async Task<IActionResult> CompleteExchange(string returnId)
        {
            await _returnService.CompleteExchangeAsync(returnId);
            return Ok("Exchange completed");
        }


    }
}
