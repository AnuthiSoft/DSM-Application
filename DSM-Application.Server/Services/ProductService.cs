using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class ProductService
    {
        private readonly IMongoCollection<Product> _products;
        private readonly IMongoCollection<Distributor> _distributors;

        public ProductService(MongoDbService db)
        {
            _products = db.Products;
            _distributors = db.Distributors;
        }

        // Get all active products
        public async Task<List<Product>> GetAllByDistributorAsync(string distributorId)
        {
            // _products is already IMongoCollection<Product>
            return await _products
                .Find(p => p.DistributorId == distributorId)
                .ToListAsync();
        }


        // Get by ID
        public async Task<Product> GetByIdAsync(string id)
        {
            return await _products.Find(p => p.ProductId == id).FirstOrDefaultAsync();
        }

        // Create product
        public async Task<Product> CreateAsync(Product product)
        {
            product.CreatedDate = DateTime.UtcNow;
            product.UpdatedDate = DateTime.UtcNow;
            await _products.InsertOneAsync(product);
            return product;
        }

        // Update product
        public async Task UpdateAsync(string id, Product product)
        {
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
    }
}
