using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly JwtService _jwt;
        private readonly ProductService _productService;
        private readonly IMongoCollection<Customer> _customersCollection;
        private readonly TemporaryAssignmentService _tempService;


        public CustomersController(MongoDbService db, JwtService jwt, ProductService productService, TemporaryAssignmentService tempService)
        {
            _db = db;
            _jwt = jwt;
            _productService = productService;
            _tempService = tempService;
            _customersCollection = db.Customers;
        }

        // 🌍 Global Registration
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CustomerRegisterRequest request)
        {
            // ✅ Check if either email or phone number already exists
            var existing = await _db.Customers
                .Find(c => c.Email == request.Email || c.PhoneNumber == request.PhoneNumber)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                if (existing.Email == request.Email)
                    return BadRequest("customer with this email already exists.");
                if (existing.PhoneNumber == request.PhoneNumber)
                    return BadRequest("customer with this phone number already exists.");
            }
            var customer = new Customer
            {
                Name = request.Name,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = ComputeHash(request.Password),
                IsRegistered = true
            };

            await _db.Customers.InsertOneAsync(customer);
            return Ok(new { message = "Customer registered successfully", customer });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] CustomerLoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest("Email or Phone Number is required");

            if (string.IsNullOrEmpty(request.Password))
                return BadRequest("Password is required");

            // Find customer by email OR phone
            var customer = await _db.Customers
      .Find(c => (request.Email != null && c.Email == request.Email) ||
                 (request.PhoneNumber != null && c.PhoneNumber == request.PhoneNumber))
      .FirstOrDefaultAsync();

            if (customer == null)
                return Unauthorized("Customer not found");

            if (!customer.IsRegistered)
                return Unauthorized("You must create password first (distributor added you)");

            if (customer.PasswordHash != ComputeHash(request.Password))
                return Unauthorized("Invalid password");

            // Generate JWT for customer
            var token = _jwt.GenerateCustomerToken(customer);
            return Ok(new
            {
                token,
                customer,
                role = customer.Role,
                customerId = customer.CustomerId
            });
        }

        [Authorize(Roles = "Distributor")]
        [HttpPost("create-by-distributor")]
        public async Task<IActionResult> CreateByDistributor([FromBody] DistributorCreateCustomerDto dto)
        {
            if(!ModelState.IsValid)
            return BadRequest(ModelState); // ⛔ STOP empty or invalid values

            // Duplicate check
            var existing = await _db.Customers
                .Find(c =>
                    (!string.IsNullOrEmpty(dto.Email) && c.Email == dto.Email) ||
                    (!string.IsNullOrEmpty(dto.PhoneNumber) && c.PhoneNumber == dto.PhoneNumber)
                )
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                if (!string.IsNullOrEmpty(dto.Email) && existing.Email == dto.Email)
                    return BadRequest("A customer with this email already exists.");
                if (!string.IsNullOrEmpty(dto.PhoneNumber) && existing.PhoneNumber == dto.PhoneNumber)
                    return BadRequest("A customer with this phone number already exists.");
            }

            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,   // ✔ simple address only

                Role = "Customer",
                AddedByDistributorId = distributorId,
                IsRegistered = false,
                PasswordHash = null
            };

            await _db.Customers.InsertOneAsync(customer);

            return Ok(new
            {
                message = "Customer created by distributor. Customer must set password.",
                customerId = customer.CustomerId
            });
        }

        //[Authorize(Roles = "Distributor")]
        //[HttpPost("create-by-distributor")]
        //public async Task<IActionResult> CreateByDistributor([FromBody] Customer customer)
        //{
        //    var existing = await _db.Customers
        // .Find(c => c.Email == customer.Email || c.PhoneNumber == customer.PhoneNumber)
        // .FirstOrDefaultAsync();
        //    if (existing != null)
        //    {
        //        if (existing.Email == customer.Email)
        //            return BadRequest("A customer with this email already exists.");
        //        if (existing.PhoneNumber == customer.PhoneNumber)
        //            return BadRequest("A customer with this phone number already exists.");
        //    }
        //    // ✅ Read "DistributorId" claim instead of ClaimTypes.NameIdentifier
        //    var distributorId = User.FindFirst("DistributorId")?.Value;
        //    if (distributorId == null)
        //        return Unauthorized("Distributor ID not found in token");

        //    customer.AddedByDistributorId = distributorId;
        //    customer.IsRegistered = false;
        //    customer.PasswordHash = null;

        //    await _db.Customers.InsertOneAsync(customer);

        //    return Ok(new { message = "Customer created by distributor. Customer must set password.", customer });
        //}

        [Authorize(Roles = "Distributor")]
        [HttpGet("my-customers")]
        public async Task<IActionResult> GetCustomersByDistributor()
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found");

            // 1) Load customers created by distributor
            var customers = await _db.Customers
                .Find(c => c.AddedByDistributorId == distributorId)
                .ToListAsync();

            var customerIds = customers.Select(c => c.CustomerId).ToList();

            // 2) Load connections for these customers
            var connections = await _db.Connections
                .Find(c => customerIds.Contains(c.CustomerId) && c.DistributorId == distributorId)
                .ToListAsync();

            // 3) Load employees
            var employeeIds = connections
                .Where(c => !string.IsNullOrEmpty(c.PermanentEmployeeId))
                .Select(c => c.PermanentEmployeeId)
                .ToList();

            var employees = await _db.Employees
                .Find(e => employeeIds.Contains(e.EmployeeId))
                .ToListAsync();

            // 4) Attach Permanent Employee Name
            var result = customers.Select(c =>
            {
                var conn = connections.FirstOrDefault(x => x.CustomerId == c.CustomerId);
                var emp = employees.FirstOrDefault(e => e.EmployeeId == conn?.PermanentEmployeeId);

                return new
                {
                    c.CustomerId,
                    c.Name,
                    c.Email,
                    c.PhoneNumber,
                    c.Address,
                    c.IsRegistered,
                    c.IsActive,
                    PermanentEmployeeId = emp?.EmployeeId,
                    PermanentEmployeeName = emp?.Name ?? "Not Assigned"
                };
            });

            return Ok(result);
        }
        [HttpPut("update-customer/{customerId}")]
        public async Task<IActionResult> UpdateCustomer(string customerId, [FromBody] Customer updatedCustomer)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var existingCustomer = await _db.Customers
                .Find(c => c.CustomerId == customerId && c.AddedByDistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (existingCustomer == null)
                return NotFound("Customer not found or does not belong to this distributor");

            existingCustomer.Name = updatedCustomer.Name;
            existingCustomer.Email = updatedCustomer.Email;
            existingCustomer.PhoneNumber = updatedCustomer.PhoneNumber;
            existingCustomer.Address = updatedCustomer.Address;

            await _db.Customers.ReplaceOneAsync(c => c.CustomerId == customerId, existingCustomer);

            return Ok(new { message = "Customer updated successfully", customer = existingCustomer });
        }

        [HttpDelete("delete-customer/{customerId}")]
        public async Task<IActionResult> DeleteCustomer(string customerId)
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var existingCustomer = await _db.Customers
                .Find(c => c.CustomerId == customerId && c.AddedByDistributorId == distributorId)
                .FirstOrDefaultAsync();

            if (existingCustomer == null)
                return NotFound("Customer not found or does not belong to this distributor");

            await _db.Customers.DeleteOneAsync(c => c.CustomerId == customerId);

            return Ok(new { message = "Customer deleted successfully" });
        }
        //// ----- Set Password -----
        //[HttpPost("set-password")]
        //public async Task<IActionResult> SetPassword([FromBody] CustomerLoginRequest request)
        //{
        //    if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
        //        return BadRequest(new { message = "Either Email or Phone Number must be provided." });

        //    var customer = await _db.Customers
        //        .Find(c =>
        //            (!string.IsNullOrEmpty(request.Email) && c.Email.ToLower() == request.Email.ToLower()) ||
        //            (!string.IsNullOrEmpty(request.PhoneNumber) && c.PhoneNumber == request.PhoneNumber)
        //        )
        //        .FirstOrDefaultAsync();

        //    if (customer == null)
        //        return NotFound(new { message = "Customer not found" });

        //    // ⚠ IMPORTANT FIX
        //    if (customer.IsRegistered)
        //        return BadRequest(new { message = "Password already created. Please login." });

        //    // SET PASSWORD
        //    var update = Builders<Customer>.Update
        //        .Set(c => c.PasswordHash, ComputeHash(request.Password))
        //        .Set(c => c.IsRegistered, true);

        //    await _db.Customers.UpdateOneAsync(c => c.CustomerId == customer.CustomerId, update);

        //    return Ok(new { message = "Password created successfully" });
        //}

        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] CustomerLoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest(new { message = "Either Email or Phone Number must be provided." });
            //return BadRequest("Either Email or Phone Number must be provided.");

            var customer = await _db.Customers
                .Find(c =>
                    (!string.IsNullOrEmpty(request.Email) && c.Email.ToLower() == request.Email.ToLower()) ||
                    (!string.IsNullOrEmpty(request.PhoneNumber) && c.PhoneNumber == request.PhoneNumber)
                )
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound(new { message = "Customer not found" });
            //return NotFound("Customer not found");

            if (customer.IsRegistered)
                return BadRequest(new { message = "Password already created. Please login." });
            //return BadRequest("Password already created. Please login.");

            var update = Builders<Customer>.Update
                .Set(c => c.PasswordHash, ComputeHash(request.Password))
                .Set(c => c.IsRegistered, true);

            await _db.Customers.UpdateOneAsync(c => c.CustomerId == customer.CustomerId, update);
            return Ok(new { message = "Password created successfully" });

        }

        ////[Authorize(Roles = "Customer")]
        //[HttpGet("dashboard/{customerId}")]
        //public async Task<IActionResult> GetCustomerDashboard(string customerId)
        //{

        //    var customer = await _db.Customers.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
        //    if (customer == null) return NotFound("Customer not found");

        //    var connections = await _db.Connections
        //        .Find(c => c.CustomerId == customerId)
        //        .ToListAsync();

        //    var allDistributors = await _db.Distributors.Find(_ => true).ToListAsync();
        //    var distributorsWithProducts = new List<object>();

        //    foreach (var dist in allDistributors)
        //    {
        //        var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
        //        dist.Status = conn?.Status.ToString();

        //        List<Product> products = new();

        //        // Show products only if:
        //        // 1. Customer is added by this distributor, or
        //        // 2. Connection exists and accepted
        //        if ((customer.AddedByDistributorId == dist.DistributorId) ||
        //            (conn != null && conn.Status == ConnectionStatus.Accepted))
        //        {
        //            products = await _productService.GetProductsByDistributorAsync(dist.DistributorId);
        //        }

        //        distributorsWithProducts.Add(new
        //        {
        //            distributor = dist,
        //            products = products
        //        });
        //    }

        //    return Ok(new
        //    {
        //        isGlobal = true, // All customers see global distributor list
        //        distributors = distributorsWithProducts
        //    });
        //}


        [HttpGet("dashboard/{customerId}")]
        public async Task<IActionResult> GetCustomerDashboard(string customerId)
        {
            // 1) Fetch customer
            var customer = await _db.Customers.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");

            // 2) Fetch distributor/customer connection records
            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId)
                .ToListAsync();

            // 3) Load all distributors and attach products based on connection rules
            var allDistributors = await _db.Distributors.Find(_ => true).ToListAsync();
            var distributorsWithProducts = new List<object>();

            foreach (var dist in allDistributors)
            {
                var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
                bool isCreator = customer.AddedByDistributorId == dist.DistributorId;

                // ✅ Correct Status Logic for Creator Distributor
                if (isCreator)
                {
                    // If connection exists AND it is Accepted → show "Accepted"
                    if (conn != null && conn.Status == ConnectionStatus.Accepted)
                    {
                        dist.Status = "Accepted";
                    }
                    else
                    {
                        // If creator and no connection → auto "Connected"
                        dist.Status = "Accepted";
                    }
                }
                else
                {
                    // Normal distributors → show their DB status OR "Available"
                    dist.Status = conn?.Status.ToString() ?? "Available";
                }

                List<Product> products = new();

                // Products only visible if:
                // 1. Creator distributor
                // 2. Connection accepted
                if (isCreator || (conn != null && conn.Status == ConnectionStatus.Accepted))
                {
                    products = await _productService.GetProductsByDistributorAsync(dist.DistributorId);
                }

                distributorsWithProducts.Add(new
                {
                    distributor = dist,
                    products = products,

                    // Creator cannot connect → false
                    // Others can connect only if not already Accepted
                    canConnect = !isCreator && (conn == null || conn.Status != ConnectionStatus.Accepted)
                });
            }


            //foreach (var dist in allDistributors)
            //{
            //    var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
            //    dist.Status = conn?.Status.ToString();

            //    List<Product> products = new();

            //    if ((customer.AddedByDistributorId == dist.DistributorId) ||
            //        (conn != null && conn.Status == ConnectionStatus.Accepted))
            //    {
            //        products = await _productService.GetProductsByDistributorAsync(dist.DistributorId);
            //    }

            //    distributorsWithProducts.Add(new
            //    {
            //        distributor = dist,
            //        products = products,

            //        // ⭐ SUPER IMPORTANT ⭐
            //        canConnect = (customer.AddedByDistributorId == null
            //                     || customer.AddedByDistributorId != dist.DistributorId)
            //    });
            //}


            //foreach (var dist in allDistributors)
            //{
            //    var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
            //    dist.Status = conn?.Status.ToString();

            //    List<Product> products = new();

            //    if ((customer.AddedByDistributorId == dist.DistributorId) ||
            //        (conn != null && conn.Status == ConnectionStatus.Accepted))
            //    {
            //        products = await _productService.GetProductsByDistributorAsync(dist.DistributorId);
            //    }

            //    distributorsWithProducts.Add(new
            //    {
            //        distributor = dist,
            //        products = products
            //    });
            //}

            // 4) Fetch customer orders
            var orders = await _db.Orders
                .Find(o => o.CustomerId == customerId)
                .SortByDescending(o => o.OrderDate)
                .ToListAsync();

            // 5) Map orders to DTO including discount breakdown
            var orderDtos = orders.Select(o =>
            {
                var first = o.Products.FirstOrDefault(); // avoid null errors

                return new DistributorOrderDto
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    Products = o.Products,

                    // ✅ Discount Totals
                    Subtotal = o.Subtotal,
                    TotalDiscount = o.TotalDiscount,
                    TotalAmount = o.TotalAmount,

                    // ✅ Discount Breakdown (if multiple products, use first)
                    SpecialDiscountPercent = first?.SpecialDiscountPercent ?? 0,
                    QuantityDiscountPercent = first?.QuantityDiscountPercent ?? 0,
                    PriceDiscountPercent = first?.PriceDiscountPercent ?? 0,
                    TotalDiscountPercent = first?.TotalDiscountPercent ?? 0,

                    OrderedDate = o.OrderedDate,
                    Status = o.Status,
                    EmployeeId = o.EmployeeId,
                    Name = o.Name,
                    PaymentCollectedByEmployee = o.PaymentCollectedByEmployee,
                    CollectedAmount = o.CollectedAmount,
                    PaymentMethod = o.PaymentMethod,
                    CollectedOn = o.CollectedOn,
                    DeliveredOn = o.DeliveredOn
                };
            }).ToList();

            // 6) Return dashboard data + orders
            return Ok(new
            {
                isGlobal = true,
                distributors = distributorsWithProducts,
                orders = orderDtos   // ✅ UI receives discount data here
            });
        }

        [HttpPost("connect-distributor")]
        public async Task<IActionResult> ConnectDistributor([FromBody] ConnectRequest request)
        {
            var customer = await _db.Customers.Find(c => c.CustomerId == request.CustomerId).FirstOrDefaultAsync();
            if (customer == null) return NotFound("Customer not found");

            var existing = await _db.Connections
                .Find(c => c.CustomerId == request.CustomerId && c.DistributorId == request.DistributorId)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                if (existing.Status == ConnectionStatus.Disconnected || existing.Status == ConnectionStatus.Rejected)
                {
                    // Reactivate connection
                    var update = Builders<CustomerDistributorConnection>.Update
                        .Set(c => c.Status, ConnectionStatus.Pending)
                        .Set(c => c.ConnectedOn, DateTime.UtcNow)
                        .Unset(c => c.DisconnectedOn);

                    await _db.Connections.UpdateOneAsync(
                        c => c.CustomerId == request.CustomerId && c.DistributorId == request.DistributorId,
                        update
                    );

                    return Ok(new { message = "Reconnection request sent successfully", status = "Pending" });
                }

                // Already Pending or Accepted => return current status
                return Ok(new { message = $"Connection already {existing.Status}", status = existing.Status.ToString() });
            }

            // Create new connection
            var newConnection = new CustomerDistributorConnection
            {
                CustomerId = request.CustomerId,
                DistributorId = request.DistributorId,
                ConnectedOn = DateTime.UtcNow,
                Status = ConnectionStatus.Pending
            };

            await _db.Connections.InsertOneAsync(newConnection);
            return Ok(new { message = "Connection request sent successfully", status = "Pending" });
        }
        // GET: api/customer/profile

        [HttpGet("profile")]
        public async Task<ActionResult<CustomerProfileDto>> GetProfile()
        {
            var customerId = User.FindFirstValue("CustomerId");
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized();

            var customer = await _customersCollection
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound();

            var dto = new CustomerProfileDto
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Email = customer.Email,
                PhoneNumber = customer.PhoneNumber,
                ProfileImageUrl = customer.ProfileImageUrl,
                Street = customer.Street,
                City = customer.City,
                State = customer.State,
                Pincode = customer.Pincode,
                Country = customer.Country,
                Role = customer.Role,
                IsRegistered = customer.IsRegistered,
                AddedByDistributorId = customer.AddedByDistributorId
            };

            return Ok(dto);
        }

        //[HttpGet("profile")]
        //public async Task<ActionResult<Customer>> GetProfile()
        //{
        //    var customerId = User.FindFirstValue("CustomerId"); // matches JWT claim
        //    if (string.IsNullOrEmpty(customerId))
        //        return Unauthorized();

        //    var customer = await _customersCollection.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
        //    if (customer == null)
        //        return NotFound();

        //    return Ok(customer);
        //}

        // PUT: api/customer/profile

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateCustomerProfileDto dto)
        {
            var customerId = User.FindFirst("CustomerId")?.Value;

            if (string.IsNullOrEmpty(customerId))
                return Unauthorized("Customer ID missing in token");

            var customer = await _customersCollection
                .Find(x => x.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound("Customer not found");


            // Update fields
            customer.Name = dto.Name ?? customer.Name;
            customer.Email = dto.Email ?? customer.Email;  // ✅ ADD THIS
            customer.PhoneNumber = dto.PhoneNumber ?? customer.PhoneNumber;
            customer.Street = dto.Street ?? customer.Street;
            customer.City = dto.City ?? customer.City;
            customer.State = dto.State ?? customer.State;
            customer.Pincode = dto.Pincode ?? customer.Pincode;
            customer.Country = dto.Country ?? customer.Country;

            // Image upload
            if (dto.ProfileImage != null)
            {
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
                if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

                var fileName = $"{Guid.NewGuid()}_{dto.ProfileImage.FileName}";

                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ProfileImage.CopyToAsync(stream);
                }

                customer.ProfileImageUrl = $"/uploads/{fileName}";
            }


            await _customersCollection.ReplaceOneAsync(x => x.CustomerId == customerId, customer);

            return Ok(new { message = "Profile updated successfully" });

        }


        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file)
        {
            var customerId = User.FindFirstValue("CustomerId");
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized(new { message = "Unauthorized" });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Invalid image file" });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");

            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            // Clean filename using FILE (NOT DTO!)
            var originalName = Path.GetFileNameWithoutExtension(file.FileName);
            var extension = Path.GetExtension(file.FileName);

            originalName = originalName.Replace(" ", "_")
                                       .Replace("(", "")
                                       .Replace(")", "")
                                       .Replace("%", "")
                                       .Replace("&", "")
                                       .Replace("#", "")
                                       .Replace("@", "")
                                       .Replace(",", "")
                                       .Replace(";", "");

            var fileName = $"{Guid.NewGuid()}_{originalName}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/{fileName}";

            var update = Builders<Customer>.Update
                .Set(c => c.ProfileImageUrl, imageUrl);

            await _customersCollection.UpdateOneAsync(
                c => c.CustomerId == customerId,
                update
            );

            return Ok(new
            {
                message = "Profile picture updated successfully",
                imageUrl
            });
        }

        [HttpGet("connected/{customerId}")]
        public async Task<IActionResult> GetConnectedDistributors(string customerId)
        {
            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId && c.Status == ConnectionStatus.Accepted)
                .ToListAsync();

            var distributors = new List<Distributor>();
            foreach (var conn in connections)
            {
                var dist = await _db.Distributors.Find(d => d.DistributorId == conn.DistributorId).FirstOrDefaultAsync();
                if (dist != null)
                    distributors.Add(dist);
            }

            return Ok(distributors);
        }
        public class ConnectRequest
        {
            public string CustomerId { get; set; }
            public string DistributorId { get; set; }
        }

        private string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }

        //[HttpPost("assign-temp")]
        //public async Task<IActionResult> AssignTemp([FromBody] AssignTempDto dto)
        //{
        //    await _tempService.AssignTodayAsync(dto.CustomerId, dto.TemporaryEmployeeId, dto.Date);
        //    return Ok(new { success = true });
        //}


    }
}
