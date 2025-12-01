using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace DistributorManagementSystem.Server.Models
{
    public class Distributor
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string? DistributorId { get; set; } = string.Empty;
        [BsonElement("CompanyName")]
        public string? CompanyName { get; set; } = string.Empty;
        public string? GST { get; set; } = string.Empty;
        public string? Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; } = string.Empty;

        public List<string>? Categories { get; set; } = new List<string>();

        public string? AadhaarNumber { get; set; }


        public string? Name { get; set; } = string.Empty; // Primary contact name
        public string? Email { get; set; } = string.Empty; // Primary contact email
        public bool IsPremium { get; set; } = false;
        public bool IsActive { get; set; } = false; // For deactivate/reactivate.



        // New fields for profile section
        public string? ProfileImageUrl { get; set; } = string.Empty;
        public string? BankName { get; set; } = string.Empty;
        public string? AccountNumber { get; set; } = string.Empty;
        public string? IFSCCode { get; set; } = string.Empty;
        public string? UPIId { get; set; } = string.Empty;




        // ✅ NEW: Categories for this distributor (Food, Clothing, Electronics, etc.)


        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public double AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;
        public int FraudCount { get; set; } = 0;
      
        public string? Status { get; set; } // Pending / Accepted / Rejected / null
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastUpdatedAt { get; set; }
    }
}
