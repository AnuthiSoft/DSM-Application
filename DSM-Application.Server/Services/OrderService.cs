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

    public OrderService(IMongoDatabase db, TemporaryAssignmentService tempService, MongoDbService mongo, InventoryService inventoryService)

    {

        _orders = db.GetCollection<Order>("orders");

        _customers = db.GetCollection<Customer>("customers");

        _tempService = tempService;

        _connections = db.GetCollection<CustomerDistributorConnection>("connections");

        _mongo = mongo;
        _inventoryService = inventoryService;

        _products = db.GetCollection<Product>("products");

    }

    public async Task CreateOrderAsync(Order order)

    {

        // Validate customer
        var customer = await _customers
     .Find(c => c.CustomerId == order.CustomerId)
     .FirstOrDefaultAsync();


        if (customer == null)
            throw new Exception("Customer not found");




      

        // 🔥 CALCULATE TOTAL AMOUNT FROM PRODUCTS (Backend controlled)
        //decimal totalAmount = 0;

        //foreach (var item in order.Products)
        //{
        //    var product = await _products
        //        .Find(p => p.ProductId == item.ProductId)
        //        .FirstOrDefaultAsync();

        //    if (product == null)
        //        throw new Exception($"Product not found: {item.ProductId}");

        //    totalAmount += product.Price * item.Quantity;
        //}

        //order.TotalAmount = totalAmount;

        



        // 🔥 APPLY CUSTOMER CREDIT (FINAL - USING _id)

        //decimal usableCredit = 0;

        //if (customer.CreditBalance > 0 && order.TotalAmount > 0)
        //{
           

        //    usableCredit = Math.Min(customer.CreditBalance, order.TotalAmount);
        //    Console.WriteLine($"Credit Before: {customer.CreditBalance}");
        //    Console.WriteLine($"UsableCredit: {usableCredit}");

        //    order.RemainingAmount = order.TotalAmount - usableCredit;

        //    // Update by Mongo _id
        //    await _customers.UpdateOneAsync(
        //        Builders<Customer>.Filter.Eq(
        //            "_id",
        //            new ObjectId(order.CustomerId)
        //        ),
        //        Builders<Customer>.Update.Inc(
        //            c => c.CreditBalance,
        //            -usableCredit
        //        )
        //    );
        //}
        //else
        //{
        //    order.RemainingAmount = order.TotalAmount;
        //}


        // Fetch distributor-customer connection

        var connection = await _connections

            .Find(x => x.CustomerId == order.CustomerId &&

                       x.DistributorId == order.DistributorId)

            .FirstOrDefaultAsync();

        if (connection == null)

            throw new Exception("Customer is not connected to this distributor");

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

        order.CreatedAt = DateTime.UtcNow;
        
        await _orders.InsertOneAsync(order);

    }



    //public async Task ApplyCustomerCreditAsync(Order order)
    //{
    //    if (string.IsNullOrEmpty(order.CustomerId))
    //        return;

    //    var customer = await _customers
    //        .Find(c => c.CustomerId == order.CustomerId)
    //        .FirstOrDefaultAsync();

    //    if (customer == null)
    //        return;

    //    if (customer.CreditBalance <= 0 || order.TotalAmount <= 0)
    //    {
    //        order.RemainingAmount = order.TotalAmount;
    //        return;
    //    }

    //    decimal usableCredit = Math.Min(customer.CreditBalance, order.TotalAmount);

    //    // Set remaining payable
    //    order.RemainingAmount = order.TotalAmount - usableCredit;

    //    // Deduct credit (atomic)
    //    var result = await _customers.UpdateOneAsync(
    //        c => c.CustomerId == order.CustomerId,
    //        Builders<Customer>.Update.Inc(c => c.CreditBalance, -usableCredit)
    //    );

       
    //}




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

