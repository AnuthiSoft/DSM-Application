using DistributorManagementSystem.Server.Models.Enums;

namespace DistributorManagementSystem.Server.Models.DTOs
{
    public class TaskUpdateStatusDto
    {
        public EmployeeTaskStatus Status { get; set; }
        public string EmployeeRemarks { get; set; }
    }
}
