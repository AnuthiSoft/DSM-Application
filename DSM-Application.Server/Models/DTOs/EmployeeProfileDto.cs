using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models.DTOs
{
    public class EmployeeProfileDto
    {
        public string EmployeeId { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string ProfileImageUrl { get; set; }

        // Editable fields
        public string Name { get; set; }
        public string PhoneNumber { get; set; }

        public string Address { get; set; } = string.Empty;

        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Pincode { get; set; }
        public string Country { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public bool PhoneVerified { get; set; } = false;
    }
}
