using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeOrdersController : ControllerBase
    {
        private readonly MongoDbService _db;

        public EmployeeOrdersController(MongoDbService db)
        {
            _db = db;
        }

      
    }
}
