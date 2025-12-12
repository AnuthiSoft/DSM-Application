using CloudinaryDotNet.Actions;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System.Security.Claims;
using YourApp.Models;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        private readonly IMongoCollection<Product> _products;

        private readonly IMongoCollection<Order> _orders;

        private readonly DiscountService _discountService;

        public OrdersController(MongoDbService mongo, DiscountService discountService)

        {

            _mongo = mongo;

            _products = _mongo.Products;   // ✅ use properties from MongoDbService

            _orders = _mongo.Orders;       // ✅ use properties from MongoDbService

            _discountService = discountService;

        }




        //[HttpPost]
        //public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        //{
        //    if (dto == null || dto.Products == null || dto.Products.Count == 0)
        //        return BadRequest("No products provided");

        //    var order = new Order
        //    {
        //        CustomerId = dto.CustomerId,
        //        DistributorId = dto.DistributorId,
        //        Products = dto.Products.Select(p => new OrderProduct
        //        {
        //            ProductId = p.ProductId,
        //            ProductName = p.ProductName,
        //            Price = p.Price,
        //            Quantity = p.Quantity
        //        }).ToList(),
        //        TotalAmount = dto.Products.Sum(p => p.Price * p.Quantity),
        //        OrderDate = DateTime.UtcNow,
        //        Status = "Pending"
        //    };

        //    await _mongo.Orders.InsertOneAsync(order);
        //    return Ok(new { message = "Order placed successfully", orderId = order.Id });
        //}





        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        {
            if (dto == null || dto.Products == null || dto.Products.Count == 0)
                return BadRequest("No products provided");

            decimal totalSubtotal = 0;
            decimal totalDiscountAmount = 0;
            decimal totalFinalAmount = 0;

            var orderProducts = new List<OrderProduct>();

            foreach (var p in dto.Products)
            {
                var product = await _products.Find(x => x.ProductId == p.ProductId).FirstOrDefaultAsync();
                if (product == null)
                    return NotFound($"Product not found: {p.ProductId}");

                decimal unitPrice = product.Price;
                decimal subtotal = unitPrice * p.Quantity;

                var calc = _discountService.Calculate(p.Quantity, subtotal, dto.SpecialDiscountPercent);

                orderProducts.Add(new OrderProduct
                {
                    ProductId = p.ProductId,
                    ProductName = product.ProductName,
                    Price = unitPrice,
                    Quantity = p.Quantity,
                    QuantityDiscountPercent = calc.qtyPct,
                    PriceDiscountPercent = calc.pricePct,
                    SpecialDiscountPercent = dto.SpecialDiscountPercent,
                    TotalDiscountPercent = calc.totalPercent,
                    DiscountAmount = calc.discountAmount,
                    FinalPrice = calc.finalPrice
                });

                totalSubtotal += subtotal;
                totalDiscountAmount += calc.discountAmount;
                totalFinalAmount += calc.finalPrice;
            }

            // -----------------------------------------------------
            // ⭐ NEW EMPLOYEE ASSIGNMENT LOGIC
            // -----------------------------------------------------

            // Fetch permanent employee from connection table     
            var connection = await _mongo.Connections
                .Find(c => c.CustomerId == dto.CustomerId &&
                           c.DistributorId == dto.DistributorId)
                .FirstOrDefaultAsync();

            // Check temporary assignment for today
            var todayTemp = await _mongo.TemporaryAssignments
                .Find(x => x.CustomerId == dto.CustomerId &&
                           x.DistributorId == dto.DistributorId &&
                           x.AssignedDate == DateTime.UtcNow.Date)
                .FirstOrDefaultAsync();

            // Decide final employee:
            // If temp exists today → use him
            // Else → fallback to permanent employee
            //var assignedEmployeeId = todayTemp?.TemporaryEmployeeId ?? connection?.PermanentEmployeeId;

            // Safety check
            // No employee assigned yet -> allow order creation
            string? assignedEmployeeId = todayTemp?.TemporaryEmployeeId ?? connection?.PermanentEmployeeId;

            // Do NOT block order creation


            // -----------------------------------------------------
            // BUILD ORDER OBJECT
            // -----------------------------------------------------

            var order = new Order
            {
                CustomerId = dto.CustomerId,
                DistributorId = dto.DistributorId,

                // 🆕 NEW FIELDS (Correct syntax)
                OrderedDate = DateTime.UtcNow,
                ExpectedDeliveryDate = DateTime.UtcNow.AddDays(1),

                Products = orderProducts,
                Subtotal = totalSubtotal,
                TotalDiscount = totalDiscountAmount,
                TotalAmount = totalFinalAmount,

                OrderDate = DateTime.UtcNow,
                Status = "Pending",

                EmployeeId = assignedEmployeeId
            };


            await _orders.InsertOneAsync(order);

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

            // ✅ Map orders to DTO including discount fields
            var result = orders.Select(o => new DistributorOrderDto
            {
                Id = o.Id,
                CustomerId = o.CustomerId,

                Products = o.Products,

                // ✅ Discount totals
                Subtotal = o.Subtotal,
                TotalDiscount = o.TotalDiscount,
                TotalAmount = o.TotalAmount,

                // ✅ Discount breakdown per item (use first item)
                SpecialDiscountPercent = o.Products.First().SpecialDiscountPercent,
                QuantityDiscountPercent = o.Products.First().QuantityDiscountPercent,
                PriceDiscountPercent = o.Products.First().PriceDiscountPercent,
                TotalDiscountPercent = o.Products.First().TotalDiscountPercent,

                OrderedDate = o.OrderedDate,
                Status = o.Status,
                EmployeeId = o.EmployeeId,
                Name = o.Name
            }).ToList();

            return Ok(result);
        }





        //[Authorize(Roles = "Customer")]
        //[HttpGet("customer/{customerId}")]
        //public async Task<IActionResult> GetCustomerOrders(string customerId)
        //{
        //    // ✅ Read CustomerId from JWT token
        //    var customerIdFromToken = User.FindFirst("CustomerId")?.Value;

        //    if (string.IsNullOrEmpty(customerIdFromToken))
        //        return Unauthorized("CustomerId missing from token");

        //    // Ensure the customerId matches the logged-in user's customerId
        //    if (customerId != customerIdFromToken)
        //        return Forbid("Not authorized to view other customers' orders");

        //    var orders = await _mongo.Orders
        //        .Find(o => o.CustomerId == customerId)
        //        .SortByDescending(o => o.OrderDate)
        //        .ToListAsync();

        //    return Ok(orders);
        //}

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
                    Subtotal = o.Subtotal,
                    TotalDiscount = o.TotalDiscount,
                    TotalAmount = o.TotalAmount,
                    SpecialDiscountPercent = o.Products.First().SpecialDiscountPercent,
                    QuantityDiscountPercent = o.Products.First().QuantityDiscountPercent,
                    PriceDiscountPercent = o.Products.First().PriceDiscountPercent,
                    TotalDiscountPercent = o.Products.First().TotalDiscountPercent,
                    OrderedDate = o.OrderedDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate,
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
            if (string.IsNullOrEmpty(employeeId))
                return BadRequest("EmployeeId required");

            var orders = await _mongo.Orders
                .Find(o => o.EmployeeId == employeeId)
                .SortByDescending(o => o.AssignedOn)
                .ToListAsync();

            var result = new List<object>();
            foreach (var order in orders)
            {
                var customer = await _mongo.Customers.Find(c => c.CustomerId == order.CustomerId).FirstOrDefaultAsync();

                result.Add(new
                {
                    id = order.Id,
                    customerId = order.CustomerId,
                    customerName = customer?.Name,
                    customerPhone = customer?.PhoneNumber,
                    customerEmail = customer?.Email,
                    customerAddress = customer?.Address,
                    products = order.Products.Select(p => new {
                        productId = p.ProductId,
                        productName = p.ProductName,
                        price = p.Price,
                        quantity = p.Quantity
                    }),
                    subtotal = order.Subtotal,
                    totalAmount = order.TotalAmount,
                    status = order.Status,
                    paymentCollectedByEmployee = order.PaymentCollectedByEmployee,
                    collectedAmount = order.CollectedAmount,
                    paymentMethod = order.PaymentMethod,
                    collectedOn = order.CollectedOn,
                    orderDate = order.OrderDate
                });
            }

            return Ok(result);
        }

        //[HttpGet("{orderId}")]
        //public async Task<IActionResult> GetOrder(string orderId)
        //{
        //    var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
        //    if (order == null) return NotFound();
        //    var customer = await _mongo.Customers.Find(c => c.CustomerId == order.CustomerId).FirstOrDefaultAsync();
        //    var dto = new DistributorOrderDto
        //    {
        //        Id = order.Id,
        //        CustomerId = order.CustomerId,
        //        CustomerName = customer?.Name,
        //        CustomerEmail = customer?.Email,
        //        CustomerPhone = customer?.PhoneNumber,
        //        Products = order.Products,
        //        Subtotal = order.Subtotal,
        //        TotalDiscount = order.TotalDiscount,
        //        TotalAmount = order.TotalAmount,


        //        OrderDate = order.OrderDate,
        //        Status = order.Status,
        //        EmployeeId=order.EmployeeId,

        //    };
        //    return Ok(dto);
        //}


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

                // ✅ Discount totals
                Subtotal = order.Subtotal,
                TotalDiscount = order.TotalDiscount,
                TotalAmount = order.TotalAmount,

                // ✅ Discount breakdown per product
                SpecialDiscountPercent = order.Products.First().SpecialDiscountPercent,
                QuantityDiscountPercent = order.Products.First().QuantityDiscountPercent,
                PriceDiscountPercent = order.Products.First().PriceDiscountPercent,
                TotalDiscountPercent = order.Products.First().TotalDiscountPercent,

                OrderedDate = order.OrderedDate,
                Status = order.Status,
                EmployeeId = order.EmployeeId,
                Name = order.Name,
                PaymentCollectedByEmployee = order.PaymentCollectedByEmployee,
                CollectedAmount = order.CollectedAmount,
                PaymentMethod = order.PaymentMethod,
                CollectedOn = order.CollectedOn,
                DeliveredOn = order.DeliveredOn
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
            if (order.DistributorId != distributorIdFromToken) return Unauthorized("Not authorized for this order");

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
        [HttpPut("{orderId}/assign")]
        public async Task<IActionResult> AssignOrder(string orderId, [FromBody] AssignOrderDto dto)
        {
            var order = await _orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (string.IsNullOrEmpty(dto.EmployeeId))
                return BadRequest("EmployeeId is required");

            order.EmployeeId = dto.EmployeeId;
            order.Name = dto.EmployeeName;
            order.AssignedOn = DateTime.UtcNow;

            // 🔥 Update order status here
            order.Status = "Shipped";

            await _orders.ReplaceOneAsync(o => o.Id == orderId, order);

            return Ok(new { message = "Order assigned & shipped" });
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
        //[HttpGet("by-employee/{employeeId}")]
        //public async Task<IActionResult> GetOrdersByEmployeeId(string EmployeeId)
        //{
        //    if (string.IsNullOrEmpty(EmployeeId))
        //        return BadRequest("EmployeeId required");

        //    var objectId = new ObjectId(EmployeeId);
        //    var orders = await _mongo.Orders
        //        .Find(o => o.EmployeeId == objectId.ToString())
        //        .SortByDescending(o => o.AssignedOn)
        //        .ToListAsync();

        //    var result = new List<object>();

        //    foreach (var order in orders)
        //    {
        //        var customer = await _mongo.Customers
        //            .Find(c => c.CustomerId == order.CustomerId)
        //            .FirstOrDefaultAsync();

        //        result.Add(new
        //        {
        //            order.Id,
        //            order.Status,
        //            order.TotalAmount,
        //            order.OrderDate,
        //            order.Products,
        //            customerName = customer?.Name,
        //            customerPhone = customer?.PhoneNumber,
        //            customerEmail = customer?.Email,
        //            customerAddress = customer?.Address
        //        });
        //    }

        //    return Ok(result);
        //}

        //[AllowAnonymous]
        //[HttpPost("collect-payment/{orderId}")]
        //public async Task<IActionResult> CollectPayment(string orderId, [FromBody] PaymentCollectionDto dto)
        //{
        //    var employee = await _mongo.Employees
        //        .Find(e => e.EmployeeId == dto.EmployeeId)
        //        .FirstOrDefaultAsync();

        //    if (employee == null)
        //        return NotFound("Employee not found.");

        //    // ❌ Delivery employee CANNOT collect payment
        //    if (employee.Designation == "Delivery")
        //        return BadRequest("Delivery employees cannot collect payment.");

        //    // ✔ Only Cash Collector can collect payment
        //    if (employee.Designation != "Cash Collector")
        //        return BadRequest("Only Cash Collector can collect payment.");

        //    var order = await _mongo.Orders
        //        .Find(o => o.Id == orderId)
        //        .FirstOrDefaultAsync();

        //    if (order == null)
        //        return NotFound("Order not found.");

        //    var update = Builders<Order>.Update
        //        .Set(o => o.IsPaymentCollected, true)
        //        .Set(o => o.PaymentCollectedBy, employee.EmployeeId)
        //        .Set(o => o.CollectedAmount, dto.Amount)
        //        .Set(o => o.CollectedOn, DateTime.UtcNow)
        //        .Set(o => o.Status, "Delivered"); // optional

        //    await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);

        //    // 📌 Add payment to history collection
        //    var history = new PaymentCollectionHistory
        //    {
        //        Id = ObjectId.GenerateNewId().ToString(),
        //        OrderId = orderId,
        //        CustomerId = order.CustomerId,
        //        DistributorId = order.DistributorId,
        //        CollectedByEmployeeId = employee.EmployeeId,
        //        CollectedByName = employee.Name,
        //        Amount = dto.Amount,
        //        PaymentMethod = dto.PaymentMethod,
        //        CollectedOn = DateTime.UtcNow
        //    };

        //    await _mongo.PaymentHistory.InsertOneAsync(history);


        //    return Ok("Payment collected by Cash Collector.");
        //}

        // DTOs inside controller for convenience (you can move these to separate files)
        //[Authorize(Roles = "Employee")]
        [HttpPut("{orderId}/employee-status")]
        public async Task<IActionResult> EmployeeUpdateStatus(string orderId, [FromBody] UpdateStatusDto body)
        {
            var requestedStatus = (body?.Status ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            var employeeId = User.FindFirst("EmployeeId")?.Value;
            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing from token");

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null) return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Unauthorized("Not authorized to modify this order");

            if (order.Status != "Assigned" && order.Status != "Shipped")
                return BadRequest($"Cannot change status from '{order.Status}'");

            // 🔥 FIXED — Delivery boy should only update delivery, NOT payment
            var update = Builders<Order>.Update
                .Set(o => o.Status, requestedStatus)
                .Set(o => o.DeliveredOn, DateTime.UtcNow)
                .Set(o => o.PaymentCollectedByEmployee, false)   // 💥 Force NO PAYMENT
                .Unset(o => o.PaymentMethod)                     // 💥 Remove payment if any
                .Unset(o => o.CollectedAmount)
                .Unset(o => o.CollectedOn);

            await _mongo.Orders.UpdateOneAsync(o => o.Id == order.Id, update);

            return Ok(new
            {
                message = "Order delivered successfully",
                status = requestedStatus
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

            //var newOrder = new Order
            //{
            //    CustomerId = existingOrder.CustomerId,
            //    DistributorId = existingOrder.DistributorId,
            //    Products = existingOrder.Products.Select(p => new OrderProduct
            //    {
            //        ProductId = p.ProductId,
            //        ProductName = p.ProductName,
            //        UnitPrice = p.UnitPrice,
            //        Quantity = p.Quantity
            //    }).ToList(),
            //    TotalAmount = existingOrder.Products.Sum(p => p.UnitPrice * p.Quantity),
            //    OrderDate = DateTime.UtcNow,
            //    Status = "Pending"
            //};



            var newOrder = new Order
            {
                CustomerId = existingOrder.CustomerId,
                DistributorId = existingOrder.DistributorId,
                Products = existingOrder.Products.Select(p => new OrderProduct
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    Price = p.Price,
                    Quantity = p.Quantity,
                    Subtotal = p.Subtotal,
                    QuantityDiscountPercent = p.QuantityDiscountPercent,
                    PriceDiscountPercent = p.PriceDiscountPercent,
                    SpecialDiscountPercent = p.SpecialDiscountPercent,
                    TotalDiscountPercent = p.TotalDiscountPercent,
                    DiscountAmount = p.DiscountAmount,
                    FinalPrice = p.FinalPrice
                }).ToList(),

                Subtotal = existingOrder.Subtotal,
                TotalDiscount = existingOrder.TotalDiscount,
                TotalAmount = existingOrder.TotalAmount,

                OrderDate = DateTime.UtcNow,
                Status = "Pending"
            };

            await _mongo.Orders.InsertOneAsync(newOrder);

            //return Ok(new { message = "Order placed successfully", orderId = newOrder.Id });


            return Ok(new
            {
                message = "Order placed successfully",
                orderId = newOrder.Id,
                subtotal = newOrder.Subtotal,
                discount = newOrder.TotalDiscount,
                finalAmount = newOrder.TotalAmount
            });

        }
        [HttpGet("delivered-for-cashier/{distributorId}")]
        public async Task<IActionResult> GetDeliveredOrdersForCashier(string distributorId)
        {
            var orders = await _mongo.Orders
                .Find(o => o.DistributorId == distributorId && o.Status == "Delivered")
                .ToListAsync();

            var result = new List<object>();

            foreach (var order in orders)
            {
                // get customer
                var customer = await _mongo.Customers
                    .Find(c => c.CustomerId == order.CustomerId)
                    .FirstOrDefaultAsync();

                // get ALL payments for this order
                var payments = await _mongo.PaymentHistory
                    .Find(p => p.OrderId == order.Id)
                    .SortBy(p => p.PaymentDate)
                    .ToListAsync();

                decimal total = order.TotalAmount;
                decimal paidSoFar = payments.Sum(p => p.AmountPaidToday);
                decimal pending = total - paidSoFar;
                if (pending < 0) pending = 0;

                result.Add(new
                {
                    orderId = order.Id,
                    customerId = order.CustomerId,
                    customerName = customer?.Name,
                    customerPhone = customer?.PhoneNumber,
                    totalAmount = total,
                    pendingAmount = pending   // <-- corrected balance
                });
            }

            return Ok(result);
        }

     


        [HttpGet("distributor-payment-summary/{distributorId}")]
        public async Task<IActionResult> GetDistributorPaymentSummary(string distributorId)
        {
            var history = await _mongo.PaymentHistory
                .Find(h => h.DistributorId == distributorId)
                .ToListAsync();

            var summary = history
                .GroupBy(h => h.CashierId)
                .Select(g => new
                {
                    CashierId = g.Key,
                    TotalCollected = g.Sum(x => x.AmountPaidToday),
                    PaymentsCount = g.Count(),
                    LastPaymentDate = g.Max(x => x.PaymentDate)
                });

            return Ok(summary);
        }


        [HttpGet("payment-report")]
        public async Task<IActionResult> GetPaymentReport(
    [FromQuery] string distributorId,
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate)
        {
            var filter = Builders<PaymentCollectionHistory>.Filter.Eq(h => h.DistributorId, distributorId);

            if (fromDate.HasValue)
                filter &= Builders<PaymentCollectionHistory>.Filter.Gte(h => h.PaymentDate, fromDate.Value);

            if (toDate.HasValue)
                filter &= Builders<PaymentCollectionHistory>.Filter.Lte(h => h.PaymentDate, toDate.Value);



            var history = await _mongo.PaymentHistory
                .Find(filter)
                .SortByDescending(h => h.PaymentDate)
                .ToListAsync();

            return Ok(history);
        }
      


    }
}

