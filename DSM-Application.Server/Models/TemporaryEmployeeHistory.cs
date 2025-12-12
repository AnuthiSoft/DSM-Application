using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class TemporaryEmployeeHistory
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string CustomerId { get; set; }
    public string TemporaryEmployeeId { get; set; }
    public string TemporaryEmployeeName { get; set; }
    public DateTime AssignedDate { get; set; }
}
