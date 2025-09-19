using DistributorManagementSystem.Server.Models;
using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;


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
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:58555") // Angular URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});
// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // preserves property names
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

app.UseCors("AllowFrontend");

//app.UseHttpsRedirection();
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
