using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImagesController : ControllerBase
    {
        private readonly BlobService _blobService;

        public ImagesController(BlobService blobService)
        {
            _blobService = blobService;
        }

        [HttpGet("{blobName}")]
        public async Task<IActionResult> Get(string blobName)
        {
            var bytes = await _blobService.DownloadAsync(blobName);

            if (bytes == null)
                return NotFound();

            return File(bytes, "image/jpeg");
        }
    }
}
