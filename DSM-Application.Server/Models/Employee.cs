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

        public string? EmployeeId { get; set; }

        public string DistributorId { get; set; }
        //public string DistributorId { get; set; } = string.Empty;

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

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;


        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;

    }
}
