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
            public decimal TotalDiscountPercent { get; set; }

            public decimal DiscountAmount { get; set; }
            public decimal FinalPrice { get; set; }
        }

    }

