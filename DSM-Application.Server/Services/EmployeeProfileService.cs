using DistributorManagementSystem.Server.Models;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Driver;
using System.Security.Claims;

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
            var filter = Builders<Employee>.Filter
                .Where(e => e.Email.ToLower() == email.ToLower());

            var update = Builders<Employee>.Update
                .Set(e => e.Name, dto.Name)
                .Set(e => e.PhoneNumber, dto.PhoneNumber)
                .Set(e => e.Street, dto.Street ?? "")
                .Set(e => e.City, dto.City ?? "")
                .Set(e => e.State, dto.State ?? "")
                .Set(e => e.Pincode, dto.Pincode ?? "")
                .Set(e => e.Country, dto.Country ?? "")
                .Set(e => e.UpdatedDate, DateTime.UtcNow);

            if (profileImage != null && profileImage.Length > 0)
            {
                using var ms = new MemoryStream();
                await profileImage.CopyToAsync(ms);

                update = update
                    .Set(e => e.ProfileImageData, ms.ToArray())
                    .Set(e => e.ProfileImageName, profileImage.FileName)
                    .Set(e => e.ProfileImageType, profileImage.ContentType);
            }

            var result = await _employees.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
                throw new Exception("Employee not found");
        }





        // ===========================
        // GET PROFILE BY EMAIL
        // ===========================
        public async Task<EmployeeProfileDto> GetProfileByEmailAsync(string email)
        {
            var employee = await _employees
                .Find(e => e.Email.ToLower() == email.ToLower())
                .FirstOrDefaultAsync();

            if (employee == null)
                throw new Exception("Employee not found");

            return new EmployeeProfileDto
            {
                Name = employee.Name,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Street = employee.Street,
                City = employee.City,
                State = employee.State,
                Pincode = employee.Pincode,
                Country = employee.Country,
                Role = employee.Role,
                IsActive = employee.IsActive,
                CreatedDate = employee.CreatedDate,
                UpdatedDate = employee.UpdatedDate
          
            };
        }


    }
}
