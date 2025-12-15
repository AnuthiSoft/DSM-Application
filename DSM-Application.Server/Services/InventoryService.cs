using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class InventoryService
    {
        private readonly IMongoCollection<InventoryItem> _inventory;
        private readonly IMongoCollection<StockMovement> _movements;
        private readonly IMongoCollection<Product> _products;

        public InventoryService(IMongoDatabase db)
        {
            _inventory = db.GetCollection<InventoryItem>("Inventory");
            _movements = db.GetCollection<StockMovement>("StockMovements");
            _products = db.GetCollection<Product>("Products");
        }

        // 🔥 FIXED: Always return products + inventory merged
        public async Task<List<object>> GetAllStock(string distributorId)
        {
            var products = await _products
                .Find(p => p.DistributorId == distributorId && p.IsActive && !p.IsDeleted)
                .ToListAsync();

            var inventory = await _inventory
                .Find(i => i.DistributorId == distributorId)
                .ToListAsync();

            var result = new List<object>();

            foreach (var product in products)
            {
                var item = inventory.FirstOrDefault(i => i.ProductId == product.ProductId);

                result.Add(new
                {
                    ProductId = product.ProductId,
                    productName = product.ProductName,
                    productCode = product.ProductCode,
                    measure = product.Measure,
                    costPrice = product.CostPrice,
                    sellingPrice = product.Price,

                    // 🔥 If inventory missing → fallback to product.stock
                    CurrentStock = item?.CurrentStock ?? product.Stock,
                    ReorderLevel = item?.ReorderLevel ?? 0,
                    UpdatedAt = item?.UpdatedAt ?? product.UpdatedDate
                });
            }

            return result;
        }

        // 🔥 Stock In
        public async Task AddStockAsync(string productId, string distributorId, int quantity, string reason)
        {
            var item = await _inventory.Find(i =>
                i.ProductId == productId &&
                i.DistributorId == distributorId
            ).FirstOrDefaultAsync();

            int previous = item?.CurrentStock ?? 0;
            int newStock = previous + quantity;

            if (item == null)
            {
                item = new InventoryItem
                {
                    ProductId = productId,
                    DistributorId = distributorId,
                    CurrentStock = quantity,
                    ReorderLevel = 0,
                    UpdatedAt = DateTime.UtcNow
                };

                await _inventory.InsertOneAsync(item);
            }
            else
            {
                item.CurrentStock = newStock;
                item.UpdatedAt = DateTime.UtcNow;

                await _inventory.ReplaceOneAsync(
                    x => x.ProductId == productId && x.DistributorId == distributorId,
                    item
                );
            }

            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = productId,
                DistributorId = distributorId,
                Date = DateTime.UtcNow,
                PreviousStock = previous,
                NewStock = newStock,
                Quantity = quantity,
                Type = "IN",
                Reason = reason
            });
        }

        // 🔥 Stock Out
        public async Task RemoveStockAsync(string productId, string distributorId, int quantity, string reason)
        {
            var filter = Builders<InventoryItem>.Filter.And(
                Builders<InventoryItem>.Filter.Eq(i => i.ProductId, productId),
                Builders<InventoryItem>.Filter.Eq(i => i.DistributorId, distributorId)
            );

            var item = await _inventory.Find(filter).FirstOrDefaultAsync();
            if (item == null) return;

            int previous = item.CurrentStock;
            int newStock = Math.Max(previous - quantity, 0);

            var update = Builders<InventoryItem>.Update
                .Set(i => i.CurrentStock, newStock)
                .Set(i => i.UpdatedAt, DateTime.UtcNow);

            await _inventory.UpdateOneAsync(filter, update);

            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = productId,
                DistributorId = distributorId,
                Date = DateTime.UtcNow,
                PreviousStock = previous,
                NewStock = newStock,
                Quantity = quantity,
                Type = "OUT",
                Reason = reason
            });
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
                await _inventory.InsertOneAsync(new InventoryItem
                {
                    ProductId = productId,
                    DistributorId = distributorId,
                    CurrentStock = newStock,
                    ReorderLevel = 0,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var update = Builders<InventoryItem>.Update
                    .Set(i => i.CurrentStock, newStock)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow);

                await _inventory.UpdateOneAsync(filter, update);
            }
        }

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
    }
}
