using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DistributorManagementSystem.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LiveLocationController : ControllerBase
    {
        private readonly MongoDbService _db;
        private readonly IMongoCollection<LiveLocation> _locations;
        private readonly IMongoCollection<Distributor> _distributors;

        // ✅ FIXED CONSTRUCTOR
        public LiveLocationController(MongoDbService db)
        {
            _db = db; // ✅ THIS WAS MISSING
            _locations = db.Database.GetCollection<LiveLocation>("LiveLocations");
            _distributors = db.Database.GetCollection<Distributor>("Distributors");
        }

        // ✅ KEEP THIS METHOD — JUST REPLACE THE BODY
        //[AllowAnonymous]
        //[HttpPost]
        //public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        //{
        //    var distributor = await _distributors
        //        .Find(d => d.DistributorId == location.DistributorId)
        //        .FirstOrDefaultAsync();

        //    if (distributor == null ||
        //        distributor.GodownLat == 0 ||
        //        distributor.GodownLng == 0)
        //    {
        //        return BadRequest("Godown location not configured");
        //    }

        //    var distance = GeoDistanceService.GetDistanceInMeters(
        //        distributor.GodownLat,
        //        distributor.GodownLng,
        //        location.Lat,
        //        location.Lng
        //    );

        //    if (distance <= 200)
        //    {
        //        return Ok(new
        //        {
        //            ignored = true,
        //            reason = "Inside godown",
        //            distance
        //        });
        //    }

        //    location.IsInsideGodown = false;
        //    location.Time = DateTime.UtcNow;

        //    await _locations.InsertOneAsync(location);

        //    return Ok(new
        //    {
        //        saved = true,
        //        distance
        //    });
        //}

        //[AllowAnonymous]
        //[HttpPost]
        //public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        //{
        //    location.Time = DateTime.UtcNow;
        //    location.IsInsideGodown = false;

        //    await _locations.InsertOneAsync(location);

        //    return Ok(new { saved = true });
        //}

        //    [AllowAnonymous]
        //    [HttpPost]
        //    public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        //    {
        //        try
        //        {
        //            // Always set server time
        //            location.Time = DateTime.UtcNow;

        //            // Default values
        //            location.IsInsideGodown = false;
        //            double distance = -1;

        //            // Fetch distributor
        //            var distributor = await _distributors
        //                .Find(d => d.DistributorId == location.DistributorId)
        //                .FirstOrDefaultAsync();

        //            // If godown is configured, calculate distance
        //            if (distributor != null &&
        //                distributor.GodownLat != 0 &&
        //                distributor.GodownLng != 0)
        //            {
        //                distance = GeoDistanceService.GetDistanceInMeters(
        //                    distributor.GodownLat,
        //                    distributor.GodownLng,
        //                    location.Lat,
        //                    location.Lng
        //                );

        //                location.IsInsideGodown = distance <= 200;
        //            }

        //            await _locations.InsertOneAsync(location);

        //            return Ok(new
        //            {
        //                saved = true,
        //                isInsideGodown = location.IsInsideGodown,
        //                distance
        //            });
        //        }
        //        catch (Exception ex)
        //        {
        //            Console.WriteLine("LiveLocation error: " + ex);

        //            return Ok(new
        //            {
        //                saved = false,
        //                error = "Handled exception"
        //            });
        //        }
        //    }
        //}
        //[AllowAnonymous]
        //[HttpPost]
        //public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        //{
        //    try
        //    {
        //        location.Time = DateTime.UtcNow;

        //        // ✅ EXACT GODOWN LOCATION (confirmed)
        //        const double GODOWN_LAT = 14.435987537475501;
        //        const double GODOWN_LNG = 75.92146032454494;
        //        const double GODOWN_RADIUS_METERS = 80;

        //        var distance = GeoDistanceService.GetDistanceInMeters(
        //            GODOWN_LAT,
        //            GODOWN_LNG,
        //            location.Lat,
        //            location.Lng
        //        );

        //        Console.WriteLine($"📏 Distance from godown: {distance} meters");

        //        // 🟢 INSIDE GODOWN → IGNORE COMPLETELY
        //        if (distance <= GODOWN_RADIUS_METERS)
        //        {
        //            return Ok(new
        //            {
        //                ignored = true,
        //                isInsideGodown = true,
        //                distance
        //            });
        //        }

        //        // 🔴 OUTSIDE GODOWN → SAVE
        //        location.IsInsideGodown = false;
        //        await _locations.InsertOneAsync(location);

        //        return Ok(new
        //        {
        //            saved = true,
        //            isInsideGodown = false,
        //            distance
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine("LiveLocation error: " + ex);

        //        return Ok(new
        //        {
        //            saved = false,
        //            error = "Handled exception"
        //        });
        //    }
        //}


        //[AllowAnonymous]
        //[HttpPost]
        //public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        //{
        //    // Check if employee is on duty
        //    if (!ObjectId.TryParse(location.EmployeeId, out var empObjId))
        //    {
        //        return BadRequest("Invalid EmployeeId");
        //    }

        //    Console.WriteLine("DB = " + _db.Database.DatabaseNamespace.DatabaseName);
        //    //var emp = await _db.Database
        //    // .GetCollection<Employee>("Employees")
        //    // .Find(e => e.EmployeeId == location.EmployeeId) // ✅ use EmployeeId
        //    // .FirstOrDefaultAsync();

        //    //var emp = await _db.Database
        //    //    .GetCollection<Employee>("Employees")
        //    //    .Find(e => e.EmployeeId == location.EmployeeId)
        //    //    .FirstOrDefaultAsync();

        //    //if (emp == null || !emp.IsOnDuty)
        //    //{
        //    //    return Ok(new { ignored = true, reason = "Not on duty" });
        //    //}

        //    var session = await _db.Database
        //    .GetCollection<DeliverySession>("DeliverySessions")
        //    .Find(s => s.EmployeeId == location.EmployeeId && s.IsActive)
        //    .FirstOrDefaultAsync();

        //    if (session == null)
        //    {
        //        return Ok(new { ignored = true, reason = "No active trip" });
        //    }

        //    try
        //    {
        //        location.Time = DateTime.UtcNow;

        //        // ✅ Fetch distributor
        //        // Convert string → ObjectId
        //        if (!ObjectId.TryParse(location.DistributorId, out var distObjId))
        //        {
        //            return BadRequest("Invalid DistributorId");
        //        }

        //        var distributor = await _distributors
        //            .Find(d => d.DistributorId == location.DistributorId) // 👈 _id field
        //            .FirstOrDefaultAsync();

        //        //var distributor = await _distributors
        //        //    .Find(d => d.DistributorId == location.DistributorId)
        //        //    .FirstOrDefaultAsync();

        //        if (distributor == null || distributor.Godowns == null || distributor.Godowns.Count == 0)
        //        {
        //            return BadRequest("No godown configured for this distributor");
        //        }

        //        bool insideGodown = false;
        //        double minDistance = double.MaxValue;

        //        // ✅ Check all godowns
        //        foreach (var godown in distributor.Godowns)
        //        {
        //            var d = GeoDistanceService.GetDistanceInMeters(
        //                godown.Lat,
        //                godown.Lng,
        //                location.Lat,
        //                location.Lng
        //            );

        //            if (d < minDistance)
        //                minDistance = d;

        //            if (d <= godown.RadiusMeters)
        //            {
        //                insideGodown = true;
        //                break;
        //            }
        //        }

        //        // 🟢 Inside → Ignore
        //        //    if (insideGodown)
        //        //    {
        //        //        return Ok(new
        //        //        {
        //        //            ignored = true,
        //        //            isInsideGodown = true,
        //        //            distance = minDistance
        //        //        });
        //        //    }

        //        //    // 🔴 Outside → Save
        //        //    location.IsInsideGodown = false;

        //        //    await _locations.InsertOneAsync(location);

        //        //    return Ok(new
        //        //    {
        //        //        saved = true,
        //        //        isInsideGodown = false,
        //        //        distance = minDistance
        //        //    });
        //        //}

        //        // ✅ Always set flags
        //        location.IsInsideGodown = insideGodown;
        //        location.IsIgnored = insideGodown; // inside = ignored
        //        location.Time = DateTime.UtcNow;

        //        // ✅ Always save
        //        //await _locations.InsertOneAsync(location);

        //        await _locations.UpdateOneAsync(
        //        Builders<LiveLocation>.Filter.Eq(l => l.EmployeeId, location.EmployeeId),

        //        Builders<LiveLocation>.Update
        //            .Set(l => l.EmployeeId, location.EmployeeId)
        //            .Set(l => l.DistributorId, location.DistributorId)
        //            .Set(l => l.Lat, location.Lat)
        //            .Set(l => l.Lng, location.Lng)
        //            .Set(l => l.Time, location.Time)
        //            .Set(l => l.IsInsideGodown, insideGodown)
        //            .Set(l => l.IsIgnored, insideGodown),

        //        new UpdateOptions { IsUpsert = true }
        //        );

        //        // ✅ Return response
        //        return Ok(new
        //        {
        //            saved = true,
        //            isInsideGodown = insideGodown,
        //            distance = minDistance
        //        });
        //    }

        //    catch (Exception ex)
        //    {
        //        Console.WriteLine("🔥 LiveLocation ERROR: " + ex.ToString());

        //        return StatusCode(500, new
        //        {
        //            saved = false,
        //            error = ex.Message
        //        });
        //    }
        //    //catch (Exception ex)
        //    //{
        //    //    Console.WriteLine("LiveLocation error: " + ex);

        //    //    return Ok(new
        //    //    {
        //    //        saved = false,
        //    //        error = "Exception"
        //    //    });
        //    //}
        //}

        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> SaveLocation([FromBody] LiveLocation location)
        {
            if (location == null || string.IsNullOrWhiteSpace(location.EmployeeId))
                return BadRequest("EmployeeId is required");

            try
            {
                // --------------------------------------------------
                // 1️⃣ CHECK ACTIVE DELIVERY SESSION
                // --------------------------------------------------

                var session = await _db.Database
                    .GetCollection<DeliverySession>("DeliverySessions")
                    .Find(s => s.EmployeeId == location.EmployeeId && s.IsActive)
                    .FirstOrDefaultAsync();

                if (session == null)
                {
                    return Ok(new
                    {
                        ignored = true,
                        reason = "No active trip"
                    });
                }


                // --------------------------------------------------
                // 2️⃣ SET SERVER TIME
                // --------------------------------------------------

                location.Time = DateTime.UtcNow;


                // --------------------------------------------------
                // 3️⃣ FETCH DISTRIBUTOR + GODOWNS
                // --------------------------------------------------

                var distributor = await _distributors
                    .Find(d => d.DistributorId == location.DistributorId)
                    .FirstOrDefaultAsync();

                if (distributor == null || distributor.Godowns == null || distributor.Godowns.Count == 0)
                {
                    return BadRequest("No godown configured for this distributor");
                }


                // --------------------------------------------------
                // 4️⃣ CHECK GODOWN DISTANCE
                // --------------------------------------------------

                bool insideGodown = false;
                double minDistance = double.MaxValue;

                foreach (var godown in distributor.Godowns)
                {
                    var d = GeoDistanceService.GetDistanceInMeters(
                        godown.Lat,
                        godown.Lng,
                        location.Lat,
                        location.Lng
                    );

                    if (d < minDistance)
                        minDistance = d;

                    if (d <= godown.RadiusMeters)
                    {
                        insideGodown = true;
                        break;
                    }
                }


                // --------------------------------------------------
                // 5️⃣ SET FLAGS
                // --------------------------------------------------

                location.IsInsideGodown = insideGodown;
                location.IsIgnored = insideGodown;


                // --------------------------------------------------
                // 6️⃣ UPSERT LIVE LOCATION (ONE ROW PER EMPLOYEE)
                // --------------------------------------------------

                await _locations.UpdateOneAsync(
                    Builders<LiveLocation>.Filter.Eq(l => l.EmployeeId, location.EmployeeId),

                    Builders<LiveLocation>.Update
                        .Set(l => l.EmployeeId, location.EmployeeId)
                        .Set(l => l.DistributorId, location.DistributorId)
                        .Set(l => l.Lat, location.Lat)
                        .Set(l => l.Lng, location.Lng)
                        .Set(l => l.Time, location.Time)
                        .Set(l => l.IsInsideGodown, insideGodown)
                        .Set(l => l.IsIgnored, insideGodown),

                    new UpdateOptions { IsUpsert = true }
                );


                // --------------------------------------------------
                // 7️⃣ SAVE ROUTE POINT IN SESSION (HISTORY)
                // --------------------------------------------------

                await _db.Database
                    .GetCollection<DeliverySession>("DeliverySessions")
                    .UpdateOneAsync(
                        s => s.Id == session.Id,

                        Builders<DeliverySession>.Update.Push(s => s.Route,
                            new LatLongPoint
                            {
                                Lat = location.Lat,
                                Lng = location.Lng,
                                Time = location.Time
                            })
                    );


                // --------------------------------------------------
                // 8️⃣ RETURN SUCCESS
                // --------------------------------------------------

                return Ok(new
                {
                    saved = true,
                    isInsideGodown = insideGodown,
                    distance = minDistance
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 LiveLocation ERROR: " + ex);

                return StatusCode(500, new
                {
                    saved = false,
                    error = ex.Message
                });
            }
        }

        // ✅ GET LIVE EMPLOYEE LOCATIONS
        //[AllowAnonymous]
        //[HttpGet("active")]
        //public async Task<IActionResult> GetLiveEmployees()
        //{
        //    try
        //    {
        //        // Get latest location per employee (today only)
        //        var today = DateTime.UtcNow.Date;

        //        //var list = await _locations
        //        //    .Find(l => l.Time >= today)
        //        //var list = await _locations
        //        ////.Find(l => l.Time >= today && !l.IsIgnored) // ❗ filter
        //        //    .Find(l => l.Time >= today)
        //        //    .SortByDescending(l => l.Time)
        //        //    .ToListAsync();

        //        // Group by EmployeeId → get latest point
        //        //var result = list
        //        //    .GroupBy(l => l.EmployeeId)
        //        //    .Select(g => g.First())
        //        //    .ToList();


        //        //return Ok(result);
        //        return new JsonResult(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine("GetLiveEmployees error: " + ex);
        //        return Ok(new List<LiveLocation>());
        //    }
        //}

        //[AllowAnonymous]
        //[HttpGet("active")]
        //public async Task<IActionResult> GetLiveEmployees()
        //{
        //    var sessions = await _db.Database
        //        .GetCollection<DeliverySession>("DeliverySessions")
        //        .Find(s => s.IsActive)
        //        .Project(s => s.EmployeeId)
        //        .ToListAsync();

        //    if (!sessions.Any())
        //        return Ok(new List<LiveLocation>());

        //    var live = await _locations
        //        .Find(l => sessions.Contains(l.EmployeeId))
        //        .ToListAsync();

        //    return Ok(live);
        //}

//        [Authorize(Roles = "Distributor")]
//[HttpGet("active")]
//public async Task<IActionResult> GetLiveEmployees()
        [AllowAnonymous]
        [HttpGet("active/{distributorId}")]
        public async Task<IActionResult> GetLiveEmployees(string distributorId)
        {
            if (string.IsNullOrWhiteSpace(distributorId))
                return BadRequest("DistributorId required");

            // 1️⃣ Get active sessions ONLY for this distributor
            var sessions = await _db.Database
                .GetCollection<DeliverySession>("DeliverySessions")
                .Find(s =>
                    s.IsActive &&
                    s.DistributorId == distributorId   // ⭐ IMPORTANT
                )
                .Project(s => s.EmployeeId)
                .ToListAsync();

            if (!sessions.Any())
                return Ok(new List<LiveLocation>());

            // 2️⃣ Get live locations ONLY for those employees
            var live = await _locations
                .Find(l =>
                    sessions.Contains(l.EmployeeId) &&
                    l.DistributorId == distributorId   // ⭐ EXTRA SAFETY
                )
                .ToListAsync();

            return Ok(live);
        }

        //[AllowAnonymous]
        //[HttpGet("active")]
        //public async Task<IActionResult> GetLiveEmployees()
        //{
        //    // 1️⃣ Get active employees
        //    var sessions = await _db.Database
        //        .GetCollection<DeliverySession>("DeliverySessions")
        //        .Find(s => s.IsActive)
        //        .Project(s => s.EmployeeId)
        //        .ToListAsync();

        //    if (!sessions.Any())
        //        return Ok(new List<LiveLocation>());

        //    // 2️⃣ Get ONLY outside-godown locations
        //    var live = await _locations
        //        .Find(l =>
        //            sessions.Contains(l.EmployeeId) &&
        //            !l.IsInsideGodown &&
        //            !l.IsIgnored
        //        )
        //        .ToListAsync();

        //    return Ok(live);
        //}

        // ✅ GET FULL ROUTE FOR TODAY
        [AllowAnonymous]
        [HttpGet("route/{empId}")]
        public async Task<IActionResult> GetTodayRoute(string empId)
        {
            try
            {
                var today = DateTime.UtcNow.Date;

                var route = await _locations
                    //.Find(l => l.EmployeeId == empId && l.Time >= today)
                    .Find(l => l.EmployeeId == empId && l.Time >= today && !l.IsIgnored)
                    .SortBy(l => l.Time)
                    .ToListAsync();

                return Ok(route);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Route error: " + ex);
                return Ok(new List<LiveLocation>());
            }
        }
    }
  }