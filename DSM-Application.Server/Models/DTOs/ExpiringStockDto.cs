namespace DSM_Application.Server.Models.DTOs
{
    public class ExpiringStockDto
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public string BatchId { get; set; }

        public int QuantityAvailable { get; set; }
        public DateTime ExpiryDate { get; set; }

        public int DaysToExpire { get; set; }
        public string Status { get; set; } // Expired | ExpiringSoon
    }
}
