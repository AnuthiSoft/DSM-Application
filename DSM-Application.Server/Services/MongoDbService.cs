using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using YourApp.Models;

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

        // ⭐ Required for InvoiceService, EmployeeService, etc.
        public IMongoDatabase GetDatabase()
        {
            return _db;
        }

        // ⭐⭐ VERY IMPORTANT: expose database ⭐⭐
        public IMongoDatabase Database => _db;

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
        public IMongoCollection<ReturnImageInfo> ReturnImages =>
        _db.GetCollection<ReturnImageInfo>("ReturnImages");




        public IMongoCollection<ReturnRequest> ReturnRequests =>
    _db.GetCollection<ReturnRequest>("ReturnRequests");


        public IMongoCollection<TemporaryAssignment> TemporaryAssignments =>
    _db.GetCollection<TemporaryAssignment>("temporaryAssignments");
        public IMongoCollection<EmployeeAvailability> EmployeeAvailability =>
    _db.GetCollection<EmployeeAvailability>("EmployeeAvailability");

        public IMongoCollection<PaymentCollectionHistory> PaymentHistory =>
    _db.GetCollection<PaymentCollectionHistory>("PaymentCollectionHistory");
        public IMongoCollection<HSN> HsnCodes => _db.GetCollection<HSN>("HsnCodes");

        
  public IMongoCollection<Otp> Otps =>
          _db.GetCollection<Otp>("Otps");
        public IMongoCollection<CustomerPaymentReceipt> CustomerPaymentReceipts =>
    _db.GetCollection<CustomerPaymentReceipt>("CustomerPaymentReceipt");

        public IMongoCollection<InventoryItem> InventoryItems =>
    _db.GetCollection<InventoryItem>("InventoryItems");   // summary stock

        public IMongoCollection<InventoryBatch> Inventory =>
            _db.GetCollection<InventoryBatch>("Inventory");       // 🔥 batches

        public IMongoCollection<InventoryBatch> InventoryBatches =>_db.GetCollection<InventoryBatch>("InventoryBatches");
        public IMongoCollection<InvoiceUpload> InvoiceUploads =>
            _db.GetCollection<InvoiceUpload>("InvoiceUploads");
        public IMongoCollection<OrderProduct> OrderProducts =>
          _db.GetCollection<OrderProduct>("OrderProduct");

        public IMongoCollection<Cart> Carts =>
    _db.GetCollection<Cart>("Carts");

    }

    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;


       


    }
}
