using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly IMongoCollection<Category> _categories;
        private readonly MongoDbService _mongo;

        public CategoriesController(MongoDbService mongo)
        {
            _mongo = mongo;
            _categories = _mongo.Categories;
        }

        [HttpGet("main")]
        public async Task<IActionResult> GetMainCategories()
        {
            var data = await _categories
                .Find(x => x.ParentId == null)
                .ToListAsync();

            var result = data.Select(c => new CategoryReadDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,           // 👈 THIS WAS MISSING
                ParentId = null,
                HsnCode = c.HsnCode
            });

            return Ok(result);
        }
        [HttpGet("sub/{parentId}")]
        public async Task<IActionResult> GetSubCategories(string parentId)
        {
            parentId = parentId.Trim();

            if (!ObjectId.TryParse(parentId, out var parentObjectId))
                return BadRequest("Invalid parentId");

            var data = await _categories
                .Find(c => c.ParentId == parentObjectId)
                .ToListAsync();

            var result = data.Select(c => new CategoryReadDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                ParentId = c.ParentId, // ✅ IMPORTANT
                HsnCode = c.HsnCode                      // ✅ THIS FIXES NULL
            });

            return Ok(result);
        }



        [HttpGet("gst/{hsnCode}")]
        public async Task<IActionResult> GetGstByHsn(string hsnCode)
        {
            var hsn = await _mongo.HsnCodes
                .Find(x => x.HsnCode == hsnCode)
                .FirstOrDefaultAsync();

            if (hsn == null)
                return NotFound("HSN not found");

            return Ok(hsn.Gst);
        }

    }
}
