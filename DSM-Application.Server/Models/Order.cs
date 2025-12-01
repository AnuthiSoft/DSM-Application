using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace DSM_Application.Server.Models
{
    public class Order
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; }
        public decimal PreviousBalance { get; set; } = 0;
        public decimal PaidAmount { get; set; } = 0;
        public decimal RemainingAmount { get; set; } = 0;

        
        public string DistributorId { get; set; }
        public List<OrderProduct> Products { get; set; } = new List<OrderProduct>();

        // 🟢 These were missing (add them)
        public decimal Subtotal { get; set; }       // Before discount
        public decimal TotalDiscount { get; set; } // Combined discount

        public decimal TotalGst { get; set; }  // sum of per-item GST

        public decimal TotalAmount { get; set; }    // After discount
        public decimal YearlyDiscountPercent { get; set; }


        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime CanceledOn { get; set; } = DateTime.UtcNow;

        [BsonElement("employeeId")]
        public string EmployeeId { get; set; }

        [BsonElement("employeeName")]
        public string Name { get; set; }
        public DateTime? AssignedOn { get; set; }

        public bool PaymentCollectedByEmployee { get; set; } = false;
        public decimal? CollectedAmount { get; set; } // ✅ changed double? → decimal?
        public string PaymentMethod { get; set; }
        public DateTime? CollectedOn { get; set; }

        public DateTime? DeliveredOn { get; set; }
        public string DeliveryRemarks { get; set; }
        public string Status { get; set; } = "Pending";

        public string? PaymentId { get; set; }          // Razorpay payment ID
        public string? PaymentOrderId { get; set; }     // Razorpay order ID
        public string PaymentStatus { get; set; } = "Pending";   // Pending / Paid / Failed

        


    }
}
