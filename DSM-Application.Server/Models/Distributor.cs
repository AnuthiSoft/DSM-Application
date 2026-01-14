using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace DistributorManagementSystem.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Distributor
    {
        [BsonId]
         [BsonRepresentation(BsonType.ObjectId)]
        public string? DistributorId { get; set; } = string.Empty;
        [BsonElement("CompanyName")]
        public string CompanyName { get; set; } = string.Empty;
        public string GST { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty; // Primary contact name
        [Required]
        [EmailAddress]
        [StringLength(254)]
        public string Email { get; set; } // Primary contact email
        public bool IsPremium { get; set; } = false;
        public bool IsActive { get; set; } = false; // For deactivate/reactivate.
                                                    
        // ✅ NEW: Categories for this distributor (Food, Clothing, Electronics, etc.)
        [BsonElement("Categories")]
        public List<string> Categories { get; set; } = new List<string>();
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public double AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;
        public int FraudCount { get; set; } = 0;
      
        public string? Status { get; set; } // Pending / Accepted / Rejected / null






                                            // 👇 serves multiple pincodes

        [BsonElement("ServicePincodes")]
        public List<string> ServicePincodes { get; set; } = new();

        public string? City { get; set; }
        public int YearsInBusiness { get; set; }
        public double Rating { get; set; }
        // ✅ QR CODE IMAGE (Azure / S3 / CDN / local)
        public string? ScannerQrUrl { get; set; }
    }
}
