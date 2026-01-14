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
                    Price = product.Price,
                    CurrentStock = inv.CurrentStock,
                    ReorderLevel = product.ReorderLevel,
                    UpdatedAt = inv.UpdatedAt
                });
            }

            return result;
        }












        // 🔥 Stock In
        public async Task AddStockAsync(string productId, string distributorId, int quantity, string reason)
        {
            // ⚠️ No expiry info → create batch with safe expiry
            var batch = new InventoryBatch
            {
                ProductId = productId,
                DistributorId = distributorId,
                QuantityInitial = quantity,
                QuantityAvailable = quantity,
                ManufactureDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddMonths(6), // default
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _batches.InsertOneAsync(batch);

            // UPDATE SUMMARY
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


        // 🔥 Stock Out
        public async Task RemoveStockAsync(
       string productId,
       string distributorId,
       int quantity,
       string reason)
        {
            var batches = await _batches.Find(b =>
                b.ProductId == productId &&
                b.DistributorId == distributorId &&
                b.QuantityAvailable > 0 &&
                b.ExpiryDate > DateTime.UtcNow   // 🔥 BLOCK expired
            )
            .SortBy(b => b.ExpiryDate) // 🔥 FEFO (earliest expiry first)
            .ToListAsync();

            int remaining = quantity;

            foreach (var batch in batches)
            {
                if (remaining <= 0) break;

                int deduct = Math.Min(batch.QuantityAvailable, remaining);
                batch.QuantityAvailable -= deduct;
                remaining -= deduct;

                await _batches.ReplaceOneAsync(
                    b => b.BatchId == batch.BatchId,
                    batch
                );

                await _movements.InsertOneAsync(new StockMovement
                {
                    ProductId = productId,
                    DistributorId = distributorId,
                    BatchId = batch.BatchId,
                    Quantity = deduct,
                    Type = "OUT",
                    Reason = reason,
                    Date = DateTime.UtcNow
                });
            }

            if (remaining > 0)
                throw new Exception("Not enough non-expired stock available");

            // Update summary inventory
            await _inventory.UpdateOneAsync(
                i => i.ProductId == productId && i.DistributorId == distributorId,
                Builders<InventoryItem>.Update
                    .Inc(i => i.CurrentStock, -quantity)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow)
            );
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
            if (dto.ExpiryDate <= dto.ManufactureDate)
                throw new Exception("Expiry date must be after manufacture date");

            // 1️⃣ Create batch
            var batch = new InventoryBatch
            {
                ProductId = dto.ProductId,
                DistributorId = distributorId,
                QuantityInitial = dto.Quantity,
                QuantityAvailable = dto.Quantity,
                ManufactureDate = dto.ManufactureDate,
                ExpiryDate = dto.ExpiryDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _batches.InsertOneAsync(batch);

            // 2️⃣ UPDATE SUMMARY INVENTORY
            await _inventory.UpdateOneAsync(
                i => i.ProductId == dto.ProductId && i.DistributorId == distributorId,
                Builders<InventoryItem>.Update
                    .SetOnInsert(i => i.InventoryId, ObjectId.GenerateNewId().ToString())
                    .SetOnInsert(i => i.ProductId, dto.ProductId)
                    .SetOnInsert(i => i.DistributorId, distributorId)
                    .SetOnInsert(i => i.CreatedAt, DateTime.UtcNow)
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
                b.ExpiryDate <= alertDate
            ).ToListAsync();

            var productIds = batches.Select(b => b.ProductId).Distinct().ToList();

            var products = await _products
                .Find(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            return batches.Select(b =>
            {
                var product = products.FirstOrDefault(p => p.ProductId == b.ProductId);

                return new ExpiringStockDto
                {
                    ProductId = b.ProductId,
                    ProductName = product?.ProductName,
                    BatchId = b.BatchId,
                    QuantityAvailable = b.QuantityAvailable,
                    ExpiryDate = b.ExpiryDate,
                    DaysToExpire = (b.ExpiryDate - today).Days,
                    Status = b.ExpiryDate < today ? "Expired" : "ExpiringSoon"
                };
            }).ToList();
        }


    }
}

