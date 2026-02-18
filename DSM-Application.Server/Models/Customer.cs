using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Customer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? CustomerId { get; set; }

        [BsonElement("Name")]
        public string Name { get; set; }

        [BsonElement("Email")]
        public string Email { get; set; }
        [BsonElement("Role")]
        public string Role { get; set; } = "Customer";
        [BsonElement("Address")]
        public string Address{ get; set; } 

        [BsonElement("PhoneNumber")]
        public string? PhoneNumber { get; set; }

        [BsonElement("PasswordHash")]
        public string? PasswordHash { get; set; }

        [BsonElement("IsRegistered")]
        public bool IsRegistered { get; set; } = false;

        [BsonRepresentation(BsonType.ObjectId)]
        public string AddedByDistributorId { get; set; }
        [BsonElement("ConnectedDistributors")]
        public List<string>? ConnectedDistributors { get; set; } // for global customers
        public string? ProfileImageUrl { get; set; }
        public bool PhoneVerified { get; set; } = false;

        [BsonElement("CreditBalance")]
        public decimal CreditBalance { get; set; } = 0;


        // Address
        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }

        public int FraudCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public bool MustChangePassword { get; set; }
        public string? Pincode { get; set; }

    }
}
