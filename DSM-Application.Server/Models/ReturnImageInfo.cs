using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{

    [BsonIgnoreExtraElements] 
    public class ReturnImageInfo
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        public string ReturnId { get; set; }

        // ✅ Store ONLY blob URL
        public string BlobName { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}
