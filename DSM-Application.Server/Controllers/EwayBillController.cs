using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DSM_Application.Server.Controllers
{

    [ApiController]
    [Route("api/ewaybill")]
    public class EwayBillController : ControllerBase
    {
        private readonly EwayBillService _eway;

        public EwayBillController(EwayBillService eway)
        {
            _eway = eway;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] EwayBillRequest request)
        {
            if (request == null)
                return BadRequest("Invalid request");

            var result = await _eway.GenerateAsync(request);
            return Ok(result);
        }

        //[HttpGet("pdf/{ewayBillNo}")]
        //public IActionResult DownloadPdf(string ewayBillNo)
        //{
        //    string path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "ewaybills", $"{ewayBillNo}.pdf");

        //    if (!System.IO.File.Exists(path))
        //        return NotFound("PDF not found");

        //    var bytes = System.IO.File.ReadAllBytes(path);
        //    return File(bytes, "application/pdf", $"{ewayBillNo}.pdf");
        //}

        [HttpGet("pdf/{ewayBillNo}")]
        public IActionResult DownloadPdf(string ewayBillNo)
        {
            var path = Path.Combine("wwwroot", "ewaybills", $"{ewayBillNo}.pdf");

            if (!System.IO.File.Exists(path))
                return NotFound("PDF not found");

            byte[] bytes;

            using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                using (var ms = new MemoryStream())
                {
                    fs.CopyTo(ms);
                    bytes = ms.ToArray();
                }
            }

            return File(bytes, "application/pdf", $"{ewayBillNo}.pdf");
        }


        //// ---------------------------------------------------------
        //// 🔹 GET ALL E-WAY BILL LIST
        //// ---------------------------------------------------------
        //[HttpGet("list")]
        //public async Task<IActionResult> GetAll()
        //{
        //    var list = await _eway.GetAllAsync();
        //    return Ok(list);
        //}

        // ---------------------------------------------------------
        // 🔹 DELETE E-WAY BILL RECORD
        // ---------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _eway.DeleteAsync(id);

            if (!success)
                return NotFound(new { message = "Record not found" });

            return Ok(new { message = "E-Way Bill deleted successfully" });
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList()
        {
            try
            {
                var list = await _eway.GetAllAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString()); // ← SHOW REAL ERROR
            }
        }


    }
}

    