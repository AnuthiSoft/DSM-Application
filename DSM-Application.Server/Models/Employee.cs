using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using static System.Net.Mime.MediaTypeNames;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Employee
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        
[BsonElement("EmployeeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? EmployeeId { get; set; }

        [BsonElement("DistributorId")]
        [BsonRepresentation(BsonType.ObjectId)]

        public string DistributorId { get; set; } = string.Empty;

        [BsonElement("Email")]
        public string Email { get; set; } = string.Empty;
        [BsonElement("PhoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [BsonElement("Address")]
        public string Address { get; set; } = string.Empty; // 🏠 employee address

        // 🖼️ Image fields stored inside MongoDB
        [BsonElement("ProfileImageData")]
        public byte[]? ProfileImageData { get; set; }

        [BsonElement("ProfileImageName")]
        public string? ProfileImageName { get; set; }

        [BsonElement("ProfileImageType")]
        public string? ProfileImageType { get; set; }

        [BsonElement("Name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("Role")]
        public string Role { get; set; } = "Employee";
        [BsonElement("Designation")]
        public string Designation { get; set; } = "Employee";

        [BsonElement("IsRegistered")]
        public bool IsRegistered { get; set; } = false;

        [BsonElement("PasswordHash")]
        public string? PasswordHash { get; set; }

        [BsonElement("IsActive")]
        public bool IsActive { get; set; } = true;
    }
}
