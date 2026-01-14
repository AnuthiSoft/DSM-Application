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
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized();

            await _inventoryService.AddStockAsync(
                req.ProductId, distributorId, req.Quantity, req.Reason);

            return Ok(new { message = "Stock added successfully" });
        }

        [HttpPost("stock-out")]
        public async Task<IActionResult> StockOut([FromBody] StockOutRequest req)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized();

            await _inventoryService.RemoveStockAsync(
                req.ProductId, distributorId, req.Quantity, req.Reason);

            return Ok(new { message = "Stock removed successfully" });
        }

        [HttpGet("movements/{distributorId}")]

        public async Task<IActionResult> Movements(string distributorId)

        {

            var result = await _inventoryService.GetMovements(distributorId);

            return Ok(result);

        }
        [Authorize(Roles = "Distributor")]

        [HttpPost("add")]

        public async Task<IActionResult> AddInventory(AddInventoryDto dto)

        {

            if (dto.ExpiryDate <= dto.ManufactureDate)

                return BadRequest(new { message = "Expiry date must be after manufacture date" });

            // ✅ GET DISTRIBUTOR ID FROM TOKEN

            var distributorId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))

                return Unauthorized();

            // ✅ CALL THE CORRECT SERVICE METHOD

            await _inventoryService.AddInventoryAsync(dto, distributorId);

            return Ok(new { message = "Inventory batch added successfully" });

        }


        [HttpGet("batches/{productId}")]
        public async Task<IActionResult> GetBatchesByProduct(string productId)
        {
            var batches = await _inventoryService.GetBatchDetailsByProduct(productId);
            return Ok(batches);
        }

        

        // GET: api/inventory/{productId}

        [HttpGet("{productId}")]

        public async Task<IActionResult> GetInventoryByProduct(string productId)

        {

            var inventory = await _inventoryService.GetInventoryByProductId(productId);

            if (inventory == null)

                return NotFound("Inventory not found");

            return Ok(inventory);

        }


        [Authorize(Roles = "Distributor")]
        [HttpGet("expiring/{distributorId}")]
        public async Task<IActionResult> GetExpiringStock(
    string distributorId,
    [FromQuery] int days = 30)
        {
            var result = await _inventoryService
                .GetExpiringStock(distributorId, days);

            return Ok(result);
        }


    }

    public class StockInRequest

    {

        public string ProductId { get; set; }

        //public string DistributorId { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; }

    }

    public class StockOutRequest

    {

        public string ProductId { get; set; }

        //public string DistributorId { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; }

    }

}

