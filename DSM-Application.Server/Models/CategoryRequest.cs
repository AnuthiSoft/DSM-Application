using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class CategoryRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string DistributorId { get; set; } = string.Empty;

        public string CategoryName { get; set; } = string.Empty;
        public string SubCategoryName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty;

        public decimal GstPercent { get; set; }

        public string Status { get; set; } = "Pending"; // Pending / Approved / Rejected
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedByAdminId { get; set; }
    }
}
