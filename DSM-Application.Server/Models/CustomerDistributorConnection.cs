using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Data;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class CustomerDistributorConnection
    {
       
       
            [BsonId]
            [BsonRepresentation(BsonType.ObjectId)]
            public string Id { get; set; } 

            public string CustomerId { get; set; }
            public string DistributorId { get; set; }
            public DateTime ConnectedOn { get; set; } = DateTime.UtcNow;
            public DateTime DisconnectedOn { get; set; }
            public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;
            public string? PermanentEmployeeId { get; set; }
        

    }

    public enum ConnectionStatus
    {
        Pending,
        Accepted,
        Rejected,
        Disconnected
    }
}
