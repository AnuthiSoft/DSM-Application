using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);
// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));


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
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    //options.AddPolicy("AllowAll", policy =>
    //{
    //    policy.AllowAnyOrigin()    // or restrict to your Angular domain later
    //          .AllowAnyHeader()
    //          .AllowAnyMethod();
    //});
    options.AddPolicy("AllowRender", policy =>
        policy.WithOrigins(
           
            "https://dsm-application.web.app",
            "https://dsm-application-l84p.onrender.com",
           "http://localhost:58555"
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});
// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // preserves property names
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<ProductService>();
builder.Services.AddSingleton<EmployeeService>();
//builder.Services.Configure<EmployeeService>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<EmailService>();

builder.Services.AddSwaggerGen();


var app = builder.Build();

var dbService = app.Services.GetRequiredService<MongoDbService>();
app.UseStaticFiles();

var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("AllowRender");

//app.UseHttpsRedirection();
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
