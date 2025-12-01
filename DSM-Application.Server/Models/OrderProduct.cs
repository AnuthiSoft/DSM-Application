using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class OrderProduct
    {
        
            public string ProductId { get; set; }
            public string ProductName { get; set; }
            public decimal? Price { get; set; }  // ✅ Use decimal, replaces Price
        [BsonElement("unitPrice")]
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }

            public decimal Subtotal { get; set; }

            public decimal SpecialDiscountPercent { get; set; }
            public decimal QuantityDiscountPercent { get; set; }
            public decimal PriceDiscountPercent { get; set; }
        public decimal YearlyDiscountPercent { get; set; }

        public decimal TotalDiscountPercent { get; set; }

            public decimal DiscountAmount { get; set; }
            public decimal FinalPrice { get; set; }

        public decimal GstPercent { get; set; }          // e.g. 5, 12, 18, 28
        public decimal GstAmount { get; set; }           // GST value on this line item
        public decimal FinalPriceWithGst { get; set; }   // FinalPrice + GstAmount
    }
}

    

