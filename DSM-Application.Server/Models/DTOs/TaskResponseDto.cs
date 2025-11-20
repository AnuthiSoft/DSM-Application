using DistributorManagementSystem.Server.Models.Enums;

namespace DistributorManagementSystem.Server.Models.DTOs
{
    public class TaskResponseDto
    {
        public string TaskId { get; set; }
        public string TaskTitle { get; set; }
        public TaskType TaskType { get; set; }
        public TaskPriority Priority { get; set; }
        public EmployeeTaskStatus Status { get; set; }
        public string AssignedTo { get; set; }
    }
}
