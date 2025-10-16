using System.ComponentModel.DataAnnotations;

namespace DistributorManagementSystem.Server.Models
{
    public class LoginRequest
    {
        public string? Email { get; set; }          // optional
        public string? PhoneNumber { get; set; }    // optional
        [Required]
        public string Password { get; set; }
    }
}
