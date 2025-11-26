namespace DSM_Application.Server.Models.DTOs
{
    public class CategoryCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public decimal GST { get; set; } = 0m;
        public List<CategoryAttribute>? Attributes { get; set; } = new();
        public string? IconUrl { get; set; }
        public int SortOrder { get; set; } = 0;
    }

    public class CategoryUpdateDto : CategoryCreateDto
    {
        public string CategoryId { get; set; } = string.Empty;
    }
}
