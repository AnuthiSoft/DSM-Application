using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class EmployeeAvailability
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string EmployeeId { get; set; }
        public DateTime Date { get; set; }            // store Date only (UTC date)
        public bool IsAvailable { get; set; } = true;
        public string? Reason { get; set; } = null;
    }
}
