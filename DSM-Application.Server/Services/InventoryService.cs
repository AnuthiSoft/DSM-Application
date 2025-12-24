using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
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
                    productId = product.ProductId,
                    productName = product.ProductName,
                    productCode = product.ProductCode,
                    measure = product.Measure,
                    costPrice = product.CostPrice,
                    currentStock = item?.CurrentStock ?? product.Stock,

                    sellingPrice = product.Price,

                    reorderLevel = product.ReorderLevel,
                    updatedAt = item?.UpdatedAt ?? product.UpdatedDate
                });
            }

            return result;
        }






        // 🔥 Stock In
        public async Task AddStockAsync(string productId, string distributorId, int quantity, string reason)
        {
            await _inventory.UpdateOneAsync(
                i => i.ProductId == productId && i.DistributorId == distributorId,
                Builders<InventoryItem>.Update
                    .Inc(i => i.CurrentStock, quantity)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true }
            );

            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = productId,
                DistributorId = distributorId,
                Date = DateTime.UtcNow,
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

            if (item == null || item.CurrentStock < quantity)
                throw new Exception("Out of stock");

            await _inventory.UpdateOneAsync(
                filter,
                Builders<InventoryItem>.Update
                    .Inc(i => i.CurrentStock, -quantity)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow)
            );

            await _movements.InsertOneAsync(new StockMovement
            {
                ProductId = productId,
                DistributorId = distributorId,
                Date = DateTime.UtcNow,
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


        public async Task AddInventoryAsync(AddInventoryDto dto)
        {
            var item = new InventoryItem
            {
                ProductId = dto.ProductId,
                //DistributorId = dto.DistributorId,   // include if needed
                AvailableQuantity = dto.Quantity,
                ManufactureDate = dto.ManufactureDate,
                ExpiryDate = dto.ExpiryDate,
                CreatedAt = DateTime.UtcNow
            };

            await _inventory.InsertOneAsync(item);
        }

        public async Task<List<InventoryItem>> GetBatchesByProduct(string productId)
        {
            return await _inventory
                .Find(i => i.ProductId == productId)
                .SortBy(i => i.CreatedAt) // FIFO order
                .ToListAsync();
        }

        public async Task DeductStockFIFO(string productId, int orderQty)
        {
            var batches = await _inventory
                .Find(i => i.ProductId == productId
                        && i.AvailableQuantity > 0
                        && i.ExpiryDate > DateTime.UtcNow)
                .SortBy(i => i.CreatedAt) // FIFO
                .ToListAsync();

            if (!batches.Any())
                throw new Exception("No valid stock available");

            int remaining = orderQty;

            foreach (var batch in batches)
            {
                if (remaining <= 0)
                    break;

                if (batch.AvailableQuantity >= remaining)
                {
                    batch.AvailableQuantity -= remaining;
                    remaining = 0;
                }
                else
                {
                    remaining -= batch.AvailableQuantity;
                    batch.AvailableQuantity = 0;
                }

                await _inventory.ReplaceOneAsync(i => i.ProductId == batch.ProductId, batch);
            }

            if (remaining > 0)
                throw new Exception("Insufficient stock");
        }

    }
}

    