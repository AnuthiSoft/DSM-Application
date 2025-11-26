using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImagesController : ControllerBase
    {
        private readonly ImageService _imageService;

        public ImagesController(ImageService service)
        {
            _imageService = service;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File missing");

            // Allow only AVIF if needed
            if (file.ContentType != "image/avif" && !file.FileName.EndsWith(".avif"))
                return BadRequest("Only AVIF images allowed");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            var id = await _imageService.UploadAsync(stream, file.FileName, file.ContentType);
            return Ok(new { id });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var (stream, contentType) = await _imageService.GetAsync(id);
            if (stream == null)
                return NotFound();

            // Return RAW AVIF bytes (inline, not attachment)
            return File(stream, contentType);
        }
    }
}
