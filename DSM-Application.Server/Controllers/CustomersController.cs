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
        private readonly IMongoCollection<Customer> _customersCollection;

        public CustomersController(MongoDbService db, JwtService jwt, ProductService productService)
        {
            _db = db;
            _jwt = jwt;
            _productService = productService;
            _customersCollection = db.Customers;
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

        [HttpPut("update-customer/{customerId}")]
        public async Task<IActionResult> UpdateCustomer(string customerId, [FromBody] Customer updatedCustomer)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var existingCustomer = await _db.Customers
                .Find(c => c.CustomerId == customerId && c.AddedByDistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (existingCustomer == null)
                return NotFound("Customer not found or does not belong to this distributor");

            existingCustomer.Name = updatedCustomer.Name;
            existingCustomer.Email = updatedCustomer.Email;
            existingCustomer.PhoneNumber = updatedCustomer.PhoneNumber;
            existingCustomer.Address = updatedCustomer.Address;

            await _db.Customers.ReplaceOneAsync(c => c.CustomerId == customerId, existingCustomer);

            return Ok(new { message = "Customer updated successfully", customer = existingCustomer });
        }

        [HttpDelete("delete-customer/{customerId}")]
        public async Task<IActionResult> DeleteCustomer(string customerId)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var existingCustomer = await _db.Customers
                .Find(c => c.CustomerId == customerId && c.AddedByDistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (existingCustomer == null)
                return NotFound("Customer not found or does not belong to this distributor");

            await _db.Customers.DeleteOneAsync(c => c.CustomerId == customerId);

            return Ok(new { message = "Customer deleted successfully" });
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
        [HttpPost("connect-distributor")]
        public async Task<IActionResult> ConnectDistributor([FromBody] ConnectRequest request)
        {
            // Validate customer
            var customer = await _db.Customers.Find(c => c.CustomerId == request.CustomerId).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");

            var existing = await _db.Connections.Find(c => c.CustomerId == request.CustomerId && c.DistributorId == request.DistributorId).FirstOrDefaultAsync();
            if (existing != null)
            {
                if (existing.Status == ConnectionStatus.Disconnected || existing.Status == ConnectionStatus.Rejected)
                {
                    // Reactivate connection (set back to Pending)
                    var update = Builders<CustomerDistributorConnection>.Update
                        .Set(c => c.Status, ConnectionStatus.Pending)
                        .Set(c => c.ConnectedOn, DateTime.UtcNow)
                        .Unset(c => c.DisconnectedOn);

                    await _db.Connections.UpdateOneAsync(
                        c => c.CustomerId == request.CustomerId && c.DistributorId == request.DistributorId,
                        update
                    );

                    return Ok("Reconnection request sent successfully");
                }

                return BadRequest("Connection already exists");
            }

            // Otherwise create new connection
            var newConnection = new CustomerDistributorConnection
            {
                CustomerId = request.CustomerId,
                DistributorId = request.DistributorId,
                ConnectedOn = DateTime.UtcNow,
                Status = ConnectionStatus.Pending
            };

            await _db.Connections.InsertOneAsync(newConnection);
            return Ok("Connection request sent successfully");
        }
        // GET: api/customer/profile
        [HttpGet("profile")]
        public async Task<ActionResult<Customer>> GetProfile()
        {
            var customerId = User.FindFirstValue("CustomerId"); // matches JWT claim
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized();

            var customer = await _customersCollection.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
            if (customer == null)
                return NotFound();

            return Ok(customer);
        }

        // PUT: api/customer/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] Customer updatedCustomer)
        {
            Console.WriteLine("Incoming JWT Claims:");
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type} = {claim.Value}");
            }
            var customerId = User.FindFirstValue("CustomerId"); // match JWT
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized();

            var update = Builders<Customer>.Update
                .Set(c => c.Name, updatedCustomer.Name)
                .Set(c => c.Email, updatedCustomer.Email)
                .Set(c => c.PhoneNumber, updatedCustomer.PhoneNumber)
                .Set(c => c.Address, updatedCustomer.Address);

            var result = await _customersCollection.UpdateOneAsync(
                c => c.CustomerId == customerId,
                update
            );

            if (result.ModifiedCount == 0)
                return BadRequest("Profile update failed.");

            return NoContent();
        }
        [HttpGet("connected/{customerId}")]
        public async Task<IActionResult> GetConnectedDistributors(string customerId)
        {
            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId && c.Status == ConnectionStatus.Accepted)
                .ToListAsync();

            var distributors = new List<Distributor>();
            foreach (var conn in connections)
            {
                var dist = await _db.Distributors.Find(d => d.DistributorId == conn.DistributorId).FirstOrDefaultAsync();
                if (dist != null)
                    distributors.Add(dist);
            }

            return Ok(distributors);
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
