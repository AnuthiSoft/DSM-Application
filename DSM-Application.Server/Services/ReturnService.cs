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


        public ReturnService(MongoDbService db, InventoryService inventoryService, IHttpContextAccessor httpContextAccessor)
        {
            _orders = db.Orders;
            _returns = db.ReturnRequests;
            _inventory = db.InventoryItems;    // ✅ ADD THIS
            _inventoryService = inventoryService;
            _httpContextAccessor = httpContextAccessor;
        }

        // 1️⃣ CREATE RETURN (ONLY AFTER DELIVERY)
        public async Task<ReturnRequest> CreateReturnAsync(CreateReturnDto dto)
        {
            var order = await _orders.Find(o => o.Id == dto.OrderId).FirstOrDefaultAsync();
            if (order == null)
                throw new Exception("Order not found");

            if (order.Status != "Delivered")
                throw new Exception("Return allowed only after delivery");

            var product = order.Products.FirstOrDefault(p => p.ProductId == dto.ProductId);
            if (product == null)
                throw new Exception("Product not found in order");

            int remainingQty = product.Quantity - product.ReturnedQty;
            if (dto.ReturnQty > remainingQty)
                throw new Exception("Return quantity exceeds delivered quantity");

            var returnRequest = new ReturnRequest
            {
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                ReturnQty = dto.ReturnQty,
                Reason = dto.Reason,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _returns.InsertOneAsync(returnRequest);

            return returnRequest; // ✅ IMPORTANT
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
            var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();

            ret.Status = "Received";
            ret.ReceivedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        }

        // 4️⃣ COMPLETE RETURN (INVENTORY + ORDER)
        public async Task CompleteReturnAsync(string returnId)
        {
            // 1️⃣ Get distributorId from JWT
            var distributorId = _httpContextAccessor.HttpContext?
                .User?.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))
                throw new Exception("Unauthorized: Distributor not found");

            // 2️⃣ Get return
            var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();
            if (ret == null)
                throw new Exception("Return not found");

            // 3️⃣ Get order and validate ownership
            var order = await _orders.Find(o =>
                o.Id == ret.OrderId &&
                o.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            if (order == null)
                throw new Exception("Unauthorized access to this order");

            // 4️⃣ Get inventory for this distributor
            var inventory = await _inventory.Find(i =>
                i.ProductId == ret.ProductId &&
                i.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            if (inventory == null)
                throw new Exception("Inventory not found");

            // 5️⃣ Update stock
            inventory.CurrentStock += ret.ReturnQty;
            //inventory.AvailableQuantity += ret.ReturnQty;
            inventory.ReturnedQty += ret.ReturnQty;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _inventory.ReplaceOneAsync(i => i.InventoryId == inventory.InventoryId, inventory);

            // 6️⃣ Update return status
            ret.Status = "Completed";
            ret.CompletedAt = DateTime.UtcNow;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
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
        public async Task RejectReturnAsync(string returnId, string reason)
        {
            var ret = await _returns.Find(r => r.Id == returnId).FirstOrDefaultAsync();

            ret.Status = "Rejected";
            ret.RejectionReason = reason;

            await _returns.ReplaceOneAsync(r => r.Id == ret.Id, ret);
        }

    public async Task<ReturnRequest> GetReturnByIdAsync(string id)
        {
            var objectId = new ObjectId(id);
            var ret = await _returns.Find(r => r.Id == id).FirstOrDefaultAsync();
            return ret;
        }


        public async Task<List<ReturnHistoryDto>> GetReturnHistoryAsync(string? status = null)
        {
            var filter = Builders<ReturnRequest>.Filter.Empty;

            if (!string.IsNullOrEmpty(status))
            {
                filter = Builders<ReturnRequest>.Filter.Eq(r => r.Status, status);
            }

            var returns = await _returns
                .Find(filter)
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();

            return returns.Select(r => new ReturnHistoryDto
            {
                Id = r.Id,
                OrderId = r.OrderId,
                ProductId = r.ProductId,
                ReturnQty = r.ReturnQty,
                Status = r.Status,
                Reason = r.Reason,
                CreatedAt = r.CreatedAt,
                ApprovedAt = r.ApprovedAt,
                ReceivedAt = r.ReceivedAt,
                CompletedAt = r.CompletedAt
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

    }
}
