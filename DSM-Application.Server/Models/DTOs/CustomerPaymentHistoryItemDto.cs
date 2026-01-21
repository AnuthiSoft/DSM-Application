public class CustomerPaymentHistoryItemDto
{
    public string PaymentId { get; set; }
    public decimal AmountPaidToday { get; set; }
    public decimal PendingAmount { get; set; }
    public string PaymentMode { get; set; }
    public string CashierId { get; set; }
    public DateTime PaymentDate { get; set; }
    public bool IsHandedOver { get; set; }
}
