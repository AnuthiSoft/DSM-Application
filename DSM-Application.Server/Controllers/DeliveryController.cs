using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Threading.Tasks;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class DeliveryController : ControllerBase
{
    private readonly IMongoCollection<DeliverySession> _sessions;
    private readonly IMongoCollection<LiveLocation> _live;
    private readonly IMongoCollection<EmployeeDevice> _devices;
    private readonly IMongoCollection<Employee> _employees;

    public DeliveryController(IMongoDatabase db)
    {
        _sessions = db.GetCollection<DeliverySession>("DeliverySessions");
        _live = db.GetCollection<LiveLocation>("LiveLocations");
        _devices = db.GetCollection<EmployeeDevice>("EmployeeDevices"); // ✅ ADD
        _employees = db.GetCollection<Employee>("Employees");
    }

    // 1) DISTRIBUTOR: start trip for an employee
    //[HttpPost("start")]
    //public async Task<IActionResult> StartTrip([FromBody] StartTripDto dto)
    //{
    //    if (dto == null || string.IsNullOrWhiteSpace(dto.EmployeeId))
    //        return BadRequest("EmployeeId is required");

    //    // 🔴 CHECK IF ALREADY ACTIVE
    //    var activeSession = await _sessions
    //        .Find(s => s.EmployeeId == dto.EmployeeId && s.IsActive)
    //        .FirstOrDefaultAsync();

    //    if (activeSession != null)
    //    {
    //        return BadRequest("Trip already started for this employee");
    //    }

    //    var session = new DeliverySession
    //    {
    //        Id = ObjectId.GenerateNewId(),
    //        EmployeeId = dto.EmployeeId,
    //        StartTime = DateTime.UtcNow,
    //        IsActive = true,
    //        Route = new List<LatLongPoint>()
    //    };

    //    await _sessions.InsertOneAsync(session);
    //    // ⭐ MARK EMPLOYEE ON DUTY
    //    await _employees.UpdateOneAsync(
    //        e => e.EmployeeId == dto.EmployeeId,
    //        Builders<Employee>.Update
    //            .Set(e => e.IsOnDuty, true)
    //            .Set(e => e.UpdatedDate, DateTime.UtcNow)
    //    );

    //    return Ok(new { started = true });
    //}


    [HttpPost("start")]
    public async Task<IActionResult> StartTrip([FromBody] StartTripDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.EmployeeId))
            return BadRequest("EmployeeId is required");

        // ✅ STRICT CHECK: Do NOT auto close
        var activeSession = await _sessions
            .Find(s => s.EmployeeId == dto.EmployeeId && s.IsActive)
            .FirstOrDefaultAsync();

        if (activeSession != null)
        {
            return Ok(new
            {
                started = false,
                message = "Trip already started"
            });
        }

        var session = new DeliverySession
        {
            Id = ObjectId.GenerateNewId(),
            EmployeeId = dto.EmployeeId,
            StartTime = DateTime.UtcNow,
            IsActive = true,
            Route = new List<LatLongPoint>()
        };

        await _sessions.InsertOneAsync(session);

        await _employees.UpdateOneAsync(
            e => e.EmployeeId == dto.EmployeeId,
            Builders<Employee>.Update
                .Set(e => e.IsOnDuty, true)
                .Set(e => e.UpdatedDate, DateTime.UtcNow)
        );

        return Ok(new
        {
            started = true,
            message = "Trip started"
        });
    }


    // 2) DISTRIBUTOR: stop trip for an employee
    [HttpPost("stop")]
    public async Task<IActionResult> StopTrip([FromBody] StopTripDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.EmployeeId))
            return BadRequest("EmployeeId is required");

        var result = await _sessions.UpdateOneAsync(
            s => s.EmployeeId == dto.EmployeeId && s.IsActive,
            Builders<DeliverySession>.Update
                .Set(s => s.IsActive, false)
                .Set(s => s.EndTime, DateTime.UtcNow)
        );

        if (result.MatchedCount == 0)
        {
            return BadRequest("No active trip found to stop");
        }

        // ⭐ MARK EMPLOYEE OFF DUTY
        await _employees.UpdateOneAsync(
            e => e.EmployeeId == dto.EmployeeId,
            Builders<Employee>.Update
                .Set(e => e.IsOnDuty, false)
                .Set(e => e.UpdatedDate, DateTime.UtcNow)
        );

        return Ok(new { stopped = true });
    }






    // 3) EMPLOYEE APP: send live location every X seconds

    [HttpPost("live")]
    public async Task<IActionResult> SaveLive([FromBody] LiveLocationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.EmployeeId))
            return NoContent();

        // ✅ Allow GPS only if trip is active
        var session = await _sessions
            .Find(s => s.EmployeeId == dto.EmployeeId && s.IsActive)
            .FirstOrDefaultAsync();

        if (session == null)
            return NoContent();

        // ✅ UPSERT live location (ONE row per employee)
        await _live.UpdateOneAsync(
            Builders<LiveLocation>.Filter.Eq(l => l.EmployeeId, dto.EmployeeId),
            Builders<LiveLocation>.Update
                .Set(l => l.EmployeeId, dto.EmployeeId)
                .Set(l => l.Lat, dto.Lat)
                .Set(l => l.Lng, dto.Lng)
                .Set(l => l.Time, DateTime.UtcNow),
            new UpdateOptions { IsUpsert = true }
        );

        // ✅ Save route history (optional but useful)
        await _sessions.UpdateOneAsync(
            s => s.Id == session.Id,
            Builders<DeliverySession>.Update.Push(s => s.Route,
                new LatLongPoint
                {
                    Lat = dto.Lat,
                    Lng = dto.Lng,
                    Time = DateTime.UtcNow
                })
        );

        return Ok();
    }







    //[HttpPost("live")]
    //public async Task<IActionResult> SaveLive([FromBody] LiveLocationDto dto)
    //{
    //    if (string.IsNullOrWhiteSpace(dto.EmployeeId))
    //        return BadRequest("EmployeeId is required");

    //    var now = DateTime.UtcNow;

    //    // (a) Upsert latest position in LiveLocations (1 doc per employee)
    //    var liveFilter = Builders<LiveLocation>.Filter.Eq(l => l.EmployeeId, dto.EmployeeId);
    //    var liveUpdate = Builders<LiveLocation>.Update
    //        .Set(l => l.EmployeeId, dto.EmployeeId)
    //        .Set(l => l.Lat, dto.Lat)
    //        .Set(l => l.Lng, dto.Lng)
    //        .Set(l => l.Time, now);

    //    await _live.UpdateOneAsync(liveFilter, liveUpdate, new UpdateOptions { IsUpsert = true });

    //    // (b) If an active trip exists, append point to its Route
    //    var session = await _sessions
    //        .Find(s => s.EmployeeId == dto.EmployeeId && s.IsActive)
    //        .FirstOrDefaultAsync();

    //    if (session != null)
    //    {
    //        var routeFilter = Builders<DeliverySession>.Filter.Eq(s => s.Id, session.Id);
    //        var routeUpdate = Builders<DeliverySession>.Update.Push(s => s.Route,
    //            new LatLongPoint
    //            {
    //                Lat = dto.Lat,
    //                Lng = dto.Lng,
    //                Time = now
    //            });

    //        await _sessions.UpdateOneAsync(routeFilter, routeUpdate);
    //    }

    //    return Ok("Live Updated");
    //}

    // 4) DASHBOARD: get latest live positions for all employees

    //[HttpGet("realtime/{employeeId}")]
    //public async Task<IActionResult> GetLive(string employeeId)
    //{
    //    var live = await _live
    //        .Find(l => l.EmployeeId == employeeId)
    //        .FirstOrDefaultAsync();

    //    if (live == null)
    //        return Ok(null);

    //    return Ok(live);
    //}

    [HttpGet("realtime")]
    public async Task<IActionResult> GetLive()
    {
        return Ok(await _live.Find(_ => true).ToListAsync());
    }



    // 4️⃣ DASHBOARD: get live locations ONLY for ACTIVE trips
    [HttpGet("realtime-active")]
    public async Task<IActionResult> GetActiveLive()
    {
        // 1️⃣ Get employees whose trip is active
        var activeEmployeeIds = await _sessions
            .Find(s => s.IsActive)
            .Project(s => s.EmployeeId)
            .ToListAsync();

        if (!activeEmployeeIds.Any())
            return Ok(new List<LiveLocation>());

        // 2️⃣ Get live locations ONLY for those employees
        var live = await _live
            .Find(l => activeEmployeeIds.Contains(l.EmployeeId))
            .ToListAsync();

        return Ok(live);
    }




    // 5) Optional: history of all trips
    [HttpGet("all-sessions")]
    public async Task<IActionResult> GetAllSessions()
    {
        var data = await _sessions.Find(_ => true)
                                  .SortByDescending(s => s.StartTime)
                                  .ToListAsync();
        return Ok(data);
    }

    [HttpGet("tracking-status/{employeeId}")]
    public async Task<IActionResult> GetStatus(string employeeId)
    {
        var session = await _sessions
            .Find(x => x.EmployeeId == employeeId && x.IsActive)
            .FirstOrDefaultAsync();

        return Ok(new { tracking = session != null });
    }

    [HttpPost("register-device")]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.EmployeeId) ||
            string.IsNullOrWhiteSpace(dto.DeviceId))
            return BadRequest("EmployeeId & DeviceId required");

        // 🔴 STEP 1: Disable all old devices for this employee
        await _devices.UpdateManyAsync(
            d => d.EmployeeId == dto.EmployeeId,
            Builders<EmployeeDevice>.Update.Set(d => d.IsActive, false)
        );

        // 🔴 STEP 2: Block device if already used by another employee
        var existing = await _devices.Find(d =>
            d.DeviceId == dto.DeviceId &&
            d.EmployeeId != dto.EmployeeId &&
            d.IsActive
        ).FirstOrDefaultAsync();

        if (existing != null)
        {
            return BadRequest("This device is already registered to another employee.");
        }

        // 🔴 STEP 3: Register / activate current device
        var device = new EmployeeDevice
        {
            EmployeeId = dto.EmployeeId,
            DeviceId = dto.DeviceId,
            IsActive = true,
            RegisteredAt = DateTime.UtcNow
        };

        await _devices.ReplaceOneAsync(
            d => d.DeviceId == dto.DeviceId,
            device,
            new ReplaceOptions { IsUpsert = true }
        );

        return Ok("Device registered successfully");
    }



    // return route points for employee's active session (or last session if needed)
    [HttpGet("session-route/{employeeId}")]
    public async Task<IActionResult> GetSessionRoute(string employeeId)
    {
        var session = await _sessions
            .Find(x => x.EmployeeId == employeeId && x.IsActive)
            .FirstOrDefaultAsync();

        if (session == null)
        {
            // optionally return last session route if you prefer
            session = await _sessions
                .Find(x => x.EmployeeId == employeeId)
                .SortByDescending(x => x.StartTime)
                .FirstOrDefaultAsync();

            if (session == null) return Ok(new List<LatLongPoint>());
        }

        return Ok(session.Route ?? new List<LatLongPoint>());
    }

    // 6️⃣ DASHBOARD: active trips with distance
    //[HttpGet("active-sessions")]
    //public async Task<IActionResult> GetActiveSessions()
    //{
    //    var sessions = await _sessions
    //        .Find(s => s.IsActive)
    //        .Project(s => new
    //        {
    //            s.EmployeeId,
    //            s.TotalDistanceKm,
    //            s.StartTime
    //        })
    //        .ToListAsync();

    //    return Ok(sessions);
    //}


    // --- helper ---------------------------------
    //private static double CalculateDistance(List<LatLongPoint> points)
    //{
    //    if (points == null || points.Count < 2) return 0;

    //    double totalKm = 0;
    //    for (int i = 1; i < points.Count; i++)
    //    {
    //        totalKm += Haversine(points[i - 1].Lat, points[i - 1].Lng,
    //                             points[i].Lat, points[i].Lng);
    //    }
    //    return totalKm;
    //}

//    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
//    {
//        const double R = 6371; // km
//        double dLat = (lat2 - lat1) * Math.PI / 180;
//        double dLon = (lon2 - lon1) * Math.PI / 180;
//        double a =
//            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
//            Math.Cos(lat1 * Math.PI / 180) *
//            Math.Cos(lat2 * Math.PI / 180) *
//            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
//        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
//        return R * c;
//    }

}


// Simple DTO classes
public class StartTripDto
{
    public string EmployeeId { get; set; } = string.Empty;
}

public class StopTripDto
{
    public string EmployeeId { get; set; } = string.Empty;
}

public class LiveLocationDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class RegisterDeviceDto
{
    public string EmployeeId { get; set; }
    public string DeviceId { get; set; }
}