using System.ComponentModel.DataAnnotations;

namespace DSM_Application.Server.Models.DTOs
{
    public class CustomerRegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string Password { get; set; }
    }

    public class CustomerLoginRequest
    {
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
