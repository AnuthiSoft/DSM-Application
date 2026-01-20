using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Driver;

namespace DSM_Application.Server.Services
{
    public class EmployeeProfileService
    {
        private readonly IMongoCollection<Employee> _employees;

        public EmployeeProfileService(IMongoDatabase database)
        {
            _employees = database.GetCollection<Employee>("Employees");
        }

        // ===========================
        // UPDATE PROFILE BY EMAIL
        // ===========================
        public async Task UpdateProfileByEmailAsync(
    string email,
    UpdateEmployeeProfileDto dto,
    IFormFile? profileImage
)
        {
            var employee = await _employees
                .Find(e => e.Email == email)
                .FirstOrDefaultAsync();

            if (employee == null)
                throw new Exception("Employee not found");

            // 🔹 Update basic fields
            employee.Name = dto.Name;
            employee.PhoneNumber = dto.PhoneNumber;
            employee.Address = dto.Address;

            // ✅ ADD THIS LINE
            employee.UpdatedDate = DateTime.UtcNow;

            // 🔹 Update image (stored inside MongoDB)
            if (profileImage != null && profileImage.Length > 0)
            {
                using var ms = new MemoryStream();
                await profileImage.CopyToAsync(ms);

                employee.ProfileImageData = ms.ToArray();
                employee.ProfileImageName = profileImage.FileName;
                employee.ProfileImageType = profileImage.ContentType;
            }

            await _employees.ReplaceOneAsync(
                e => e.Id == employee.Id,
                employee
            );
        }


        // ===========================
        // GET PROFILE BY EMAIL
        // ===========================
        public async Task<EmployeeProfileDto> GetProfileByEmailAsync(string email)
        {
            var employee = await _employees
                .Find(e => e.Email == email)
                .FirstOrDefaultAsync();

            if (employee == null)
                throw new Exception("Employee not found");

            return new EmployeeProfileDto
            {
                EmployeeId = employee.EmployeeId,
                Name = employee.Name,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Address = employee.Address,
                Role = employee.Role,
                IsActive = employee.IsActive,

                // ✅ REQUIRED FOR RIGHT INFO CARD
                CreatedDate = employee.CreatedDate,
                UpdatedDate = employee.UpdatedDate
            };
        }

    }
}
