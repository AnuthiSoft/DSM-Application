using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class Otp
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string PhoneNumber { get; set; }

        public string Code { get; set; }

        public DateTime ExpiresAt { get; set; }
        public string CustomerId { get; set; }
    }
}
