using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class FraudService
    {
        private readonly IMongoCollection<FraudReport> _fraud;
        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<Distributor> _distributors;
        private readonly IMongoCollection<Customer> _customers;

        public int AutoBlockThreshold = 3; // configurable limit

        public FraudService(MongoDbService ctx)
        {
            _fraud = ctx.FraudReports;
            _users = ctx.Users;
            _distributors = ctx.Distributors;
            _customers = ctx.Customers;
        }

        public Task AddAsync(FraudReport r) => _fraud.InsertOneAsync(r);

        public Task<List<FraudReport>> GetPendingAsync() =>
            _fraud.Find(fr => fr.Status == "Pending").ToListAsync();

        public Task<FraudReport> GetByIdAsync(string id) =>
            _fraud.Find(fr => fr.Id == id).FirstOrDefaultAsync();

        public Task UpdateStatusAsync(string id, string status) =>
            _fraud.UpdateOneAsync(fr => fr.Id == id, Builders<FraudReport>.Update.Set(fr => fr.Status, status));

        //public async Task OnFraudApprovedAsync(string fraudReportId)
        //{
        //    var report = await GetByIdAsync(fraudReportId);
        //    if (report == null) return;

        //    var targetId = report.TargetId;
        //    var targetType = report.TargetType?.Trim().ToLower();

        //    // 🧩 1️⃣ Always update Users collection
        //    // Find user linked via DistributorId or direct User.Id
        //    var userFilter = Builders<User>.Filter.Or(
        //        Builders<User>.Filter.Eq(u => u.Id, targetId),
        //        Builders<User>.Filter.Eq(u => u.DistributorId, targetId)
        //    );

        //    await _users.UpdateOneAsync(
        //        userFilter,
        //        Builders<User>.Update.Inc(u => u.FraudCount, 1)
        //    );

        //    var linkedUser = await _users.Find(userFilter).FirstOrDefaultAsync();
        //    if (linkedUser != null && linkedUser.FraudCount >= AutoBlockThreshold)
        //    {
        //        await _users.UpdateOneAsync(
        //            userFilter,
        //            Builders<User>.Update.Set(u => u.IsBlocked, true)
        //        );
        //    }

        //    // 🧩 2️⃣ Update target collection (Distributor / Customer)
        //    if (targetType == "distributor")
        //    {
        //        await _distributors.UpdateOneAsync(
        //            d => d.DistributorId == targetId,
        //            Builders<Distributor>.Update.Inc(d => d.FraudCount, 1)
        //        );

        //        var dist = await _distributors.Find(d => d.DistributorId == targetId).FirstOrDefaultAsync();
        //        if (dist != null && dist.FraudCount >= AutoBlockThreshold)
        //        {
        //            await _distributors.UpdateOneAsync(
        //                d => d.DistributorId == targetId,
        //                Builders<Distributor>.Update.Set(d => d.IsActive, false)
        //            );
        //        }
        //    }
        //    else if (targetType == "customer")
        //    {
        //        await _customers.UpdateOneAsync(
        //            c => c.CustomerId == targetId,
        //            Builders<Customer>.Update.Inc(c => c.FraudCount, 1)
        //        );

        //        var cust = await _customers.Find(c => c.CustomerId == targetId).FirstOrDefaultAsync();
        //        if (cust != null && cust.FraudCount >= AutoBlockThreshold)
        //        {
        //            await _customers.UpdateOneAsync(
        //                c => c.CustomerId == targetId,
        //                Builders<Customer>.Update.Set(c => c.IsActive, false)
        //            );
        //        }
        //    }

        //}

        public async Task OnFraudApprovedAsync(string fraudReportId)
        {
            var report = await GetByIdAsync(fraudReportId);
            if (report == null) return;

            var targetId = report.TargetId;
            var targetType = report.TargetType?.Trim().ToLower();

            if (targetType == "distributor")
            {
                await _distributors.UpdateOneAsync(
                    d => d.DistributorId == targetId,
                    Builders<Distributor>.Update.Inc(d => d.FraudCount, 1)
                );

                var dist = await _distributors
                    .Find(d => d.DistributorId == targetId)
                    .FirstOrDefaultAsync();

                if (dist != null && dist.FraudCount >= AutoBlockThreshold)
                {
                    await _distributors.UpdateOneAsync(
                        d => d.DistributorId == targetId,
                        Builders<Distributor>.Update.Set(d => d.IsActive, false)
                    );
                }
            }
            else if (targetType == "customer")
            {
                await _customers.UpdateOneAsync(
                    c => c.CustomerId == targetId,
                    Builders<Customer>.Update.Inc(c => c.FraudCount, 1)
                );

                var cust = await _customers
                    .Find(c => c.CustomerId == targetId)
                    .FirstOrDefaultAsync();

                if (cust != null && cust.FraudCount >= AutoBlockThreshold)
                {
                    await _customers.UpdateOneAsync(
                        c => c.CustomerId == targetId,
                        Builders<Customer>.Update.Set(c => c.IsActive, false)
                    );
                }
            }
        }

        public Task<List<FraudReport>> GetAllAsync() =>
    _fraud.Find(_ => true).SortByDescending(x => x.CreatedOn).ToListAsync();

        public async Task<Customer?> GetCustomerByIdAsync(string id)
        {
            return await _customers
                .Find(c => c.CustomerId == id)
                .FirstOrDefaultAsync();
        }

        public async Task<Distributor?> GetDistributorByIdAsync(string id)
        {
            return await _distributors
                .Find(d => d.DistributorId == id)
                .FirstOrDefaultAsync();
        }



    }
}
