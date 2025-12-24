using MongoDB.Bson;

public class LiveLocation
{
    public ObjectId Id { get; set; }
    public string EmployeeId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime Time { get; set; }
}
