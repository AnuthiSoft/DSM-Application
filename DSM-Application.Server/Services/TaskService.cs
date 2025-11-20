using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Models.DTOs;
using DistributorManagementSystem.Server.Models.Enums;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Services
{
    public class TaskService
    {
        private readonly IMongoCollection<TaskModel> _tasks;

        public TaskService(IConfiguration config)
        {
            var connectionString = config.GetSection("MongoDb:ConnectionString").Value;
            var databaseName = config.GetSection("MongoDb:DatabaseName").Value;

            var client = new MongoClient(connectionString);
            var db = client.GetDatabase(databaseName);
            _tasks = db.GetCollection<TaskModel>("Tasks");

            //var client = new MongoClient(config.GetConnectionString("DefaultConnection"));
            //var db = client.GetDatabase("DistributorDB");
            //_tasks = db.GetCollection<TaskModel>("Tasks");
        }

        public async Task<TaskModel> CreateTask(TaskCreateDto dto)
        {
            var task = new TaskModel
            {
                TaskTitle = dto.TaskTitle,
                TaskType = dto.TaskType,
                AssignedTo = dto.AssignedTo,
                AssignedBy = dto.AssignedBy,
                RelatedOrderId = dto.RelatedOrderId,
                RelatedCustomerId = dto.RelatedCustomerId,
                RelatedProductId = dto.RelatedProductId,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                Description = dto.Description,
                Location = dto.Location,
                ManagerNotes = dto.ManagerNotes,
                Status = EmployeeTaskStatus.Pending
            };

            await _tasks.InsertOneAsync(task);
            return task;
        }

        public async Task<List<TaskModel>> GetTasksForEmployee(string employeeId)
        {
            return await _tasks.Find(t => t.AssignedTo == employeeId).ToListAsync();
        }

        public async Task<TaskModel> GetTaskById(string taskId)
        {
            return await _tasks.Find(t => t.TaskId == taskId).FirstOrDefaultAsync();
        }

        public async Task<TaskModel> UpdateTaskStatus(string taskId, TaskUpdateStatusDto dto)
        {
            var task = await GetTaskById(taskId);
            if (task == null) return null;

            task.Status = dto.Status;
            task.EmployeeRemarks = dto.EmployeeRemarks;

            await _tasks.ReplaceOneAsync(t => t.TaskId == taskId, task);
            return task;
        }
    }
}
