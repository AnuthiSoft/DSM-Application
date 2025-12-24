using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Xml.Linq;
using DSM_Application.Server.Models;


namespace DSM_Application.Server.Services
{
    public class ProductService
    {
        private readonly IMongoCollection<Product> _products;
        private readonly IMongoCollection<Distributor> _distributors;
        private readonly CategoryService _categoryService;
        private readonly IMongoCollection<InventoryItem> _inventory;


        public ProductService(MongoDbService db, CategoryService categoryService)
        {
            _products = db.Products;
            _distributors = db.Distributors;
            _categoryService = categoryService;
            _inventory = db.InventoryItems;

        }

        public async Task<List<Product>> GetAllAsync(string distributorId)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId),
                Builders<Product>.Filter.Eq(p => p.IsActive, true)
            );

            return await _products.Find(filter).ToListAsync();
        }

        // Get all active products
        public async Task<List<Product>> GetAllByDistributorAsync(string distributorId)
        {
            // _products is already IMongoCollection<Product>
            return await _products
                .Find(p => p.DistributorId == distributorId && p.IsActive)
                .ToListAsync();
        }

        public async Task<Product> GetByIdAsync(string id)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(p => p.ProductId, id),
                Builders<Product>.Filter.Eq(p => p.IsActive, true)
            );

            return await _products.Find(filter).FirstOrDefaultAsync();
        }


        //public async Task<Product> GetByIdAsync(string id)
        //{
        //    return await _products.Find(p => p.ProductId == id).FirstOrDefaultAsync();
        //}

        // Create product
        //public async Task<Product> CreateAsync(Product product)
        //{
        //    // 🔍 Fetch GST from subcategory
        //    var subCategory = await _categoryService.GetByIdAsync(product.Category);

        //    if (subCategory != null)
        //        product.GST = subCategory.GST; // 💥 APPLY SUBCATEGORY GST
        //    product.CreatedDate = DateTime.UtcNow;
        //    product.UpdatedDate = DateTime.UtcNow;
        //    await _products.InsertOneAsync(product);
        //    return product;
        //}


        public async Task<Product> CreateAsync(Product product)
        {
            await _products.InsertOneAsync(product);

            // 🔥 CREATE INVENTORY ENTRY
            await _inventory.InsertOneAsync(new InventoryItem
            {
                ProductId = product.ProductId,
                DistributorId = product.DistributorId,
                
                UpdatedAt = DateTime.UtcNow
            });

            return product;
        }


        // Update product
        public async Task UpdateAsync(string id, Product product)
        {
            // If category changed, refresh GST
            var subCategory = await _categoryService.GetByIdAsync(product.Category);

            if (subCategory != null)
                product.GST = subCategory.GST;
            product.UpdatedDate = DateTime.UtcNow;
            await _products.ReplaceOneAsync(p => p.ProductId == id, product);
        }

        // Soft delete (set IsActive = false)
        public async Task DeleteAsync(string id)
        {
            var update = Builders<Product>.Update.Set(p => p.IsActive, false).Set(p => p.UpdatedDate, DateTime.UtcNow);
            await _products.UpdateOneAsync(p => p.ProductId == id, update);
        }

        public async Task<Distributor?> GetDistributorByIdAsync(string distributorId)
        {
            return await _distributors.Find(d => d.DistributorId == distributorId).FirstOrDefaultAsync();
        }
        public async Task<List<string>> GetCategoriesByDistributorAsync(string distributorId)
        {
            var distributor = await _distributors
                .Find(d => d.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return new List<string>();

            return distributor.Categories;
        }


        public async Task<List<Product>> GetProductsByDistributorAsync(string distributorId)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId),
                Builders<Product>.Filter.Eq(p => p.IsActive, true),
                Builders<Product>.Filter.Or(
                    Builders<Product>.Filter.Eq(p => p.IsDeleted, false),
                    Builders<Product>.Filter.Exists(p => p.IsDeleted, false) // ✅ include if missing
                )
            );

            return await _products.Find(filter).ToListAsync();
        }


        //public async Task<List<Product>> GetProductsByDistributorAsync(string distributorId)
        //{
        //    // Filter by string
        //    var filter = Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId);
        //    var products = await _products.Find(filter).ToListAsync();

        //    return products ?? new List<Product>();
        //}

        // 🔍 SEARCH SECTION STARTS HERE -----------------------------------

        // ✅ Search by Category
        public async Task<List<Product>> SearchByCategoryAsync(string distributorId, string category)
        {
            if (string.IsNullOrWhiteSpace(distributorId) || string.IsNullOrWhiteSpace(category))
                return new List<Product>();

            distributorId = distributorId.Trim();
            category = System.Text.RegularExpressions.Regex.Replace(category.Trim(), @"\s+", " ");

            // ✅ If your DistributorId in MongoDB is stored as a string (check your DB):
            var distributorFilter = Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId);

            // ✅ Case-insensitive category search (matches "Electronics", "electronics", etc.)
            var categoryFilter = Builders<Product>.Filter.Regex(
                p => p.Category,
                new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(category)}$", "i")
            );

            var isActiveFilter = Builders<Product>.Filter.Eq(p => p.IsActive, true);

            var finalFilter = Builders<Product>.Filter.And(distributorFilter, categoryFilter, isActiveFilter);

            return await _products.Find(finalFilter).ToListAsync();
        }

        // ✅ Search by Name (case-insensitive)
        public async Task<List<Product>> SearchByNameAsync(string distributorId, string name)
        {
            if (string.IsNullOrWhiteSpace(distributorId) || string.IsNullOrWhiteSpace(name))
                return new List<Product>();

            // Normalize input (trim spaces and case-insensitive search)
            distributorId = distributorId.Trim();
            name = name.Trim();

            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId),
                Builders<Product>.Filter.Regex(p => p.ProductName, new BsonRegularExpression(name, "i")),
                Builders<Product>.Filter.Eq(p => p.IsActive, true)
            );

            return await _products.Find(filter).ToListAsync();
        }

        // ✅ Search by Price Range

        public async Task<List<Product>> SearchByPriceAsync(string distributorId, decimal? minPrice, decimal? maxPrice)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(distributorId))
                    return new List<Product>();

                distributorId = distributorId.Trim();

                // 🧠 Base filter — match distributor and active products
                var filters = new List<FilterDefinition<Product>>
        {
            Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId),
            Builders<Product>.Filter.Eq(p => p.IsActive, true)
        };

                // 🧮 Add price range filters dynamically
                if (minPrice.HasValue && maxPrice.HasValue)
                {
                    filters.Add(Builders<Product>.Filter.And(
                        Builders<Product>.Filter.Gte(p => p.Price, minPrice.Value),
                        Builders<Product>.Filter.Lte(p => p.Price, maxPrice.Value)
                    ));
                }
                else if (minPrice.HasValue)
                {
                    filters.Add(Builders<Product>.Filter.Gte(p => p.Price, minPrice.Value));
                }
                else if (maxPrice.HasValue)
                {
                    filters.Add(Builders<Product>.Filter.Lte(p => p.Price, maxPrice.Value));
                }

                // ✅ Combine all filters
                var finalFilter = Builders<Product>.Filter.And(filters);

                var results = await _products.Find(finalFilter).ToListAsync();

                // 🔍 Debug logs (optional — check in your console)
                Console.WriteLine($"[DEBUG] DistributorId: {distributorId}, MinPrice: {minPrice}, MaxPrice: {maxPrice}, Results: {results.Count}");

                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] SearchByPriceAsync failed: {ex.Message}");
                return new List<Product>();
            }
        }

        // ✅ Search by Color (case-insensitive)
        public async Task<List<Product>> SearchByColorAsync(string distributorId, string color)
        {
            if (string.IsNullOrWhiteSpace(distributorId) || string.IsNullOrWhiteSpace(color))
                return new List<Product>();

            color = color.Trim();

            // Case-insensitive match using Regex
            var colorFilter = Builders<Product>.Filter.Regex(
                p => p.Color,
                new BsonRegularExpression(color, "i")
            );

            var distributorFilter = Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId);
            var isActiveFilter = Builders<Product>.Filter.Eq(p => p.IsActive, true);

            var filter = Builders<Product>.Filter.And(distributorFilter, colorFilter, isActiveFilter);

            return await _products.Find(filter).ToListAsync();
        }

        public async Task<List<Product>> GetAllActiveAsync()
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(p => p.IsActive, true),
                Builders<Product>.Filter.Or(
                    Builders<Product>.Filter.Eq(p => p.IsDeleted, false),
                    Builders<Product>.Filter.Exists(p => p.IsDeleted, false)
                )
            );

            return await _products.Find(filter).ToListAsync();
        }


        // ✅ (Optional) Search by Product Quality Details
        //public async Task<List<Product>> SearchByQualityAsync(string distributorId, string? qualityGrade, string? originCountry, string? certification)
        //{
        //    var filters = new List<FilterDefinition<Product>>
        //    {
        //        Builders<Product>.Filter.Eq(p => p.DistributorId, distributorId),
        //        Builders<Product>.Filter.Eq(p => p.IsActive, true)
        //    };

        //    if (!string.IsNullOrEmpty(qualityGrade))
        //        filters.Add(Builders<Product>.Filter.Eq(p => p.QualityGrade, qualityGrade));

        //    if (!string.IsNullOrEmpty(originCountry))
        //        filters.Add(Builders<Product>.Filter.Eq(p => p.OriginCountry, originCountry));

        //    if (!string.IsNullOrEmpty(certification))
        //        filters.Add(Builders<Product>.Filter.Eq(p => p.Certification, certification));

        //    var filter = Builders<Product>.Filter.And(filters);
        //    return await _products.Find(filter).ToListAsync();



        //public async Task<bool> IncreaseStockAsync(string productId, int quantity)
        //{
        //    if (quantity <= 0)
        //        return false;

        //    var filter = Builders<Product>.Filter.Eq(p => p.ProductId, productId);

        //    var update = Builders<Product>.Update
        //        .Inc(p => p.Stock, quantity)
        //        .Set(p => p.UpdatedDate, DateTime.UtcNow);

        //    var result = await _products.UpdateOneAsync(filter, update);

        //    return result.ModifiedCount > 0;
        //}


    }
}

