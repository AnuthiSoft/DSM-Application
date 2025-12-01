using DmsDistributor = DistributorManagementSystem.Server.Models.Distributor;

using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Text.Json.Serialization;


namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DistributorController : ControllerBase
    {
        private readonly IMongoCollection<CustomerDistributorConnection> _connections;
        private readonly IMongoCollection<Customer> _customers;
        private readonly EmailService _emailService;
        private readonly IMongoCollection<DistributorManagementSystem.Server.Models.Distributor> _distributors;

        private readonly IMongoCollection<User> _users;
        public DistributorController(MongoDbService mongoService, EmailService emailService)
        {
            _connections = mongoService.Connections;
            _customers = mongoService.Customers;
            _emailService = emailService;
            _distributors = mongoService.Distributors; // <- new
            _users = mongoService.Users;
        }

        //[HttpGet("debug")]
        //public async Task<IActionResult> DebugDistributors()
        //{
        //    var all = await _distributors.Find(Builders<DistributorManagementSystem.Server.Models.Distributor>.Filter.Empty).ToListAsync();
        //    return Ok(new
        //    {
        //        total = all.Count,
        //        first = all.FirstOrDefault()
        //    });
        //}

        //[HttpGet("ping")]
        //public IActionResult Ping()
        //{
        //    return Ok("Distributor API is alive!");
        //}


        // ---------- GET profile ----------
        [HttpGet("profile/{distributorId}")]
        public async Task<IActionResult> GetProfile(string distributorId)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "Distributor ID is required." });

            // 🔹 Directly compare with the Id property (it's stored as string due to BsonRepresentation)
            var distributor = await _distributors
                .Find(d => d.Id == distributorId || d.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return NotFound(new { message = $"Distributor not found for ID: {distributorId}" });

            return Ok(distributor);
        }


        // ---------- UPDATE profile ----------
        [HttpPut("profile/update/{distributorId}")]
        public async Task<IActionResult> UpdateProfile(string distributorId, [FromBody] DistributorManagementSystem.Server.Models.Distributor updatedData)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "distributorId is required" });

            try
            {
                var distributor = await _distributors
     .Find(d => d.Id == distributorId || d.DistributorId == distributorId)
     .FirstOrDefaultAsync();


                if (distributor == null)
                    return NotFound(new { message = "Distributor not found." });

                // Aadhaar Validation (Backend Mandatory)
                if (!string.IsNullOrWhiteSpace(updatedData.AadhaarNumber))
                {
                    if (!System.Text.RegularExpressions.Regex.IsMatch(updatedData.AadhaarNumber, @"^\d{12}$"))
                    {
                        return BadRequest(new { message = "Aadhaar number must be exactly 12 digits." });
                    }
                }


                // Update only editable fields
                // Update only allowed/editable fields (null-checks to avoid overwriting)
                distributor.Name = string.IsNullOrWhiteSpace(updatedData.Name) ? distributor.Name : updatedData.Name;
                distributor.PhoneNumber = string.IsNullOrWhiteSpace(updatedData.PhoneNumber) ? distributor.PhoneNumber : updatedData.PhoneNumber;
                distributor.Address = string.IsNullOrWhiteSpace(updatedData.Address) ? distributor.Address : updatedData.Address;
                distributor.AadhaarNumber = string.IsNullOrWhiteSpace(updatedData.AadhaarNumber) ? distributor.AadhaarNumber : updatedData.AadhaarNumber;
                distributor.BankName = string.IsNullOrWhiteSpace(updatedData.BankName) ? distributor.BankName : updatedData.BankName;
                distributor.AccountNumber = string.IsNullOrWhiteSpace(updatedData.AccountNumber) ? distributor.AccountNumber : updatedData.AccountNumber;
                distributor.IFSCCode = string.IsNullOrWhiteSpace(updatedData.IFSCCode) ? distributor.IFSCCode : updatedData.IFSCCode;
                distributor.UPIId = string.IsNullOrWhiteSpace(updatedData.UPIId) ? distributor.UPIId : updatedData.UPIId;
                distributor.ProfileImageUrl = string.IsNullOrWhiteSpace(updatedData.ProfileImageUrl) ? distributor.ProfileImageUrl : updatedData.ProfileImageUrl;

                // UPDATE CATEGORIES (append-only)
                if (updatedData.Categories != null)
                {
                    foreach (var cat in updatedData.Categories)
                    {
                        if (!string.IsNullOrWhiteSpace(cat) &&
                            (distributor.Categories == null || !distributor.Categories.Contains(cat)))
                        {
                            distributor.Categories ??= new List<string>();
                            distributor.Categories.Add(cat);
                        }
                    }
                }


                distributor.LastUpdatedAt = DateTime.UtcNow;


                await _distributors.ReplaceOneAsync(d => d.Id == distributor.Id, distributor);

                return Ok(new { message = "Profile updated successfully.", distributor });
            }
            catch (FormatException)
            {
                return BadRequest(new { message = "Invalid distributor ID format." });
            }
        }


        //// ---------- CHANGE PASSWORD (optional) ----------
        //[HttpPut("profile/change-password/{userId}")]
        //public async Task<IActionResult> ChangePassword(string userId, [FromBody] ChangePasswordRequest request)
        //{
        //    if (string.IsNullOrEmpty(userId))
        //        return BadRequest(new { message = "userId is required" });

        //    var user = await _users.Find(u => u.Id == userId && u.Role == "Distributor").FirstOrDefaultAsync();
        //    if (user == null)
        //        return NotFound(new { message = "User not found." });

        //    if (string.IsNullOrWhiteSpace(request.NewPassword))
        //        return BadRequest(new { message = "New password cannot be empty." });

        //    // Hash the password before storing. This uses BCrypt.Net
        //    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        //    await _users.ReplaceOneAsync(u => u.Id == userId, user);

        //    return Ok(new { message = "Password updated successfully." });
        //}

        //// DTO used by change-password endpoint
        //public class ChangePasswordRequest
        //{
        //    public string NewPassword { get; set; }
        //}


        [HttpGet("connection-requests")]
        public async Task<IActionResult> GetPendingRequests([FromQuery] string distributorId)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "distributorId is required" });

            var requests = await _connections
                .Find(c => c.DistributorId == distributorId && c.Status == ConnectionStatus.Pending)
                .ToListAsync();

            var result = requests.Select(c =>
            {
                var customer = _customers.Find(x => x.CustomerId == c.CustomerId).FirstOrDefault();
                return new ConnectionRequestDto
                {
                    ConnectionId = c.Id,
                    CustomerId = c.CustomerId,
                    Name = customer?.Name,
                    Email = customer?.Email,
                    PhoneNumber = customer?.PhoneNumber,
                    Status = c.Status.ToString(),
                    ConnectedOn = c.ConnectedOn
                };
            }).ToList();

            // Return the actual pending requests as JSON
            return Ok(result);
        }

        // New: Get accepted (connected) customers for the distributor
        [HttpGet("accepted-customers")]
        public async Task<IActionResult> GetAcceptedCustomers([FromQuery] string distributorId)
        {
            distributorId = distributorId ?? User.FindFirst("DistributorId")?.Value;
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "distributorId is required" });

            var connections = await _connections
                .Find(c => c.DistributorId == distributorId && c.Status == ConnectionStatus.Accepted)
                .ToListAsync();

            var result = connections.Select(c =>
            {
                var customer = _customers.Find(x => x.CustomerId == c.CustomerId).FirstOrDefault();
                return new ConnectionRequestDto
                {
                    ConnectionId = c.Id,
                    CustomerId = c.CustomerId,
                    Name = customer?.Name,
                    Email = customer?.Email,
                    PhoneNumber = customer?.PhoneNumber,
                    Status = c.Status.ToString(),
                    ConnectedOn = c.ConnectedOn
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost("respond-connection")]
        public async Task<IActionResult> RespondConnection([FromBody] RespondRequest request)
        {
            var connection = await _connections.Find(c => c.Id == request.ConnectionId).FirstOrDefaultAsync();
            if (connection == null) return NotFound("Connection not found");

            connection.Status = request.Accept ? ConnectionStatus.Accepted : ConnectionStatus.Rejected;
            await _connections.ReplaceOneAsync(c => c.Id == request.ConnectionId, connection);

            // Fetch customer details for notification
            var customer = await _customers.Find(x => x.CustomerId == connection.CustomerId).FirstOrDefaultAsync();
            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                var subject = request.Accept
                    ? "Your Distributor Request has been Accepted"
                    : "Your Distributor Request has been Rejected";

                var body = request.Accept
                    ? $"Hi {customer.Name},\n\nGood news! Your request to connect with distributor ({connection.DistributorId}) has been ACCEPTED."
                    : $"Hi {customer.Name},\n\nUnfortunately, your request to connect with distributor ({connection.DistributorId}) has been REJECTED.";

                _emailService.SendEmailAsync(customer.Email, subject, body);
            }

            return Ok(new { message = request.Accept ? "Request accepted and notification sent" : "Request rejected and notification sent" });
        }

        // New: Disconnect customer (soft) using connectionId
        [HttpPost("disconnect-customer")]
        public async Task<IActionResult> DisconnectCustomer([FromBody] DisconnectRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.ConnectionId))
                return BadRequest(new { message = "ConnectionId is required" });

            var connection = await _connections.Find(c => c.Id == request.ConnectionId).FirstOrDefaultAsync();
            if (connection == null) return NotFound("Connection not found");

            // Mark disconnected
            connection.Status = ConnectionStatus.Disconnected;
            connection.DisconnectedOn = DateTime.UtcNow;
            await _connections.ReplaceOneAsync(c => c.Id == request.ConnectionId, connection);

            // Notify customer by email (optional)
            var customer = await _customers.Find(x => x.CustomerId == connection.CustomerId).FirstOrDefaultAsync();
            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                var subject = "Your Distributor Connection has been Disconnected";
                var body = $"Hi {customer.Name},\n\nThe distributor ({connection.DistributorId}) has disconnected you. You may send a new connection request if needed.";
                await _emailService.SendEmailAsync(customer.Email, subject, body);
            }

            return Ok(new { message = "Customer disconnected successfully" });
        }

        public class RespondRequest
        {
            //[JsonPropertyName("connectionId")]
            public string ConnectionId { get; set; }

            //[JsonPropertyName("accept")]
            public bool Accept { get; set; }
        }

        public class DisconnectRequest
        {
            public string ConnectionId { get; set; }
        }


        [HttpPost("add-category/{distributorId}")]
        public async Task<IActionResult> AddCategory(string distributorId, [FromBody] string newCategory)
        {
            if (string.IsNullOrWhiteSpace(newCategory))
                return BadRequest("Category cannot be empty");

            var distributor = await _distributors
                .Find(d => d.Id == distributorId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return NotFound(new { message = "Distributor not found" });

            // Initialize list if null
            distributor.Categories ??= new List<string>();

            // Avoid duplicates
            if (distributor.Categories.Contains(newCategory, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new { message = "Category already exists" });

            // Add new category
            distributor.Categories.Add(newCategory);

            // Update DB
            await _distributors.UpdateOneAsync(
                d => d.Id == distributorId,
                Builders<Distributor>.Update.Set(d => d.Categories, distributor.Categories)
            );

            return Ok(new
            {
                message = "Category added successfully",
                categories = distributor.Categories
            });
        }

    }
}