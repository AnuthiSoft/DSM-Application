using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class CategoryService
    {
        private readonly IMongoCollection<Category> _categories;
        private readonly IMongoCollection<DistributorCategoryMap> _distMap;

        public CategoryService(MongoDbService db)
        {
            _categories = db.Categories;
            _distMap = db.DistributorCategoryMaps;
        }

        public async Task<List<Category>> GetAllAsync()
            => await _categories.Find(c => c.IsActive).SortBy(c => c.SortOrder).ToListAsync();

        public async Task<Category?> GetByIdAsync(string id)
            => await _categories.Find(c => c.CategoryId == id && c.IsActive).FirstOrDefaultAsync();

        public async Task<Category> CreateAsync(CategoryCreateDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                ParentId = dto.ParentId,
                GST = dto.GST,
                Attributes = dto.Attributes ?? new(),
                IconUrl = dto.IconUrl,
                SortOrder = dto.SortOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _categories.InsertOneAsync(category);
            return category;
        }

        public async Task UpdateAsync(string id, CategoryUpdateDto dto)
        {
            var update = Builders<Category>.Update
                .Set(c => c.Name, dto.Name)
                .Set(c => c.ParentId, dto.ParentId)
                .Set(c => c.GST, dto.GST)
                .Set(c => c.Attributes, dto.Attributes ?? new())
                .Set(c => c.IconUrl, dto.IconUrl)
                .Set(c => c.SortOrder, dto.SortOrder)
                .Set(c => c.UpdatedAt, DateTime.UtcNow);

            await _categories.UpdateOneAsync(c => c.CategoryId == id, update);
        }

        public async Task DeleteAsync(string id)
        {
            var update = Builders<Category>.Update.Set(c => c.IsActive, false).Set(c => c.UpdatedAt, DateTime.UtcNow);
            await _categories.UpdateOneAsync(c => c.CategoryId == id, update);
        }

        // Distributor mapping
        public async Task SetDistributorCategoriesAsync(string distributorId, List<string> categoryIds)
        {
            var existing = await _distMap.Find(d => d.DistributorId == distributorId).FirstOrDefaultAsync();
            if (existing == null)
            {
                var map = new DistributorCategoryMap
                {
                    DistributorId = distributorId,
                    CategoryIds = categoryIds,
                    UpdatedAt = DateTime.UtcNow
                };
                await _distMap.InsertOneAsync(map);
            }
            else
            {
                var update = Builders<DistributorCategoryMap>.Update.Set(d => d.CategoryIds, categoryIds).Set(d => d.UpdatedAt, DateTime.UtcNow);
                await _distMap.UpdateOneAsync(d => d.DistributorId == distributorId, update);
            }
        }

        public async Task<List<string>> GetCategoriesForDistributorAsync(string distributorId)
        {
            var map = await _distMap.Find(d => d.DistributorId == distributorId).FirstOrDefaultAsync();
            return map?.CategoryIds ?? new List<string>();
        }

        // Utility: get category names
        public async Task<Dictionary<string, string>> GetCategoryNamesAsync(IEnumerable<string> ids)
        {
            var filter = Builders<Category>.Filter.In(c => c.CategoryId, ids);
            var cats = await _categories.Find(filter).ToListAsync();
            return cats.ToDictionary(c => c.CategoryId, c => c.Name);
        }
    }
}

