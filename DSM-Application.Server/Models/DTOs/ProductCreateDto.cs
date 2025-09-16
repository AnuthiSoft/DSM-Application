using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models.DTOs
{
    public class ProductCreateDto
    {

        public string ProductName { get; set; }
        public string ProductCode { get; set; }
        //public string? Category { get; set; } // ✅ add this
        public string Category { get; set; } // <-- must match FormData key
        public string Description { get; set; }
        public string Unit { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal GST { get; set; }
        public int Stock { get; set; }
        public int ReorderLevel { get; set; }
        public string Brand { get; set; }
        public IFormFile? Image { get; set; } // <-- File must be IFormFile
        public string? ImageUrl { get; set; }
        
        public string DistributorId { get; set; }
    }
}
