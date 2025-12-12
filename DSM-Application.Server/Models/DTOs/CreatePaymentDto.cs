public class CreatePaymentDto
{
    public string CustomerId { get; set; }
    public string CustomerName { get; set; }
    public string OrderId { get; set; }

    public decimal OrderTotalAmount { get; set; }
    public decimal AmountPaidToday { get; set; }
    public string PaymentMode { get; set; }

    public string? TransactionReference { get; set; }
    public string CashierId { get; set; }
    public string DistributorId { get; set; }
}
