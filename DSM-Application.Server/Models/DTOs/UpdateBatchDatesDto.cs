namespace DSM_Application.Server.Models.DTOs
{
    public class UpdateBatchDatesDto
    {
        public string BatchId { get; set; }
        public DateTime ManufactureDate { get; set; }
        public DateTime ExpiryDate { get; set; }
    }
}
