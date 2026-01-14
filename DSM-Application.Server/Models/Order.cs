using MongoDB.Bson.Serialization.Attributes;

using MongoDB.Bson;

namespace DSM_Application.Server.Models

{

    public class Order

    {

        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string CustomerId { get; set; }

        public string DistributorId { get; set; }

        public List<OrderProduct> Products { get; set; } = new List<OrderProduct>();

        // 🟢 These were missing (add them)

        public decimal Subtotal { get; set; }       // Before discount

        public decimal TotalDiscount { get; set; }  // Combined discount

        public decimal TotalAmount { get; set; }    // After discount

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime CanceledOn { get; set; } = DateTime.UtcNow;

        [BsonElement("employeeId")]

        public string EmployeeId { get; set; }

        [BsonElement("employeeName")]

        public string Name { get; set; }

        public DateTime? AssignedOn { get; set; }

        public bool PaymentCollectedByEmployee { get; set; } = false;

        // 🆕 NEW FIELDS FOR CASH COLLECTOR WORKFLOW

        public bool IsPaymentCollected { get; set; } = false;

        public string? PaymentCollectedBy { get; set; }

        public decimal? CollectedAmount { get; set; } // ✅ changed double? → decimal?

        public string PaymentMethod { get; set; }

        public DateTime? CollectedOn { get; set; }

        public bool StockUpdated { get; set; } = false;


        public DateTime? DeliveredOn { get; set; }

        public string DeliveryRemarks { get; set; }

        public string Status { get; set; } = "Pending";

        public string AssignedEmployeeId { get; set; }   // REQUIRED

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;  // REQUIRED

        public string CustomerName { get; set; }


        // 🟦 🆕 ADD ONLY NEW FIELDS FOR "NEW ORDER REQUEST FORM"

        // ----------------------------------------------

        // NEW FIELD → Required for your "Ordered Date" in UI

        public DateTime OrderedDate { get; set; }

        // ✅ ADD THIS LINE

        public DateTime? UpdatedAt { get; set; }

        // NEW FIELD → Retailer dropdown

        //public string RetailerId { get; set; }

        // NEW FIELD → Expected Delivery Date

        public DateTime ExpectedDeliveryDate { get; set; }

        public decimal RemainingAmount { get; set; }

        // Helps tracking full return state

        public bool HasReturn { get; set; } = false;

        // Helps accounting clarity

        public decimal ReturnedAmount { get; set; } = 0;

        public string CreatedByUserId { get; set; }   // Cash Collector ID

        public string CreatedByRole { get; set; }     // "CashCollector"

        public string OrderSource { get; set; }       // "RETAILER" or "CASH_COLLECTOR"

        public DateTime? UpdatedOn { get; set; }
  
        public string CustomerPhone { get; set; }   // ✅ ADD THIS
        public string CustomerEmail { get; set; }   // ✅ ADD THIS
        public string? DeliveryReceiptUrl { get; set; } // ⭐ FULL Azure Blob URL

    }

}

