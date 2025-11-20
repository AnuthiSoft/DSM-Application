using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models.DTOs
{
    [BsonIgnoreExtraElements]
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
        [Required]
        public string DistributorId { get; set; }

        public string Color { get; set; }
        //[BsonElement("Name")]
        //public string Name { get; set; }

        // ✅ Added Quality Standards
        public string? QualityGrade { get; set; }
        public string? OriginCountry { get; set; }
        public string? MaterialType { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Certification { get; set; }
        //public string? Color { get; set; }
        public string? SizeOrWeight { get; set; }


    }
}
