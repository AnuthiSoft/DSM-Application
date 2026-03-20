using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Bson;
using MongoDB.Driver;
using DSM_Application.Server.Models.DTOs;



namespace DSM_Application.Server.Services
{
    public class ReturnService
    {
        private readonly IMongoCollection<Order> _orders;
        private readonly IMongoCollection<ReturnRequest> _returns;
        private readonly IMongoCollection<InventoryItem> _inventory;
        private readonly InventoryService _inventoryService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMongoCollection<ReturnImageInfo> _returnImages;
        private readonly IWebHostEnvironment _env;
        private readonly IMongoCollection<Customer> _customers;
        private readonly BlobService _blobService;

        private readonly IMongoCollection<CreditTransaction> _creditTransactions;

        private readonly IMongoClient _client;
        public ReturnService(
            MongoDbService db,
            InventoryService inventoryService,
            IHttpContextAccessor httpContextAccessor,
            IWebHostEnvironment env,// ✅ ADD THIS
            BlobService blobService

        )
        {
            _customers = db.Customers;
            _orders = db.Orders;
            _returns = db.ReturnRequests;
            _inventory = db.InventoryItems;    // ✅ ADD THIS
            _inventoryService = inventoryService;
            _httpContextAccessor = httpContextAccessor;
            _returnImages = db.ReturnImages;

            _env = env; // ✅ ASSIGN IT (THIS WAS MISSING)
            _blobService = blobService;
            _creditTransactions = db.CreditTransactions;
            _client = db.Database.Client;
        }



        public async Task<List<ReturnHistoryDto>> GetPendingReturnsForDistributor(string distributorId)
        {
            var returns = await _returns
                .Find(r =>
                    r.DistributorId == distributorId &&
                    (
                        r.Status == "Pending" ||
                        r.Status == "PickupConfirmed" ||
                        r.Status == "PickedUp" ||
                        r.Status == "Received"
                    )
                )
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();

            return returns.Select(r =>
            {
                // 1️⃣ Fetch Order
                var order = _orders
                    .Find(o => o.Id == r.OrderId)
                    .FirstOrDefault();

                // 2️⃣ Fetch Product from order
                var product = order?.Products
                    ?.FirstOrDefault(p => p.ProductId == r.ProductId);

                // 3️⃣ Construct DTO
                return new ReturnHistoryDto
                {
                    Id = r.Id,
                    OrderId = r.OrderId,
                    ProductId = r.ProductId,
                    ProductName = product?.ProductName ?? "Unknown",
                    Price = product?.Price,          // ✔ PRICE added safely
                    ReturnQty = r.ReturnQty,
                    Status = r.Status,
                    Reason = r.Reason,
                    CreatedAt = r.CreatedAt
                };
            }).ToList();
        }


        public async Task<List<ReturnHistoryDto>> GetAllReturnsForDistributorAsync(string distributorId)
        {
            var returns = await _returns
                .Find(r => r.DistributorId == distributorId)
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();

            var customerIds = returns
                .Where(r => !string.IsNullOrEmpty(r.CustomerId))
                .Select(r => r.CustomerId)
                .Distinct()
                .ToList();

            var customers = await _customers
                .Find(c => customerIds.Contains(c.CustomerId))
                .ToListAsync();

            var images = await _returnImages
                .Find(_ => true)
                .ToListAsync();

            return returns.Select(r =>
            {
                // 🔹 CUSTOMER (new + old data safe)
                var customer = customers.FirstOrDefault(c => c.CustomerId == r.CustomerId);

                // 🔹 ORDER FALLBACK (🔥 THIS FIXES OLD DATA 🔥)
                Order? order = ObjectId.TryParse(r.OrderId, out _)
                    ? _orders.Find(o => o.Id == r.OrderId).FirstOrDefault()
                    : null;


                var product = order?.Products?.FirstOrDefault(p => p.ProductId == r.ProductId);

                return new ReturnHistoryDto
                {
                    Id = r.Id,
                    OrderId = r.OrderId,
                    ProductId = r.ProductId,

                    // ✅ PRODUCT NAME FIX
                    ProductName =
                        r.ProductName
                        ?? product?.ProductName
                        ?? "Unknown Product",

                    ReturnQty = r.ReturnQty,
                    Price = product?.Price,
                    Reason = r.Reason,
                    Status = r.Status,
                    DistributorId = r.DistributorId,

                    // ✅ CUSTOMER NAME FIX
                    CustomerName =
                        customer?.Name
                        ?? r.CustomerName
                        ?? order?.CustomerName
                        ?? "Unknown Customer",

                    CustomerPhone =
                        customer?.PhoneNumber
                        ?? order?.CustomerPhone,

                    CustomerEmail =
                        customer?.Email
                        ?? order?.CustomerEmail,
                    CustomerAddress =
    string.Join(", ", new[]
    {
        customer?.Street,
        customer?.City,
        customer?.State,
        customer?.Pincode,
        customer?.Country
    }.Where(x => !string.IsNullOrWhiteSpace(x)))
    ?? order?.CustomerAddress
    ?? "N/A",

                    ImageUrls = images
                        .Where(i => i.ReturnId == r.Id)
                        .Select(i => i.Id)
                        .ToList(),

                    CreatedAt = r.CreatedAt
                };
            }).ToList();
        }


        public async Task<Stream?> GetReturnImageStreamByIdAsync(string imageId)
        {
            var image = await _returnImages
                .Find(i => i.Id == imageId)
                .FirstOrDefaultAsync();

            if (image == null)
                return null;

            // 🔥 Uses blobName (not URL)
            var blobBytes = await _blobService.DownloadAsync(image.BlobName);

            if (blobBytes == null)
                return null;

            return new MemoryStream(blobBytes);
        }





        public async Task SchedulePickupAsync(string returnId, SchedulePickupDto dto)
        {
            var distributorId = _httpContextAccessor.HttpContext?.User?
      .Claims.FirstOrDefault(c => c.Type == "DistributorId")?.Value;



            if (string.IsNullOrEmpty(distributorId))
                throw new Exception("Unauthorized distributor");

            var ret = await _returns.Find(r =>
                r.Id == returnId &&
                r.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            if (ret == null)
                throw new Exception("Return not found or access denied");

            ret.Status = "PickupConfirmed";
            ret.PickupDate = dto.PickupDate;
            ret.PickupSlot = dto.PickupSlot;
            ret.AssignedEmployeeId = dto.EmployeeId;

            ret.PickupMessage =
                string.IsNullOrWhiteSpace(dto.Message)
                    ? $"Pickup scheduled on {dto.PickupDate:dd MMM yyyy} ({dto.PickupSlot})"
                    : dto.Message;

            ret.ApprovedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        }



        // 1️⃣ CREATE RETURN (ONLY AFTER DELIVERY)
        public async Task<ReturnRequest> CreateReturnAsync(CreateReturnDto dto)
        {
            var customerId = _httpContextAccessor.HttpContext?
                .User.FindFirst("CustomerId")?.Value;

            if (string.IsNullOrEmpty(customerId))
                throw new Exception("Customer not authenticated");



            // 🔥 1️⃣ Update returned quantity inside ORDER document
            var order = await _orders
                .Find(o => o.Id == dto.OrderId)
                .FirstOrDefaultAsync();

            var product = order?.Products
                .FirstOrDefault(p => p.ProductId == dto.ProductId);

            if (product != null)
            {
                product.ReturnedQty += dto.ReturnQty;

                await _orders.ReplaceOneAsync(
                    o => o.Id == order.Id,
                    order
                );
            }


            var customer = await _customers
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            var returnRequest = new ReturnRequest
            {
                CustomerId = customerId,
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                ProductName = dto.ProductName,
                ReturnQty = dto.ReturnQty,
                Reason = dto.Reason,


                CustomerName = customer?.Name, // optional cache

                DistributorId = order.DistributorId,

                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _returns.InsertOneAsync(returnRequest);
            return returnRequest;



        }




        public async Task<List<EmployeeReturnPickupDto>> GetReturnsForEmployee(string employeeId)
        {
            var returns = await _returns
                .Find(r =>
                    r.AssignedEmployeeId == employeeId &&
                    r.Status == "PickupConfirmed"
                )
                .ToListAsync();

            var result = new List<EmployeeReturnPickupDto>();

            foreach (var r in returns)
            {
                // 1️⃣ Fetch order
                var order = await _orders
                    .Find(o => o.Id == r.OrderId)
                    .FirstOrDefaultAsync();

                // 2️⃣ Fetch product
                var product = order?.Products
                    .FirstOrDefault(p => p.ProductId == r.ProductId);

                // 3️⃣ Fetch customer
                Customer? customer = null;
                if (!string.IsNullOrEmpty(r.CustomerId))
                {
                    customer = await _customers
                        .Find(c => c.CustomerId == r.CustomerId)
                        .FirstOrDefaultAsync();
                }

                // 4️⃣ Add to DTO
                result.Add(new EmployeeReturnPickupDto
                {
                    ReturnId = r.Id,
                    OrderId = r.OrderId,
                    ProductName = product?.ProductName ?? "Unknown",
                    ReturnQty = r.ReturnQty,
                    PickupDate = r.PickupDate ?? DateTime.MinValue,
                    PickupSlot = r.PickupSlot,
                    Status = r.Status,
                    ProductPrice = product?.Price ?? 0,

                    // ⭐ NEW CUSTOMER DETAILS ⭐
                    CustomerName = customer?.Name
                                   ?? order?.CustomerName
                                   ?? "Unknown Customer",

                    CustomerPhone = customer?.PhoneNumber
                                    ?? order?.CustomerPhone
                                    ?? "N/A",

                    CustomerEmail = customer?.Email
                                    ?? order?.CustomerEmail
                                    ?? "N/A",

                    CustomerAddress = string.Join(", ", new[]
{
    customer?.Street,
    customer?.City,
    customer?.State,
    customer?.Pincode,
    customer?.Country
}.Where(x => !string.IsNullOrWhiteSpace(x))),
                });
            }

            return result;
        }



        // 2️⃣ APPROVE RETURN
        public async Task ApproveReturnAsync(string returnId)
        {
            var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();

            if (ret == null)
                throw new Exception("Return not found");

            ret.Status = "Approved";
            ret.ApprovedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        }

        // 3️⃣ RECEIVE RETURN (PHYSICAL COLLECTION)
        public async Task ReceiveReturnAsync(string returnId)
        {
            var distributorId = GetDistributorId();

            var ret = await _returns.Find(r =>
                r.Id == returnId &&
                r.Status == "PickedUp" &&
                r.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            if (ret == null)
                throw new Exception("Return not ready for receiving");

            ret.Status = "Received";
            ret.ReceivedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        }





        // 4️⃣ COMPLETE RETURN (INVENTORY + ORDER)
        public async Task CompleteReturnAsync(string returnId)
        {
            using var session = await _client.StartSessionAsync();
            session.StartTransaction();

            try
            {

                // Get distributor from Return itself (NOT from token)
                var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();

                if (ret == null)
                    throw new Exception("Return not found");

                // 🔥 ADD THESE LOGS HERE
               
                var distributorId = ret.DistributorId;




            if (ret.Status != "Received")
                throw new Exception("Item not yet picked up");

            // 1️⃣ UPDATE INVENTORY
            var inventory = await _inventory.Find(i =>
                i.ProductId == ret.ProductId &&
                i.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            if (inventory == null)
                throw new Exception("Inventory not found");

                // 🔥 Detect damaged return
                bool isDamaged =
    ret.Reason?.ToLower().Contains("damaged") == true;

                if (isDamaged)
                {
                    inventory.DamagedQty += ret.ReturnQty;
                }
                else
                {
                    inventory.CurrentStock += ret.ReturnQty;
                }

                // ✅ Always track returned qty
                inventory.ReturnedQty += ret.ReturnQty;

               
                inventory.UpdatedAt = DateTime.UtcNow;

            await _inventory.ReplaceOneAsync(i => i.InventoryId == inventory.InventoryId, inventory);

            // 2️⃣ UPDATE ORDER
            var order = await _orders.Find(o => o.Id == ret.OrderId).FirstOrDefaultAsync();

            if (order != null)
            {
                var orderProduct = order.Products
                    .FirstOrDefault(p => p.ProductId == ret.ProductId);

                if (orderProduct != null)
                {
                    // Update returned qty
                    orderProduct.ReturnedQty += ret.ReturnQty;

                    if (orderProduct.ReturnedQty > orderProduct.Quantity)
                        orderProduct.ReturnedQty = orderProduct.Quantity;

                    // Calculate return value using final price
                    var unitFinalPrice = orderProduct.FinalPrice / orderProduct.Quantity;
                    var returnValue = unitFinalPrice * ret.ReturnQty;

                    // Initialize remaining amount first time
                    if (!order.HasReturn)
                        order.RemainingAmount = order.TotalAmount;


                    // Accounting
                    order.ReturnedAmount += returnValue;
                    order.RemainingAmount -= returnValue;

                    if (order.RemainingAmount < 0)
                        order.RemainingAmount = 0;

                    order.HasReturn = true;


                    // Refund only approved credit balance
                    var remainingEligible = order.ApprovedCredit - order.RefundedCredit;
                    var creditRefund = Math.Min(returnValue, remainingEligible);

                    if (creditRefund > 0)
                    {
                            // Add credit back to customer
                            await _customers.UpdateOneAsync(
         session,
         c => c.CustomerId == order.CustomerId,
         Builders<Customer>.Update.Inc(c => c.CreditBalance, creditRefund)
     );
                            // Ledger entry
                            await _creditTransactions.InsertOneAsync(session, new CreditTransaction
                            {
                            CustomerId = order.CustomerId,
                            Amount = creditRefund,
                            Type = "Return",
                            OrderId = order.Id,
                            ReturnId = ret.Id,
                            CreatedAt = DateTime.UtcNow
                        });

                        order.RefundedCredit += creditRefund;
                    }

                }

                order.Status = "Return Completed";
                order.UpdatedAt = DateTime.UtcNow;
            

                // 🔥 SAVE ORDER
                await _orders.ReplaceOneAsync(session,o => o.Id == order.Id, order);
            }

            // 3️⃣ UPDATE RETURN STATUS
            ret.Status = "Completed";
            ret.CompletedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(session,r => r.Id == ret.Id, ret);
                await session.CommitTransactionAsync();
            }
            catch
            {
                await session.AbortTransactionAsync();
                throw;
            }


        }




        //public async Task CompleteReturnAsync(string returnId
        //{
        //    var distributorId = GetDistributorId();

        //    if (string.IsNullOrEmpty(distributorId))
        //        throw new Exception("Unauthorized distributor");

        //    var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();
        //    if (ret == null)
        //        throw new Exception("Return not found");

        //    var order = await _orders.Find(o =>
        //        o.Id == ret.OrderId &&
        //        o.DistributorId == distributorId
        //    ).FirstOrDefaultAsync();

        //    if (order == null)
        //        throw new Exception("Order does not belong to this distributor");

        //    var inventory = await _inventory.Find(i =>
        //        i.ProductId == ret.ProductId &&
        //        i.DistributorId == distributorId
        //    ).FirstOrDefaultAsync();

        //    if (inventory == null)
        //        throw new Exception("Inventory not found");

        //    // Update stock
        //    inventory.CurrentStock += ret.ReturnQty;
        //    inventory.AvailableQuantity += ret.ReturnQty;
        //    inventory.ReturnedQty += ret.ReturnQty;
        //    inventory.UpdatedAt = DateTime.UtcNow;

        //    await _inventory.ReplaceOneAsync(i => i.Id == inventory.Id, inventory);

        //    ret.Status = "Completed";
        //    ret.CompletedAt = DateTime.UtcNow;

        //    await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        //}

        //public async Task CompleteReturnAsync(string returnId)
        //{
        //    var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();
        //    if (ret == null)
        //        throw new Exception("Return not found");

        //    var order = await _orders.Find(o => o.Id == ret.OrderId).FirstOrDefaultAsync();
        //    if (order == null)
        //        throw new Exception("Order not found");

        //    var inventory = await _inventory.Find(i =>
        //        i.ProductId == ret.ProductId &&
        //        i.DistributorId == order.DistributorId
        //    ).FirstOrDefaultAsync();

        //    if (inventory == null)
        //        throw new Exception("Inventory not found");

        //    inventory.CurrentStock += ret.ReturnQty;
        //    inventory.AvailableQuantity += ret.ReturnQty;
        //    inventory.ReturnedQty = (inventory.ReturnedQty) + ret.ReturnQty;
        //    inventory.UpdatedAt = DateTime.UtcNow;

        //    await _inventory.ReplaceOneAsync(i => i.Id == inventory.Id, inventory);

        //    ret.Status = "Completed";
        //    ret.CompletedAt = DateTime.UtcNow;

        //    await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        //}



        // 5️⃣ REJECT RETURN
        public async Task RejectReturnAsync(
     string returnId,
     string reason,
     string rejectedBy
 )
        {
            // 1️⃣ Fetch return record
            var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();
            if (ret == null)
                throw new Exception("Return not found");

            // 2️⃣ CUSTOMER rule
            if (rejectedBy == "Customer")
            {
                if (ret.Status != "Pending")
                    throw new Exception("Return cannot be cancelled at this stage.");
            }

            // 3️⃣ DISTRIBUTOR rule
            if (rejectedBy == "Distributor")
            {
                var distributorId = GetDistributorId();
                if (ret.DistributorId != distributorId)
                    throw new Exception("Unauthorized distributor.");

                if (ret.Status == "Received" || ret.Status == "Completed")
                    throw new Exception("Cannot reject return after receiving item.");
            }

            // 4️⃣ Update return record
            ret.Status = "Rejected";
            ret.RejectedBy = rejectedBy;
            ret.RejectionReason = reason;
            ret.UpdatedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);

            // 5️⃣ Update related order (IMPORTANT FIX)
            await _orders.UpdateOneAsync(
                o => o.Id == ret.OrderId,  // OrderId matches Order.Id
                Builders<Order>.Update
                    .Set(o => o.Status, rejectedBy == "Customer" ? "Delivered" : "Return Rejected")
                    .Set(o => o.UpdatedAt, DateTime.UtcNow)
            );
        }













        public async Task<ReturnRequest> GetReturnByIdAsync(string id)
        {
            var objectId = new ObjectId(id);
            var ret = await _returns.Find(r => r.Id == id).FirstOrDefaultAsync();
            return ret;
        }


        public async Task<List<ReturnHistoryDto>> GetReturnHistoryAsync(string? status = null)
        {
            var customerId = _httpContextAccessor.HttpContext?
                .User.FindFirst("CustomerId")?.Value;

            if (string.IsNullOrEmpty(customerId))
                throw new Exception("Customer not authenticated");

            // Filter only this customer's return requests
            var filter = Builders<ReturnRequest>.Filter.Eq(r => r.CustomerId, customerId);

            if (!string.IsNullOrEmpty(status))
            {
                filter = Builders<ReturnRequest>.Filter.And(
                    filter,
                    Builders<ReturnRequest>.Filter.Eq(r => r.Status, status)
                );
            }

            var returns = await _returns
                .Find(filter)
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();

            return returns.Select(r =>
            {
                Order? order = null;

                if (ObjectId.TryParse(r.OrderId, out _))
                {
                    order = _orders.Find(o => o.Id == r.OrderId).FirstOrDefault();
                }

                var product = order?.Products
                    .FirstOrDefault(p => p.ProductId == r.ProductId);

                return new ReturnHistoryDto
                {
                    Id = r.Id,
                    OrderId = r.OrderId,
                    ProductId = r.ProductId,
                    ProductName = r.ProductName ?? product?.ProductName ?? "Unknown Product",
                    Price = product?.Price,
                    ReturnQty = r.ReturnQty,
                    Status = r.Status,
                    Reason = r.Reason,
                    CreatedAt = r.CreatedAt
                };
            }).ToList();
        }



        public async Task<List<ReturnRequest>> GetReturnHistoryByStatusAsync(string status)
        {
            return await _returns
                .Find(r => r.Status == status)
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();
        }


        private string GetDistributorId()
        {
            return _httpContextAccessor.HttpContext?.User?
                .FindFirst("DistributorId")?.Value;
        }


        public async Task MarkPickedUpAsync(string returnId)
        {
            // 1️⃣ Find return
            var ret = await _returns
                .Find(r => r.Id == returnId)
                .FirstOrDefaultAsync();

            if (ret == null)
                throw new Exception("Return not found");

            // 2️⃣ Validate current state
            if (ret.Status != "PickupConfirmed")
                throw new Exception(
                    $"Pickup not scheduled. Current status: {ret.Status}"
                );

            // 3️⃣ Update return status
            ret.Status = "Received";
            ret.ReceivedAt = DateTime.UtcNow;

            // 4️⃣ Persist change
            await _returns.ReplaceOneAsync(
                r => r.Id == ret.Id,
                ret
            );
        }









        public async Task UploadReturnImagesAsync(
    string returnId,
    List<IFormFile> files
)
        {
            foreach (var file in files)
            {
                if (!file.ContentType.StartsWith("image/"))
                    throw new Exception("Only image files allowed");

                // 1️⃣ Upload to Azure Blob → returns blobName
                var blobName = await _blobService.UploadAsync(file);

                // 2️⃣ Save ONLY blobName in MongoDB
                var image = new ReturnImageInfo
                {
                    ReturnId = returnId,
                    BlobName = blobName,
                    UploadedAt = DateTime.UtcNow
                };

                await _returnImages.InsertOneAsync(image);
            }
        }


    }
}
