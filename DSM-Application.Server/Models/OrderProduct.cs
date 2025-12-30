using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class OrderProduct
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }

        public decimal? Price { get; set; }

        [BsonElement("unitPrice")]
        public decimal? UnitPrice { get; set; }

        [BsonElement("ReturnedQty")]
        public int ReturnedQty { get; set; } = 0;

        //public int Quantity { get; set; }
        [BsonElement("Quantity")]
        public int Quantity { get; set; }

        // 🆕 REQUIRED FOR RETURNS
        public int ReturnedQty { get; set; } = 0;

        public string DistributorId { get; set; }
        public decimal Subtotal { get; set; }

        public decimal SpecialDiscountPercent { get; set; }
        public decimal QuantityDiscountPercent { get; set; }
        public decimal PriceDiscountPercent { get; set; }
        public decimal TotalDiscountPercent { get; set; }

        public decimal DiscountAmount { get; set; }
        public decimal FinalPrice { get; set; }
    }
}
