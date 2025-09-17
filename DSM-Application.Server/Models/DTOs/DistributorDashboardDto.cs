namespace DSM_Application.Server.Models.DTOs
{
    public class DistributorDashboardDto
    {
        public string DistributorId { get; set; }
        public string CompanyName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsPremium { get; set; }
        public List<Product>? Products { get; set; } // optional
    }
}
