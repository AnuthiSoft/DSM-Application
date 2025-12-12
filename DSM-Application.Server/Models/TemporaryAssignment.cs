using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class TemporaryAssignment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string DistributorId { get; set; }
        public string CustomerId { get; set; }
        public string TemporaryEmployeeId { get; set; }
        public DateTime AssignedDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
