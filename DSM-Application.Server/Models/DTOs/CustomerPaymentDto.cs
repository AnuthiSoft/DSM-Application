namespace DSM_Application.Server.Models.DTOs
{
    public class CustomerPaymentDto
    {
        public string CustomerId { get; set; }
        public string CustomerName { get; set; }

        public decimal AmountPaid { get; set; }

        public string PaymentMode { get; set; } // cash | upi | scanner
        public string? TransactionReference { get; set; }

        public string CashierId { get; set; }
        public string DistributorId { get; set; }
    }
}
