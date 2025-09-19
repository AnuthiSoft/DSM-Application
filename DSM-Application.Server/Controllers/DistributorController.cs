using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
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

        public DistributorController(MongoDbService mongoService)
        {
            _connections = mongoService.Connections;
            _customers = mongoService.Customers;
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
                      ConnectedOn =c.ConnectedOn
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
            return Ok(new { message = request.Accept ? "Request accepted" : "Request rejected" });
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
