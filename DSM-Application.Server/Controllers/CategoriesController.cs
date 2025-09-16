//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;

//namespace DSM_Application.Server.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class CategoriesController : ControllerBase
//    {
//        [HttpGet("by-distributor/{distributorId}")]
//        public async Task<IActionResult> GetCategoriesByDistributor(string distributorId)
//        {
//            var categories = await _categoryService.GetByDistributorIdAsync(distributorId);
//            return Ok(categories);
//        }
//    }
//}
