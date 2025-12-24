using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Security.Claims;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly MongoDbService _db;

    public SearchController(MongoDbService db)
    {
        _db = db;
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("distributors")]
    public async Task<IActionResult> SearchDistributorsByProduct([FromQuery] string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return BadRequest("Search keyword required");

        // 1️⃣ Logged-in customer
        var customerId = User.FindFirstValue("CustomerId");

        var customer = await _db.Customers
            .Find(c => c.CustomerId == customerId)
            .FirstOrDefaultAsync();

        if (customer == null)
            return Unauthorized("Customer not found");

        if (string.IsNullOrEmpty(customer.Pincode))
            return BadRequest("Customer pincode not set");

        // 2️⃣ PRODUCT SEARCH (WORD-BASED)
        var words = keyword
            .ToLower()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var regexFilters = words.Select(w =>
            Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex(p => p.ProductName, new BsonRegularExpression(w, "i")),
                Builders<Product>.Filter.Regex(p => p.Category, new BsonRegularExpression(w, "i"))
            )
        ).ToList();

        var productFilter = Builders<Product>.Filter.And(
            Builders<Product>.Filter.Eq(p => p.IsActive, true),
            Builders<Product>.Filter.And(regexFilters)
        );

        var products = await _db.Products
            .Find(productFilter)
            .ToListAsync();

        if (!products.Any())
            return Ok(new List<object>());

        // 3️⃣ Distributor IDs from products
        var distributorIds = products
            .Select(p => p.DistributorId)
            .Distinct()
            .ToList();

        // 4️⃣ Filter distributors by pincode
        var distributors = await _db.Distributors
            .Find(d =>
                distributorIds.Contains(d.DistributorId) &&
                (
                    d.ServicePincodes == null ||
                    d.ServicePincodes.Count == 0 ||
                    d.ServicePincodes.Contains(customer.Pincode)
                )
            )
            .ToListAsync();

        // 5️⃣ Connection status
        var connections = await _db.Connections
            .Find(c => c.CustomerId == customerId)
            .ToListAsync();

        // 6️⃣ Response
        var result = distributors.Select(d =>
        {
            var conn = connections.FirstOrDefault(c => c.DistributorId == d.DistributorId);

            return new
            {
                distributorId = d.DistributorId,
                companyName = d.CompanyName,
                city = d.City,
                yearsInBusiness = d.YearsInBusiness,
                rating = d.Rating,
                status = conn?.Status.ToString() ?? "Available",
                canConnect = conn == null || conn.Status != ConnectionStatus.Accepted
            };
        });

        return Ok(result);
    }
}
