using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class Handover
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string HandoverId { get; set; } = Guid.NewGuid().ToString();

        public string CashierId { get; set; }
        public string DistributorId { get; set; }

        public List<string> PaymentIds { get; set; }


        public decimal CashAmountSubmitted { get; set; }
        public decimal TotalAmountSubmitted { get; set; }

        public DateTime HandoverDate { get; set; }
        public bool Validated { get; set; } = false;

        public List<string>? ValidationErrors { get; set; }
        public string Status { get; set; } = "Pending";   // Pending / Accepted / Rejected
        public string? Notes { get; set; }
        public DateTime? ReviewedOn { get; set; }
    }
}
