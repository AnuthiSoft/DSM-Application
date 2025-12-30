using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class ReturnRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string OrderId { get; set; }
        public string ProductId { get; set; }

        public int ReturnQty { get; set; }

        public string Reason { get; set; }
        // Damaged | Expired | Excess

        public string Status { get; set; }
        // Pending | Approved | Received | Completed | Rejected

        public string? RejectionReason { get; set; }

        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        // ✅ ADD THIS
        public DateTime CreatedAt { get; set; }
    }
}
