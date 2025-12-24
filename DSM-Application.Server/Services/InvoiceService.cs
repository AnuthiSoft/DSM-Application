using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Services

{
    public class InvoiceService
    {
        private readonly IMongoCollection<Invoice> _invoices;

        public InvoiceService(MongoDbService dbService)
        {
            _invoices = dbService.GetDatabase().GetCollection<Invoice>("Invoices");
        }

        public Task<List<Invoice>> GetAllAsync(string distributorId) =>
            _invoices.Find(x => x.DistributorId == distributorId).ToListAsync();

        public Task<Invoice?> GetByIdAsync(string id) =>
            _invoices.Find(x => x.Id == id).FirstOrDefaultAsync();

        public Task CreateAsync(Invoice invoice) =>
            _invoices.InsertOneAsync(invoice);

        public Task UpdateAsync(string id, Invoice updated) =>
            _invoices.ReplaceOneAsync(x => x.Id == id, updated);

        public Task DeleteAsync(string id) =>
            _invoices.DeleteOneAsync(x => x.Id == id);

        public Task UpdateEwayBillAsync(string id, string ewayBillNo)
        {
            var update = Builders<Invoice>.Update.Set(x => x.EwayBillNo, ewayBillNo);
            return _invoices.UpdateOneAsync(x => x.Id == id, update);
        }

    }

}
