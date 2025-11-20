using DistributorManagementSystem.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace DistributorManagementSystem.Server.Models.DTOs
{
    public class TaskCreateDto
    {
        [Required] public string TaskTitle { get; set; }
        [Required] public TaskType TaskType { get; set; }
        [Required] public string AssignedTo { get; set; }
        public string AssignedBy { get; set; }

        public string RelatedOrderId { get; set; }
        public string RelatedCustomerId { get; set; }
        public string RelatedProductId { get; set; }

        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public DateTime? DueDate { get; set; }

        public string Description { get; set; }
        public string Location { get; set; }
        public string ManagerNotes { get; set; }
    }
}
