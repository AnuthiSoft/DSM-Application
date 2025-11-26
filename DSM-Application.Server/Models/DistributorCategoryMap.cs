using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class DistributorCategoryMap
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string DistributorId { get; set; } = string.Empty;

        // List of CategoryIds the distributor uses or is allowed to use
        public List<string> CategoryIds { get; set; } = new List<string>();

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
