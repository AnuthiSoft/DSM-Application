using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DistributorManagementSystem.Server.Models
{
    public class Distributor
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? DistributorId { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;
        public string GST { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty; // Primary contact name
        public string Email { get; set; } = string.Empty; // Primary contact email
        public bool IsActive { get; set; } = false; // For deactivate/reactivate.
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
