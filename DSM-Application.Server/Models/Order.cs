using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class Order
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; }
        public string DistributorId { get; set; }
        public List<OrderProduct> Products { get; set; } = new List<OrderProduct>();
        public double TotalAmount { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime CanceledOn { get; set; } = DateTime.UtcNow;


        [BsonElement("employeeId")]
        public string EmployeeId { get; set; }
        [BsonElement("employeeName")]
        public string Name { get; set; }
        public DateTime? AssignedOn { get; set; }

        public bool PaymentCollectedByEmployee { get; set; } = false;
        public double? CollectedAmount { get; set; } // amount collected physically by employee (if COD)
        public string PaymentMethod { get; set; } // "COD", "Online", etc.
        public DateTime? CollectedOn { get; set; }

        public DateTime? DeliveredOn { get; set; }

   
        public string DeliveryRemarks { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Shipped, Delivered
    }

    public class OrderProduct
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public double Price { get; set; }
        public int Quantity { get; set; }
    }
}
