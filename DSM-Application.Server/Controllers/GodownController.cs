using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/godown")]
public class GodownController : ControllerBase
{
    private readonly IMongoCollection<Distributor> _distributors;

    public GodownController(MongoDbService db)
    {
        _distributors = db.Database.GetCollection<Distributor>("Distributors");
    }

    [HttpPost("add/{distributorId}")]
    public async Task<IActionResult> AddGodown(
        string distributorId,
        [FromBody] GodownLocation godown)
    {
        var filter = Builders<Distributor>
            .Filter.Eq(d => d.DistributorId, distributorId);

        var update = Builders<Distributor>
            .Update.Push(d => d.Godowns, godown);

        await _distributors.UpdateOneAsync(filter, update);

        return Ok("Godown Added");
    }

    [HttpPost("godown/location")]
    [Authorize]
    public async Task<IActionResult> SaveGodownLocation(
    [FromBody] GodownLocationDto dto)
    {
        var distributorId = User.FindFirst("distributorId")?.Value
                 ?? User.FindFirst("DistributorId")?.Value;

        if (string.IsNullOrEmpty(distributorId))
            return Unauthorized();

        var filter = Builders<Distributor>
            .Filter.Eq(x => x.DistributorId, distributorId);

        var update = Builders<Distributor>.Update.Set(
            x => x.Godowns,
            new List<GodownLocation>
            {
            new GodownLocation
            {
                Name = "Main Godown",
                Lat = dto.Lat,
                Lng = dto.Lng,
                RadiusMeters = 80
            }
            });

        await _distributors.UpdateOneAsync(filter, update);

        return Ok();
    }
}