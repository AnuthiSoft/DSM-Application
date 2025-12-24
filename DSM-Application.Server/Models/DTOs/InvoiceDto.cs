public class InvoiceDto
{
    public string DistributorId { get; set; }
    public string InvoiceNo { get; set; }
    public string InvoiceDate { get; set; }
    public string CustomerId { get; set; }
    public string EwayBillNo { get; set; }
    public decimal TotalAmount { get; set; }
    public List<InvoiceItem> Items { get; set; }
}
