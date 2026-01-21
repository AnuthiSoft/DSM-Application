namespace DSM_Application.Server.Models.DTOs
{
    public class CreateReturnDto
    {
        public string OrderId { get; set; }
        public string ProductId { get; set; }
        public int ReturnQty { get; set; }
        public string Reason { get; set; }
       // 🔥 NEW
    public string ReturnType { get; set; }
        // "Refund" | "Exchange"

        // 🔥 ONLY IF Exchange
        public string? ExchangeProductId { get; set; }
        public int? ExchangeQty { get; set; }
    }
}
