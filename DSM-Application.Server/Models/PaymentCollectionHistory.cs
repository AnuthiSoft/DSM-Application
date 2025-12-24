using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class PaymentCollectionHistory
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string PaymentId { get; set; } = Guid.NewGuid().ToString();

        public string CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string OrderId { get; set; }

        public decimal OrderTotalAmount { get; set; }
        public decimal AmountPaidToday { get; set; }
        public decimal PendingAmount { get; set; }

        public string PaymentMode { get; set; }  // cash | online | scanner
        public string TransactionReference { get; set; }

        public string CashierId { get; set; }
        public string DistributorId { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public bool IsHandedOver { get; set; } = false;
        public bool IsSubmittedForHandover { get; set; }
        public string HandoverStatus { get; set; } = "Pending"; // Pending | Rejected | Accepted
        public string RejectReason { get; set; }



    }
}
