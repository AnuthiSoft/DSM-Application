using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class FraudReport
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string ReportedById { get; set; }
        public string TargetId { get; set; }
        public string TargetType { get; set; } // "Distributor" or "Customer"
        public string Reason { get; set; }
        public string EvidenceUrl { get; set; } // optional file/image link
        public string Status { get; set; } = "Pending"; // Pending/Approved/Rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    }
}
