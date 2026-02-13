using System.Text.Json.Serialization;

namespace DSM_Application.Server.Models.DTOs
{
    public class OrderCreateDto
    {
        //public string CustomerName { get; set; }
        //public string CustomerEmail { get; set; }
        //public string CustomerPhone { get; set; }
        public string CustomerId { get; set; }
        public string DistributorId { get; set; }
        public List<OrderProductInputDto> Products { get; set; }
        public decimal SpecialDiscountPercent { get; set; }
        public DateTime? ExpectedDelivery { get; set; }
        public DateTime? OrderedDate { get; set; }
        public bool Preview { get; internal set; }
    }

    public class OrderProductDto
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        
    }

    public class OrderProductInputDto
    {
        public string ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class AssignOrderDto
    {
        
        public string EmployeeId { get; set; }

        public string EmployeeName { get; set; }   // REQUIRED
        public string Note { get; set; } // optional
    }

    public class EmployeeUpdateStatusDto
    {
        public string Status { get; set; } // e.g., "Delivered", "FailedDelivery"
        public bool PaymentCollected { get; set; } = false;
        public decimal? CollectedAmount { get; set; }
        public string PaymentMethod { get; set; } // "COD", "Online"
        public string Remarks { get; set; }
    }
    public class UpdateStatusDto
    {
        public string Status { get; set; }
        public string? PaymentMethod { get; set; } // "Cash" or "Online"
        public decimal? CollectedAmount { get; set; }
    }

    public class DistributorOrderDto
    {
        public string Id { get; set; }
        public string CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }
        public List<OrderProduct> Products { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal TotalAmount { get; set; }

        public decimal SpecialDiscountPercent { get; set; }
        public decimal QuantityDiscountPercent { get; set; }
        public decimal PriceDiscountPercent { get; set; }
        public decimal TotalDiscountPercent { get; set; }
        public DateTime? OrderedDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }

        public string DistributorId { get; set; }


        //// ⭐ ADD THESE TWO NEW FIELDS
        //public DateTime? OrderedDate { get; set; }
        //public DateTime? ExpectedDeliveryDate { get; set; }

        //public DateTime OrderDate { get; set; }
        public string Status { get; set; }
        // ✅ Add these fields
        public string? EmployeeId { get; set; }
        public string? Name { get; set; }
        public bool PaymentCollectedByEmployee { get; set; } = false;
        public decimal? CollectedAmount { get; set; } // amount collected physically by employee (if COD)
        public string PaymentMethod { get; set; } // "COD", "Online", etc.
        public DateTime? CollectedOn { get; set; }

        public DateTime? DeliveredOn { get; set; }

        public string? DeliveryReceiptUrl { get; set; } // ⭐ FULL Azure Blob URL
        public string DistributorName { get;  set; }
        public decimal TotalGst { get; set; }

        // ⭐ REQUIRED for per-product delivery date
        //public DateTime? DeliveryEta { get; set; }
        //}
    }
}
