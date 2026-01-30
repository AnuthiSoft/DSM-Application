namespace DSM_Application.Server.Models.DTOs
{
    public class InventoryBatchDto
    {
   
            public string BatchId { get; set; }
            public string ProductId { get; set; }
            public string ProductName { get; set; }
            public string ProductCode { get; set; }
        public int InitialQuantity { get; set; }     // ✅ Added stock
        public int QuantityAvailable { get; set; }
        public DateTime? ManufactureDate { get; set; }

        public int CurrentStock { get; set; }
        public DateTime? ExpiryDate { get; set; }
            public bool IsExpired { get; set; }
        }

    }

