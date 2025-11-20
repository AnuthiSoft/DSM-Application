namespace DSM_Application.Server.Models.DTOs
{
    public class CustomerProfileDto
    {
        // Basic
        public string CustomerId { get; set; }   // for responses only
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }

        // Address + profile image
        public string ProfileImageUrl { get; set; }
        
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }
        public string Country { get; set; }

        // Other metadata (read-only)
        public string Role { get; set; }
        public bool IsRegistered { get; set; }
        public string AddedByDistributorId { get; set; }

        
    }
}
