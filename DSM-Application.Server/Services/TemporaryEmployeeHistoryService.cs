using MongoDB.Driver;

public class TemporaryEmployeeHistoryService
{
    private readonly IMongoCollection<TemporaryEmployeeHistory> _history;

    public TemporaryEmployeeHistoryService(IMongoDatabase db)
    {
        _history = db.GetCollection<TemporaryEmployeeHistory>("TemporaryEmployeeHistory");
    }

    public async Task AddRecordAsync(string customerId, string tempEmployeeId)
    {
        var record = new TemporaryEmployeeHistory
        {
            CustomerId = customerId,
            TemporaryEmployeeId = tempEmployeeId,
            AssignedDate = DateTime.UtcNow.Date
        };

        await _history.InsertOneAsync(record);
    }

    public async Task<List<TemporaryEmployeeHistory>> GetHistoryAsync(string customerId)
    {
        return await _history
            .Find(x => x.CustomerId == customerId)
            .ToListAsync();
    }
}
