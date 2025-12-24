using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class InventoryItem
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string InventoryId { get; set; }

        public string ProductId { get; set; }
        public string DistributorId { get; set; }

        public string ProductName { get; set; }
        public string ProductCode { get; set; }
        public string Measure { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }

        public int CurrentStock { get; set; }
        public int ReorderLevel { get; set; }

        public DateTime UpdatedAt { get; set; }

        public int AvailableQuantity { get; set; }

        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }

        // FIFO key
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
