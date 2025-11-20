using Microsoft.AspNetCore.Http;

namespace DSM_Application.Server.Models.DTOs
{
    public class UpdateCustomerProfileDto
    {
        // Editable fields
        public string? Name { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }     // <-- ADD THIS
        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }

        // Profile image upload
        public IFormFile? ProfileImage { get; set; }
    }
}
