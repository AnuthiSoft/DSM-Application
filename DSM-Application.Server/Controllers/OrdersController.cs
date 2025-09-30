using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public OrdersController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        {
            if (dto == null || dto.Products == null || dto.Products.Count == 0)
                return BadRequest("No products provided");

            var order = new Order
            {
                CustomerId = dto.CustomerId,
                DistributorId = dto.DistributorId,
                Products = dto.Products.Select(p => new OrderProduct
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    Price = p.Price,
                    Quantity = p.Quantity
                }).ToList(),
                TotalAmount = dto.Products.Sum(p => p.Price * p.Quantity),
                OrderDate = DateTime.UtcNow,
                Status = "Pending"
            };

            await _mongo.Orders.InsertOneAsync(order);
            return Ok(new { message = "Order placed successfully", orderId = order.Id });
        }
        [Authorize(Roles = "Customer")]
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetCustomerOrders(string customerId)
        {
            // ✅ Read CustomerId from JWT token
            var customerIdFromToken = User.FindFirst("CustomerId")?.Value;

            if (string.IsNullOrEmpty(customerIdFromToken))
                return Unauthorized("CustomerId missing from token");

            // Ensure the customerId matches the logged-in user's customerId
            if (customerId != customerIdFromToken)
                return Forbid("Not authorized to view other customers' orders");

            var orders = await _mongo.Orders
                .Find(o => o.CustomerId == customerId)
                .SortByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/orders/distributor/{distributorId}?status=Pending
        [HttpGet("distributor/{distributorId}")]
        public async Task<IActionResult> GetOrdersByDistributor(string distributorId, [FromQuery] string? status = null)
        {
            var filter = Builders<Order>.Filter.Eq(o => o.DistributorId, distributorId);
            if (!string.IsNullOrEmpty(status))
            {
                filter = Builders<Order>.Filter.And(filter, Builders<Order>.Filter.Eq(o => o.Status, status));
            }

            var orders = await _mongo.Orders.Find(filter).SortByDescending(o => o.OrderDate).ToListAsync();

            // Resolve customer details for UI convenience
            var result = new List<DistributorOrderDto>();
            foreach (var o in orders)
            {
                var customer = await _mongo.Customers.Find(c => c.CustomerId == o.CustomerId).FirstOrDefaultAsync();
                result.Add(new DistributorOrderDto
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    CustomerName = customer?.Name ?? "Unknown",
                    CustomerEmail = customer?.Email,
                    CustomerPhone = customer?.PhoneNumber,
                    Products = o.Products,
                    TotalAmount = o.TotalAmount,
                    OrderDate = o.OrderDate,
                    Status = o.Status
                });
            }

            return Ok(result);
        }

        // Optional: distributor can update order status
        //[HttpPut("{orderId}/status")]
        //public async Task<IActionResult> UpdateStatus(string orderId, [FromBody] string status)
        //{
        //    var update = Builders<Order>.Update.Set(o => o.Status, status);
        //    var res = await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);
        //    if (res.ModifiedCount == 0) return NotFound("Order not found");
        //    return NoContent();
        //}
        // GET: api/orders/{orderId}
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrder(string orderId)
        {
            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound();
            var customer = await _mongo.Customers.Find(c => c.CustomerId == order.CustomerId).FirstOrDefaultAsync();
            var dto = new DistributorOrderDto
            {
                Id = order.Id,
                CustomerId = order.CustomerId,
                CustomerName = customer?.Name,
                CustomerEmail = customer?.Email,
                CustomerPhone = customer?.PhoneNumber,
                Products = order.Products,
                TotalAmount = order.TotalAmount,
                OrderDate = order.OrderDate,
                Status = order.Status
            };
            return Ok(dto);
        }

        // Distributor-only endpoint to update status.
        // It ensures the logged-in distributor owns the order.
        [Authorize(Roles = "Distributor")]
        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> UpdateStatus(string orderId, [FromBody] UpdateStatusDto body)
        {
            var requestedStatus = (body?.Status ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            // Get distributor id from JWT (your tokens include this claim in other controllers)
            var distributorIdFromToken = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorIdFromToken))
                return Unauthorized("DistributorId missing from token");

            // Find order
            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            // ensure distributor owns this order
            if (order.DistributorId != distributorIdFromToken) return Forbid("Not authorized for this order");

            // Example state transitions you might want to enforce:
            // Pending -> Confirmed -> Shipped -> Delivered
            // Pending -> Rejected (allowed)
            // We'll implement a simple guard and special handling for Confirmed.
            var from = order.Status;
            var to = requestedStatus;

            // If moving to Confirmed from Pending: check product stock and decrement
            if (from == "Pending" && to == "Confirmed")
            {
                // Validate stock
                foreach (var p in order.Products)
                {
                    var product = await _mongo.Products.Find(x => x.ProductId == p.ProductId).FirstOrDefaultAsync();
                    if (product == null)
                        return BadRequest($"Product '{p.ProductId}' not found");

                    if (product.Stock < p.Quantity)
                        return BadRequest($"Insufficient stock for '{product.ProductName}'. Available: {product.Stock}, Required: {p.Quantity}");
                }

                // Decrement stock for each product
                foreach (var p in order.Products)
                {
                    var update = Builders<Product>.Update.Inc(pr => pr.Stock, -p.Quantity);
                    await _mongo.Products.UpdateOneAsync(pr => pr.ProductId == p.ProductId, update);
                }
            }

            // Update order status
            var upd = Builders<Order>.Update.Set(o => o.Status, to);
            await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, upd);

            return Ok(new { message = "Order status updated", status = to });
        }

        // DTOs inside controller for convenience (you can move these to separate files)
        public class UpdateStatusDto
        {
            public string Status { get; set; }
        }

        public class DistributorOrderDto
        {
            public string Id { get; set; }
            public string CustomerId { get; set; }
            public string CustomerName { get; set; }
            public string CustomerEmail { get; set; }
            public string CustomerPhone { get; set; }
            public List<OrderProduct> Products { get; set; }
            public double TotalAmount { get; set; }
            public DateTime OrderDate { get; set; }
            public string Status { get; set; }
        }
    }
}

