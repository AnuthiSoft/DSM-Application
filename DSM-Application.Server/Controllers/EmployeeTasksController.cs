using DistributorManagementSystem.Server.Models.DTOs;
using DistributorManagementSystem.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DistributorManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeTasksController : ControllerBase
    {
        private readonly TaskService _taskService;

        public EmployeeTasksController(TaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto dto)
        {
            var task = await _taskService.CreateTask(dto);
            return Ok(task);
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var employeeId = User.FindFirst("employeeId")?.Value;

            if (employeeId == null)
                return Unauthorized("Employee ID missing in JWT token");

            var tasks = await _taskService.GetTasksForEmployee(employeeId);
            return Ok(tasks);
        }

        [HttpPut("update-status/{taskId}")]
        public async Task<IActionResult> UpdateStatus(string taskId, [FromBody] TaskUpdateStatusDto dto)
        {
            var employeeId = User.FindFirst("employeeId")?.Value;

            var task = await _taskService.GetTaskById(taskId);
            if (task == null)
                return NotFound("Task not found");

            if (task.AssignedTo != employeeId)
                return Unauthorized("You cannot update tasks assigned to another employee");

            var updatedTask = await _taskService.UpdateTaskStatus(taskId, dto);
            return Ok(updatedTask);
        }
    }
}
