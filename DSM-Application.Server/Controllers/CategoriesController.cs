using Microsoft.AspNetCore.Mvc;
using DSM_Application.Server.Services;
using DSM_Application.Server.Models.DTOs;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly CategoryService _categoryService;
        public CategoriesController(CategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cats = await _categoryService.GetAllAsync();
            return Ok(cats);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var cat = await _categoryService.GetByIdAsync(id);
            if (cat == null) return NotFound();
            return Ok(cat);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name required");
            var created = await _categoryService.CreateAsync(dto);
            return Ok(created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] CategoryUpdateDto dto)
        {
            var existing = await _categoryService.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _categoryService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _categoryService.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _categoryService.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("distributor/{distributorId}")]
        public async Task<IActionResult> SetDistributorCategories(string distributorId, [FromBody] List<string> categoryIds)
        {
            await _categoryService.SetDistributorCategoriesAsync(distributorId, categoryIds);
            return NoContent();
        }

        [HttpGet("distributor/{distributorId}")]
        public async Task<IActionResult> GetDistributorCategories(string distributorId)
        {
            var ids = await _categoryService.GetCategoriesForDistributorAsync(distributorId);
            return Ok(ids);
        }
    }
}
