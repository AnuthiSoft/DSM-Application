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

        [BsonElement("CustomerId")]
        public string CustomerId { get; set; }

        [BsonElement("DistributorId")]
        public string DistributorId { get; set; }

        [BsonElement("connectedOn")]
        public DateTime ConnectedOn { get; set; } = DateTime.UtcNow;

        [BsonElement("disconnectedOn")]
        public DateTime DisconnectedOn { get; set; }

        [BsonElement("status")]
        //[BsonRepresentation(BsonType.String)]
        public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;

        public string? PermanentEmployeeId { get; set; }
    }

    public enum ConnectionStatus
    {
        Pending = 0,
        Accepted = 1,
        Rejected =2,
        Disconnected =3
    }
}
