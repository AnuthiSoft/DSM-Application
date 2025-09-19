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


        public class RespondRequest
        {
            //[JsonPropertyName("connectionId")]
            public string ConnectionId { get; set; }

            //[JsonPropertyName("accept")]
            public bool Accept { get; set; }
        }
    }
}
