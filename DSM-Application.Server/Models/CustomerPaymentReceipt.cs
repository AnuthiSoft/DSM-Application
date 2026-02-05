namespace DSM_Application.Server.Models
{
    public class CustomerPaymentReceipt
    {
        public string Id { get; set; }
        public string ReceiptId { get; set; }

        public string CustomerId { get; set; }
        public string CustomerName { get; set; }

        public string DistributorId { get; set; }
        public string CashierId { get; set; }

        public decimal AmountPaid { get; set; }   // 🔥 TOTAL PAID BY CUSTOMER
        public string PaymentMode { get; set; }
        public string TransactionReference { get; set; }

        public DateTime PaidOn { get; set; }

        // Optional but powerful
        public bool IsSubmittedForHandover { get; set; }
        public string? HandoverStatus { get; set; }   // Pending / Accepted / Rejected
        public string? RejectReason { get; set; }
        public List<OrderPaymentSplit> Orders { get; set; } = new();
        public string HandoverId { get; set; }
        public string? PreviousRejectReason { get; set; }
        public string? RehandoverNote { get; set; }
        public bool IsRehandover { get; set; }

    }

    public class OrderPaymentSplit
    {
        public string OrderId { get; set; }
        public decimal AmountApplied { get; set; }
    }

}
