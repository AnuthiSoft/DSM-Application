using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DSM_Application.Server.Models
{
    [BsonIgnoreExtraElements]
    public class ReturnRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string OrderId { get; set; }
        public string ProductId { get; set; }

        public int ReturnQty { get; set; }

        public string Reason { get; set; }
        // Damaged | Expired | Excess

        public string ProductName { get; set; }

        public string CustomerName { get; set; }


        public string Status { get; set; }
        // Pending | Approved | Received | Completed | Rejected

        public string? RejectionReason { get; set; }

        public string DistributorId { get; set; } // ✅ ADD THIS

        public string CustomerId { get; set; } // ✅ ADD THIS

        public string? RejectedBy { get; set; } // "Customer" | "Distributor"


        public DateTime? PickupDate { get; set; }
        public string? PickupSlot { get; set; }
        public string? AssignedEmployeeId { get; set; }



        public string? PickupMessage { get; set; } // ✅ ADD (for customer UI)


        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        // ✅ ADD THIS
        public DateTime CreatedAt { get; set; }

        public List<ReturnImageInfo> Images { get; set; } = new();

    }


    //public class SchedulePickupDto
    //{
    //    public DateTime PickupDate { get; set; }
    //    public string PickupSlot { get; set; }
    //    public string EmployeeId { get; set; }
    //    public string Message { get; set; }
    //}


}
