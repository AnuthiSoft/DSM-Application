namespace DSM_Application.Server.Models.DTOs
{
    public class CollectPaymentDto
    {
        public decimal? CollectedAmount { get; set; }
        public string PaymentMethod { get; set; } = "COD"; // or "Online"
    }
}
