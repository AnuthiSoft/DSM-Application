namespace DSM_Application.Server.Models.DTOs
{
    public class CreateReturnDto
    {
        public string OrderId { get; set; }
        public string ProductId { get; set; }

        public string ProductName { get; set; }
        public int ReturnQty { get; set; }
        public string Reason { get; set; }
    }
}
