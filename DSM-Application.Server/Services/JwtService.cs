using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DistributorManagementSystem.Server.Services
{
    public class JwtService
    {
        private readonly IConfiguration _config;

        public JwtService(IConfiguration config)
        {
            _config = config;
        }

        // ✅ Existing token generator for users (Admin/Distributor/Employee)
        public string GenerateToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username ?? user.Email),
                new Claim(ClaimTypes.Role, user.Role ?? "User"),
                new Claim("UserId", user.Id ?? string.Empty),
                new Claim("DistributorId", user.DistributorId ?? string.Empty),
              
            };

            return BuildToken(claims);
        }

        // ✅ New: Customer-specific token generator
        public string GenerateCustomerToken(Customer customer)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, customer.Email),
                new Claim(ClaimTypes.Role, "Customer"),
                new Claim("CustomerId", customer.CustomerId),
                    //new Claim(ClaimTypes.Role, "Distributor")
            };

            return BuildToken(claims);
        }

        // ✅ Shared token builder method
        private string BuildToken(IEnumerable<Claim> claims)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(5),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
