namespace DSM_Application.Server.Models
{
    public class Cart
    {
        public string Id { get; set; }
        public string CustomerId { get; set; }
        public string DistributorId { get; set; }
        public List<CartItem> Items { get; set; } = new();
        public DateTime UpdatedOn { get; set; }
    }

    public class CartItem
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}
