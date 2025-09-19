using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly JwtService _jwt;
        private readonly ProductService _productService;

        public CustomersController(MongoDbService db, JwtService jwt, ProductService productService)
        {
            _db = db;
            _jwt = jwt;
            _productService = productService;
        }

        // 🌍 Global Registration
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CustomerRegisterRequest request)
        {
            var existing = await _db.Customers.Find(c => c.Email == request.Email).FirstOrDefaultAsync();
            if (existing != null)
                return BadRequest("Customer already exists");

            var customer = new Customer
            {
                Name = request.Name,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = ComputeHash(request.Password),
                IsRegistered = true
            };

            await _db.Customers.InsertOneAsync(customer);
            return Ok(new { message = "Customer registered successfully", customer });
        }

        // 🔑 Global Login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] CustomerLoginRequest request)
        {
            var customer = await _db.Customers.Find(c => c.Email == request.Email).FirstOrDefaultAsync();
            if (customer == null) return Unauthorized("Customer not found");

            if (!customer.IsRegistered)
                return Unauthorized("You must create password first (distributor added you)");

            if (customer.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // Generate JWT for customer
            var token = _jwt.GenerateCustomerToken(customer);
            return Ok(new { token, customer , role = customer.Role,customerId=customer.CustomerId });
        }


        [Authorize(Roles = "Distributor")]
        [HttpPost("create-by-distributor")]
        public async Task<IActionResult> CreateByDistributor([FromBody] Customer customer)
        {
            var existing = await _db.Customers.Find(c => c.Email == customer.Email).FirstOrDefaultAsync();
            if (existing != null)
                return BadRequest("Customer already exists");

            // ✅ Read "DistributorId" claim instead of ClaimTypes.NameIdentifier
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            customer.AddedByDistributorId = distributorId;
            customer.IsRegistered = false;
            customer.PasswordHash = null;

            await _db.Customers.InsertOneAsync(customer);

            return Ok(new { message = "Customer created by distributor. Customer must set password.", customer });
        }
        [Authorize(Roles = "Distributor")]
        [HttpGet("my-customers")]
        public async Task<IActionResult> GetCustomersByDistributor()
        {
            // Get distributor ID from JWT claims
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            // Fetch customers added by this distributor
            var customers = await _db.Customers
                .Find(c => c.AddedByDistributorId == distributorId)
                .ToListAsync();

            return Ok(customers);
        }


        // 🔑 First-time password creation for distributor-added customer
        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] CustomerLoginRequest request)
        {
            var customer = await _db.Customers.Find(c => c.Email == request.Email).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");

            if (customer.IsRegistered)
                return BadRequest("Password already created. Please login.");

            var update = Builders<Customer>.Update
                .Set(c => c.PasswordHash, ComputeHash(request.Password))
                .Set(c => c.IsRegistered, true);

            await _db.Customers.UpdateOneAsync(c => c.CustomerId == customer.CustomerId, update);
            return Ok("Password created successfully. You can now login.");
        }
        //[Authorize(Roles = "Customer")]
        [HttpGet("dashboard/{customerId}")]
        public async Task<IActionResult> GetCustomerDashboard(string customerId)
        {
            var customer = await _db.Customers.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");
            // Collection of connections
            // Get all connections for this customer
            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId)
                .ToListAsync();
            // Global customer: show all distributors + products if connection accepted
            if (string.IsNullOrEmpty(customer.AddedByDistributorId))
            {
                var allDistributors = await _db.Distributors.Find(_ => true).ToListAsync();
                var distributorsWithProducts = new List<object>();

                foreach (var dist in allDistributors)
                {
                    var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
                    dist.Status = conn?.Status.ToString();

                    List<Product> products = new();
                    if (conn != null && conn.Status == ConnectionStatus.Accepted)
                    {
                        // Fetch products for this distributor
                        products = await _productService.GetProductsByDistributorAsync(dist.DistributorId);
                    }

                    distributorsWithProducts.Add(new
                    {
                        distributor = dist,
                        products = products
                    });
                }

                return Ok(new
                {
                    isGlobal = true,
                    distributors = distributorsWithProducts
                });
            }

            else
            {
                // Distributor-specific customer => return that distributor and products
                // Distributor-specific customer: show only that distributor + products
                var distributor = await _productService.GetDistributorByIdAsync(customer.AddedByDistributorId);
                if (distributor == null) return NotFound("Distributor not found");

                var connectionSpecific = connections.FirstOrDefault(c => c.DistributorId == distributor.DistributorId);
                List<Product> distributorProducts = new();
                if (connectionSpecific == null || connectionSpecific.Status == ConnectionStatus.Accepted)
                {
                    distributorProducts = await _productService.GetProductsByDistributorAsync(distributor.DistributorId);
                }

                return Ok(new
                {
                    isGlobal = false,
                    distributor,
                    products = distributorProducts
                });
            }
        }
        //[Authorize(Roles = "Customer")]
        [HttpPost("connect-distributor")]
        public async Task<IActionResult> ConnectDistributor([FromBody] ConnectRequest request)
        {
            // Validate customer
            var customer = await _db.Customers.Find(c => c.CustomerId == request.CustomerId).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");

            // Optionally check if already connected
            var existing = await _db.Connections.Find(c => c.CustomerId == request.CustomerId && c.DistributorId == request.DistributorId).FirstOrDefaultAsync();
            if (existing != null) return BadRequest("Already connected");

            // Save connection
            var newConnection = new CustomerDistributorConnection
            {
                CustomerId = request.CustomerId,
                DistributorId = request.DistributorId,
                ConnectedOn = DateTime.UtcNow
            };
            await _db.Connections.InsertOneAsync(newConnection);

            return Ok("Connection request sent successfully");
        }

        public class ConnectRequest
        {
            public string CustomerId { get; set; }
            public string DistributorId { get; set; }
        }

        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }
       
    }
}
