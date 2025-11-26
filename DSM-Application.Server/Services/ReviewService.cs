using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class ReviewService
    {
        private readonly IMongoCollection<Review> _reviews;
        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<Distributor> _distributors;

        public ReviewService(MongoDbService ctx)
        {
            _reviews = ctx.Reviews;
            _users = ctx.Users;
            _distributors = ctx.Distributors; // ✅ properly defined here
        }

        public Task AddAsync(Review r) => _reviews.InsertOneAsync(r);

        public Task<List<Review>> GetPendingAsync() =>
            _reviews.Find(r => r.Status == "Pending").ToListAsync();

        public Task<Review> GetByIdAsync(string id) =>
            _reviews.Find(r => r.Id == id).FirstOrDefaultAsync();
        public async Task<List<Review>> GetAllAsync()
        {
            return await _reviews.Find(_ => true)
                    .SortByDescending(r => r.CreatedAt)
                    .ToListAsync();
        }


        public Task UpdateStatusAsync(string id, string status) =>
            _reviews.UpdateOneAsync(
                r => r.Id == id,
                Builders<Review>.Update.Set(r => r.Status, status)
            );

        public async Task RecalculateRatingAsync(string distributorId)
        {
            // Get all approved reviews for this distributor
            var approved = await _reviews
                .Find(r => r.TargetId == distributorId && r.Status == "Approved")
                .ToListAsync();

            if (!approved.Any())
                return;

            // Calculate average rating and count
            var avg = Math.Round(approved.Average(r => r.Rating), 1);
            var count = approved.Count;

            // ✅ 1. Update Distributor collection
            await _distributors.UpdateOneAsync(
                d => d.DistributorId == distributorId,
                Builders<Distributor>.Update
                    .Set(d => d.AverageRating, avg)
                    .Set(d => d.ReviewCount, count)
            );

            // ✅ 2. Update corresponding User record (Role = "Distributor")
            await _users.UpdateOneAsync(
                u => u.DistributorId == distributorId && u.Role == "Distributor",
                Builders<User>.Update
                    .Set(u => u.AverageRating, avg)
                    .Set(u => u.ReviewCount, count)
            );
        }
       
    }
}
