using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Bson;
using MongoDB.Driver;


namespace DSM_Application.Server.Services
{
    public class InventoryService
    {
        private readonly IMongoCollection<InventoryItem> _inventory;

        private readonly IMongoCollection<Product> _products;
        private readonly IMongoCollection<InventoryBatch> _inventoryBatches;
        private readonly IMongoCollection<InventoryBatch> _batches;
        private readonly IMongoCollection<StockMovement> _movements;



        public InventoryService(IMongoDatabase db)
        {
            //_inventory = db.GetCollection<InventoryItem>("Inventory");
            _inventory = db.GetCollection<InventoryItem>("InventoryItems");
            _movements = db.GetCollection<StockMovement>("StockMovements");
            _products = db.GetCollection<Product>("Products");
            _batches = db.GetCollection<InventoryBatch>("InventoryBatches");
            _movements = db.GetCollection<StockMovement>("StockMovements");
        }

        // 🔥 FIXED: Always return products + inventory merged
        public async Task<List<InventoryProductDto>> GetAllStock(string distributorId)
        {
            // 1️⃣ Inventory ONLY for this distributor
            var inventory = await _inventory
                .Find(i =>
                    i.DistributorId == distributorId &&
                    i.CurrentStock > 0
                )
                .ToListAsync();

            if (!inventory.Any())
                return new List<InventoryProductDto>();

            var productIds = inventory.Select(i => i.ProductId).Distinct().ToList();

            // 2️⃣ Products ONLY for this distributor
            var products = await _products
                .Find(p =>
                    productIds.Contains(p.ProductId) &&
                    p.DistributorId == distributorId &&
                    p.IsActive &&
                    !p.IsDeleted
                )
                .ToListAsync();

            // 3️⃣ STRICT merge (skip orphan inventory)
            var result = new List<InventoryProductDto>();

            foreach (var inv in inventory)
            {
                var product = products.FirstOrDefault(p => p.ProductId == inv.ProductId);

                // 🚫 Skip inventory without valid product
                if (product == null)
                    continue;

                result.Add(new InventoryProductDto
                {
                    ProductId = product.ProductId,
                    ProductName = product.ProductName,
                    ProductCode = product.ProductCode,
                    Brand = product.Brand,
                    Measure = product.Measure,
                    DamagedQty = inv.DamagedQty,
                    Price = product.Price,
                    CurrentStock = inv.CurrentStock,
                    ReorderLevel = product.ReorderLevel,
                    UpdatedAt = inv.UpdatedAt
                });
            }

            return result;
        }












        // 🔥 Stock In
        public async Task AddStockAsync(
      string productId,
      string distributorId,
      int quantity,
      DateTime manufactureDate,
      DateTime expiryDate,
      string reason)
        {
            // ✅ Validation
            //if (expiryDate <= manufactureDate)
            //    throw new Exception("Expiry date must be after manufacture date");

            var batch = new InventoryBatch
            {
                ProductId = productId,
                DistributorId = distributorId,
                InitialQuantity = quantity,
                QuantityAvailable = quantity,
                ManufactureDate = manufactureDate,
                ExpiryDate = expiryDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _batches.InsertOneAsync(batch);

            // ✅ Update total inventory
            await _inventory.UpdateOneAsync(
                i => i.ProductId == productId && i.DistributorId == distributorId,
                Builders<InventoryItem>.Update
                    .SetOnInsert(i => i.InventoryId, ObjectId.GenerateNewId().ToString())
                    .SetOnInsert(i => i.ProductId, productId)
                    .SetOnInsert(i => i.DistributorId, distributorId)
                    .SetOnInsert(i => i.CreatedAt, DateTime.UtcNow)
                    .Inc(i => i.CurrentStock, quantity)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true }
            );

            // ✅ Movement log
            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = productId,
                DistributorId = distributorId,
                BatchId = batch.BatchId,
                Quantity = quantity,
                Type = "IN",
                Reason = reason,
                Date = DateTime.UtcNow
            });
        }



        //public async Task AddStockAsync(string productId, string distributorId, int quantity, string reason)
        //{
        //    await _inventory.UpdateOneAsync(
        //        i => i.ProductId == productId && i.DistributorId == distributorId,
        //        Builders<InventoryItem>.Update
        //            .Inc(i => i.CurrentStock, quantity)
        //            .Set(i => i.UpdatedAt, DateTime.UtcNow),
        //        new UpdateOptions { IsUpsert = true }
        //    );

        //    await _movements.InsertOneAsync(new StockMovement
        //    {
        //        ProductId = productId,
        //        DistributorId = distributorId,
        //        Date = DateTime.UtcNow,
        //        Quantity = quantity,
        //        Type = "IN",
        //        Reason = reason
        //    });
        //}


        public async Task<bool> RemoveStockAsync(
            string productId,
            string distributorId,
            int quantity,
            string reason)

        {

            // ----------------------------------------

            // 0️⃣ ENSURE BATCH EXISTS (🔥 MAIN FIX)

            // ----------------------------------------

            var existingBatches = await _batches.Find(b =>

                b.ProductId == productId &&

                b.DistributorId == distributorId &&

                b.QuantityAvailable > 0 &&

                b.IsActive

            ).ToListAsync();

            if (!existingBatches.Any())

            {

                // 🔥 Fallback: create batch from InventoryItems

                var inventory = await _inventory.Find(i =>

                    i.ProductId == productId &&

                    i.DistributorId == distributorId

                ).FirstOrDefaultAsync();

                if (inventory == null || inventory.CurrentStock <= 0)
                    return false;

                var autoBatch = new InventoryBatch

                {

                    ProductId = productId,

                    DistributorId = distributorId,

                    InitialQuantity = inventory.CurrentStock,

                    QuantityAvailable = inventory.CurrentStock,

                    ManufactureDate = DateTime.UtcNow,

                    ExpiryDate = DateTime.UtcNow.AddMonths(6),

                    IsActive = true,

                    CreatedAt = DateTime.UtcNow

                };

                await _batches.InsertOneAsync(autoBatch);

                existingBatches.Add(autoBatch);

            }

            // ----------------------------------------

            // 1️⃣ FIFO STOCK DEDUCTION

            // ----------------------------------------

            int remainingQty = quantity;

            foreach (var batch in existingBatches.OrderBy(b => b.CreatedAt))

            {

                if (remainingQty <= 0)

                    break;

                if (batch.QuantityAvailable >= remainingQty)

                {

                    await _batches.UpdateOneAsync(

                        b => b.BatchId == batch.BatchId,

                        Builders<InventoryBatch>.Update

                            .Inc(b => b.QuantityAvailable, -remainingQty)

                    );

                    await _movements.InsertOneAsync(new StockMovement

                    {

                        ProductId = productId,

                        DistributorId = distributorId,

                        BatchId = batch.BatchId,

                        Quantity = remainingQty,

                        Type = "OUT",

                        Reason = reason,

                        Date = DateTime.UtcNow

                    });

                    remainingQty = 0;

                }

                else

                {

                    int consumed = batch.QuantityAvailable;

                    await _batches.UpdateOneAsync(

                        b => b.BatchId == batch.BatchId,

                        Builders<InventoryBatch>.Update

                            .Set(b => b.QuantityAvailable, 0)

                    );

                    await _movements.InsertOneAsync(new StockMovement

                    {

                        ProductId = productId,

                        DistributorId = distributorId,

                        BatchId = batch.BatchId,

                        Quantity = consumed,

                        Type = "OUT",

                        Reason = reason,

                        Date = DateTime.UtcNow

                    });

                    remainingQty -= consumed;

                }

            }

            if (remainingQty > 0)
                return false;
            // ----------------------------------------

            // 2️⃣ UPDATE INVENTORY SUMMARY

            // ----------------------------------------

            await _inventory.UpdateOneAsync(

         i => i.ProductId == productId && i.DistributorId == distributorId,

         Builders<InventoryItem>.Update

             .Inc(i => i.CurrentStock, -quantity)

             .Set(i => i.UpdatedAt, DateTime.UtcNow)

     );
            return true;

        }



        // ⭐ CRITICAL FIX — Auto create Inventory if missing
        public async Task UpdateStockAfterProductEdit(string productId, string distributorId, int newStock)
        {
            var filter = Builders<InventoryItem>.Filter.And(
                Builders<InventoryItem>.Filter.Eq(i => i.ProductId, productId),
                Builders<InventoryItem>.Filter.Eq(i => i.DistributorId, distributorId)
            );

            var item = await _inventory.Find(filter).FirstOrDefaultAsync();

            if (item == null)
            {
                // ✅ Create inventory if missing
                await _inventory.InsertOneAsync(new InventoryItem
                {
                    ProductId = productId,
                    DistributorId = distributorId,
                    CurrentStock = newStock,
                    ReorderLevel = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var update = Builders<InventoryItem>.Update
                    .Set(i => i.CurrentStock, newStock)
                    .Set(i => i.AvailableQuantity, newStock)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow);

                await _inventory.UpdateOneAsync(filter, update);
            }
        }

        //public async Task UpdateStockAfterProductEdit(string productId, string distributorId, int newStock)
        //{
        //    var filter = Builders<InventoryItem>.Filter.And(
        //        Builders<InventoryItem>.Filter.Eq(i => i.ProductId, productId),
        //        Builders<InventoryItem>.Filter.Eq(i => i.DistributorId, distributorId)
        //    );

        //    var item = await _inventory.Find(filter).FirstOrDefaultAsync();

        //    if (item == null)
        //    {
        //        await _inventory.InsertOneAsync(new InventoryItem
        //        {
        //            ProductId = productId,
        //            DistributorId = distributorId,
        //            CurrentStock = newStock,
        //            ReorderLevel = 0,
        //            UpdatedAt = DateTime.UtcNow
        //        });
        //    }
        //    else
        //    {
        //        var update = Builders<InventoryItem>.Update
        //            .Set(i => i.CurrentStock, newStock)
        //            //.Set(i => i.AvailableQuantity, newStock)
        //            .Set(i => i.UpdatedAt, DateTime.UtcNow);

        //        await _inventory.UpdateOneAsync(filter, update);
        //    }
        //}

        public async Task DeleteInventoryByProductId(string productId)
        {
            await _inventory.DeleteManyAsync(i => i.ProductId == productId);
        }

        public async Task<List<StockMovement>> GetMovements(string distributorId)
        {
            return await _movements.Find(m => m.DistributorId == distributorId)
                                   .SortByDescending(m => m.Date)
                                   .ToListAsync();
        }


        public async Task AddInventoryAsync(AddInventoryDto dto, string distributorId)
        {
            // 1️⃣ CREATE NEW BATCH (NEW ROW)
            var batch = new InventoryBatch
            {
                ProductId = dto.ProductId,
                DistributorId = distributorId,
                InitialQuantity = dto.Quantity,
                QuantityAvailable = dto.Quantity,
                ManufactureDate = dto.ManufactureDate,
                ExpiryDate = dto.ExpiryDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _batches.InsertOneAsync(batch);

            // 2️⃣ UPDATE PRODUCT TOTAL STOCK
            await _inventory.UpdateOneAsync(
                i => i.ProductId == dto.ProductId && i.DistributorId == distributorId,
                Builders<InventoryItem>.Update
                    .SetOnInsert(i => i.InventoryId, ObjectId.GenerateNewId().ToString())
                    .SetOnInsert(i => i.ProductId, dto.ProductId)
                    .SetOnInsert(i => i.DistributorId, distributorId)
                    .Inc(i => i.CurrentStock, dto.Quantity)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true }
            );



            // 3️⃣ Movement
            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = dto.ProductId,
                DistributorId = distributorId,
                BatchId = batch.BatchId,
                Quantity = dto.Quantity,
                Type = "IN",
                Reason = "Batch stock added",
                Date = DateTime.UtcNow
            });
        }






        public async Task<List<InventoryItem>> GetBatchesByProduct(string productId)
        {
            return await _inventory
                .Find(i => i.ProductId == productId)
                .SortBy(i => i.CreatedAt) // FIFO order
                .ToListAsync();
        }

        public async Task DeductStock(string productId, int quantity)
        {
            var item = await _inventory.Find(i => i.ProductId == productId).FirstOrDefaultAsync();

            if (item == null || item.CurrentStock < quantity)
                throw new Exception("Not enough stock");

            item.CurrentStock -= quantity;

            await _inventory.ReplaceOneAsync(i => i.ProductId == productId, item);
        }


        public async Task<InventoryItem> GetInventoryByProductId(string productId)
        {
            return await _inventory
                .Find(i => i.ProductId == productId)
                .FirstOrDefaultAsync();
        }

        public async Task<List<InventoryBatch>> GetBatchDetailsByProduct(string productId)
        {
            return await _batches
                .Find(b => b.ProductId == productId)
                .SortBy(b => b.ExpiryDate)
                .ToListAsync();
        }

        public async Task<List<ExpiringStockDto>> GetExpiringStock(
    string distributorId,
    int days = 30)
        {
            var today = DateTime.UtcNow;
            var alertDate = today.AddDays(days);

            var batches = await _batches.Find(b =>
                b.DistributorId == distributorId &&
                b.QuantityAvailable > 0 &&
                b.IsActive == true &&

                b.ExpiryDate != null &&
                b.ExpiryDate <= alertDate
            ).ToListAsync();

            var productIds = batches.Select(b => b.ProductId).Distinct().ToList();

            var products = await _products
                .Find(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            return batches
    .Where(b => b.ExpiryDate.HasValue) // 🔥 important
    .Select(b =>
    {
        var product = products.FirstOrDefault(p => p.ProductId == b.ProductId);

        var daysToExpire = (b.ExpiryDate!.Value - today).Days;

        return new ExpiringStockDto
        {
            ProductId = b.ProductId,
            ProductName = product?.ProductName,
            BatchId = b.BatchId,
            QuantityAvailable = b.QuantityAvailable,
            ExpiryDate = b.ExpiryDate.Value,
            DaysToExpire = daysToExpire,
            Status = daysToExpire < 0 ? "Expired" : "ExpiringSoon"
        };
    })
    .ToList();
        }


        public async Task<List<InventoryBatchDto>> GetBatchesByDistributor(string distributorId)
        {
            var batches = await _batches
                .Find(b =>
                    b.DistributorId == distributorId &&
                    b.QuantityAvailable > 0 &&      // 🔥 KEY FIX
                    b.IsActive == true
                )
                .SortBy(b => b.CreatedAt)           // FIFO
                .ToListAsync();

            var productIds = batches.Select(b => b.ProductId).Distinct().ToList();

            var products = await _products
                .Find(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            return batches.Select(b =>
            {
                var product = products.FirstOrDefault(p => p.ProductId == b.ProductId);

                return new InventoryBatchDto
                {
                    BatchId = b.BatchId,
                    ProductId = b.ProductId,
                    ProductName = product?.ProductName ?? "-",
                    ProductCode = product?.ProductCode ?? "-",
                    InitialQuantity = b.InitialQuantity,
                    QuantityAvailable = b.QuantityAvailable,
                    ManufactureDate = b.ManufactureDate,
                    ExpiryDate = b.ExpiryDate,
                    IsExpired = b.IsExpired
                };
            }).ToList();
        }

        public async Task UpdateBatchDatesAsync(UpdateBatchDatesDto dto)
        {
            await _batches.UpdateOneAsync(
                b => b.BatchId == dto.BatchId,
                Builders<InventoryBatch>.Update
                    .Set(b => b.ManufactureDate, dto.ManufactureDate)
                    .Set(b => b.ExpiryDate, dto.ExpiryDate)
            );
        }



    }
}
