using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models.DTOs
{
    public class DistributorCreateCustomerDto
    {
        [Required(ErrorMessage = "Name is required")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        [StringLength(254)]
        public string Email { get; set; }

        [Required(ErrorMessage = "Phone Number is required")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Address is required")]
        public string Address { get; set; }

        // 🔥 NEW
        [Required(ErrorMessage = "Password is required")]

        public string Password { get; set; }
    }
}
