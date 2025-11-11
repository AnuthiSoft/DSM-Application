using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System.Security.Claims;

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

        [HttpGet("distributor/{distributorId}")]
        public async Task<IActionResult> GetOrdersByDistributor(string distributorId, [FromQuery] string? status = null)
        {
            var filter = Builders<Order>.Filter.Eq(o => o.DistributorId, distributorId);
            if (!string.IsNullOrEmpty(status))
            {
                filter = Builders<Order>.Filter.And(filter, Builders<Order>.Filter.Eq(o => o.Status, status));
            }

            var orders = await _mongo.Orders.Find(filter)
                .SortByDescending(o => o.OrderDate)
                .ToListAsync();

            var result = new List<DistributorOrderDto>();
            foreach (var o in orders)
            {
                var customer = await _mongo.Customers.Find(c => c.CustomerId == o.CustomerId).FirstOrDefaultAsync();
                Employee employee = null;
                if (!string.IsNullOrEmpty(o.EmployeeId))
                {
                    employee = await _mongo.Employees
                        .Find(e => e.EmployeeId == o.EmployeeId)
                        .FirstOrDefaultAsync();
                }

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
                    Status = o.Status,
                    EmployeeId = employee?.EmployeeId,
                    Name = employee?.Name,
                     PaymentCollectedByEmployee = o.PaymentCollectedByEmployee,
                    CollectedAmount = o.CollectedAmount,
                    PaymentMethod = o.PaymentMethod,
                    CollectedOn = o.CollectedOn

                    // ✅ Include these two fields

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
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetOrdersByEmployee(string employeeId)
        {
            var orders = await _mongo.Orders
                .AsQueryable()
                .Where(o => o.EmployeeId == employeeId)
                .ToListAsync();

            // If you need product details, query Products collection separately
            // and join manually or embed products in Orders.

            return Ok(orders);
        }
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
                Status = order.Status,
                EmployeeId=order.EmployeeId,

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
        [Authorize(Roles = "Distributor")]
        [HttpPut("{orderId}/assign")]
        public async Task<IActionResult> AssignOrderToEmployee(string orderId, [FromBody] AssignOrderDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.EmployeeId))
                return BadRequest("EmployeeId required");

            var distributorIdFromToken = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorIdFromToken))
                return Unauthorized("DistributorId missing from token");

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.DistributorId != distributorIdFromToken)
                return Forbid("Not authorized to modify this order");

            if (order.Status != "Confirmed" && order.Status != "Pending")
                return BadRequest($"Order cannot be assigned in state '{order.Status}'");

            var emp = await _mongo.Employees.Find(e => e.EmployeeId == dto.EmployeeId && e.DistributorId == distributorIdFromToken).FirstOrDefaultAsync();
            if (emp == null) return BadRequest("Employee not found for this distributor");
            order.EmployeeId = emp.EmployeeId;  // This ensures it matches the login system ID
            order.Name = emp.Name;

            // ✅ Save EmployeeId and EmployeeName consistently
            var update = Builders<Order>.Update
               .Set(o => o.EmployeeId, dto.EmployeeId)
        .Set(o => o.Name, dto.EmployeeName)
                .Set(o => o.AssignedOn, DateTime.UtcNow)
                .Set(o => o.Status, "Assigned");

            if (!string.IsNullOrEmpty(dto.Note))
                update = update.Set(o => o.DeliveryRemarks, dto.Note);
            await _mongo.Orders.UpdateOneAsync(o => o.Id == order.Id, update);

            return Ok(new { message = "Order assigned to employee", orderId, assignedTo = dto.EmployeeId });
        }
        [HttpGet("{distributorId}/employees")]
        public async Task<IActionResult> GetEmployees(string distributorId)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest("DistributorId required");

            var employees = await _mongo.Employees
                .Find(e => e.DistributorId == distributorId)
                .ToListAsync();

            return Ok(employees);
        }
        [HttpGet("by-employee/{employeeId}")]
        public async Task<IActionResult> GetOrdersByEmployeeId(string employeeId)
        {
            if (string.IsNullOrEmpty(employeeId))
                return BadRequest("EmployeeId required");

            var objectId = new ObjectId(employeeId);
            var orders = await _mongo.Orders
                .Find(o => o.EmployeeId == objectId.ToString())
                .SortByDescending(o => o.AssignedOn)
                .ToListAsync();

            var result = new List<object>();

            foreach (var order in orders)
            {
                var customer = await _mongo.Customers
                    .Find(c => c.CustomerId == order.CustomerId)
                    .FirstOrDefaultAsync();

                result.Add(new
                {
                    order.Id,
                    order.Status,
                    order.TotalAmount,
                    order.OrderDate,
                    order.Products,
                    customerName = customer?.Name,
                    customerPhone = customer?.PhoneNumber,
                    customerEmail = customer?.Email,
                    customerAddress = customer?.Address
                });
            }

            return Ok(result);
        }
        //[Authorize(Roles = "Employee")]
        [HttpPut("{orderId}/collect-payment")]
        public async Task<IActionResult> CollectPayment(string orderId, [FromBody] CollectPaymentDto dto)
        {
            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Forbid("You are not assigned to this order");

            if (order.PaymentCollectedByEmployee)
                return BadRequest("Payment already collected for this order");

            var update = Builders<Order>.Update
                .Set(o => o.PaymentCollectedByEmployee, true)
                .Set(o => o.CollectedAmount, dto.CollectedAmount)
                .Set(o => o.PaymentMethod, dto.PaymentMethod)
                .Set(o => o.CollectedOn, DateTime.UtcNow)
                .Set(o => o.Status, "Delivered");

            await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);

            return Ok(new { message = "Payment collected and order marked as delivered" });
        }
        // DTOs inside controller for convenience (you can move these to separate files)
        //[Authorize(Roles = "Employee")]
        [HttpPut("{orderId}/employee-status")]
        public async Task<IActionResult> EmployeeUpdateStatus(string orderId, [FromBody] UpdateStatusDto body)
        {
            var requestedStatus = (body?.Status ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            var employeeId = User.FindFirst("EmployeeId")?.Value ?? User.FindFirstValue("EmployeeId");
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Forbid("Not authorized to modify this order");

            if (order.Status != "Assigned" && order.Status != "Shipped")
                return BadRequest($"Cannot change status from '{order.Status}'");

            var update = Builders<Order>.Update
                .Set(o => o.Status, requestedStatus)
                .Set(o => o.DeliveredOn, DateTime.UtcNow)
                .Set(o => o.PaymentMethod, body.PaymentMethod)
                .Set(o => o.CollectedAmount, body.CollectedAmount)
                .Set(o => o.PaymentCollectedByEmployee, true)
                .Set(o => o.CollectedOn, DateTime.UtcNow);

            await _mongo.Orders.UpdateOneAsync(o => o.Id == order.Id, update);

            return Ok(new
            {
                message = "Order delivered and payment recorded",
                status = requestedStatus,
                payment = body.PaymentMethod,
                amount = body.CollectedAmount
            });
        }
        [Authorize(Roles = "Customer")]
        [HttpPut("{orderId}/cancel")]
        public async Task<IActionResult> CancelOrder(string orderId)
        {
            var customerId = User.FindFirst("CustomerId")?.Value;
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized("CustomerId missing from token");

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.CustomerId != customerId)
                return Forbid("Not authorized to cancel this order");

            if (order.Status != "Pending")
                return BadRequest($"Order cannot be canceled in status '{order.Status}'");

            var update = Builders<Order>.Update.Set(o => o.Status, "Canceled")
                                               .Set(o => o.CanceledOn, DateTime.UtcNow);

            await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);

            return Ok(new { message = "Order canceled successfully", orderId });
        }
        [Authorize(Roles = "Customer")]
        [HttpPost("{orderId}/reorder")]
        public async Task<IActionResult> Reorder(string orderId)
        {
            var customerId = User.FindFirst("CustomerId")?.Value;
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized("CustomerId missing from token");

            var existingOrder = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (existingOrder == null) return NotFound("Order not found");

            if (existingOrder.CustomerId != customerId)
                return Forbid("Not authorized to reorder this order");

            if (existingOrder.Status != "Delivered")
                return BadRequest($"Only delivered orders can be reordered. Current status: '{existingOrder.Status}'");

            var newOrder = new Order
            {
                CustomerId = existingOrder.CustomerId,
                DistributorId = existingOrder.DistributorId,
                Products = existingOrder.Products.Select(p => new OrderProduct
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    Price = p.Price,
                    Quantity = p.Quantity
                }).ToList(),
                TotalAmount = existingOrder.Products.Sum(p => p.Price * p.Quantity),
                OrderDate = DateTime.UtcNow,
                Status = "Pending"
            };

            await _mongo.Orders.InsertOneAsync(newOrder);

            return Ok(new { message = "Order placed successfully", orderId = newOrder.Id });
        }
    }
}

