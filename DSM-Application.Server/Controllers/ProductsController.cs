using System.Data;
using System.Drawing;
using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    //[Authorize(Roles = "Distributor")]
    //[AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]

    public class ProductsController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly CategoryService _categoryService;

        public ProductsController(ProductService productService, CategoryService categoryService)
        {
            _productService = productService;
            _categoryService = categoryService;
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

        [HttpGet("{id:length(24)}")]
        public async Task<IActionResult> GetById(string id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] ProductCreateDto dto)
        {
            var distributor = await _productService.GetDistributorByIdAsync(dto.DistributorId);
            if (distributor == null)
                return NotFound("Distributor not found");

            var imageUrls = new List<string>();

            if (dto.Images != null && dto.Images.Any())
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                foreach (var file in dto.Images)
                {
                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    imageUrls.Add("/uploads/" + fileName);
                }
            }
            var subCategory = await _categoryService.GetByIdAsync(dto.Category);
            decimal gst = subCategory?.GST ?? 0;
            var product = new Product
            {
                ProductName = dto.ProductName,
                ProductCode = dto.ProductCode,
                Description = dto.Description,
                Measure = dto.Measure,
                Price = dto.Price,
                CostPrice = dto.CostPrice,
                Discount = dto.Discount,
                GST = gst,
                Stock = dto.Stock,
                ReorderLevel = dto.ReorderLevel,
                Brand = dto.Brand,
                DistributorId = dto.DistributorId,
                DistributorName = distributor.Name,
                Category = dto.Category,
                Color = dto.Color,

                // MULTIPLE IMAGES
                ImageUrls = imageUrls,

                IsActive = true,
                IsDeleted = false
            };

            var created = await _productService.CreateAsync(product);

            return Ok(created);
        }


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


        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromForm] ProductCreateDto dto)
        {
            var existing = await _productService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
            Directory.CreateDirectory(uploadsFolder);

            // ⭐ 1. If user uploaded new images → replace
            if (dto.Images != null && dto.Images.Any())
            {
                var newUrls = new List<string>();

                foreach (var file in dto.Images)
                {
                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    newUrls.Add("/uploads/" + fileName);
                }

                existing.ImageUrls = newUrls;
            }
            else
            {
                // ⭐ 2. KEEP OLD IMAGES when user does not upload new ones
                existing.ImageUrls = existing.ImageUrls ?? new List<string>();
            }
            var subCategory = await _categoryService.GetByIdAsync(dto.Category);
            existing.GST = subCategory?.GST ?? existing.GST;
            // ⭐ 3. Update fields
            existing.ProductName = dto.ProductName;
            existing.ProductCode = dto.ProductCode;
            existing.Description = dto.Description;
            existing.Measure = dto.Measure;
            existing.Price = dto.Price;
            existing.CostPrice = dto.CostPrice;
            existing.Discount = dto.Discount;
            existing.GST = existing.GST;
            existing.Stock = dto.Stock;
            existing.ReorderLevel = dto.ReorderLevel;
            existing.Brand = dto.Brand;
            existing.Category = dto.Category;
            existing.Color = dto.Color;
            existing.UpdatedDate = DateTime.UtcNow;

            await _productService.UpdateAsync(id, existing);

            // ⭐ 4. Return updated product with imageUrls
            return Ok(existing);
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
        [HttpGet("measures")]
        public IActionResult GetMeasures()
        {
            var measures = new List<string>
    {
        "Piece (pcs)",
        "Kilogram (kg)",
        "Gram (g)",
        "Litre (L)",
        "Millilitre (ml)",
        "Pack",
        "Dozen (12 pcs)",
        "Box",
        "Bottle",
        "Bag",
        "Meter (m)",
        "Centimeter (cm)"
    };

            return Ok(measures);
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


