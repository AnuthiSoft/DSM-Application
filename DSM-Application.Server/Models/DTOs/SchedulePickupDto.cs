using System.ComponentModel.DataAnnotations;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models.DTOs
{

    [BsonIgnoreExtraElements]

    public class SchedulePickupDto
    {
        public DateTime PickupDate { get; set; }
        [Required]
        public string PickupSlot { get; set; } = string.Empty;

        [Required]
        public string EmployeeId { get; set; } = string.Empty;
        public string? Message { get; set; }
    }
}
