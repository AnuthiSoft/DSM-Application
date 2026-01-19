using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

[BsonIgnoreExtraElements] // ⭐ prevents future crashes
public class InventoryBatch
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BatchId { get; set; }

    [BsonElement("ProductId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; }

    [BsonElement("DistributorId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string DistributorId { get; set; }


    [BsonElement("ProductCode")]
    public string ProductCode { get; set; }

    [BsonElement("Quantity")]
    public int Quantity { get; set; }

    [BsonElement("InitialQuantity")]
    public int InitialQuantity { get; set; }

    public int QuantityAvailable { get; set; }
          // ✅ STRING
  

   

    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsExpired => ExpiryDate < DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
