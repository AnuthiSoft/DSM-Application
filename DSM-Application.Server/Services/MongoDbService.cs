//using DistributorManagementSystem.Server.Models;
//using DSM_Application.Server.Models;
//using Microsoft.Extensions.Options;
//using MongoDB.Driver;
//using System.Diagnostics.Metrics;

//namespace DistributorManagementSystem.Server.Services
//{
//    public class MongoDbService
//    {
//        public IMongoDatabase Database { get; }


//        public MongoDbService(IOptions<MongoDbSettings> options)
//        {
//            var client = new MongoClient(options.Value.ConnectionString);
//            _db = client.GetDatabase(options.Value.DatabaseName);
//        }

//        public IMongoCollection<User> Users => _db.GetCollection<User>("Users");
//        public IMongoCollection<Distributor> Distributors => _db.GetCollection<Distributor>("Distributors");
//        public IMongoCollection<Product> Products => _db.GetCollection<Product>("Products");
//        public IMongoCollection<Customer> Customers => _db.GetCollection<Customer>("Customers");
//        public IMongoCollection<Employee> Employees => _db.GetCollection<Employee>("Employees");
//        //public IMongoCollection<Counter> Counters => _db.GetCollection<Counter>("Counters");
//        public IMongoCollection<Order> Orders => _db.GetCollection<Order>("Orders");
//        // ✅ Add this for connections
//        public IMongoCollection<CustomerDistributorConnection> Connections =>
//            _db.GetCollection<CustomerDistributorConnection>("Connections");
//        public IMongoCollection<RefreshToken> RefreshTokens =>
//    _db.GetCollection<RefreshToken>("RefreshTokens");
//    }

//    public class MongoDbSettings
//    {
//        public string ConnectionString { get; set; } = string.Empty;
//        public string DatabaseName { get; set; } = string.Empty;
//    }
//}

//namespace DistributorManagementSystem.Server.Services
//{
//    public class MongoDbService
//    {
//        public IMongoDatabase Database { get; }

//        public MongoDbService(IOptions<MongoDbSettings> options)
//        {
//            var client = new MongoClient(options.Value.ConnectionString);
//            Database = client.GetDatabase(options.Value.DatabaseName);
//        }

//        public IMongoCollection<User> Users => Database.GetCollection<User>("Users");
//        public IMongoCollection<Distributor> Distributors => Database.GetCollection<Distributor>("Distributors");
//        public IMongoCollection<Product> Products => Database.GetCollection<Product>("Products");
//        public IMongoCollection<Customer> Customers => Database.GetCollection<Customer>("Customers");
//        public IMongoCollection<Employee> Employees => Database.GetCollection<Employee>("Employees");
//        public IMongoCollection<Order> Orders => Database.GetCollection<Order>("Orders");
//        public IMongoCollection<CustomerDistributorConnection> Connections => Database.GetCollection<CustomerDistributorConnection>("Connections");
//        public IMongoCollection<RefreshToken> RefreshTokens => Database.GetCollection<RefreshToken>("RefreshTokens");
//    }

//    public class MongoDbSettings
//    {
//        public string ConnectionString { get; set; } = string.Empty;
//        public string DatabaseName { get; set; } = string.Empty;
//    }
//}


using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.Payments;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Services
{
    public class MongoDbService
    {
        //private readonly IMongoDatabase _db;
        public IMongoDatabase _db { get; }
        public MongoDbService(IOptions<MongoDbSettings> options)
        {
            var client = new MongoClient(options.Value.ConnectionString);
            _db = client.GetDatabase(options.Value.DatabaseName);

            // ✅ Create unique index for AadhaarNumber in Distributors collection
           
        }

        public IMongoCollection<User> Users => _db.GetCollection<User>("Users");
        public IMongoCollection<Distributor> Distributors => _db.GetCollection<Distributor>("Distributors");
        public IMongoCollection<Product> Products => _db.GetCollection<Product>("Products");
        public IMongoCollection<Customer> Customers => _db.GetCollection<Customer>("Customers");
        public IMongoCollection<Employee> Employees => _db.GetCollection<Employee>("Employees");
        public IMongoCollection<Order> Orders => _db.GetCollection<Order>("Orders");
        public IMongoCollection<CustomerDistributorConnection> Connections =>
            _db.GetCollection<CustomerDistributorConnection>("Connections");
        public IMongoCollection<RefreshToken> RefreshTokens =>
    _db.GetCollection<RefreshToken>("RefreshTokens");
        public IMongoCollection<Review> Reviews => _db.GetCollection<Review>("reviews");
        public IMongoCollection<FraudReport> FraudReports => _db.GetCollection<FraudReport>("fraudreports");
        public IMongoCollection<DistributorCategoryMap> DistributorCategoryMaps => _db.GetCollection<DistributorCategoryMap>("DistributorCategoryMap");
        public IMongoCollection<Category> Categories => _db.GetCollection<Category>("Categories");


        public IMongoCollection<Payment> Payments => _db.GetCollection<Payment>("Payments");

        // 🔥 NEW COLLECTION (ADDED WITHOUT TOUCHING OLD CODE)
        public IMongoCollection<Category> Categories =>
            _db.GetCollection<Category>("Categories");

        public IMongoCollection<CategoryRequest> CategoryRequests => _db.GetCollection<CategoryRequest>("CategoryRequests");

        public IMongoCollection<GstMaster> GstMaster =>
     _db.GetCollection<GstMaster>("GstMaster");


    }

    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
    }
}
