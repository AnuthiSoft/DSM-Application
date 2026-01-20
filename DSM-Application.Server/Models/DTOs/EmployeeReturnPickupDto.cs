namespace DSM_Application.Server.Models.DTOs
{
    public class EmployeeReturnPickupDto
    {
        public string ReturnId { get; set; }
        public string OrderId { get; set; }
        public string ProductName { get; set; }
        public int ReturnQty { get; set; }

        public DateTime PickupDate { get; set; }
        public string PickupSlot { get; set; }

        public string Status { get; set; }
    }
}
