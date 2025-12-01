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

        public DistributorController(MongoDbService mongoService, EmailService emailService)
        {
            _connections = mongoService.Connections;
            _customers = mongoService.Customers;
            _emailService = emailService;
        }

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
    }
}
