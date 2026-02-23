using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.Json.Serialization;

namespace DSM_Application.Server.Controllers
{
    [Route("api/distributor")]   // FIXED
    [ApiController]
    public class DistributorController : ControllerBase
    {
        private readonly IMongoCollection<CustomerDistributorConnection> _connections;
        private readonly IMongoCollection<Customer> _customers;
        private readonly EmailService _emailService;
        private readonly TemporaryAssignmentService _tempService;
        private readonly TemporaryEmployeeHistoryService _tempHistoryService;
        private readonly IMongoCollection<EmployeeAvailability> _availability;
        private readonly IMongoCollection<Employee> _employees;
        private readonly MongoDbService _db;
        private readonly IWebHostEnvironment _env;
        private readonly BlobService _blobService;





        public DistributorController(MongoDbService mongoService, EmailService emailService, TemporaryAssignmentService tempService, TemporaryEmployeeHistoryService tempHistoryService, MongoDbService db, IWebHostEnvironment env, BlobService blobService)
        {
            _connections = mongoService.Connections;
            _customers = mongoService.Customers;
            _availability = mongoService.Database.GetCollection<EmployeeAvailability>("EmployeeAvailability");
            _emailService = emailService;
            _tempService = tempService;
            _tempHistoryService = tempHistoryService;   // ADD THIS
            _employees = mongoService.Employees;

            _db = db;
            _env = env;
            _blobService = blobService;



        }
        private async Task<bool> IsEmployeeAvailable(string employeeId)
        {
            if (string.IsNullOrEmpty(employeeId)) return true;

            // Convert UTC -> IST
            var ist = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

            var today = ist.Date;

            var rec = await _availability
                .Find(a => a.EmployeeId == employeeId && a.Date == today)
                .FirstOrDefaultAsync();

            return rec == null ? true : rec.IsAvailable;
        }



        [HttpGet("connection-requests")]
        public async Task<IActionResult> GetPendingRequests([FromQuery] string distributorId)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "distributorId is required" });

            var requests = await _connections
                .Find(c => c.DistributorId == distributorId && c.Status == ConnectionStatus.Pending)
                .ToListAsync();

            var result = requests.Select(c =>
            {
                var customer = _customers.Find(x => x.CustomerId == c.CustomerId).FirstOrDefault();
                return new ConnectionRequestDto
                {
                    ConnectionId = c.Id,
                    CustomerId = c.CustomerId,
                    Name = customer?.Name,
                    Email = customer?.Email,
                    PhoneNumber = customer?.PhoneNumber,
                    Status = c.Status.ToString(),
                    ConnectedOn = c.ConnectedOn
                };
            }).ToList();

            // Return the actual pending requests as JSON
            return Ok(result);
        }

        // New: Get accepted (connected) customers for the distributor
        [HttpGet("accepted-customers")]
        public async Task<IActionResult> GetAcceptedCustomers([FromQuery] string distributorId)
        {
            distributorId ??= User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(distributorId))
                return BadRequest(new { message = "distributorId is required" });

            var connections = await _connections.Find(c =>
                c.DistributorId == distributorId &&
                c.Status == ConnectionStatus.Accepted &&
                (
                    c.DisconnectedOn == null ||
                    c.DisconnectedOn == DateTime.MinValue
                )
            ).ToListAsync();

            var result = connections.Select(c =>
            {
                var customer = _customers.Find(x => x.CustomerId == c.CustomerId).FirstOrDefault();
                return new ConnectionRequestDto
                {
                    ConnectionId = c.Id,
                    CustomerId = c.CustomerId,
                    Name = customer?.Name,
                    Email = customer?.Email,
                    PhoneNumber = customer?.PhoneNumber,
                    Status = c.Status.ToString(),
                    ConnectedOn = c.ConnectedOn
                };
            }).ToList();

            return Ok(result);
        }


        [HttpPost("respond-connection")]
        public async Task<IActionResult> RespondConnection([FromBody] RespondRequest request)
        {
            var connection = await _connections.Find(c => c.Id == request.ConnectionId).FirstOrDefaultAsync();
            if (connection == null) return NotFound("Connection not found");

            connection.Status = request.Accept ? ConnectionStatus.Accepted : ConnectionStatus.Rejected;
            await _connections.ReplaceOneAsync(c => c.Id == request.ConnectionId, connection);

            // Fetch customer details for notification
            var customer = await _customers.Find(x => x.CustomerId == connection.CustomerId).FirstOrDefaultAsync();
            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                var subject = request.Accept
                    ? "Your Distributor Request has been Accepted"
                    : "Your Distributor Request has been Rejected";

                var body = request.Accept
                    ? $"Hi {customer.Name},\n\nGood news! Your request to connect with distributor ({connection.DistributorId}) has been ACCEPTED."
                    : $"Hi {customer.Name},\n\nUnfortunately, your request to connect with distributor ({connection.DistributorId}) has been REJECTED.";

                _emailService.SendEmailAsync(customer.Email, subject, body);
            }

            return Ok(new { message = request.Accept ? "Request accepted and notification sent" : "Request rejected and notification sent" });
        }

        [HttpPost("disconnect-customer")]
        public async Task<IActionResult> DisconnectCustomer([FromBody] DisconnectRequest request)
        {
            if (string.IsNullOrEmpty(request.CustomerId) || string.IsNullOrEmpty(request.DistributorId))
                return BadRequest("CustomerId and DistributorId are required");

            var update = Builders<CustomerDistributorConnection>.Update
                .Set(c => c.Status, ConnectionStatus.Disconnected)
                .Set(c => c.DisconnectedOn, DateTime.UtcNow);

            var result = await _connections.UpdateOneAsync(
                c => c.CustomerId == request.CustomerId &&
                     c.DistributorId == request.DistributorId &&
                     (c.Status == ConnectionStatus.Accepted || c.Status == ConnectionStatus.Pending),
                update
            );

            if (result.MatchedCount == 0)
                return NotFound("Active connection not found");

            return Ok(new { message = "Customer disconnected successfully" });
        }


        // ============================
        //  TEMPORARY EMPLOYEE (TODAY)
        // ============================
        [HttpPost("assign-temp-today")]
        public async Task<IActionResult> AssignTemporaryToday([FromBody] AssignTempDto dto)
        {
            if (dto == null ||
                string.IsNullOrEmpty(dto.DistributorId) ||
                string.IsNullOrEmpty(dto.CustomerId) ||
                string.IsNullOrEmpty(dto.TemporaryEmployeeId))
            {
                return BadRequest(new { message = "distributorId, customerId, temporaryEmployeeId required" });
            }

            await _tempService.AssignTodayAsync(dto.DistributorId, dto.CustomerId, dto.TemporaryEmployeeId);
            await _tempHistoryService.AddRecordAsync(dto.CustomerId, dto.TemporaryEmployeeId);

            return Ok(new { message = "Temporary employee assigned for today." });
        }




        // ============================
        //  CHECK EMPLOYEE ACTIVE TODAY
        // ============================
        [HttpGet("customer-employee-status")]
        public async Task<IActionResult> GetEmployeeStatus(
         [FromQuery] string distributorId,
         [FromQuery] string customerId)
        {
            // 1️⃣ Try to find connection
            var connection = await _connections
                .Find(x => x.CustomerId == customerId && x.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            // 2️⃣ If not found but customer added by distributor → auto-connect
            if (connection == null)
            {
                var customer = await _customers
                    .Find(x => x.CustomerId == customerId)
                    .FirstOrDefaultAsync();

                if (customer != null && customer.AddedByDistributorId == distributorId)
                {
                    connection = new CustomerDistributorConnection
                    {
                        DistributorId = distributorId,
                        CustomerId = customerId,
                        Status = ConnectionStatus.Accepted,
                        ConnectedOn = DateTime.UtcNow
                    };

                    await _connections.InsertOneAsync(connection);
                }
                else
                {
                    return NotFound("Customer not connected to this distributor");
                }
            }

            // 3️⃣ Temporary employee assignment for today
            var todayTemp = await _tempService.GetTodayAsync(distributorId, customerId);

            // Get permanent employee availability record
            // Convert to IST first
            var istToday = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("India Standard Time")
            ).Date;

            // Permanent employee availability
            EmployeeAvailability permanentAvailability = null;
            if (!string.IsNullOrEmpty(connection.PermanentEmployeeId))
            {
                permanentAvailability = await _availability
                    .Find(a => a.EmployeeId == connection.PermanentEmployeeId &&
                               a.Date == istToday)
                    .FirstOrDefaultAsync();
            }

            // Temporary employee availability
            EmployeeAvailability tempAvailability = null;
            if (!string.IsNullOrEmpty(todayTemp?.TemporaryEmployeeId))
            {
                tempAvailability = await _availability
                    .Find(a => a.EmployeeId == todayTemp.TemporaryEmployeeId &&
                               a.Date == istToday)
                    .FirstOrDefaultAsync();
            }

            return Ok(new
            {
                // Permanent Employee Status + Reason
                PermanentEmployeeId = connection?.PermanentEmployeeId,
                PermanentEmployeeAvailable = permanentAvailability?.IsAvailable ?? true,
                PermanentReason = permanentAvailability?.Reason,

                // Temporary Employee Status + Reason
                TemporaryEmployeeId = todayTemp?.TemporaryEmployeeId,
                TemporaryEmployeeAvailable = tempAvailability?.IsAvailable ?? true,
                TemporaryReason = tempAvailability?.Reason,

                IsTemporaryActiveToday = todayTemp != null
            });
        }



        // ============================
        //  VIEW CUSTOMERS + EMPLOYEES
        // ============================
        [HttpGet("customers-with-employee")]
        public async Task<IActionResult> GetCustomersWithEmployee([FromQuery] string distributorId)
        {
            var connections = await _connections
                .Find(x => x.DistributorId == distributorId).ToListAsync();

            var today = DateTime.UtcNow.Date;

            var result = new List<object>();

            foreach (var c in connections)
            {
                var todayTemp = await _tempService.GetTodayAsync(distributorId, c.CustomerId);

                result.Add(new
                {
                    CustomerId = c.CustomerId,
                    PermanentEmployeeId = c.PermanentEmployeeId,
                    TemporaryEmployeeId = todayTemp?.TemporaryEmployeeId
                });
            }

            return Ok(result);
        }




        // ============================
        //  PERMANENT EMPLOYEE ASSIGN
        // ============================
        [HttpPut("assign-permanent-employee")]
        public async Task<IActionResult> AssignPermanentEmployee(
      [FromQuery] string distributorId,
      [FromQuery] string customerId,
      [FromQuery] string employeeId)
        {
            if (string.IsNullOrEmpty(distributorId) ||
                string.IsNullOrEmpty(customerId) ||
                string.IsNullOrEmpty(employeeId))
                return BadRequest("Invalid parameters");

            // 1️⃣ Verify customer ownership
            var customer = await _customers
                .Find(x => x.CustomerId == customerId)
                .FirstOrDefaultAsync();

            //if (customer == null || customer.AddedByDistributorId != distributorId)
            //    return BadRequest("Customer not linked to this distributor");

            // 2️⃣ Verify employee belongs to distributor
            var employee = await _employees
                .Find(e => e.EmployeeId == employeeId &&
                           e.DistributorId == distributorId &&
                           e.IsActive)
                .FirstOrDefaultAsync();

            if (employee == null)
                return BadRequest("Employee not found or inactive");

            // 3️⃣ Upsert connection
            var filter = Builders<CustomerDistributorConnection>.Filter.And(
                Builders<CustomerDistributorConnection>.Filter.Eq(x => x.DistributorId, distributorId),
                Builders<CustomerDistributorConnection>.Filter.Eq(x => x.CustomerId, customerId)
            );

            var update = Builders<CustomerDistributorConnection>.Update
                .Set(x => x.PermanentEmployeeId, employeeId)
                .Set(x => x.Status, ConnectionStatus.Accepted)
                .SetOnInsert(x => x.ConnectedOn, DateTime.UtcNow);

            var result = await _connections.UpdateOneAsync(
                filter,
                update,
                new UpdateOptions { IsUpsert = true }
            );

            if (result.MatchedCount == 0 && result.UpsertedId == null)
                return StatusCode(500, "Assignment failed");

            return Ok(new
            {
                message = "Permanent employee assigned successfully",
                customerId,
                distributorId,
                employeeId,
                employeeName = employee.Name
            });
        }




        // ============================
        //  VIEW TEMP HISTORY
        // ============================
        [HttpGet("temp-employee-history")]
        public async Task<IActionResult> GetTempHistory([FromQuery] string customerId)
        {
            var history = await _tempHistoryService.GetHistoryAsync(customerId);
            return Ok(history);
        }



          

        [HttpPost("employee/mark-availability")]
        public async Task<IActionResult> MarkEmployeeAvailability([FromBody] EmployeeAvailability dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.EmployeeId))
                return BadRequest("EmployeeId and date required.");

            dto.Date = dto.Date.Date;

            var existing = await _availability
                .Find(x => x.EmployeeId == dto.EmployeeId && x.Date == dto.Date)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.IsAvailable = dto.IsAvailable;
                existing.Reason = dto.Reason;
                await _availability.ReplaceOneAsync(x => x.Id == existing.Id, existing);
            }
            else
            {
                await _availability.InsertOneAsync(dto);
            }

            return Ok(new { message = "Employee availability updated" });
        }



        [HttpGet("employee/availability")]
        public async Task<IActionResult> GetEmployeeAvailability(
    [FromQuery] string employeeId,
    [FromQuery] DateTime? date)
        {
            if (string.IsNullOrEmpty(employeeId))
                return BadRequest("employeeId is required.");

            var d = (date ?? DateTime.UtcNow).Date;

            var rec = await _availability
                .Find(x => x.EmployeeId == employeeId && x.Date == d)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                employeeId,
                date = d,
                isAvailable = rec == null ? true : rec.IsAvailable,
                reason = rec?.Reason
            });
        }
        [HttpPost("upload-scanner-qr")]
        public async Task<IActionResult> UploadScannerQr(
      [FromForm] IFormFile file,
      [FromForm] string distributorId)
        {
            if (file == null || file.Length == 0)
                return BadRequest("QR image is required");

            // ✅ Upload to Azure Blob → RETURNS FULL URL
            var blobUrl = await _blobService.UploadAsync(file);

            // ✅ STORE FULL URL (THIS IS THE FIX)
            await _db.Distributors.UpdateOneAsync(
                d => d.DistributorId == distributorId,
                Builders<Distributor>.Update
                    .Set(d => d.ScannerQrUrl, blobUrl)
            );

            return Ok(new
            {
                scannerQrUrl = blobUrl
            });
        }


        // =====================================================
        // 🔥 GET SCANNER QR (FOR CASHIER)
        // =====================================================
        //[HttpGet("scanner-qr/{distributorId}")]
        //public async Task<IActionResult> GetScannerQr(string distributorId)
        //{
        //    var distributor = await _db.Distributors
        //        .Find(d => d.DistributorId == distributorId)
        //        .FirstOrDefaultAsync();

        //    if (distributor == null || string.IsNullOrEmpty(distributor.ScannerQrUrl))
        //        return NotFound(new { message = "Scanner QR not uploaded" });

        //    return Ok(new
        //    {
        //        scannerQrUrl = distributor.ScannerQrUrl // now FULL URL 🎉
        //    });
        //}
        [HttpGet("scanner-qr/view/{blobName}")]
        public async Task<IActionResult> ViewScannerQr(string blobName)
        {
            var bytes = await _blobService.DownloadAsync(blobName);

            if (bytes == null)
                return NotFound();

            return File(bytes, "image/png");
        }
        [HttpGet("scanner-qr/{distributorId}")]
        public async Task<IActionResult> GetScannerQr(string distributorId)
        {
            var distributor = await _db.Distributors
                .Find(d => d.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (distributor == null || string.IsNullOrEmpty(distributor.ScannerQrUrl))
                return NotFound();

            return Ok(new
            {
                scannerQrUrl = distributor.ScannerQrUrl // blob name
            });
        }

        // ============================
        // 🔥 GET DISTRIBUTOR BY ID (FOR FRAUD REPORT)
        // ============================
        [HttpGet("{distributorId}")]
        public async Task<IActionResult> GetDistributorById(string distributorId)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest("distributorId is required");

            var distributor = await _db.Distributors
                .Find(d => d.DistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return NotFound();

            return Ok(distributor);
        }

        // =======================================
        //  FIX: GET DISTRIBUTOR PROFILE
        //  Angular calls /api/distributors/profile
        // =======================================
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Invalid token");

            var distributor = await _db.Distributors
                .Find(d => d.DistributorId == userId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return NotFound("Distributor not found");

            var dto = new DistributorProfileDto
            {
                DistributorId = distributor.DistributorId,
                Name = distributor.Name,
                Email = distributor.Email,
                PhoneNumber = distributor.PhoneNumber,
                Street = distributor.Street,
                City = distributor.City,
                State = distributor.State,
                Pincode = distributor.Pincode,
                Country = distributor.Country,
                PhoneVerified = distributor.PhoneVerified,
                CreatedDate = distributor.CreatedDate,
                UpdatedDate = distributor.UpdatedDate,
                ProfileImageBase64 = distributor.ProfileImage != null
                    ? Convert.ToBase64String(distributor.ProfileImage)
                    : null
            };

            return Ok(dto);
        }

        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] DistributorProfileUpdateDto dto)
        {
            var userId = User.FindFirst("DistributorId")?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Invalid token");

            var distributor = await _db.Distributors
                .Find(x => x.DistributorId == userId)
                .FirstOrDefaultAsync();

            if (distributor == null)
                return NotFound("Distributor not found");

            // Update fields
            distributor.Name = dto.Name;
            distributor.Email = dto.Email;
            distributor.PhoneNumber = dto.PhoneNumber;
            distributor.Street = dto.Street;
            distributor.City = dto.City;
            distributor.State = dto.State;
            distributor.Pincode = dto.Pincode;
            distributor.Country = dto.Country;

            // Update Last Updated Timestamp
            distributor.UpdatedDate = DateTime.UtcNow;

            // Image handling
            if (dto.ProfileImage != null)
            {
                using var ms = new MemoryStream();
                await dto.ProfileImage.CopyToAsync(ms);
                distributor.ProfileImage = ms.ToArray();
            }

            await _db.Distributors.ReplaceOneAsync(
                x => x.DistributorId == userId,
                distributor
            );

            return Ok(new { message = "Profile updated successfully." });
        }

        public class RespondRequest
        {
            //[JsonPropertyName("connectionId")]
            public string ConnectionId { get; set; }

            //[JsonPropertyName("accept")]
            public bool Accept { get; set; }
        }

        public class DisconnectRequest
        {
            
            public string CustomerId { get; set; }
            public string DistributorId { get; set; }
        }
    }

}
