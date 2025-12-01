using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly MongoDbService _db;

        public CategoriesController(MongoDbService db)
        {
            _db = db;
        }

        // 1) Get ONLY approved categories (used in dropdowns)
        [HttpGet]
        public async Task<IActionResult> GetApprovedCategories()
        {
            var list = await _db.Categories
                .Find(c => c.IsApproved)
                .ToListAsync();

            return Ok(list);
        }

        // 2) Distributor creates Category (Pending approval)
        [Authorize(Roles = "Distributor")]
        [HttpPost("create-category")]
        public async Task<IActionResult> DistributorCreateCategory([FromBody] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Category name required");

            var exists = await _db.Categories.Find(c => c.Name == name).AnyAsync();
            if (exists)
                return BadRequest("Category already exists");

            var distributorId = User.FindFirst("DistributorId")?.Value;

            var newCategory = new Category
            {
                Name = name.Trim(),
                IsApproved = false,
                CreatedByDistributorId = distributorId
            };

            await _db.Categories.InsertOneAsync(newCategory);
            return Ok(new { message = "Category request sent to admin for approval" });
        }

        // 3) Admin approves category
        [Authorize(Roles = "Admin")]
        [HttpPut("approve-category")]
        public async Task<IActionResult> ApproveCategory([FromBody] string categoryName)
        {
            var cat = await _db.Categories.Find(c => c.Name == categoryName).FirstOrDefaultAsync();
            if (cat == null)
                return NotFound("Category not found");

            var update = Builders<Category>.Update.Set(c => c.IsApproved, true);
            await _db.Categories.UpdateOneAsync(c => c.Id == cat.Id, update);

            return Ok(new { message = "Category approved successfully" });
        }

        // 4) Distributor creates SubCategory (NO approval)
        [Authorize(Roles = "Distributor")]
        [HttpPost("create-sub")]
        public async Task<IActionResult> CreateSubCategory([FromBody] CreateSubCategoryDto dto)
        {
            var cat = await _db.Categories.Find(c => c.Name == dto.CategoryName).FirstOrDefaultAsync();
            if (cat == null)
                return NotFound("Category not found");

            if (!cat.IsApproved)
                return BadRequest("Category is not approved by admin");

            if (cat.SubCategories.Any(sc => sc.Name == dto.SubCategoryName))
                return BadRequest("Subcategory already exists");

            cat.SubCategories.Add(new SubCategory
            {
                Name = dto.SubCategoryName.Trim()
            });

            var update = Builders<Category>.Update.Set(c => c.SubCategories, cat.SubCategories);
            await _db.Categories.UpdateOneAsync(c => c.Id == cat.Id, update);

            return Ok(new { message = "SubCategory added successfully" });
        }

        // 5) Distributor creates Item (NO approval)
        [Authorize(Roles = "Distributor")]
        [HttpPost("create-item")]
        public async Task<IActionResult> CreateItem([FromBody] CreateItemDto dto)
        {
            // 1) Find Category
            var cat = await _db.Categories.Find(c => c.Name == dto.CategoryName).FirstOrDefaultAsync();
            if (cat == null)
                return NotFound("Category not found");

            if (!cat.IsApproved)
                return BadRequest("Category not approved by admin");

            // 2) Find SubCategory
            var sub = cat.SubCategories.FirstOrDefault(s => s.Name == dto.SubCategoryName);
            if (sub == null)
                return NotFound("SubCategory not found");

            // 3) Check existing ItemType
            if (sub.ItemTypes.Any(i => i.Name == dto.ItemName))
                return BadRequest("Item already exists");

            // ⭐⭐⭐ 4) AUTO GST USING HSN LOOKUP ⭐⭐⭐
            var gstItem = await _db.GstMaster
                .Find(x => x.Hsn == dto.Hsn)
                .FirstOrDefaultAsync();

            if (gstItem == null)
                return BadRequest("Invalid HSN — GST not found");

            // 5) Add item with auto GST
            sub.ItemTypes.Add(new ItemType
            {
                Name = dto.ItemName.Trim(),
                GstPercent = gstItem.Gst    // ⭐ Auto Apply GST
            });

            // 6) Update DB
            var update = Builders<Category>.Update.Set(c => c.SubCategories, cat.SubCategories);
            await _db.Categories.UpdateOneAsync(c => c.Id == cat.Id, update);

            return Ok(new { message = "Item added successfully" });
        }


        // 6) GST Lookup
        [HttpGet("gst")]
        public async Task<IActionResult> GetGst(
            [FromQuery] string category,
            [FromQuery] string sub,
            [FromQuery] string item)
        {
            var cat = await _db.Categories.Find(c => c.Name == category).FirstOrDefaultAsync();
            if (cat == null) return NotFound("Category not found");

            if (!cat.IsApproved)
                return BadRequest("Category not approved by admin");

            var subCat = cat.SubCategories.FirstOrDefault(s => s.Name == sub);
            if (subCat == null) return NotFound("SubCategory not found");

            var it = subCat.ItemTypes.FirstOrDefault(i => i.Name == item);
            if (it == null) return NotFound("Item not found");

            return Ok(new { gstPercent = it.GstPercent });
        }


        [HttpGet("{categoryName}/subcategories")]
        public async Task<IActionResult> GetSubCategories(string categoryName)
        {
            var category = await _db.Categories
                .Find(c => c.Name == categoryName && c.IsApproved)
                .FirstOrDefaultAsync();

            if (category == null)
                return NotFound("Category not found or not approved");

            return Ok(category.SubCategories);
        }


        [HttpGet("{categoryName}/{subName}/itemtypes")]
        public async Task<IActionResult> GetItemTypes(string categoryName, string subName)
        {
            var category = await _db.Categories
                .Find(c => c.Name == categoryName && c.IsApproved)
                .FirstOrDefaultAsync();

            if (category == null)
                return NotFound("Category not found or not approved");

            var sub = category.SubCategories.FirstOrDefault(x => x.Name == subName);

            if (sub == null)
                return NotFound("Subcategory not found");

            return Ok(sub.ItemTypes);
        }








        [HttpPost("seed")]
        public async Task<IActionResult> SeedCategories()
        {
            var data = new List<Category>
    {
        new Category
        {
            Name = "Electronics",
            IsApproved = true,
            SubCategories = new List<SubCategory>
            {
                new SubCategory
                {
                    Name = "Mobile",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "Samsung", GstPercent = 18 },
                        new ItemType { Name = "Apple", GstPercent = 18 },
                        new ItemType { Name = "OnePlus", GstPercent = 18 }
                    }
                },
                new SubCategory
                {
                    Name = "Television",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "LG", GstPercent = 18 },
                        new ItemType { Name = "Sony", GstPercent = 18 },
                        new ItemType { Name = "Samsung TV", GstPercent = 18 }
                    }
                }
            }
        },

        new Category
        {
            Name = "Groceries",
            IsApproved = true,
            SubCategories = new List<SubCategory>
            {
                new SubCategory
                {
                    Name = "Dairy",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "Milk", GstPercent = 5 },
                        new ItemType { Name = "Paneer", GstPercent = 5 },
                        new ItemType { Name = "Cheese", GstPercent = 5 }
                    }
                },
                new SubCategory
                {
                    Name = "Spices",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "Turmeric", GstPercent = 5 },
                        new ItemType { Name = "Chilli Powder", GstPercent = 5 }
                    }
                }
            }
        },

        new Category
        {
            Name = "Beauty",
            IsApproved = true,
            SubCategories = new List<SubCategory>
            {
                new SubCategory
                {
                    Name = "Skin Care",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "Moisturizer", GstPercent = 18 },
                        new ItemType { Name = "Face Cream", GstPercent = 18 }
                    }
                },
                new SubCategory
                {
                    Name = "Hair Care",
                    ItemTypes = new List<ItemType>
                    {
                        new ItemType { Name = "Shampoo", GstPercent = 18 },
                        new ItemType { Name = "Conditioner", GstPercent = 18 }
                    }
                }
            }
        }
    };

            await _db.Categories.InsertManyAsync(data);

            return Ok("Sample categories seeded successfully!");
        }

    }

}
