using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class HsnService
    {
        private readonly IMongoCollection<HSN> _hsn;

        public HsnService(MongoDbService db)
        {
            _hsn = db.HsnCodes;
        }

        public async Task<List<HSN>> GetAllAsync()
            => await _hsn.Find(_ => true).ToListAsync();

        public async Task<HSN?> GetByCodeAsync(string code)
            => await _hsn.Find(h => h.HsnCode == code).FirstOrDefaultAsync();
    }
}
