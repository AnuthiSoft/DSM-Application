//using DistributorManagementSystem.Server.Services;
//using DSM_Application.Server.Models;
//using MongoDB.Driver;

//namespace DSM_Application.Server.Services
//{
//    public class OrderService
//    {
//        private readonly IMongoCollection<Order> _orders;
//        private readonly IMongoCollection<Customer> _customers;

//        public OrderService(MongoDbService db)
//        {
//            _orders = db.Orders;
//            _customers = db.Customers;
//        }

//        // Place order with validation
//        public async Task<Order> PlaceOrderAsync(Order order)
//        {
//            // Fetch customer
//            var customer = await _customers.Find(c => c.CustomerId == order.CustomerId).FirstOrDefaultAsync();
//            if (customer == null)
//                throw new System.Exception("Customer not found");

//            // Validation: distributor access
//            if (customer.AddedByDistributorId != null)
//            {
//                if (customer.AddedByDistributorId != order.DistributorId)
//                    throw new System.Exception("Customer not allowed to order from this distributor");
//            }
//            else if (customer.ConnectedDistributors != null && !customer.ConnectedDistributors.Contains(order.DistributorId))
//            {
//                throw new System.Exception("Customer not connected to this distributor");
//            }

//            await _orders.InsertOneAsync(order);
//            return order;
//        }

//        // Get orders by distributor
//        public async Task<List<Order>> GetOrdersByDistributorAsync(string distributorId)
//        {
//            return await _orders.Find(o => o.DistributorId == distributorId).ToListAsync();
//        }
//    }
//}
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

public class OrderService
{
    private readonly IMongoCollection<Order> _orders;
    private readonly IMongoCollection<Customer> _customers;
    private readonly TemporaryAssignmentService _tempService;
    private readonly IMongoCollection<CustomerDistributorConnection> _connections;

    public OrderService(IMongoDatabase db, TemporaryAssignmentService tempService)
    {
        _orders = db.GetCollection<Order>("orders");
        _customers = db.GetCollection<Customer>("customers");
        _tempService = tempService;
        _connections = db.GetCollection<CustomerDistributorConnection>("connections");
    }

    public async Task CreateOrderAsync(Order order)
    {
        // Validate customer
        var customer = await _customers
            .Find(x => x.CustomerId == order.CustomerId)
            .FirstOrDefaultAsync();

        if (customer == null)
            throw new Exception("Customer not found");

        // Fetch distributor-customer connection
        var connection = await _connections
            .Find(x => x.CustomerId == order.CustomerId &&
                       x.DistributorId == order.DistributorId)
            .FirstOrDefaultAsync();

        if (connection == null)
            throw new Exception("Customer is not connected to this distributor");

        var today = DateTime.UtcNow.Date;

        // 💥 NEW LOGIC — Check if temporary employee is active TODAY
        var todayTemp = await _tempService
            .GetTemporaryForDateAsync(order.DistributorId, order.CustomerId, today);

        string? assignedEmployeeId;

        if (todayTemp != null)
        {
            // Temporary employee works today
            assignedEmployeeId = todayTemp.TemporaryEmployeeId;
        }
        else
        {
            // Permanent employee works today
            assignedEmployeeId = connection.PermanentEmployeeId;
        }

        if (assignedEmployeeId == null)
            throw new Exception("No employee available for this customer today.");

        // Assign to order
        order.AssignedEmployeeId = assignedEmployeeId;
        order.CreatedAt = DateTime.UtcNow;

        await _orders.InsertOneAsync(order);
    }
}
