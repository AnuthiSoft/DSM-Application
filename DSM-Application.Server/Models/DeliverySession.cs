using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


[BsonIgnoreExtraElements]

public class DeliverySession
{
    [BsonId]
    public ObjectId Id { get; set; }
    public string DistributorId { get; set; }   // ⭐ ADD THIS
    public string EmployeeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public double TotalDistanceKm { get; set; }
    public List<LatLongPoint> Route { get; set; }
    // Add these NEW fields
    public double TotalKm { get; set; }         // Total Kilometers travelled
    public double DurationMinutes { get; set; } // Total Trip Duration
    public bool IsActive { get; set; }
}

public class LatLongPoint
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime Time { get; set; }         // NEW: timestamp per point

}
