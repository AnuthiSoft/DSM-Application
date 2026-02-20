using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class LiveLocation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string EmployeeId { get; set; }
    public string DistributorId { get; set; }

    // ✅ MATCH CONTROLLER
    public double Lat { get; set; }
    public double Lng { get; set; }


    public bool IsInsideGodown { get; set; } = false; // ✅ DEFAULT
    public bool IsIgnored { get; set; }   // true = inside godown
    public DateTime Time { get; set; } = DateTime.UtcNow; // ✅ DEFAULT
}
