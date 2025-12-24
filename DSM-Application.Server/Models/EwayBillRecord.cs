using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using DSM_Application.Server.Models.DTOs;

public class EwayBillRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }   // string is easier for Angular

    public string InvoiceId { get; set; }
    public string EwayBillNo { get; set; }
    public string GeneratedDate { get; set; }
    public string ValidUpto { get; set; }

    public EwayBillRequest RequestData { get; set; }
}
