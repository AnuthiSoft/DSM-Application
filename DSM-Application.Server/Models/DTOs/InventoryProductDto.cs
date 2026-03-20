namespace DSM_Application.Server.Models.DTOs
{
    public class InventoryProductDto
    {
        public string? ProductId { get; set; }
        public string? ProductName { get; set; }

        public string? ProductCode { get; set; }   // ✅ FIXED

        public int CurrentStock { get; set; }     // ✅ FIXED (INT, NOT STRING)
        public string? Brand { get; set; }
        public decimal Price { get; set; }

        public string? Color { get; set; }
        public string? Measure { get; set; }
        public int Stock { get; set; }
        //public string Image { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public int ReorderLevel { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int DamagedQty { get; set; }
    }
}