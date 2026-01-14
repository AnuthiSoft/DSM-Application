using MongoDB.Bson;

using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models

{

    public class InventoryBatch

    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string BatchId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ProductId { get; set; }

        public string DistributorId { get; set; }

        public int QuantityInitial { get; set; }
        public int QuantityAvailable { get; set; }

        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }

        // ✅ ADD THIS
        public bool IsActive { get; set; } = true;

        // ✅ OPTIONAL (recommended)
        public bool IsExpired => ExpiryDate < DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}

