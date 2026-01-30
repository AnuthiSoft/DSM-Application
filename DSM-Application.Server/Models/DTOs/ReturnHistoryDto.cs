namespace DSM_Application.Server.Models.DTOs
{
    public class ReturnHistoryDto
    {
        public string Id { get; set; }
        public string OrderId { get; set; }
        public string ProductId { get; set; }
        public int ReturnQty { get; set; }
        public decimal? Price { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
        public string CustomerPhone { get; set; }
        public string CustomerEmail { get; set; }

        public string? RejectedBy { get; set; } // "Distributor" | "Customer"


        public string ProductName { get; set; }      // ✅
        public string DistributorId { get; set; }      // ✅
        public string CustomerName { get; set; }      // ✅
        public List<string> ImageUrls { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class RejectReasonRequest
    {
        public string Reason { get; set; }
    }

}
