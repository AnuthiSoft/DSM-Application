using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Product
    {
        [BsonId] // MongoDB will auto-generate this
        [BsonRepresentation(BsonType.ObjectId)]
        public string? ProductId { get; set; }  // Unique Product ID

        [BsonElement("ProductName")]
        public string ProductName { get; set; }
        [BsonElement("DistributorId")]
        [Required]
        public string DistributorId { get; set; } // Logged-in distributor ID
                                                  //[BsonElement("Name")]
                                                  //public string Name { get; set; }
                                                  // ✅ Add this property
        public string DistributorName { get; set; } = string.Empty;



        [BsonElement("ProductCode")]
        public string ProductCode { get; set; } // SKU or unique code
        [BsonElement("CategoryId")]
        public string? CategoryId { get; set; }
        [BsonElement("Category" +
            "" +
            "" +
            "" +
            "")]
        public string Category { get; set; } // store name for quick display



        [BsonElement("Description")]
        public string Description { get; set; }

        [BsonElement("Unit")]
        public string Unit { get; set; } // e.g., pcs, kg, liter

        [BsonElement("Price")]
        public decimal Price { get; set; } // Selling price / MRP

        [BsonElement("CostPrice")]
        public decimal CostPrice { get; set; } // Purchase price for distributor

        [BsonElement("Discount")]
        public decimal? Discount { get; set; } // Optional default discount

        [BsonElement("GST")]
        public decimal GST { get; set; } // Tax rate percentage

        [BsonElement("Stock")]
        public int Stock { get; set; } // Current quantity in stock

        [BsonElement("ReorderLevel")]
        public int ReorderLevel { get; set; } // Minimum stock level

        [BsonElement("IsActive")]
        public bool IsActive { get; set; } = true; // Active or discontinued

        [BsonElement("CreatedDate")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedDate")]
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("CreatedBy")]
        public string? CreatedBy { get; set; }

        [BsonElement("UpdatedBy")]
        public string? UpdatedBy { get; set; }

        // Optional fields
        [BsonElement("Brand")]
        public string Brand { get; set; }

        [BsonElement("ImageUrl")]
        public string ImageUrl { get; set; }

        // ✅ Added Real-Time Product Standard Qualities
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

        [BsonElement("Color")]
        public string? Color { get; set; }

        [BsonElement("SizeOrWeight")]
        public string? SizeOrWeight { get; set; }

        [BsonElement("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

    }
}
