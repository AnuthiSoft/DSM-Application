namespace DSM_Application.Server.Models.DTOs
{
    public class DistributorCreateDto
    {
        public string? CompanyName { get; set; } = string.Empty;
        public string? Name { get; set; } = string.Empty;
        public string? Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; } = string.Empty;
        public string? GST { get; set; } = string.Empty;
        public string? Address { get; set; } = string.Empty;
        public List<string>? Categories { get; set; } = new();
        public string? AadhaarNumber { get; set; }

       
        //public bool IsPremium { get; set; }
        //public bool IsActive { get; set; }
        //public string ProfileImageUrl { get; set; }
        //public string BankName { get; set; }
        //public string AccountNumber { get; set; }
        //public string IFSCCode { get; set; }
        //public string UPIId { get; set; }
        //public DateTime CreatedDate { get; set; }
        //public string Status { get; set; }
        //public DateTime CreatedAt { get; set; }
        //public DateTime? LastUpdatedAt { get; set; }
    }
}
