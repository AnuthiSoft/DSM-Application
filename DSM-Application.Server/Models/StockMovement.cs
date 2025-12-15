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

        public int Quantity { get; set; }
        public string Type { get; set; }   // IN / OUT
        public string Reason { get; set; }
        public DateTime Date { get; set; }
        public int PreviousStock { get; set; }
        public int NewStock { get; set; }
    }
}
