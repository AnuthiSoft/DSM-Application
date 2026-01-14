namespace DSM_Application.Server.Models.DTOs
{
    
    public class ProductWithStockDto
    {
          public string ProductId { get; set; }
    public string ProductName { get; set; }
    public string ProductCode { get; set; }
    public decimal Price { get; set; }
    public string Brand { get; set; }
    public string Color { get; set; }
    public string Category { get; set; }
    public List<string> ImageUrls { get; set; }
    public string Measure { get; set; }

    public string DistributorId { get; set; }
    public string DistributorName { get; set; }

    // 🔥 THIS IS THE FIX
    public int CurrentStock { get; set; }
    
    }
}
