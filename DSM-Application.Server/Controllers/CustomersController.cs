using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Newtonsoft.Json.Linq;

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
        private readonly IMongoCollection<Employee> _employees;
        private readonly IMongoCollection<InventoryItem> _inventory;


        public CustomersController(MongoDbService db, JwtService jwt, ProductService productService, TemporaryAssignmentService tempService)
        {
            _db = db;
            _jwt = jwt;
            _productService = productService;
            _tempService = tempService;
            _customersCollection = db.Customers;
            _employees = _db.Employees;
            _inventory = db.InventoryItems;

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
                IsRegistered = true,
                MustChangePassword = false
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
                customerId = customer.CustomerId,
                mustChangePassword = customer.MustChangePassword,

                addedByDistributorId = customer.AddedByDistributorId // 🔥 ADD THIS
            });
        }

        [Authorize(Roles = "Customer")]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var customerId = User.FindFirstValue("CustomerId");

            var update = Builders<Customer>.Update
                .Set(c => c.PasswordHash, ComputeHash(dto.NewPassword))
                .Set(c => c.MustChangePassword, false); // 🔥 IMPORTANT

            await _db.Customers.UpdateOneAsync(
                c => c.CustomerId == customerId,
                update
            );

            return Ok(new { message = "Password updated successfully" });
        }



        [Authorize(Roles = "Distributor")]
        [HttpPost("create-by-distributor")]
        public async Task<IActionResult> CreateByDistributor([FromBody] DistributorCreateCustomerDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await _db.Customers
                .Find(c =>
                    (!string.IsNullOrEmpty(dto.Email) && c.Email == dto.Email) ||
                    (!string.IsNullOrEmpty(dto.PhoneNumber) && c.PhoneNumber == dto.PhoneNumber)
                )
                .FirstOrDefaultAsync();

            if (existing != null)
                return BadRequest("Email or phone number already exists.");

            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID not found in token");

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                Role = "Customer",
                AddedByDistributorId = distributorId,
                PasswordHash = ComputeHash(dto.Password),
                IsRegistered = true,
                MustChangePassword = true
            };

            await _db.Customers.InsertOneAsync(customer);

            // ⭐⭐⭐ AUTO-CONNECT CUSTOMER TO DISTRIBUTOR ⭐⭐⭐
            var connection = new CustomerDistributorConnection
            {
                CustomerId = customer.CustomerId,
                DistributorId = distributorId,
                Status = ConnectionStatus.Accepted,
                ConnectedOn = DateTime.UtcNow
            };

            await _db.Connections.InsertOneAsync(connection);

            return Ok(new
            {
                message = "Customer created and automatically connected.",
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
        [Authorize(Roles = "Customer")]
        [HttpGet("my-customers-for-customer")]
        public async Task<IActionResult> GetCustomersForCustomer()
        {
            // 1️⃣ Logged-in customer
            var customerId = User.FindFirst("CustomerId")?.Value;
            if (string.IsNullOrEmpty(customerId))
                return Unauthorized("Customer ID not found");

            // 2️⃣ Load customer
            var customer = await _db.Customers
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound("Customer not found");

            // 3️⃣ Get distributor who owns this customer
            var distributorId = customer.AddedByDistributorId;
            if (string.IsNullOrEmpty(distributorId))
                return Ok(new List<object>());

            // 4️⃣ Load all customers under same distributor
            var customers = await _db.Customers
                .Find(c => c.AddedByDistributorId == distributorId)
                .ToListAsync();

            // 5️⃣ SAME RESPONSE SHAPE AS DISTRIBUTOR API
            return Ok(customers.Select(c => new
            {
                customerId = c.CustomerId,
                customerName = c.Name,
                email = c.Email,
                phoneNumber = c.PhoneNumber
            }));
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
            // 1️⃣ Fetch customer
            var customer = await _db.Customers
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound("Customer not found");

            // 2️⃣ Fetch distributor–customer connections
            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId)
                .ToListAsync();

            // 3️⃣ Load all distributors
            var allDistributors = await _db.Distributors
                .Find(_ => true)
                .ToListAsync();

            var distributorsWithProducts = new List<object>();

            foreach (var dist in allDistributors)
            {
                var conn = connections.FirstOrDefault(c => c.DistributorId == dist.DistributorId);
                bool isCreatorDistributor = customer.AddedByDistributorId == dist.DistributorId;
                bool isAcceptedConnection = conn != null && conn.Status == ConnectionStatus.Accepted;


                // Set status
                if (isCreatorDistributor)
                {
                    dist.Status = "Connected";
                }
                else if (conn != null)
                {
                    dist.Status = conn.Status.ToString(); // Accepted / Pending / Rejected
                }
                else
                {
                    dist.Status = "Available";
                }


                // ✅ LOAD PRODUCTS CONDITIONALLY
                List<object> products = new();

                if (isCreatorDistributor || isAcceptedConnection)
                {
                    var distributorProducts =
                        await _productService.GetProductsByDistributorAsync(dist.DistributorId);

                    var inventoryItems = await _inventory
                        .Find(i => i.DistributorId == dist.DistributorId)
                        .ToListAsync();

                    products = distributorProducts.Select(p =>
                    {
                        var stock = inventoryItems.FirstOrDefault(i => i.ProductId == p.ProductId);

                        return new
                        {
                            p.ProductId,
                            p.ProductName,
                            p.ProductCode,
                            p.Price,
                            p.Measure,
                            p.ImageUrls,
                            p.Brand,
                            p.Color,
                            p.DistributorId,
                            p.DistributorName,
                            currentStock = stock?.CurrentStock ?? 0
                        };
                    }).ToList<object>();
                }

                bool canConnect =
                    !isCreatorDistributor &&
                    (
                        conn == null ||
                        conn.Status == ConnectionStatus.Disconnected ||
                        conn.Status == ConnectionStatus.Rejected
                    );

                distributorsWithProducts.Add(new
                {
                    distributor = dist,
                    products = products,
                    canConnect = canConnect
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

            // 5️⃣ Map orders → DTO
            var orderDtos = orders.Select(o =>
            {
                var first = o.Products.FirstOrDefault();

                return new DistributorOrderDto
                {
                    Id = o.Id,
                    CustomerId = o.CustomerId,
                    Products = o.Products,

                    Subtotal = o.Subtotal,
                    TotalDiscount = o.TotalDiscount,
                    TotalAmount = o.TotalAmount,

                    SpecialDiscountPercent = first?.SpecialDiscountPercent ?? 0,
                    QuantityDiscountPercent = first?.QuantityDiscountPercent ?? 0,
                    PriceDiscountPercent = first?.PriceDiscountPercent ?? 0,
                    TotalDiscountPercent = first?.TotalDiscountPercent ?? 0,

                    OrderedDate = o.OrderedDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate,
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

            // 6️⃣ Final response
            return Ok(new
            {
                isGlobal = true,
                distributors = distributorsWithProducts,
                orders = orderDtos
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



        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllProductsForCustomers()
        {
            var products = await _productService.GetAllActiveAsync();
            return Ok(products);
        }


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


        [HttpGet("get-customer/{customerId}")]
        public async Task<IActionResult> GetCustomerById(string customerId)
        {
            var customer = await _customersCollection
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound("Customer not found");

            return Ok(new
            {

                role = customer.Role,
                customerId = customer.CustomerId,
                name = customer.Name,
                email = customer.Email,
                phoneNumber = customer.PhoneNumber
            });
        }




        [HttpGet("{customerId}/connected-distributors")]
        public async Task<IActionResult> GetConnectedDistributors(string customerId)
        {
            var customer = await _db.Customers
                .Find(c => c.CustomerId == customerId)
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound();

            var connections = await _db.Connections
                .Find(c => c.CustomerId == customerId)
                .ToListAsync();

            return Ok(new
            {
                acceptedDistributors = connections
                    .Where(c => c.Status == ConnectionStatus.Accepted)
                    .Select(c => c.DistributorId),

                // ✅ FIX IS HERE
                pendingDistributors = connections
                    .Where(c =>
                        c.Status == ConnectionStatus.Pending &&
                        c.DistributorId != customer.AddedByDistributorId
                    )
                    .Select(c => c.DistributorId),

                creatorDistributorId = customer.AddedByDistributorId
            });
        }


        [Authorize(Roles = "CashCollector,Employee")]
        [HttpGet("for-cash-collector")]
        public async Task<IActionResult> GetCustomersForCashCollector()
        {
            // 🔑 Get employeeId from token
            var employeeId = User.FindFirst("EmployeeId")?.Value;

            if (string.IsNullOrEmpty(employeeId))
                return Unauthorized("EmployeeId missing in token");

            // 🔎 Find employee
            var employee = await _db.Employees
                .Find(e => e.EmployeeId == employeeId)
                .FirstOrDefaultAsync();

            if (employee == null)
                return Unauthorized("Employee not found");

            var distributorId = employee.DistributorId;

            // 1️⃣ Customers CREATED by this distributor
            var createdCustomers = await _db.Customers
                .Find(c => c.AddedByDistributorId == distributorId)
                .ToListAsync();

            // 2️⃣ ACCEPTED connections
            var connections = await _db.Connections
                .Find(c => c.DistributorId == distributorId &&
                           c.Status == ConnectionStatus.Accepted)
                .ToListAsync();

            var connectedCustomerIds = connections
                .Select(c => c.CustomerId)
                .ToList();

            var connectedCustomers = await _db.Customers
                .Find(c => connectedCustomerIds.Contains(c.CustomerId))
                .ToListAsync();

            // 3️⃣ Merge + remove duplicates
            var customers = createdCustomers
                .Concat(connectedCustomers)
                .GroupBy(c => c.CustomerId)
                .Select(g => g.First())
                .ToList();

            // 4️⃣ Attach permanent employee name (optional but useful)
            var employeeIds = connections
                .Where(c => !string.IsNullOrEmpty(c.PermanentEmployeeId))
                .Select(c => c.PermanentEmployeeId)
                .Distinct()
                .ToList();

            var employees = await _db.Employees
                .Find(e => employeeIds.Contains(e.EmployeeId))
                .ToListAsync();

            var result = customers.Select(c =>
            {
                var conn = connections.FirstOrDefault(x => x.CustomerId == c.CustomerId);
                var emp = employees.FirstOrDefault(e => e.EmployeeId == conn?.PermanentEmployeeId);

                return new
                {
                    c.CustomerId,
                    c.Name,
                    c.PhoneNumber,
                    c.Address,
                    c.IsRegistered,
                    PermanentEmployeeName = emp?.Name ?? "Not Assigned"
                };
            });

            return Ok(result);
        }




        //[Authorize(Roles = "Distributor")]
        // [Authorize(Roles = "Distributor")]
        [HttpGet("all-for-distributor")]
        public async Task<IActionResult> GetAllCustomersForDistributor()
        {
            var distributorId = User.FindFirst("DistributorId")?.Value;
            if (distributorId == null)
                return Unauthorized("Distributor ID missing");

            // 1️⃣ Customers created by distributor
            var createdCustomers = await _db.Customers
                .Find(c => c.AddedByDistributorId == distributorId)
                .ToListAsync();

            // 2️⃣ Accepted connections
            var connections = await _db.Connections
                .Find(c => c.DistributorId == distributorId &&
                           c.Status == ConnectionStatus.Accepted)
                .ToListAsync();

            var connectedCustomerIds = connections
                .Select(c => c.CustomerId)
                .ToList();

            var connectedCustomers = await _db.Customers
                .Find(c => connectedCustomerIds.Contains(c.CustomerId))
                .ToListAsync();

            // 3️⃣ Merge customers (avoid duplicates)
            var customers = createdCustomers
                .Concat(connectedCustomers)
                .GroupBy(c => c.CustomerId)
                .Select(g => g.First())
                .ToList();

            // 4️⃣ Load employees (for name lookup)
            var employeeIds = connections
                .Where(c => !string.IsNullOrEmpty(c.PermanentEmployeeId))
                .Select(c => c.PermanentEmployeeId)
                .Distinct()
                .ToList();

            var employees = await _db.Employees
                .Find(e => employeeIds.Contains(e.EmployeeId))
                .ToListAsync();

            // 5️⃣ Final response with permanent employee name
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

                    AddedByDistributorId = c.AddedByDistributorId,
                    IsAddedByDistributor = c.AddedByDistributorId == distributorId,


                    PermanentEmployeeId = conn?.PermanentEmployeeId,
                    PermanentEmployeeName = emp?.Name   // ✅ KEY FIX
                };
            });

            return Ok(result);
        }

        [HttpGet("check-email/{email}")]
        public async Task<IActionResult> CheckEmailExists(string email)
        {
            if (string.IsNullOrEmpty(email))
                return Ok(false);

            var exists = await _customersCollection
                .Find(c => c.Email.ToLower() == email.ToLower())
                .AnyAsync();

            return Ok(exists);
        }

        [HttpGet("check-phone/{phone}")]
        public async Task<IActionResult> CheckPhoneExists(string phone)
        {
            if (string.IsNullOrEmpty(phone))
                return Ok(false);

            var exists = await _customersCollection
                .Find(c => c.PhoneNumber == phone)
                .AnyAsync();

            return Ok(exists);
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
