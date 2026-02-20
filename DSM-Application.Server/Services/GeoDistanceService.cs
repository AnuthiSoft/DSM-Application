namespace DistributorManagementSystem.Server.Services
{
    public static class GeoDistanceService
    {
        private const double EarthRadius = 6371000; // meters

        public static double GetDistanceInMeters(
            double lat1, double lon1,
            double lat2, double lon2)
        {
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);

            lat1 = ToRadians(lat1);
            lat2 = ToRadians(lat2);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(lat1) * Math.Cos(lat2) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadius * c;
        }

        private static double ToRadians(double deg) => deg * (Math.PI / 180);
    }
}
