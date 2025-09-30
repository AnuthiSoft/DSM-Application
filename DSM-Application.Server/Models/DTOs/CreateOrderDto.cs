namespace DSM_Application.Server.Models.DTOs
{
    public class OrderCreateDto
    {
        public string CustomerId { get; set; }
        public string DistributorId { get; set; }
        public List<OrderProductDto> Products { get; set; }
    }

    public class OrderProductDto
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public double Price { get; set; }
        public int Quantity { get; set; }
    }
}
