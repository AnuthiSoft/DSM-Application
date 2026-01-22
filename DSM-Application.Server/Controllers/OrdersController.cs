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
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        private readonly IMongoCollection<Product> _products;

        private readonly IMongoCollection<Order> _orders;

        private readonly DiscountService _discountService;

        private readonly InventoryService _inventoryService;

        private readonly OrderService _orderService;
        private readonly BlobService _blobService;



        public OrdersController(MongoDbService mongo, DiscountService discountService, OrderService orderService, InventoryService inventoryService, BlobService blobService)

        {

            _mongo = mongo;

            _products = _mongo.Products;   // ✅ use properties from MongoDbService

            _orders = _mongo.Orders;       // ✅ use properties from MongoDbService

            _discountService = discountService;

            _orderService = orderService;

            _inventoryService = inventoryService;
            _blobService = blobService;
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

            var distributorId = dto.DistributorId;

            if (string.IsNullOrEmpty(distributorId))
                return BadRequest("DistributorId is required");

            decimal totalSubtotal = 0;
            decimal totalDiscountAmount = 0;
            decimal totalFinalAmount = 0;
            decimal totalGst = 0;

            var orderProducts = new List<OrderProduct>();

            int leadTime = 1;
            bool leadTimeCaptured = false;

            foreach (var p in dto.Products)
            {
                var product = await _products
                    .Find(x => x.ProductId == p.ProductId)
                    .FirstOrDefaultAsync();

                if (product == null)
                    return NotFound("Product not found");

                if (!leadTimeCaptured)
                {
                    leadTime = product.LeadTimeDays ?? 1;
                    leadTimeCaptured = true;
                }

                decimal unitPrice = product.Price;
                decimal subtotal = unitPrice * p.Quantity;


                // ✅ FIX 1: NULL-SAFE general discount
                decimal generalDiscountPercent = product.Discount;

                // 🔹 EXISTING discount service (UNCHANGED)
                var calc = _discountService.Calculate(
                    p.Quantity,
                    subtotal,
                    dto.SpecialDiscountPercent
                );

                // 🔹 General discount from PRODUCT
                decimal generalDiscountAmount =
                    (subtotal * generalDiscountPercent) / 100m;

                // 🔹 TOTAL discount (existing + general)
                decimal totalDiscountForItem =
                    calc.discountAmount + generalDiscountAmount;

                // 🔹 TAXABLE AMOUNT
                decimal taxableAmount =
                    subtotal - totalDiscountForItem;

                // ✅ FIX 2: NULL-SAFE GST
                // ✅ GST FROM HSN TABLE
                var category = await _mongo.Categories
       .Find(c => c.CategoryId == product.Category)
       .FirstOrDefaultAsync();
                if (category == null)
                    return BadRequest("Category not found for product");

                // ===============================
                // ✅ FETCH HSN USING CATEGORY
                // ===============================
                var hsn = await _mongo.HsnCodes
                    .Find(h => h.HsnCode == category.HsnCode)
                    .FirstOrDefaultAsync();



                decimal gstPercent = hsn?.Gst ?? 0m;
                decimal gstAmount =
                    (taxableAmount * gstPercent) / 100m;

                // 🔹 FINAL PRICE
                decimal finalPrice =
                    taxableAmount + gstAmount;


                orderProducts.Add(new OrderProduct
                {
                    ProductId = p.ProductId,
                    ProductName = product.ProductName,
                    DistributorId = product.DistributorId,
                    Price = unitPrice,
                    Quantity = p.Quantity,

                    QuantityDiscountPercent = calc.qtyPct,
                    PriceDiscountPercent = calc.pricePct,
                    SpecialDiscountPercent = dto.SpecialDiscountPercent,

                    // 🔹 INCLUDE GENERAL DISCOUNT
                    GeneralDiscount = generalDiscountAmount,

                    TotalDiscountPercent =
                        calc.totalPercent + generalDiscountPercent,

                    DiscountAmount = totalDiscountForItem,

                    FinalPrice = finalPrice,

                    GstPercentage = gstPercent,
                    GstAmount = gstAmount
                });

                totalSubtotal += subtotal;
                totalDiscountAmount += totalDiscountForItem;
                totalGst += gstAmount;
                totalFinalAmount += finalPrice;
            }

            // -----------------------------------------------------
            // EMPLOYEE ASSIGNMENT (UNCHANGED)
            // -----------------------------------------------------
            var connection = await _mongo.Connections
    .Find(c => c.CustomerId == dto.CustomerId &&
               c.DistributorId == distributorId &&      // ✅ JWT value
               c.Status == ConnectionStatus.Accepted)    // ✅ IMPORTANT
    .FirstOrDefaultAsync();



            // 🔒 BLOCK ORDER IF CONNECTION IS PENDING
            if (connection == null)
            {
                return BadRequest("Customer not connected to this distributor");
            }

            var todayTemp = await _mongo.TemporaryAssignments
                .Find(x => x.CustomerId == dto.CustomerId &&
                           x.DistributorId == dto.DistributorId &&
                           x.AssignedDate == DateTime.UtcNow.Date)
                .FirstOrDefaultAsync();

            string? assignedEmployeeId =
                todayTemp?.TemporaryEmployeeId ??
                connection?.PermanentEmployeeId;

            DateTime expectedDelivery =
                dto.ExpectedDelivery ?? DateTime.UtcNow.AddDays(leadTime);

            var order = new Order
            {
                //Id = Guid.NewGuid().ToString(),
                CustomerId = dto.CustomerId,
                DistributorId = dto.DistributorId,
                OrderedDate = DateTime.UtcNow,
                ExpectedDeliveryDate = expectedDelivery,

                Products = orderProducts,
                Subtotal = totalSubtotal,
                TotalDiscount = totalDiscountAmount,
                TotalAmount = totalFinalAmount,

                OrderDate = DateTime.UtcNow,
                Status = "Pending",

                EmployeeId = assignedEmployeeId,
                RemainingAmount = totalFinalAmount,
                TotalGst = totalGst
            };
            foreach (var item in orderProducts)
            {
                var success = await _inventoryService.RemoveStockAsync(
                    item.ProductId,
                    dto.DistributorId,
                    item.Quantity,
                    "ORDER_PLACED"
                );

                if (!success)
                {
                    return BadRequest(new
                    {
                        message = $"Insufficient stock for product {item.ProductId}"
                    });
                }
            }

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

            // ⭐ UPDATED: Fetch Distributor Name for each order
            var result = await Task.WhenAll(orders.Select(async o =>
            {
                var distributor = await _mongo.Distributors
                    .Find(d => d.DistributorId == o.DistributorId)
                    .FirstOrDefaultAsync();

                return new DistributorOrderDto
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,

                    Products = o.Products,
                    OrderedDate = o.OrderedDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate,
                    DistributorId = o.DistributorId,

                    // ⭐ ADD THIS
                    DistributorName = distributor?.Name ?? "Unknown Distributor",

                    // Discount totals
                    Subtotal = o.Subtotal,
                    TotalDiscount = o.TotalDiscount,
                    TotalAmount = o.TotalAmount,

                    // Discount breakdown per item
                    SpecialDiscountPercent = o.Products.First().SpecialDiscountPercent,
                    QuantityDiscountPercent = o.Products.First().QuantityDiscountPercent,
                    PriceDiscountPercent = o.Products.First().PriceDiscountPercent,
                    TotalDiscountPercent = o.Products.First().TotalDiscountPercent,

                    Status = o.Status,
                    EmployeeId = o.EmployeeId,
                    Name = o.Name
                };
            }));

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
        public async Task<IActionResult> GetOrdersByDistributor(
      string distributorId,
      [FromQuery] string? status = null)
        {
            try
            {
                // 🔍 Build base filter
                var filter = Builders<Order>.Filter.Eq(o => o.DistributorId, distributorId);

                if (!string.IsNullOrEmpty(status))
                {
                    filter &= Builders<Order>.Filter.Eq(o => o.Status, status);
                }

                // 📦 Fetch orders
                var orders = await _mongo.Orders
                    .Find(filter)
                    .SortByDescending(o => o.OrderDate)
                    .ToListAsync();

                var result = new List<DistributorOrderDto>();

                foreach (var o in orders)
                {
                    // 🛡️ Ensure Products is never null
                    var products = o.Products ?? new List<OrderProduct>();
                    var firstProduct = products.FirstOrDefault();

                    // 👤 Load customer
                    var customer = await _mongo.Customers
                        .Find(c => c.CustomerId == o.CustomerId)
                        .FirstOrDefaultAsync();

                    // 👷 Load employee (optional)
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
                        CollectedOn = o.CollectedOn,
                        DeliveryReceiptUrl = o.DeliveryReceiptUrl,
                        DeliveredOn = o.DeliveredOn,
                        // ✅ Include these two fields

                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                // 🔥 TEMP: return real error while debugging
                return StatusCode(500, new
                {
                    message = "Failed to load distributor orders",
                    error = ex.Message
                });
            }
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
                    products = order.Products.Select(p => new
                    {
                        productId = p.ProductId,
                        productName = p.ProductName,
                        price = p.Price,
                        quantity = p.Quantity
                    }),
                    subtotal = order.Subtotal,
                    discount = order.TotalDiscount,
                    payableAmount = order.TotalAmount,
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
                DistributorId = order.DistributorId,

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
                ExpectedDeliveryDate = order.ExpectedDeliveryDate,

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
        [Authorize(Roles = "Distributor")]
        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> UpdateStatus(string orderId, [FromBody] UpdateStatusDto body)
        {
            var requestedStatus = body?.Status?.Trim();
            if (string.IsNullOrEmpty(requestedStatus))
                return BadRequest("Status required");

            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized();

            var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null)
                return NotFound("Order not found");

            if (order.DistributorId != distributorId)
                return Unauthorized("Not your order");

            // 🔥 ADD STOCK BACK IF REJECTED
            if (requestedStatus == "Rejected" && order.Status != "Rejected")
            {
                foreach (var item in order.Products)
                {
                    await _inventoryService.AddStockAsync(
     item.ProductId,
     order.DistributorId,
     item.Quantity,
       DateTime.UtcNow,                 // or original MFG
    DateTime.UtcNow.AddMonths(6),

     "ORDER_REJECTED"
 );
                }
            }

            order.Status = requestedStatus;
            order.UpdatedOn = DateTime.UtcNow;

            await _mongo.Orders.ReplaceOneAsync(o => o.Id == orderId, order);

            return Ok(new
            {
                message = "Order status updated",
                status = requestedStatus
            });
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
        //[HttpPut("{orderId}/employee-status")]
        //public async Task<IActionResult> EmployeeUpdateStatus(string orderId, [FromBody] UpdateStatusDto body)
        //{
        //    var requestedStatus = (body?.Status ?? string.Empty).Trim();
        //    if (string.IsNullOrEmpty(requestedStatus))
        //        return BadRequest("Status required");

        //    var employeeId = User.FindFirst("EmployeeId")?.Value;
        //    if (string.IsNullOrEmpty(employeeId))
        //        return Unauthorized("EmployeeId missing from token");

        //    var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
        //    if (order == null) return NotFound("Order not found");

        //    if (order.EmployeeId != employeeId)
        //        return Unauthorized("Not authorized to modify this order");

        //    if (order.Status != "Assigned" && order.Status != "Shipped")
        //        return BadRequest($"Cannot change status from '{order.Status}'");

        //    // 🔥 FIXED — Delivery boy should only update delivery, NOT payment
        //    var update = Builders<Order>.Update
        //        .Set(o => o.Status, requestedStatus)
        //        .Set(o => o.DeliveredOn, DateTime.UtcNow)
        //        .Set(o => o.PaymentCollectedByEmployee, false)   // 💥 Force NO PAYMENT
        //        .Unset(o => o.PaymentMethod)                     // 💥 Remove payment if any
        //        .Unset(o => o.CollectedAmount)
        //        .Unset(o => o.CollectedOn);

        //    await _mongo.Orders.UpdateOneAsync(o => o.Id == order.Id, update);

        //    return Ok(new
        //    {
        //        message = "Order delivered successfully",
        //        status = requestedStatus
        //    });
        //}


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
            if (order == null)
                return NotFound("Order not found");

            if (order.EmployeeId != employeeId)
                return Unauthorized("Not authorized");

            // ✅ ONLY UPDATE STATUS & DELIVERY DATE
            var update = Builders<Order>.Update
                .Set(o => o.Status, requestedStatus)
                .Set(o => o.DeliveredOn, DateTime.UtcNow);

            await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);

            return Ok(new
            {
                message = "Order status updated",
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
        public async Task<IActionResult> Reorder(string orderId, [FromQuery] DateTime? expectedDelivery)
        {
            var customerId = User.FindFirst("CustomerId")?.Value;
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized("CustomerId missing from token");

            var existingOrder = await _mongo.Orders
                .Find(o => o.Id == orderId)
                .FirstOrDefaultAsync();

            if (existingOrder == null)
                return NotFound("Order not found");

            if (existingOrder.CustomerId != customerId)
                return Forbid("Not authorized to reorder this order");

            if (existingOrder.Status != "Delivered")
                return BadRequest($"Only delivered orders can be reordered. Current status: '{existingOrder.Status}'");

            // 🔹 Set expected delivery date
            DateTime deliveryDate = expectedDelivery ?? DateTime.UtcNow.AddDays(1);

            // 🔍 Assign employee (same logic as CreateOrder)
            var connection = await _mongo.Connections
                .Find(c =>
                    c.CustomerId == existingOrder.CustomerId &&
                    c.DistributorId == existingOrder.DistributorId &&
                    c.Status == ConnectionStatus.Accepted
                )
                .FirstOrDefaultAsync();

            if (connection == null)
                return BadRequest("Customer not connected to distributor");

            var todayTemp = await _mongo.TemporaryAssignments
                .Find(x =>
                    x.CustomerId == existingOrder.CustomerId &&
                    x.DistributorId == existingOrder.DistributorId &&
                    x.AssignedDate == DateTime.UtcNow.Date
                )
                .FirstOrDefaultAsync();

            string? assignedEmployeeId =
                todayTemp?.TemporaryEmployeeId ??
                connection?.PermanentEmployeeId;

            // 🆕 Create cloned order
            var newOrder = new Order
            {
                Id = Guid.NewGuid().ToString(),

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
                    FinalPrice = p.FinalPrice,
                    GstAmount = p.GstAmount,
                    GstPercentage = p.GstPercentage
                }).ToList(),

                Subtotal = existingOrder.Subtotal,
                TotalDiscount = existingOrder.TotalDiscount,
                TotalAmount = existingOrder.TotalAmount,
                TotalGst = existingOrder.TotalGst,

                RemainingAmount = existingOrder.TotalAmount,

                OrderDate = DateTime.UtcNow,
                OrderedDate = DateTime.UtcNow,
                ExpectedDeliveryDate = deliveryDate,

                Status = "Pending",
                EmployeeId = assignedEmployeeId
            };

            // 🔥 Deduct stock (just like CreateOrder)
            foreach (var item in newOrder.Products)
            {
                await _inventoryService.RemoveStockAsync(
                    item.ProductId,
                    existingOrder.DistributorId,
                    item.Quantity,
                    "ORDER_PLACED"
                );
            }

            await _mongo.Orders.InsertOneAsync(newOrder);

            return Ok(new
            {
                message = "Order placed successfully",
                orderId = newOrder.Id,
                expectedDelivery = newOrder.ExpectedDeliveryDate,
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
                decimal pending = order.RemainingAmount;
                if (pending < 0) pending = 0;

                result.Add(new
                {
                    orderId = order.Id,
                    customerId = order.CustomerId,
                    customerName = customer?.Name,
                    customerPhone = customer?.PhoneNumber,
                    totalAmount = order.TotalAmount,
                    pendingAmount = order.RemainingAmount
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



        [Authorize(Roles = "CashCollector,Employee")]

        [HttpPost("create-by-collector")]

        public async Task<IActionResult> CreateOrderByCollector([FromBody] OrderCreateDto dto)

        {

            var userId = User.FindFirst("UserId")?.Value;

            var role = User.FindFirst("role")?.Value;

            var distributorId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))

                return Unauthorized("DistributorId missing from token");

            // 🔐 FORCE distributor from JWT (ignore frontend value)

            dto.DistributorId = distributorId;

            var order = await _orderService.CreateByCollector(

                dto,

                userId,

                role,

                distributorId

            );


            return Ok(order);

        }



        [Authorize(Roles = "CashCollector,Employee")]
        [HttpGet("my-customers")]
        public async Task<IActionResult> GetMyCustomers()
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized("DistributorId missing from token");

            var connections = await _mongo.Connections
                .Find(c =>
                    c.DistributorId == distributorId &&
                    c.Status == ConnectionStatus.Accepted
                )
                .ToListAsync();

            var customers = new List<object>();

            foreach (var c in connections)
            {
                var customer = await _mongo.Customers
                    .Find(x => x.CustomerId == c.CustomerId)
                    .FirstOrDefaultAsync();

                if (customer != null)
                {
                    customers.Add(new
                    {
                        customerId = customer.CustomerId,
                        name = customer.Name,
                        phone = customer.PhoneNumber,
                        address = customer.Address
                    });
                }
            }

            return Ok(customers);


            //[Authorize(Roles = "CashCollector,Employee")]
            //[HttpPost("create-by-collector")]
            //public async Task<IActionResult> CreateOrderByCollector([FromBody] OrderCreateDto dto)
            //{
            //    var role = User.FindFirst(ClaimTypes.Role)?.Value;

            //    if (string.IsNullOrEmpty(role))
            //        return Unauthorized("Role missing in token");

            //    if (role != "CashCollector" && role != "Employee")
            //        return Forbid("Only CashCollector or Employee can perform this action");

            //    if (dto == null || dto.Products == null || dto.Products.Count == 0)
            //        return BadRequest("Invalid order data");

            //    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            //    //var userId = User.FindFirst("UserId")?.Value;
            //    if (string.IsNullOrEmpty(userId))
            //        return Unauthorized("Invalid user");

            //    var orderProducts = new List<OrderProduct>();
            //    decimal subTotal = 0;
            //    decimal totalDiscount = 0;

            //    foreach (var item in dto.Products)
            //    {
            //        var product = await _mongo.Products
            //        .Find(p => p.ProductId == item.ProductId)
            //        .FirstOrDefaultAsync();

            //        if (product == null)
            //            return BadRequest($"Product not found: {item.ProductId}");

            //        var itemSubtotal = product.Price * item.Quantity;
            //        var discountAmount = (itemSubtotal * dto.SpecialDiscountPercent) / 100;
            //        var finalPrice = itemSubtotal - discountAmount;

            //        orderProducts.Add(new OrderProduct
            //        {
            //            ProductId = product.ProductId,
            //            ProductName = product.ProductName,
            //            Price = product.Price,
            //            Quantity = item.Quantity,
            //            Subtotal = itemSubtotal,
            //            DiscountAmount = discountAmount,
            //            FinalPrice = finalPrice
            //        });

            //        subTotal += itemSubtotal;
            //        totalDiscount += discountAmount;
            //    }

            //    var order = new Order
            //    {
            //        CustomerId = dto.CustomerId,
            //        DistributorId = dto.DistributorId,
            //        Products = orderProducts,

            //        Subtotal = subTotal,
            //        TotalDiscount = totalDiscount,
            //        TotalAmount = subTotal - totalDiscount,

            //        CreatedByUserId = userId,
            //        CreatedByRole = "CashCollector",
            //        OrderSource = "CASH_COLLECTOR",

            //        OrderDate = DateTime.UtcNow,
            //        ExpectedDeliveryDate = dto.ExpectedDelivery ?? DateTime.UtcNow.AddDays(1),
            //        Status = "Pending"
            //    };

            //    await _orders.InsertOneAsync(order);

            //    return Ok(order);
            //}

            //[Authorize(Roles = "CashCollector,Employee")]
            //[HttpPost("create-by-collector")]
            //public async Task<IActionResult> CreateOrderByCollector([FromBody] OrderCreateDto dto)
            //{
            //    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            //    var role = User.FindFirst(ClaimTypes.Role)?.Value;

            //    if (string.IsNullOrEmpty(userId))
            //        return Unauthorized("Invalid user");

            //    if (role != "CashCollector" && role != "Employee")
            //        return Forbid("Only CashCollector or Employee can create orders");

            //    if (dto == null || dto.Products == null || dto.Products.Count == 0)
            //        return BadRequest("Invalid order data");

            //    var order = await _orderService.CreateByCollector(dto, userId, role);
            //    return Ok(order);
            //}
        }
            [Authorize(Roles = "Employee")]
            [HttpPost("{orderId}/upload-receipt")]
            public async Task<IActionResult> UploadDeliveryReceipt(
                string orderId,
                IFormFile receipt)
            {
                if (receipt == null || receipt.Length == 0)
                    return BadRequest("Receipt image is required");

                var employeeId = User.FindFirst("EmployeeId")?.Value;
                if (string.IsNullOrEmpty(employeeId))
                    return Unauthorized("EmployeeId missing");

                var order = await _mongo.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
                if (order == null)
                    return NotFound("Order not found");

                if (order.EmployeeId != employeeId)
                    return Unauthorized("Not your assigned order");

                // ✅ Upload to Azure Blob (FULL URL)
                var blobName = await _blobService.UploadAsync(receipt);

                var update = Builders<Order>.Update
                    .Set(o => o.DeliveryReceiptUrl, blobName)
                                .Set(o => o.Status, "Delivered")
                    .Set(o => o.DeliveredOn, DateTime.UtcNow);

                await _mongo.Orders.UpdateOneAsync(o => o.Id == orderId, update);

                return Ok(new
                {
                    message = "Receipt uploaded & order delivered",
                    deliveryReceiptUrl = blobName
                });
            }

            [AllowAnonymous]
            [HttpGet("receipt/{blobName}")]
            public async Task<IActionResult> GetReceipt(string blobName)
            {
                var data = await _blobService.DownloadAsync(blobName);
                if (data == null)
                    return NotFound();

                return File(data, "image/jpeg");
            }

        }
    }


