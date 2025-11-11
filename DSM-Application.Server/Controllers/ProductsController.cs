using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Data;

namespace DSM_Application.Server.Controllers
{
    [Authorize(Roles = "Distributor")]
    //[AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]

    public class ProductsController : ControllerBase
    {
        private readonly ProductService _productService;

        public ProductsController(ProductService productService)
        {
            _productService = productService;
        }

        //[Authorize(Roles = "Distributor")]
        //[HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // ✅ Extract distributor ID from token
            var distributorId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))
                return Unauthorized("DistributorId not found in token");

            // ✅ Fetch only that distributor’s active products
            var products = await _productService.GetAllByDistributorAsync(distributorId);

            if (products == null || products.Count == 0)
                return NotFound("No products available for this distributor.");

            return Ok(products);
        }


        //[HttpGet]
        //public async Task<IActionResult> GetAll([FromQuery] string? distributorId = null)
        //{
        //    if (!string.IsNullOrEmpty(distributorId))
        //    {
        //        // ✅ Distributor-specific products
        //        var products = await _productService.GetAllByDistributorAsync(distributorId);
        //        return Ok(products);
        //    }

        //    // ✅ If no distributorId — return all active products
        //    var allProducts = await _productService.GetAllActiveAsync();
        //    return Ok(allProducts);
        //}

        ////[AllowAnonymous]
        //[HttpGet]
        //public async Task<IActionResult> GetAll([FromQuery] string distributorId)
        //{
        //    var products = await _productService.GetAllByDistributorAsync(distributorId);
        //    if (products == null || products.Count == 0)
        //        return NotFound("Distributor not found or no products available.");

        //    return Ok(products);
        //}

        //[HttpGet]
        //public async Task<IActionResult> GetAll()
        //{
        //    var distributorId = User.FindFirst("DistributorId")?.Value;
        //    if (string.IsNullOrEmpty(distributorId))
        //        return Unauthorized("Distributor not found");

        //    var products = await _productService.GetAllByDistributorAsync(distributorId);
        //    return Ok(products);
        //}

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] ProductCreateDto dto)
        {
            if (string.IsNullOrEmpty(dto.DistributorId))
                return BadRequest("DistributorId is missing from request");
            // ✅ Validate category
            var distributor = await _productService.GetDistributorByIdAsync(dto.DistributorId);
            if (distributor == null)
                return NotFound("Distributor not found");

            if (string.IsNullOrWhiteSpace(dto.Category) ||
                distributor.Categories == null ||
                !distributor.Categories.Contains(dto.Category))
            {
                return BadRequest($"Category '{dto.Category}' is not available for this distributor.");
            }

            if (dto.Image != null)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Image.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Image.CopyToAsync(stream);
                }

                dto.ImageUrl = $"/uploads/{fileName}";
            }

            var product = new Product
            {
                ProductName = dto.ProductName,
                ProductCode = dto.ProductCode,
                Description = dto.Description,
                Unit = dto.Unit,
                Price = dto.Price,
                CostPrice = dto.CostPrice,
                Discount = dto.Discount,
                GST = dto.GST,
                Stock = dto.Stock,
                ReorderLevel = dto.ReorderLevel,
                Brand = dto.Brand,
                ImageUrl = dto.ImageUrl,
                DistributorId = dto.DistributorId,
                DistributorName = distributor.Name,
                Category = dto.Category,
                IsActive = true,        // ✅ must be true when creating
                IsDeleted = false       // ✅ must be false when creating
            };

            var created = await _productService.CreateAsync(product);

            return Ok(created);

            //var product = new Product
            //{
            //    ProductName = dto.ProductName,
            //    ProductCode = dto.ProductCode,
            //    Description = dto.Description,
            //    Unit = dto.Unit,
            //    Price = dto.Price,
            //    CostPrice = dto.CostPrice,
            //    Discount = dto.Discount,
            //    GST = dto.GST,
            //    Stock = dto.Stock,
            //    ReorderLevel = dto.ReorderLevel,
            //    Brand = dto.Brand,
            //    ImageUrl = dto.ImageUrl,
            //      DistributorId = dto.DistributorId ,
            //    DistributorName = distributor.Name,
            //    //Name =distributor.Name,
            //    Category = dto.Category // ✅ store selected category
            //};

        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromForm] ProductCreateDto dto)
        {
            var existing = await _productService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            if (dto.Image != null)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = Guid.NewGuid() + Path.GetExtension(dto.Image.FileName);
                var filePath = Path.Combine
                    (uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Image.CopyToAsync(stream);
                }

                existing.ImageUrl = $"/uploads/{fileName}";
            }

            // Update fields
            existing.ProductName = dto.ProductName;
            existing.ProductCode = dto.ProductCode;
            existing.Description = dto.Description;
            existing.Unit = dto.Unit;
            existing.Price = dto.Price;
            existing.CostPrice = dto.CostPrice;
            existing.Discount = dto.Discount;
            existing.GST = dto.GST;
            existing.Stock = dto.Stock;
            existing.ReorderLevel = dto.ReorderLevel;
            existing.Brand = dto.Brand;
            existing.Category = dto.Category; // ✅ update category

            await _productService.UpdateAsync(id, existing);

            return NoContent();
        }
        [AllowAnonymous]
        [HttpGet("distributor/{distributorId}/categories")]
        public async Task<IActionResult> GetCategoriesByDistributor(string distributorId)
        {
            var categories = await _productService.GetCategoriesByDistributorAsync(distributorId);
            return Ok(categories);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _productService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            await _productService.DeleteAsync(id);
            return NoContent();
        }


        [AllowAnonymous]
        [HttpGet("distributor/{distributorId}")]
        public async Task<IActionResult> GetProductsByDistributorAsync(string distributorId)
        {
            try
            {
                var products = await _productService.GetProductsByDistributorAsync(distributorId);
                return Ok(products); // always return list, even if empty
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching products", error = ex.Message });
            }
        }

        // 🔍 SEARCH APIs ---------------------------------------------------

        // ✅ Search by Category
        [AllowAnonymous]
        [HttpGet("search/category")]
        public async Task<IActionResult> SearchByCategory([FromQuery] string distributorId, [FromQuery] string category)
        {
            var products = await _productService.SearchByCategoryAsync(distributorId, category);
            return Ok(products);
        }

        // ✅ Search by Product Name
        [AllowAnonymous]
        [HttpGet("search/name")]
        public async Task<IActionResult> SearchByName([FromQuery] string distributorId, [FromQuery] string name)
        {
            var products = await _productService.SearchByNameAsync(distributorId, name);
            return Ok(products);
        }

        // ✅ Search by Price Range
        [AllowAnonymous]
        [HttpGet("search/price")]
        public async Task<IActionResult> SearchByPrice([FromQuery] string distributorId, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice)
        {
            var products = await _productService.SearchByPriceAsync(distributorId, minPrice, maxPrice);
            return Ok(products);
        }


        [AllowAnonymous]
        [HttpGet("search/color")]
        public async Task<IActionResult> SearchByColor(
    [FromQuery] string distributorId,
    [FromQuery] string color)
        {
            var products = await _productService.SearchByColorAsync(distributorId, color);
            return Ok(products);
        }


        // ✅ (Optional) Search by Quality filters
        //[HttpGet("search/quality")]
        //public async Task<IActionResult> SearchByQuality(
        //    [FromQuery] string distributorId,
        //    [FromQuery] string? qualityGrade,
        //    [FromQuery] string? originCountry,
        //    [FromQuery] string? certification)
        //{
        //    var products = await _productService.SearchByQualityAsync(distributorId, qualityGrade, originCountry, certification);
        //    return Ok(products);
        //}


    }
}
