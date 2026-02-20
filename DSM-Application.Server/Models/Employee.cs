using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

[BsonIgnoreExtraElements]
public class Employee
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? EmployeeId { get; set; }
    public string DistributorId { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    // ✅ ADDRESS FIELDS (THIS IS THE FIX)
    public string Street { get; set; } = "";
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string Pincode { get; set; } = "";
    public string Country { get; set; } = "";

    // 🖼️ Image fields
    public byte[]? ProfileImageData { get; set; }
    public string? ProfileImageName { get; set; }
    public string? ProfileImageType { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = "Employee";
    public string Designation { get; set; } = "Employee";

    public bool IsRegistered { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsOnDuty { get; set; } = false;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;


       
        public bool PhoneVerified { get; set; } = false;

}

