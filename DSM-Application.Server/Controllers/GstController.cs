using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GstController : ControllerBase
    {
        private readonly MongoDbService _db;

        public GstController(MongoDbService db)   // ✔ Correct constructor
        {
            _db = db;
        }

        // ✔ GET GST by HSN
        [HttpGet("{hsn}")]
        public async Task<IActionResult> GetByHsn(string hsn)
        {
            var item = await _db.GstMaster
                .Find(x => x.Hsn == hsn)
                .FirstOrDefaultAsync();

            if (item == null)
                return NotFound("HSN not found");

            return Ok(item);
        }

        // ✔ GET ALL GST
        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.GstMaster
                .Find(_ => true)
                .ToListAsync();

            return Ok(items);
        }
    }
}
