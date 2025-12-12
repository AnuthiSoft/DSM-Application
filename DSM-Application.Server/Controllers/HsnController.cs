using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HsnController : ControllerBase
    {
        private readonly HsnService _hsnService;

        public HsnController(HsnService hsnService)
        {
            _hsnService = hsnService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _hsnService.GetAllAsync());

        [HttpGet("gst/{code}")]
        public async Task<IActionResult> GetGST(string code)
        {
            var hsn = await _hsnService.GetByCodeAsync(code);
            if (hsn == null) return NotFound();
            return Ok(hsn.Gst);
        }
    }
}
