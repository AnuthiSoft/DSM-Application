using MongoDB.Bson;

namespace DSM_Application.Server.Models
{
    public class InvoiceUpload
    {
        public ObjectId Id { get; set; }
        public string EmployeeId { get; set; } = null!;
        public byte[] FileData { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public string ContentType { get; set; } = "application/pdf";
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
