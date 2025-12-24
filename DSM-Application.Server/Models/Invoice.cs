public class Invoice
{
    public string Id { get; set; }
    public string DistributorId { get; set; }
    public string InvoiceNo { get; set; }
    public string InvoiceDate { get; set; }
    public string CustomerId { get; set; }
    public string EwayBillNo { get; set; }
    public decimal TotalAmount { get; set; }
    public List<InvoiceItem> Items { get; set; }
}

public class InvoiceItem
{
    public string ProductId { get; set; }
    public string ProductName { get; set; }
    public string HsnCode { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TaxableValue { get; set; }

    public decimal GstRate { get; set; }

}
