using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class Employee
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? EmployeeId { get; set; }

        [BsonElement("DistributorId")]
        public string DistributorId { get; set; } = string.Empty;

        [BsonElement("Email")]
        public string Email { get; set; } = string.Empty;
        [BsonElement("PhoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [BsonElement("Name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("Role")]
        public string Role { get; set; } = "Employee";
        [BsonElement("Designation")]
        public string Designation { get; set; } = "Employee";

        [BsonElement("IsRegistered")]
        public bool IsRegistered { get; set; } =true;

        [BsonElement("PasswordHash")]
        public string? PasswordHash { get; set; }

        [BsonElement("IsActive")]
        public bool IsActive { get; set; } = true;
    }
}
