using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class InventoryItem
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]


        //public string Id { get; set; }
        public string InventoryId { get; set; }

        public string ProductId { get; set; }
        public string DistributorId { get; set; }

        public string ProductName { get; set; }
        public string ProductCode { get; set; }
        public string Measure { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }

        public int CurrentStock { get; set; } = 0;
        public int ReorderLevel { get; set; } = 0;

        public DateTime UpdatedAt { get; set; }

        // ✅ Auto-calculated (DO NOT STORE IN DB)

        [BsonIgnore] // 🔥 VERY IMPORTANT

        public int? AvailableQuantity { get; set; }


        public int DamagedQty { get; set; } = 0;    // ❌ damaged items



        public DateTime ManufactureDate { get; set; }
        [BsonElement("ReturnedQty")]
        public int? ReturnedQty { get; set; } = 0;
        public DateTime ExpiryDate { get; set; }

        // FIFO key
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}