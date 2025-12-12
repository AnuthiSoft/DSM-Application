using DSM_Application.Server.Models;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Services
{
    public class TemporaryAssignmentService
    {
        private readonly IMongoCollection<TemporaryAssignment> _tempAssignments;

        public TemporaryAssignmentService(MongoDbService db)
        {
            _tempAssignments = db.Database.GetCollection<TemporaryAssignment>("temporaryAssignments");
        }

        // ================================================
        // 1️⃣ Assign a temporary employee ONLY for TODAY
        // ================================================
        public async Task AssignTodayAsync(string distributorId, string customerId, string tempEmployeeId)
        {
            var today = DateTime.UtcNow.Date;

            // Remove existing today's assignment
            await _tempAssignments.DeleteManyAsync(x =>
                x.DistributorId == distributorId &&
                x.CustomerId == customerId &&
                x.AssignedDate == today
            );

            // Insert new
            var assignment = new TemporaryAssignment
            {
                DistributorId = distributorId,
                CustomerId = customerId,
                TemporaryEmployeeId = tempEmployeeId,
                AssignedDate = today,
                CreatedAt = DateTime.UtcNow
            };

            await _tempAssignments.InsertOneAsync(assignment);
        }

        // =======================================================
        // 2️⃣ Get temporary assignment for TODAY (real-time check)
        // =======================================================
        public async Task<TemporaryAssignment?> GetTodayAsync(string distributorId, string customerId)
        {
            var today = DateTime.UtcNow.Date;

            return await _tempAssignments
                .Find(x =>
                    x.DistributorId == distributorId &&
                    x.CustomerId == customerId &&
                    x.AssignedDate == today
                )
                .FirstOrDefaultAsync();
        }

        // ====================================================================
        // 3️⃣ Required by OrderService → Get temp assignment for ANY DATE
        // ====================================================================
        public async Task<TemporaryAssignment?> GetTemporaryForDateAsync(string distributorId, string customerId, DateTime date)
        {
            return await _tempAssignments
                .Find(x =>
                    x.DistributorId == distributorId &&
                    x.CustomerId == customerId &&
                    x.AssignedDate == date.Date
                )
                .FirstOrDefaultAsync();
        }
    }
}
