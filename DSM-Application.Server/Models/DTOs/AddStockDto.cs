namespace DSM_Application.Server.Models.DTOs
{
    public class AddStockDto
    {
        public int Quantity { get; set; }
        public string Note { get; set; } = "Distributor purchase";
    }
}
