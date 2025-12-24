using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class EmployeeDevice
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string EmployeeId { get; set; }
    public string DeviceId { get; set; }
    public bool IsActive { get; set; }
    public DateTime RegisteredAt { get; set; }
}
