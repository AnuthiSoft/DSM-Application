using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

public class NullableDecimalSafeSerializer : SerializerBase<decimal?>
{
    public override decimal? Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
    {
        var reader = context.Reader;
        var bsonType = reader.GetCurrentBsonType();

        switch (bsonType)
        {
            case BsonType.Null:
                reader.ReadNull();
                return null;

            case BsonType.Decimal128:
                return (decimal)reader.ReadDecimal128();

            case BsonType.Double:
                return (decimal)reader.ReadDouble();

            case BsonType.Int32:
                return reader.ReadInt32();

            case BsonType.Int64:
                return reader.ReadInt64();

            case BsonType.String:
                var str = reader.ReadString();
                if (decimal.TryParse(str, out var parsed))
                    return parsed;
                return null;

            default:
                reader.SkipValue();
                return null;
        }
    }

    public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, decimal? value)
    {
        var writer = context.Writer;

        if (value.HasValue)
        {
            writer.WriteDecimal128((Decimal128)value.Value);
        }
        else
        {
            writer.WriteNull();
        }
    }
}
