//using DistributorManagementSystem.Server.Services;

//using DSM_Application.Server.Models;

//using MongoDB.Driver;

//namespace DSM_Application.Server.Services

//{

//    public class OrderService

//    {

//        private readonly IMongoCollection<Order> _orders;

//        private readonly IMongoCollection<Customer> _customers;

//        public OrderService(MongoDbService db)

//        {

//            _orders = db.Orders;

//            _customers = db.Customers;

//        }

//        // Place order with validation

//        public async Task<Order> PlaceOrderAsync(Order order)

//        {

//            // Fetch customer

//            var customer = await _customers.Find(c => c.CustomerId == order.CustomerId).FirstOrDefaultAsync();

//            if (customer == null)

//                throw new System.Exception("Customer not found");

//            // Validation: distributor access

//            if (customer.AddedByDistributorId != null)

//            {

//                if (customer.AddedByDistributorId != order.DistributorId)

//                    throw new System.Exception("Customer not allowed to order from this distributor");

//            }

//            else if (customer.ConnectedDistributors != null && !customer.ConnectedDistributors.Contains(order.DistributorId))

//            {

//                throw new System.Exception("Customer not connected to this distributor");

//            }

//            await _orders.InsertOneAsync(order);

//            return order;

//        }

//        // Get orders by distributor

//        public async Task<List<Order>> GetOrdersByDistributorAsync(string distributorId)

//        {

//            return await _orders.Find(o => o.DistributorId == distributorId).ToListAsync();

//        }

//    }

//}

using DistributorManagementSystem.Server.Services;

using DSM_Application.Server.Models;

using DSM_Application.Server.Models.DTOs;

using DSM_Application.Server.Services;

using MongoDB.Driver;
using MongoDB.Bson;

public class OrderService

{

    private readonly IMongoCollection<Order> _orders;

    private readonly IMongoCollection<Customer> _customers;

    private readonly TemporaryAssignmentService _tempService;

    private readonly IMongoCollection<CustomerDistributorConnection> _connections;
    private readonly MongoDbService _mongo;
    private readonly InventoryService _inventoryService;
    private readonly IMongoCollection<Product> _products;

    private readonly IMongoCollection<CreditTransaction> _creditTransactions;
    private readonly IMongoClient _client;

    private readonly IMongoDatabase _database;


    public OrderService(IMongoDatabase db, TemporaryAssignmentService tempService, MongoDbService mongo, InventoryService inventoryService)

    {

        _orders = db.GetCollection<Order>("orders");

        _customers = mongo.Customers;

        _tempService = tempService;

        _connections = db.GetCollection<CustomerDistributorConnection>("connections");

        _mongo = mongo;
        _inventoryService = inventoryService;

        _products = db.GetCollection<Product>("products");
        _client = db.Client;
        _creditTransactions = db.GetCollection<CreditTransaction>("CreditTransactions");
        _database = db;
    }

    public async Task CreateOrderAsync(Order order)

    {

        // Validate customer
        var customer = await _customers
     .Find(c => c.CustomerId == order.CustomerId)
     .FirstOrDefaultAsync();


        if (customer == null)
            throw new Exception("Customer not found");




      


        // Fetch distributor-customer connection

        var connection = await _connections

            .Find(x => x.CustomerId == order.CustomerId &&

                       x.DistributorId == order.DistributorId)

            .FirstOrDefaultAsync();

        if (connection == null)

            throw new Exception("Customer is not connected to this distributor");
        // 🔥 CALCULATE TOTAL FIRST
        decimal totalAmount = 0;

        foreach (var item in order.Products)
        {
            var product = await _products
                .Find(p => p.ProductId == item.ProductId)
                .FirstOrDefaultAsync();

            if (product == null)
                throw new Exception($"Product not found: {item.ProductId}");

            totalAmount += product.Price * item.Quantity;
        }

        order.TotalAmount = totalAmount;


        // REQUEST CREDIT (DO NOT DEDUCT)
        decimal requestedCredit = 0;

        if (customer.CreditBalance > 0 && order.TotalAmount > 0)
        {
            requestedCredit = Math.Min(customer.CreditBalance, order.TotalAmount);
        }

        order.RequestedCredit = requestedCredit;
        order.ApprovedCredit = 0;
        order.RefundedCredit = 0;
        if (requestedCredit > 0)
            order.CreditStatus = "Pending";
        else
            order.CreditStatus = "NotRequested";

        // Full amount payable until distributor approves
        order.CreditUsed = 0;
        order.PayableAmount = order.TotalAmount;
        order.RemainingAmount = order.TotalAmount;



        var today = DateTime.UtcNow.Date;

        // 💥 NEW LOGIC — Check if temporary employee is active TODAY

        var todayTemp = await _tempService

            .GetTemporaryForDateAsync(order.DistributorId, order.CustomerId, today);

        string? assignedEmployeeId;

        if (todayTemp != null)

        {

            // Temporary employee works today

            assignedEmployeeId = todayTemp.TemporaryEmployeeId;

        }

        else

        {

            // Permanent employee works today

            assignedEmployeeId = connection.PermanentEmployeeId;

        }

        if (assignedEmployeeId == null)

            throw new Exception("No employee available for this customer today.");

        // Assign to order

        order.AssignedEmployeeId = assignedEmployeeId;
        order.Status = "Pending";
        order.OrderedDate = DateTime.UtcNow;

        order.CreatedAt = DateTime.UtcNow;
        
        await _orders.InsertOneAsync(order);

    }

    public async Task ApproveCreditAsync(string orderId, decimal approveAmount)
    {
        using var session = await _client.StartSessionAsync();
        session.StartTransaction();

        try
        {
            // Collections (define at method level so usable everywhere)
            var ordersCollection = _database.GetCollection<Order>("Orders");
            var cashOrdersCollection = _database.GetCollection<Order>("orders");

            bool isCashOrder = false;

            // 1️⃣ Find order in Orders
            var order = await ordersCollection
                .Find(session, o => o.Id == orderId)
                .FirstOrDefaultAsync();

            // 2️⃣ If not found, check cash collector collection
            if (order == null)
            {
                order = await cashOrdersCollection
                    .Find(session, o => o.Id == orderId)
                    .FirstOrDefaultAsync();

                if (order != null)
                    isCashOrder = true;
            }

            if (order == null)
                throw new Exception($"Order not found: {orderId}");

            // ===== SAFE CREDIT STATUS CHECK =====
            // ===== HARD LOCK: Allow approval only once and only in Pending state =====

            // Order must be Pending
            if (!string.Equals(order.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                return;

            // Credit must not be already applied
            if (order.ApprovedCredit > 0 || order.CreditUsed > 0)
                return;

            // Credit must be requested
            if (order.RequestedCredit <= 0)
                return;

            // CreditStatus must be Pending (or empty/null treated as Pending)
            var status = string.IsNullOrWhiteSpace(order.CreditStatus)
                ? "Pending"
                : order.CreditStatus;

            if (!status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                return;

            // 3️⃣ Find customer (existing logic)
            var customerFilter = Builders<Customer>.Filter.Eq("_id", new ObjectId(order.CustomerId));

            // 2️⃣ FIND CUSTOMER (handles ObjectId + string)

            Customer? customer = null;

            // Try match with Mongo _id (ObjectId)
            if (ObjectId.TryParse(order.CustomerId, out var customerObjectId))
            {
                var objectFilter = Builders<Customer>.Filter.Eq("_id", customerObjectId);
                customer = await _customers
                    .Find(session, objectFilter)
                    .FirstOrDefaultAsync();
            }

            // If not found, try string field match
            if (customer == null)
            {
                customer = await _customers
                    .Find(session, c => c.CustomerId == order.CustomerId)
                    .FirstOrDefaultAsync();
            }

            if (customer == null)
                throw new Exception($"Customer not found: {order.CustomerId}");

            // 4️⃣ Calculate usable credit
            // If credit was never requested, do nothing (idempotent)
            if (order.RequestedCredit <= 0)
                return;

            var usableCredit = Math.Min(customer.CreditBalance, approveAmount);
            usableCredit = Math.Min(usableCredit, order.RequestedCredit);
            usableCredit = Math.Min(usableCredit, order.TotalAmount);

            if (usableCredit <= 0)
                return;

            // 5️⃣ Deduct credit atomically
            var result = await _customers.UpdateOneAsync(
       session,
       Builders<Customer>.Filter.And(
           Builders<Customer>.Filter.Eq("_id", new ObjectId(order.CustomerId)),
           Builders<Customer>.Filter.Gte(c => c.CreditBalance, usableCredit)
       ),
       Builders<Customer>.Update.Inc(c => c.CreditBalance, -usableCredit)
   );

            if (result.ModifiedCount == 0)
                throw new Exception("Insufficient credit");

            // 6️⃣ Update order
            order.ApprovedCredit = usableCredit;
            order.CreditUsed = usableCredit;
            order.PayableAmount = order.TotalAmount - usableCredit;
            order.RemainingAmount = order.PayableAmount;
            order.CreditStatus = "Approved";
            order.UpdatedAt = DateTime.UtcNow;

            // Save to correct collection
            if (isCashOrder)
            {
                await cashOrdersCollection.ReplaceOneAsync(
                    session,
                    o => o.Id == order.Id,
                    order
                );
            }
            else
            {
                await ordersCollection.ReplaceOneAsync(
                    session,
                    o => o.Id == order.Id,
                    order
                );
            }

            // 7️⃣ Ledger entry
            await _creditTransactions.InsertOneAsync(session, new CreditTransaction
            {
                CustomerId = order.CustomerId,
                Amount = -usableCredit,
                Type = "OrderApproved",
                OrderId = order.Id,
                CreatedAt = DateTime.UtcNow
            });

            await session.CommitTransactionAsync();
        }
        catch
        {
            await session.AbortTransactionAsync();
            throw;
        }
    }


    public async Task CancelOrderAsync(string orderId)
    {
        using var session = await _client.StartSessionAsync();
        session.StartTransaction();

        try
        {
            var order = await _orders
     .Find(session, Builders<Order>.Filter.Eq("_id", new ObjectId(orderId)))
     .FirstOrDefaultAsync();
            if (order == null) throw new Exception("Order not found");
          
            // 🔒 Prevent double cancel
            if (order.CreditStatus == "Cancelled")
                throw new Exception("Order already cancelled");

            // 🔒 Allow cancel only if credit was approved
            if (order.CreditStatus == "Approved" && order.ApprovedCredit > 0)
            {
                await _customers.UpdateOneAsync(
    session,
    Builders<Customer>.Filter.Eq("_id", new ObjectId(order.CustomerId)),
                    Builders<Customer>.Update.Inc(c => c.CreditBalance, order.ApprovedCredit)
                );

                await _creditTransactions.InsertOneAsync(session, new CreditTransaction
                {
                    CustomerId = order.CustomerId,
                    Amount = order.ApprovedCredit,
                    Type = "Cancel",
                    OrderId = order.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }

            order.CreditStatus = "Cancelled";
            order.Status = "Cancelled";



            if (order.ApprovedCredit > 0)
            {
                await _customers.UpdateOneAsync(
                    session,
                    c => c.CustomerId == order.CustomerId,
                    Builders<Customer>.Update.Inc(c => c.CreditBalance, order.ApprovedCredit)
                );

                await _creditTransactions.InsertOneAsync(session, new CreditTransaction
                {
                    CustomerId = order.CustomerId,
                    Amount = order.ApprovedCredit,
                    Type = "Cancel",
                    OrderId = order.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }

            order.CreditStatus = "Cancelled";
            order.Status = "Cancelled";
            order.UpdatedAt = DateTime.UtcNow;

            await _orders.ReplaceOneAsync(session, o => o.Id == order.Id, order);

            await session.CommitTransactionAsync();
        }
        catch
        {
            await session.AbortTransactionAsync();
            throw;
        }
    }


    //public async Task<Order> CreateByCollector(OrderCreateDto dto, string userId, string role)
    //{
    //    if (string.IsNullOrEmpty(userId))
    //        throw new Exception("Invalid user");

    //    if (dto == null || dto.Products == null || !dto.Products.Any())
    //        throw new Exception("Invalid order data");

    //    var orderProducts = new List<OrderProduct>();
    //    decimal subTotal = 0;
    //    decimal totalDiscount = 0;

    //    foreach (var item in dto.Products)
    //    {
    //        var product = await _mongo.Products
    //            .Find(p => p.ProductId == item.ProductId)
    //            .FirstOrDefaultAsync();

    //        if (product == null)
    //            throw new Exception($"Product not found: {item.ProductId}");

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
    //        //CustomerEmail = dto.CustomerEmail,
    //        //CustomerName = dto.CustomerName,
    //        //CustomerPhone = dto.CustomerPhone,
    //        CustomerId = dto.CustomerId,
    //        DistributorId = dto.DistributorId,
    //        Products = orderProducts,
    //        Subtotal = subTotal,
    //        TotalDiscount = totalDiscount,
    //        TotalAmount = subTotal - totalDiscount,

    //        CreatedByUserId = userId,
    //        CreatedByRole = role,
    //        OrderSource = "CASH_COLLECTOR",
    //        OrderDate = DateTime.UtcNow,
    //        ExpectedDeliveryDate = dto.ExpectedDelivery ?? DateTime.UtcNow.AddDays(1)
    //    };

    //    await _orders.InsertOneAsync(order);
    //    return order;
    //}

    public async Task<Order> CreateByCollector(OrderCreateDto dto, string userId, string role, string distributorId)
    {
        if (string.IsNullOrEmpty(userId))
            throw new Exception("Invalid user");

        if (dto == null || dto.Products == null || !dto.Products.Any())

            throw new Exception("Invalid order data");
        decimal subTotal = 0;
        decimal totalDiscount = 0;
        decimal totalGstAmount = 0;


        var orderProducts = new List<OrderProduct>();

        decimal generalDiscountPercent = dto.SpecialDiscountPercent;


        foreach (var item in dto.Products)

        {

            var product = await _mongo.Products

                .Find(p => p.ProductId == item.ProductId)

                .FirstOrDefaultAsync();

            if (product == null)

                throw new Exception($"Product not found: {item.ProductId}");

            // 1️⃣ Subtotal
            var itemSubtotal = product.Price * item.Quantity;

            var discountAmount = (itemSubtotal * dto.SpecialDiscountPercent) / 100;

            var finalPrice = itemSubtotal - discountAmount;
            // 3️⃣ GST
            var gstPercent = product.GST;
            var gstAmount = (finalPrice * gstPercent) / 100;
            orderProducts.Add(new OrderProduct

            {

                ProductId = product.ProductId,

                ProductName = product.ProductName,

                Price = product.Price,

                Quantity = item.Quantity,

                Subtotal = itemSubtotal,

                // ✅ STORE DISCOUNTS
                PriceDiscountPercent = generalDiscountPercent,
                DiscountAmount = discountAmount,

                // ✅ GeneralDiscount MUST be PERCENT, not amount
                GeneralDiscount = generalDiscountPercent,

                // ✅ Total discount % (for now same, later can add others)
                TotalDiscountPercent = generalDiscountPercent,

                GstPercentage = gstPercent,
                GstAmount = gstAmount,

                FinalPrice = finalPrice

            });

            subTotal += itemSubtotal;

            totalDiscount += discountAmount;
            totalGstAmount += gstAmount;
        }

        var order = new Order

        {

            CustomerId = dto.CustomerId,

            DistributorId = dto.DistributorId,

            Products = orderProducts,

            OrderedDate = DateTime.UtcNow,
            OrderDate = DateTime.UtcNow,
            ExpectedDeliveryDate =
                dto.ExpectedDelivery ?? DateTime.UtcNow.AddDays(1),


            TotalDiscount = totalDiscount,
            GstAmount = totalGstAmount,
            Subtotal = subTotal,
            TotalAmount = (subTotal - totalDiscount) + totalGstAmount,

            // Audit fields
            CreatedByUserId = userId,

            CreatedByRole = role,
            OrderSource = "EMPLOYEE"
        };

        // 🔥 STEP 2: REDUCE INVENTORY STOCK (BATCH-WISE)
        foreach (var item in order.Products)
        {
            await _inventoryService.RemoveStockAsync(
                item.ProductId,
                order.DistributorId,
                item.Quantity,
                "Customer Order"
            );


        }



        await _orders.InsertOneAsync(order);

        return order;

    }







    //public async Task<Order> CreateByCollector(OrderCreateDto dto, string userId, string role)

    //{

    //    var order = new Order

    //    {

    //        CustomerId = dto.CustomerId,

    //        DistributorId = dto.DistributorId,

    //        CreatedByUserId = userId,

    //        CreatedByRole = role,

    //        OrderSource = "CASH_COLLECTOR",

    //        CreatedAt = DateTime.UtcNow,

    //        // ✅ THIS IS THE FIX

    //        Products = dto.Products.Select(p => new OrderProduct

    //        {

    //            ProductId = p.ProductId,

    //            Quantity = p.Quantity

    //        }).ToList(),

    //        Status = "Pending"

    //    };

    //    await _orders.InsertOneAsync(order);

    //    return order;

    //}


}

