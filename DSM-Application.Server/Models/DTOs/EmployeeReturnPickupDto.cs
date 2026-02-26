namespace DSM_Application.Server.Models.DTOs
{
    public class EmployeeReturnPickupDto
    {
        public string ReturnId { get; set; }
        public string OrderId { get; set; }
        public string ProductName { get; set; }
        public int ReturnQty { get; set; }

        public decimal ProductPrice { get; set; }

        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerAddress { get; set; }

        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }
        public string Country { get; set; }

        public DateTime PickupDate { get; set; }
        public string PickupSlot { get; set; }

        public string Status { get; set; }
    }
}
