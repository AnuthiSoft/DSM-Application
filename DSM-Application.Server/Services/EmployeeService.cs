using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class EmployeeService
    {
        private readonly IMongoCollection<Employee> _employees;

        public EmployeeService(IOptions<MongoDbSettings> options)
        {
            var client = new MongoClient(options.Value.ConnectionString);
            var database = client.GetDatabase(options.Value.DatabaseName);
            _employees = database.GetCollection<Employee>("Employees");
        }

        // Get all employees for a distributor
        public async Task<List<Employee>> GetEmployeesAsync(string distributorId)
        {
            return await _employees.Find(e => e.DistributorId == distributorId).ToListAsync();
        }

        // Add employee
        public async Task<Employee> AddEmployeeAsync(Employee employee)
        {
            await _employees.InsertOneAsync(employee);
            return employee;
        }

        // Update employee
        public async Task<Employee?> UpdateEmployeeAsync(string distributorId, string employeeId, Employee updated)
        {
            var filter = Builders<Employee>.Filter.Eq(e => e.EmployeeId, employeeId) &
                         Builders<Employee>.Filter.Eq(e => e.DistributorId, distributorId);

            var update = Builders<Employee>.Update
                .Set(e => e.Name, updated.Name)
                .Set(e => e.Email, updated.Email)
                .Set(e => e.PhoneNumber, updated.PhoneNumber)
                .Set(e => e.Role, updated.Role)
                .Set(e => e.Designation, updated.Designation)
                .Set(e => e.IsActive, updated.IsActive);

            return await _employees.FindOneAndUpdateAsync(filter, update, new FindOneAndUpdateOptions<Employee>
            {
                ReturnDocument = ReturnDocument.After
            });
        }

        // Delete employee
        public async Task<bool> DeleteEmployeeAsync(string distributorId, string employeeId)
        {
            var result = await _employees.DeleteOneAsync(e =>
                e.EmployeeId == employeeId && e.DistributorId == distributorId);
            return result.DeletedCount > 0;
        }

        // Toggle IsActive
        public async Task<Employee?> ToggleActiveAsync(string distributorId, string employeeId)
        {
            var filter = Builders<Employee>.Filter.Eq(e => e.EmployeeId, employeeId) &
                         Builders<Employee>.Filter.Eq(e => e.DistributorId, distributorId);

            var employee = await _employees.Find(filter).FirstOrDefaultAsync();
            if (employee == null) return null;

            employee.IsActive = !employee.IsActive;

            await _employees.ReplaceOneAsync(filter, employee);
            return employee;
        }
    }
}
