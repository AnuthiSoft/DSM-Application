using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    public class CategoryAttribute
    {
        public string AttributeName { get; set; } = string.Empty;
        public string AttributeType { get; set; } = "text";
        public List<string>? Options { get; set; } = null;
        public bool IsRequired { get; set; } = false;
    }

    public class GstHistory
    {
        public decimal Rate { get; set; }
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    }

    [BsonIgnoreExtraElements]
    public class Category
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string CategoryId { get; set; } = ObjectId.GenerateNewId().ToString();
        // ✅ THIS IS THE MISSING PIECE
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;
        [BsonElement("parentId")]
        public ObjectId? ParentId { get; set; }

        public string? IconUrl { get; set; }
        public string? BannerUrl { get; set; }

        // NEW FIELD ↓↓↓
        [BsonElement("hsnCode")]
        public string? HsnCode { get; set; }
    

        // GST pulled automatically from HSN (or manually stored)
        public decimal GST { get; set; } = 0m;

        public List<CategoryAttribute> Attributes { get; set; } = new();

        public List<GstHistory> GstHistory { get; set; } = new();

        public int SortOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}