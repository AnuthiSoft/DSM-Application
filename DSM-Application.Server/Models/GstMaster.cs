using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class GstMaster
    {

        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        public string Hsn { get; set; }
        public string Description { get; set; }
        public decimal Gst { get; set; }
    }
}
