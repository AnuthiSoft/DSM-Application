using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
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

        [BsonElement("AddedByDistributorId")]
        public string? AddedByDistributorId { get; set; } // null if global signup
        [BsonElement("ConnectedDistributors")]
        public List<string>? ConnectedDistributors { get; set; } // for global customers
        public string ProfileImageUrl { get; set; }
      

        // Address
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }
        public string Country { get; set; }

    }
}
