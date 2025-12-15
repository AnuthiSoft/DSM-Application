using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService;

        public InventoryController(InventoryService service)
        {
            _inventoryService = service;
        }

        //[HttpGet("stock/{distributorId}")]
        //public async Task<IActionResult> GetStock(string distributorId)
        //{
        //    var result = await _inventoryService.GetAllStock(distributorId);
        //    return Ok(result);
        //}
        [HttpGet("stock/{distributorId}")]
        public async Task<IActionResult> GetStock(string distributorId)
        {
            Console.WriteLine("DistributorId =", distributorId);

            var result = await _inventoryService.GetAllStock(distributorId);

            Console.WriteLine("Stock Count =", result.Count);

            return Ok(result);
        }
        [HttpPost("stock-in")]
        public async Task<IActionResult> StockIn([FromBody] StockInRequest req)
        {
            await _inventoryService.AddStockAsync(req.ProductId, req.DistributorId, req.Quantity, req.Reason);
            return Ok(new { message = "Stock added successfully" });
        }

        [HttpPost("stock-out")]
        public async Task<IActionResult> StockOut([FromBody] StockOutRequest req)
        {
            await _inventoryService.RemoveStockAsync(req.ProductId, req.DistributorId, req.Quantity, req.Reason);
            return Ok(new { message = "Stock removed successfully" });
        }

        [HttpGet("movements/{distributorId}")]
        public async Task<IActionResult> Movements(string distributorId)
        {
            var result = await _inventoryService.GetMovements(distributorId);
            return Ok(result);
        }
    }

    public class StockInRequest
    {
        public string ProductId { get; set; }
        public string DistributorId { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; }
    }

    public class StockOutRequest
    {
        public string ProductId { get; set; }
        public string DistributorId { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; }
    }
}

