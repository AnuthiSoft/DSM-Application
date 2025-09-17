using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DistributorManagementSystem.Server.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty; // Admin, Distributor, Customer, Employee
        public string? DistributorId { get; set; } // For employees/customers linked to distributor
        public string? EmployeeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        public bool IsRegistered { get; set; } = false; // true if password created by distributor
        [BsonElement("ResetOtp")]
        public string? ResetOtp { get; set; }

        [BsonElement("ResetOtpExpiry")]
        public DateTime? ResetOtpExpiry { get; set; }


    }
}
