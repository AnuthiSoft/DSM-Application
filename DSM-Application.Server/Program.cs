using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;


var builder = WebApplication.CreateBuilder(args);
// 👇 Add this line to allow access from other devices (mobile)
builder.WebHost.UseUrls("http://0.0.0.0:5164", "http://localhost:5164");
// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));

// Mongo Client + DB
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IConfiguration>()
                     .GetSection("MongoDb")
                     .Get<MongoDbSettings>();
    return new MongoClient(settings.ConnectionString);
});



builder.Services.AddSingleton<MongoDbService>();

builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<EmailService>();

builder.Services.AddSingleton<IMongoDatabase>(sp =>
{
    var mongoService = sp.GetRequiredService<MongoDbService>();
    return mongoService.Database;
});

builder.Services.AddScoped<TemporaryEmployeeHistoryService>();

builder.Services.AddScoped<DiscountService>();
builder.Services.AddScoped<HsnService>();
builder.Services.AddScoped<BlobService>();
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<ReturnService>();
builder.Services.AddScoped<OrderService>();


builder.Services.AddScoped<EwayBillService>();


// JWT
builder.Services.AddSingleton<JwtService>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
        ),

        RoleClaimType = ClaimTypes.Role
    };
});


//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(key)
//        };
//    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });

    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
            "https://dsm-application.web.app",
   

            "https://dsm-application.onrender.com" ,
                "http://localhost:58555",
                "http://localhost:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("AllowAngular", policy =>
//    {
//        policy.WithOrigins(
//            "https://dsm-application.web.app",

//            "https://dsm-application.onrender.com" ,
//                "http://localhost:58555"
//        )
//        .AllowAnyHeader()
//        .AllowAnyMethod()
//        .AllowCredentials();
//    });

//});


// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // preserves property names

    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());// me added
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<ProductService>();
builder.Services.AddSingleton<EmployeeService>();
builder.Services.AddSingleton<TaskService>(); // aded this
//builder.Services.Configure<EmployeeService>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<EmailService>();
builder.Services.AddScoped<TemporaryAssignmentService>();
//builder.Services.AddSingleton<OrderService>();     // Add this
//builder.Services.AddSingleton<RetailerService>();  // Add this
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<OrderService>();



builder.Services.AddScoped<FraudService>();
builder.Services.AddScoped<ReviewService>();

builder.Services.AddScoped<ImageService>();

builder.Services.AddScoped<CategoryService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<BlobService>();



builder.Services.AddSwaggerGen();


var app = builder.Build();

var dbService = app.Services.GetRequiredService<MongoDbService>();

app.UseStaticFiles(); // default wwwroot

// ---------- Serve /uploads ----------
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".avif"] = "image/avif";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ContentTypeProvider = provider
});

// ---------- Serve /ewaybills ----------
var ewbPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "ewaybills");
if (!Directory.Exists(ewbPath))
    Directory.CreateDirectory(ewbPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(ewbPath),
    RequestPath = "/ewaybills"
});

//var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
//if (!Directory.Exists(uploadsPath))
//{
//    Directory.CreateDirectory(uploadsPath);
//}

//app.UseStaticFiles(new StaticFileOptions
//{
//    FileProvider = new PhysicalFileProvider(uploadsPath),
//    RequestPath = "/uploads"
//});
//app.UseCors("AllowAngular");
app.UseCors("AllowAll");   // 📌 allow mobile calls


//app.UseHttpsRedirection();
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");


app.Run();


