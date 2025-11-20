using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using DistributorManagementSystem.Server.Models.Enums;

namespace DistributorManagementSystem.Server.Models
{
    public class TaskModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string TaskId { get; set; }

        public string TaskTitle { get; set; }
        public TaskType TaskType { get; set; }

        public string AssignedBy { get; set; }
        public string AssignedTo { get; set; }

        public string RelatedOrderId { get; set; }
        public string RelatedCustomerId { get; set; }
        public string RelatedProductId { get; set; }

        public TaskPriority Priority { get; set; }
        public EmployeeTaskStatus Status { get; set; } = EmployeeTaskStatus.Pending;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }

        public string Description { get; set; }
        public string Location { get; set; }

        public List<string> Attachments { get; set; } = new();
        public string EmployeeRemarks { get; set; }
        public string ManagerNotes { get; set; }
    }
}
