namespace DSM_Application.Server.Models.DTOs
{
    public class AddReviewDto
    {
        public string ReviewerId { get; set; }
        public string TargetId { get; set; }
        public string TargetType { get; set; } // "Distributor" / "Customer"
        public string Title { get; set; }
        public string Description { get; set; }
        public int Rating { get; set; }
    }
}
