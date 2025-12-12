namespace YourApp.Models
{
    public class Payment
    {
        public string Id { get; set; }                // Mongo ObjectId as string
        public string PaymentId { get; set; }         // UUID
        public string CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string OrderId { get; set; }
        public decimal OrderTotalAmount { get; set; }
        public decimal AmountPaidToday { get; set; }
        public decimal PendingAmount { get; set; }
        public string PaymentMode { get; set; }       // "cash" | "online" | "scanner"
        public string TransactionReference { get; set; }
        public string CollectedByCashierId { get; set; }
        public DateTime DateOfPayment { get; set; }   // stored in UTC
        public bool IsHandedOver { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
