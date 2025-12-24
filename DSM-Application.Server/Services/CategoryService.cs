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
        private readonly HsnService _hsnService;

        public CategoryService(MongoDbService db, HsnService hsnService)
        {
            _categories = db.Categories;
            _distMap = db.DistributorCategoryMaps;
            _hsnService = hsnService;
        }

        public async Task<List<Category>> GetAllAsync()
            => await _categories.Find(c => c.IsActive).SortBy(c => c.SortOrder).ToListAsync();

        public async Task<Category?> GetByIdAsync(string id)
            => await _categories.Find(c => c.CategoryId == id && c.IsActive).FirstOrDefaultAsync();
        public async Task<Category?> GetByNameAsync(string name)
        {
            return await _categories
                .Find(c => c.Name.ToLower() == name.ToLower() && c.IsActive)
                .FirstOrDefaultAsync();
        }


        public async Task<Category> CreateAsync(CategoryCreateDto dto)
        {
            decimal gst = 0;

            Console.WriteLine("DEBUG: ParentId = " + dto.ParentId);
            Console.WriteLine("DEBUG: HSN = " + dto.HsnCode);

            // Subcategory → must apply HSN GST
            if (!string.IsNullOrWhiteSpace(dto.ParentId) &&
                !string.IsNullOrWhiteSpace(dto.HsnCode))
            {
                var hsn = await _hsnService.GetByCodeAsync(dto.HsnCode);

                if (hsn != null)
                {
                    gst = hsn.Gst;

                    Console.WriteLine("DEBUG GST FOUND = " + gst);
                }
                else
                {
                    Console.WriteLine("DEBUG: HSN not found");
                }
            }

            var category = new Category
            {
                Name = dto.Name,
                //ParentId = dto.ParentId,
                HsnCode = dto.HsnCode,
                GST = gst,

                Attributes = dto.Attributes ?? new(),
                IconUrl = dto.IconUrl,
                SortOrder = dto.SortOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Save GST history
            if (gst > 0)
            {
                category.GstHistory.Add(new GstHistory
                {
                    Rate = gst,
                    EffectiveFrom = DateTime.UtcNow
                });
            }

            await _categories.InsertOneAsync(category);
            return category;
        }

        public async Task UpdateAsync(string id, CategoryUpdateDto dto)
        {
            decimal gst = 0;

            // Only subcategories can have GST
            if (!string.IsNullOrWhiteSpace(dto.ParentId) && !string.IsNullOrWhiteSpace(dto.HsnCode))
            {
                var hsn = await _hsnService.GetByCodeAsync(dto.HsnCode);
                if (hsn != null)
                    gst = hsn.Gst;
            }

            var update = Builders<Category>.Update
                .Set(c => c.Name, dto.Name)
                //.Set(c => c.ParentId, dto.ParentId)
                .Set(c => c.HsnCode, dto.HsnCode)
                .Set(c => c.GST, gst)
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
        public async Task<List<Category>> GetMainCategoriesAsync()
        {
            return await _categories.Find(c => c.ParentId == null && c.IsActive).ToListAsync();
        }
        //public async Task<List<Category>> GetSubCategoriesAsync(string parentId)
        //{
        //    return await _categories.Find(c => c.ParentId == parentId && c.IsActive).ToListAsync();
        //}



    }
}

