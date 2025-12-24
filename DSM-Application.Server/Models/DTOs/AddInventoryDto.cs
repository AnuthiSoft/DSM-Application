namespace DSM_Application.Server.Models.DTOs
{
    public class AddInventoryDto
    {
        public string ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }
    }

}
