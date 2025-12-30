using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Product
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? ProductId { get; set; }

        // ✅ KEEP ONLY THIS - final correct image list property
        [BsonElement("ImageUrls")]
        public List<string> ImageUrls { get; set; } = new List<string>();

        [BsonElement("ProductName")]
        public string ProductName { get; set; }

        [BsonElement("DistributorId")]
        [Required]
        public string DistributorId { get; set; }

        public string DistributorName { get; set; } = string.Empty;

        [BsonElement("ProductCode")]
        public string ProductCode { get; set; }

        [BsonElement("CategoryId")]
        public string? CategoryId { get; set; }

        [BsonElement("Category")]
        public string Category { get; set; }

        [BsonElement("Description")]
        public string Description { get; set; }

        [BsonElement("Measure")]
        public string Measure { get; set; } // e.g., pcs, kg, liter

        [BsonElement("Price")]
        public decimal Price { get; set; }

        [BsonElement("CostPrice")]
        public decimal? CostPrice { get; set; }

        [BsonElement("Discount")]
        public decimal? Discount { get; set; }

        [BsonElement("GST")]
        public decimal GST { get; set; }

        //[BsonElement("Stock")]
        //public int Stock { get; set; }

        [BsonElement("Color")]
        public string Color { get; set; }

        [BsonElement("ReorderLevel")]
        public int ReorderLevel { get; set; }

        [BsonElement("IsActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("CreatedDate")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedDate")]
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("CreatedBy")]
        public string? CreatedBy { get; set; }

        [BsonElement("UpdatedBy")]
        public string? UpdatedBy { get; set; }

        [BsonElement("Brand")]
        public string Brand { get; set; }

        // ⭐ Optional fields
        [BsonElement("QualityGrade")]
        public string? QualityGrade { get; set; }

        [BsonElement("OriginCountry")]
        public string? OriginCountry { get; set; }

        [BsonElement("MaterialType")]
        public string? MaterialType { get; set; }

        [BsonElement("ManufactureDate")]
        public DateTime? ManufactureDate { get; set; }

        [BsonElement("ExpiryDate")]
        public DateTime? ExpiryDate { get; set; }

        [BsonElement("Certification")]
        public string? Certification { get; set; }

        [BsonElement("SizeOrWeight")]
        public string? SizeOrWeight { get; set; }

        [BsonElement("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        // inside Product class
        public int? LeadTimeDays { get; set; } = 1; // nullable, default 1

    }
}
