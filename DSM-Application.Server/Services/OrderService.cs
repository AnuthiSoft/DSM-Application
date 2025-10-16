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
