namespace DSM_Application.Server.Models.DTOs
{
    public class InventorySummaryDto
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public string ProductCode { get; set; }

        public int InitialStock { get; set; }
        public int IncreasedStock { get; set; }
        public int TotalStock { get; set; }
    }
}
