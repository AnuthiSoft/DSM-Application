using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class CreditTransaction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        public string CustomerId { get; set; }
        public decimal Amount { get; set; } // +credit / -credit
        public string Type { get; set; } // OrderApproved, Return, Cancel
        public string OrderId { get; set; }
        public string? ReturnId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
