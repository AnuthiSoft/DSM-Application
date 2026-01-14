using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class StockMovement
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MovementId { get; set; }

        public string ProductId { get; set; }
        public string DistributorId { get; set; }

        // ✅ Batch reference
        public string BatchId { get; set; }

        // IN / OUT
        public string Type { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; }

        // ✅ ADD THIS (THIS FIXES YOUR ERROR)
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}
