//using DSM_Application.Server.Models;

//using DSM_Application.Server.Models.DTOs;

//using DSM_Application.Server.Services;

//using Microsoft.AspNetCore.Authorization;

//using Microsoft.AspNetCore.Http;

//using Microsoft.AspNetCore.Mvc;

//namespace DSM_Application.Server.Controllers

//{

//    [Route("api/[controller]")]

//    [ApiController]

//    public class InventoryController : ControllerBase

//    {

//        private readonly InventoryService _inventoryService;

//        public InventoryController(InventoryService service)

//        {

//            _inventoryService = service;

//        }

//        //[HttpGet("stock/{distributorId}")]

//        //public async Task<IActionResult> GetStock(string distributorId)

//        //{

//        //    var result = await _inventoryService.GetAllStock(distributorId);

//        //    return Ok(result);

//        //}

//        [HttpGet("stock/{distributorId}")]

//        public async Task<IActionResult> GetStock(string distributorId)

//        {

//            Console.WriteLine("DistributorId =", distributorId);

//            var result = await _inventoryService.GetAllStock(distributorId);

//            Console.WriteLine("Stock Count =", result.Count);

//            return Ok(result);

//        }

//        [HttpPost("stock-in")]
//        public async Task<IActionResult> StockIn([FromBody] StockInRequest req)
//        {
//            var distributorId = User.FindFirst("DistributorId")?.Value;
//            if (string.IsNullOrEmpty(distributorId))
//                return Unauthorized();

//            await _inventoryService.AddStockAsync(
//                req.ProductId, distributorId, req.Quantity, req.Reason);

//            return Ok(new { message = "Stock added successfully" });
//        }

//        [HttpPost("stock-out")]
//        public async Task<IActionResult> StockOut([FromBody] StockOutRequest req)
//        {
//            var distributorId = User.FindFirst("DistributorId")?.Value;
//            if (string.IsNullOrEmpty(distributorId))
//                return Unauthorized();

//            await _inventoryService.RemoveStockAsync(
//                req.ProductId, distributorId, req.Quantity, req.Reason);

//            return Ok(new { message = "Stock removed successfully" });
//        }

//        [HttpGet("movements/{distributorId}")]

//        public async Task<IActionResult> Movements(string distributorId)

//        {

//            var result = await _inventoryService.GetMovements(distributorId);

//            return Ok(result);

//        }
//        [Authorize(Roles = "Distributor")]

//        [HttpPost("add")]

//        public async Task<IActionResult> AddInventory(AddInventoryDto dto)

//        {

//            if (dto.ManufactureDate == default || dto.ExpiryDate == default)
//                return BadRequest("Manufacture & Expiry dates are required");

//            if (dto.ExpiryDate <= dto.ManufactureDate)
//                return BadRequest("Expiry must be after manufacture");


//            // ✅ GET DISTRIBUTOR ID FROM TOKEN

//            var distributorId = User.FindFirst("DistributorId")?.Value;

//            if (string.IsNullOrEmpty(distributorId))

//                return Unauthorized();

//            // ✅ CALL THE CORRECT SERVICE METHOD

//            // ✅ GET DISTRIBUTOR ID FROM TOKEN

//            var distributorId = User.FindFirst("DistributorId")?.Value;

//            if (string.IsNullOrEmpty(distributorId))

//                return Unauthorized();

//            // ✅ CALL THE CORRECT SERVICE METHOD

//            await _inventoryService.AddInventoryAsync(dto, distributorId, distributorId);


//            return Ok(new { message = "Inventory batch added successfully" });

//        }


//        [HttpGet("batches/{productId}")]
//        public async Task<IActionResult> GetBatchesByProduct(string productId)
//        {
//            var batches = await _inventoryService.GetBatchDetailsByProduct(productId);
//            return Ok(batches);
//        }



//        // GET: api/inventory/{productId}

//        [HttpGet("{productId}")]

//        public async Task<IActionResult> GetInventoryByProduct(string productId)

//        {

//            var inventory = await _inventoryService.GetInventoryByProductId(productId);

//            if (inventory == null)

//                return NotFound("Inventory not found");

//            return Ok(inventory);


//            [Authorize(Roles = "Distributor")]
//            [HttpGet("expiring/{distributorId}")]
//            public async Task<IActionResult> GetExpiringStock(
//        string distributorId,
//        [FromQuery] int days = 30)
//            {
//                var result = await _inventoryService
//                    .GetExpiringStock(distributorId, days);

//                return Ok(result);

//            }


//            [Authorize(Roles = "Distributor")]
//            [HttpGet("expiring/{distributorId}")]
//            public async Task<IActionResult> GetExpiringStock(
//        string distributorId,
//        [FromQuery] int days = 30)
//            {
//                var result = await _inventoryService
//                    .GetExpiringStock(distributorId, days);

//                return Ok(result);
//            }

//            [HttpGet("distributor/{distributorId}")]
//            public async Task<IActionResult> GetInventoryProducts(string distributorId)
//            {
//                var data = await _inventoryService.GetAllStock(distributorId);
//                return Ok(data);
//            }

//            [HttpGet("batches-by-distributor/{distributorId}")]
//            public async Task<IActionResult> GetBatchesByDistributor(string distributorId)
//            {
//                var batches = await _inventoryService.GetBatchesByDistributor(distributorId);

//                // ✅ Always return 200 for list APIs
//                return Ok(batches);
//            }

//            [HttpGet("distributor/{distributorId}")]
//            public async Task<IActionResult> GetInventoryProducts(string distributorId)
//            {
//                var data = await _inventoryService.GetAllStock(distributorId);
//                return Ok(data);
//            }

//            [HttpGet("batches-by-distributor/{distributorId}")]
//            public async Task<IActionResult> GetBatchesByDistributor(string distributorId)
//            {
//                var batches = await _inventoryService.GetBatchesByDistributor(distributorId);

//                // ✅ Always return 200 for list APIs
//                return Ok(batches);
//            }


//        }

//        public class StockInRequest

//        {

//            public string ProductId { get; set; }

//            //public string DistributorId { get; set; }

//            public int Quantity { get; set; }

//            public string Reason { get; set; }

//        }

//        public class StockOutRequest

//        {

//            public string ProductId { get; set; }

//            //public string DistributorId { get; set; }

//            public int Quantity { get; set; }

//            public string Reason { get; set; }

//        }

//    }
//}

using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
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

        // ---------------- STOCK ----------------

        [HttpGet("stock/{distributorId}")]
        public async Task<IActionResult> GetStock(string distributorId)
        {
            var result = await _inventoryService.GetAllStock(distributorId);
            return Ok(result);
        }

        [Authorize(Roles = "Distributor")]
        [HttpPost("stock-in")]
        public async Task<IActionResult> StockIn([FromBody] StockInRequest req)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized();

            await _inventoryService.AddStockAsync(
                req.ProductId, distributorId, req.Quantity, req.ManufactureDate,   // ✅ distributor provided
        req.ExpiryDate, req.Reason);

            return Ok(new { message = "Stock added successfully" });
        }

        [Authorize(Roles = "Distributor")]
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

        // ---------------- INVENTORY ----------------

        [Authorize(Roles = "Distributor")]
        [HttpPost("add")]
        public async Task<IActionResult> AddInventory(AddInventoryDto dto)
        {
            if (dto.ManufactureDate == default || dto.ExpiryDate == default)
                return BadRequest("Manufacture & Expiry dates are required");

            if (dto.ExpiryDate <= dto.ManufactureDate)
                return BadRequest("Expiry must be after manufacture");

            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized();

            await _inventoryService.AddInventoryAsync(dto, distributorId);

            return Ok(new { message = "Inventory batch added successfully" });
        }

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
            var result = await _inventoryService.GetExpiringStock(distributorId, days);
            return Ok(result);
        }

        [HttpGet("batches/{productId}")]
        public async Task<IActionResult> GetBatchesByProduct(string productId)
        {
            var batches = await _inventoryService.GetBatchDetailsByProduct(productId);
            return Ok(batches);
        }

        [HttpGet("batches-by-distributor/{distributorId}")]
        public async Task<IActionResult> GetBatchesByDistributor(string distributorId)
        {
            var batches = await _inventoryService.GetBatchesByDistributor(distributorId);
            return Ok(batches);
        }

        [Authorize(Roles = "Distributor")]
        [HttpPut("batches/update-dates")]
        public async Task<IActionResult> UpdateBatchDates(
    [FromBody] UpdateBatchDatesDto dto)
        {
            await _inventoryService.UpdateBatchDatesAsync(dto);
            return Ok();
        }
        // 🔥 Damaged + Expired stock (NON-SELLABLE)
        [Authorize(Roles = "Distributor")]
        [HttpGet("non-sellable")]
        public async Task<IActionResult> GetDamagedAndExpiredItems()
        {
            // 🔐 DistributorId from JWT
            var distributorId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized("Invalid distributor");

            var data = await _inventoryService
                .GetDamagedAndExpiredItemsAsync(distributorId);

            return Ok(data);
        }


    }

    public class StockInRequest
    {
        public string ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string Reason { get; set; }
    }

    public class StockOutRequest
    {
        public string ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string Reason { get; set; }
    }
}
