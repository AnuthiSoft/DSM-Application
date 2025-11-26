namespace DSM_Application.Server.Models.DTOs
{
    public class AddFraudReportDto
    {
        public string ReportedById { get; set; }
        public string TargetId { get; set; }
        public string TargetType { get; set; } // "Distributor" / "Customer"
        public string Reason { get; set; }
        public string EvidenceUrl { get; set; } // optional
    }
}
