using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class DeliveryInvoice
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string EmployeeId { get; set; }
    public string PdfUrl { get; set; }
    public DateTime UploadedOn { get; set; }
}
