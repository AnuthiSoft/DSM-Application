using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using static DSM_Application.Server.Services.YearlyLoyaltyService;


var builder = WebApplication.CreateBuilder(args);
// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));

builder.Services.Configure<YearlyLoyaltyDiscountSettings>(
    builder.Configuration.GetSection("YearlyLoyaltyDiscountSettings"));


builder.Services.AddScoped<IYearlyLoyaltyService, YearlyLoyaltyService>();

builder.Services.AddScoped<DiscountService>();
builder.Services.AddSingleton<MongoDbService>();



// JWT
builder.Services.AddSingleton<JwtService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),

            // ⭐ MOST IMPORTANT FIX ⭐
            RoleClaimType = ClaimTypes.Role
        };

    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
            "https://dsm-application.web.app",
   
            "https://dsm-application.onrender.com" ,
                "http://localhost:58555"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });

});


// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // preserves property names

    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());// me added
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<ProductService>();
builder.Services.AddSingleton<EmployeeService>();
builder.Services.AddSingleton<TaskService>(); // aded this
//builder.Services.Configure<EmployeeService>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<EmailService>();

builder.Services.AddScoped<FraudService>();
builder.Services.AddScoped<ReviewService>();

builder.Services.AddSingleton<ImageService>();

builder.Services.AddSingleton<CategoryService>();


builder.Services.AddSwaggerGen();


var app = builder.Build();

var dbService = app.Services.GetRequiredService<MongoDbService>();
// CORS
app.UseCors("AllowAngular");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// ✔ Controller routes MUST come BEFORE static files
app.MapControllers();

// ---------------------------------------
// ✔ Static Files (AFTER MapControllers)
// ---------------------------------------
app.UseStaticFiles(); // Default wwwroot support

// Serve /uploads from wwwroot/uploads
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");

if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".avif"] = "image/avif";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ContentTypeProvider = provider
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

//app.MapFallbackToFile("/index.html");

app.Run();
