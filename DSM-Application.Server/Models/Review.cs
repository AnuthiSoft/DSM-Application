using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class Review
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string ReviewerId { get; set; }   // user id who posts review
        public string TargetId { get; set; }     // distributorId or customerId being reviewed
        public string TargetType { get; set; }   // "Distributor" or "Customer"
        public string Title { get; set; }
        public string Description { get; set; }
        public int Rating { get; set; }          // 1..5
        public string Status { get; set; } = "Pending"; // Pending/Approved/Rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
