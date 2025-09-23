using MongoDB.Bson;
using System.Data;

namespace DSM_Application.Server.Models
{
    public class CustomerDistributorConnection
    {
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        public string CustomerId { get; set; }
        public string DistributorId { get; set; }
        public DateTime ConnectedOn { get; set; } = DateTime.UtcNow;
        public DateTime DisconnectedOn { get; set; } = DateTime.UtcNow;
        public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending; // Default pending
    }

    public enum ConnectionStatus
    {
        Pending,
        Accepted,
        Rejected,
        Disconnected
    }
}
