public class CustomerPaymentStatusDto
{
    public string OrderId { get; set; }
    public string OrderStatus { get; set; }   // ⭐ REQUIRED
    public decimal TotalAmount { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal PendingAmount { get; set; }
    public List<CustomerPaymentHistoryItemDto> Payments { get; set; }
}
