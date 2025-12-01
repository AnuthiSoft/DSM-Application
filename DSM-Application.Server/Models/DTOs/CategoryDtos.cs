namespace DSM_Application.Server.Models.DTOs
{
    // Distributor → Create Category
    public class CreateCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
    }

    // Admin → Approve Category
    public class ApproveCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
    }

    // Distributor → Create SubCategory
    public class CreateSubCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string SubCategoryName { get; set; } = string.Empty;
    }

    // Distributor → Create Item
    public class CreateItemDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string SubCategoryName { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal GstPercent { get; set; }
        public string Hsn { get; set; }
    }

    // Distributor → Request new Item (alternate flow)
    public class ItemTypeRequestDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string SubCategoryName { get; set; } = string.Empty;
        public string ItemTypeName { get; set; } = string.Empty;
        public decimal GstPercent { get; set; }
    }
}
