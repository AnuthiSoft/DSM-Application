using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class EwayBillService
    {
        private readonly IMongoCollection<EwayBillRecord> _ewayBills;

        public EwayBillService(IMongoDatabase database)
        {
            _ewayBills = database.GetCollection<EwayBillRecord>("EwayBills");
        }

        // 🔹 Generate E-Way Bill
        public async Task<EwayBillRecord> GenerateAsync(EwayBillRequest request)
        {
            var record = new EwayBillRecord
            {
               
                EwayBillNo = DateTime.UtcNow.Ticks.ToString(),
                GeneratedDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                ValidUpto = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                RequestData = request
            };

            await _ewayBills.InsertOneAsync(record);
            return record;
        }

        // 🔹 Get all E-Way Bills
        public async Task<List<EwayBillRecord>> GetAllAsync()
        {
            return await _ewayBills.Find(_ => true).ToListAsync();
        }

        // 🔹 Delete E-Way Bill
        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _ewayBills.DeleteOneAsync(x => x.Id == id);
            return result.DeletedCount > 0;
        }
    }
}
