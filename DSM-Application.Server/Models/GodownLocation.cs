using MongoDB.Bson.Serialization.Attributes;

namespace DistributorManagementSystem.Server.Models
{
    public class GodownLocation
    {
        public string Name { get; set; } = string.Empty;

        public double Lat { get; set; }

        public double Lng { get; set; }

        // Radius for geofence (meters)
        public double RadiusMeters { get; set; } = 80;
    }
}