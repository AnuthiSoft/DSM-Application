//using DistributorManagementSystem.Server.Models;
//using DSM_Application.Server.Models;
//using Microsoft.IdentityModel.Tokens;
//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using System.Security.Cryptography;
//using System.Text;

//namespace DistributorManagementSystem.Server.Services
//{
//    public class JwtService
//    {
//        private readonly IConfiguration _config;

//        public JwtService(IConfiguration config)
//        {
//            _config = config;
//        }

//        // ✅ Existing token generator for users (Admin/Distributor/Employee)
//        public string GenerateToken(User user)
//        {
//            var claims = new[]
//            {
//                new Claim(ClaimTypes.Name, user.PhoneNumber ?? user.Email),
//                //new Claim(ClaimTypes.Role, user.Role ?? "User"),
//                new Claim("UserId", user.Id ?? string.Empty),
//                //new Claim("DistributorId", user.DistributorId ?? string.Empty),
//                   //new Claim("EmployeeId", user.EmployeeId),  // ✅ Add this
//                    new Claim("Role", user.Role ?? ""),                        // Role may be null
//    new Claim("DistributorId", user.DistributorId ?? ""),
//    new Claim(ClaimTypes.Role, "Distributor"),// DistributorId may be null
//    new Claim("EmployeeId", user.EmployeeId ?? "")             // EmployeeId may be null

//            };

//            return BuildToken(claims);
//        }

//        // ✅ New: Customer-specific token generator
//        public string GenerateCustomerToken(Customer customer)
//        {
//            var claims = new[]
//            {
//                new Claim(ClaimTypes.Name, customer.Email),
//                new Claim(ClaimTypes.Role, "Customer"),
//                new Claim("CustomerId", customer.CustomerId),
//                    //new Claim(ClaimTypes.Role, "Distributor")
//            };

//            return BuildToken(claims);
//        }

//        // ✅ Shared token builder method
//        private string BuildToken(IEnumerable<Claim> claims)
//        {
//            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
//            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

//            var token = new JwtSecurityToken(
//                issuer: _config["Jwt:Issuer"],
//                audience: _config["Jwt:Audience"],
//                claims: claims,
//                expires: DateTime.UtcNow.AddHours(5),
//                signingCredentials: creds);

//            return new JwtSecurityTokenHandler().WriteToken(token);
//        }
//        public string GenerateRefreshToken()
//        {
//            var randomNumber = new byte[32];
//            using var rng = RandomNumberGenerator.Create();
//            rng.GetBytes(randomNumber);
//            return Convert.ToBase64String(randomNumber);
//        }
//    }
//}


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


        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Name, user.Email ?? user.PhoneNumber ?? ""),
        new Claim("UserId", user.Id ?? ""),
        new Claim("Role", user.Role ?? "User"),
        new Claim(ClaimTypes.Role, user.Role ?? "User"),
          //new Claim("employeeId", user.EmployeeId ?? ""), // ✅ ADD THIS
    };

            // Distributor — always include the claim
            if (user.Role == "Distributor")
                claims.Add(new Claim("DistributorId", user.DistributorId ?? ""));

            // Employee — only include if exists
            if (user.Role == "Employee" && !string.IsNullOrWhiteSpace(user.EmployeeId))
                claims.Add(new Claim("EmployeeId", user.EmployeeId));

            return BuildToken(claims);
        }





        // ✅ Generate token specifically for Customer users
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

        // ✅ Shared token builder
        private string BuildToken(IEnumerable<Claim> claims)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(5),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ✅ Refresh token generator
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
