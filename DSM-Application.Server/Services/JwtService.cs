using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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

        // ================= JWT TOKEN =================
        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id ?? ""),
                new Claim(ClaimTypes.Name, user.Email ?? user.PhoneNumber ?? ""),
                new Claim("UserId", user.Id ?? ""),
                new Claim("Role", user.Role ?? "User"),
                new Claim(ClaimTypes.Role, user.Role ?? "User")
            };

            // DistributorId
            if (!string.IsNullOrEmpty(user.DistributorId))
            {
                claims.Add(new Claim("DistributorId", user.DistributorId));
            }

            // EmployeeId
            if (!string.IsNullOrEmpty(user.EmployeeId))
            {
                claims.Add(new Claim("EmployeeId", user.EmployeeId));
            }

            return BuildToken(claims);
        }

        // ================= CUSTOMER TOKEN =================
        public string GenerateCustomerToken(Customer customer)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, customer.Email),
                new Claim(ClaimTypes.Role, "Customer"),
                new Claim("CustomerId", customer.CustomerId)
            };

            return BuildToken(claims);
        }

        // ================= BUILD TOKEN =================
        private string BuildToken(IEnumerable<Claim> claims)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(5),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ================= REFRESH TOKEN =================
        public string GenerateRefreshToken()
        {
            return Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(64)
            );
        }
    }
}