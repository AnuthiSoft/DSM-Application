using System.Text.Json.Serialization;

namespace DSM_Application.Server.Models.DTOs
{
    public class CategoryCreateDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        [JsonPropertyName("parentId")]
    public string? ParentId { get; set; }

        public decimal GST { get; set; } = 0m;

        public List<CategoryAttribute>? Attributes { get; set; } = new();
        public string? IconUrl { get; set; }
        public int SortOrder { get; set; } = 0;
        [JsonPropertyName("hsnCode")]
        public string? HsnCode { get; set; }
    }

    public class CategoryUpdateDto : CategoryCreateDto
    {
        public string CategoryId { get; set; } = string.Empty;
        public string? HsnCode { get; set; }
    }
}
