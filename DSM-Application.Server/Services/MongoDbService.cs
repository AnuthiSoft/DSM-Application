using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Diagnostics.Metrics;

namespace DistributorManagementSystem.Server.Services
{
    public class MongoDbService
    {
        private readonly IMongoDatabase _db;

        public MongoDbService(IOptions<MongoDbSettings> options)
        {
            var client = new MongoClient(options.Value.ConnectionString);
            _db = client.GetDatabase(options.Value.DatabaseName);
        }

        public IMongoCollection<User> Users => _db.GetCollection<User>("Users");
        public IMongoCollection<Distributor> Distributors => _db.GetCollection<Distributor>("Distributors");
        public IMongoCollection<Product> Products => _db.GetCollection<Product>("Products");
        public IMongoCollection<Customer> Customers => _db.GetCollection<Customer>("Customers");
        public IMongoCollection<Employee> Employees => _db.GetCollection<Employee>("Employees");
        //public IMongoCollection<Counter> Counters => _db.GetCollection<Counter>("Counters");
        public IMongoCollection<Order> Orders => _db.GetCollection<Order>("Orders");
        // ✅ Add this for connections
        public IMongoCollection<CustomerDistributorConnection> Connections =>
            _db.GetCollection<CustomerDistributorConnection>("Connections");
        public IMongoCollection<RefreshToken> RefreshTokens =>
    _db.GetCollection<RefreshToken>("RefreshTokens");
    }

    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
    }
}

