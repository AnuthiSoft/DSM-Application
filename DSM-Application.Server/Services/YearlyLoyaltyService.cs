//using DSM_Application.Server.Models;
//using Microsoft.Extensions.Options;
//using MongoDB.Driver;

//namespace DSM_Application.Server.Services
//{
//    public interface IYearlyLoyaltyService
//    {
//        Task<decimal> GetYearlyDiscountPercentAsync(string customerId);
//    }

//    public class YearlyLoyaltyService : IYearlyLoyaltyService
//    {
//        private readonly IMongoCollection<Order> _orders;
//        private readonly YearlyLoyaltyDiscountSettings _settings;

//        public YearlyLoyaltyService(IMongoDatabase database, IOptions<YearlyLoyaltyDiscountSettings> options)
//        {
//            _orders = database.GetCollection<Order>("Orders");
//            _settings = options.Value;
//        }

//        public async Task<decimal> GetYearlyDiscountPercentAsync(string customerId)
//        {
//            var oneYearAgo = DateTime.UtcNow.AddYears(-1);

//            var filter = Builders<Order>.Filter.And(
//                Builders<Order>.Filter.Eq(o => o.CustomerId, customerId),
//                Builders<Order>.Filter.Gte(o => o.OrderDate, oneYearAgo)
//            );

//            var count = await _orders.CountDocumentsAsync(filter);

//            return count >= _settings.ThresholdOrders ? _settings.ExtraDiscountPercent : 0m;
//        }
//    }
//}
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public interface IYearlyLoyaltyService
    {
        Task<decimal> GetYearlyDiscountPercentAsync(string customerId);
    }

    public class YearlyLoyaltyService : IYearlyLoyaltyService
    {
        private readonly IMongoCollection<Order> _orders;
        private readonly YearlyLoyaltyDiscountSettings _settings;

        public YearlyLoyaltyService(
            MongoDbService mongo,
            IOptions<YearlyLoyaltyDiscountSettings> options)
        {
            _orders = mongo.Orders;   // ✅ Use MongoDbService (already registered)
            _settings = options.Value;
        }

        public async Task<decimal> GetYearlyDiscountPercentAsync(string customerId)
        {
            var oneYearAgo = DateTime.UtcNow.AddYears(-1);

            var filter = Builders<Order>.Filter.And(
                Builders<Order>.Filter.Eq(o => o.CustomerId, customerId),
                Builders<Order>.Filter.Gte(o => o.OrderDate, oneYearAgo)
            );

            var count = await _orders.CountDocumentsAsync(filter);

            return count >= _settings.ThresholdOrders ? _settings.ExtraDiscountPercent : 0m;
        }
    }
}
