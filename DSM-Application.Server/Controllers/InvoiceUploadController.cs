using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using DSM_Application.Server.Models;
using System.IO;

namespace DSM_Application.Server.Controllers
{
    [ApiController]
    [Route("api/invoice-upload")]
    public class InvoiceUploadController : ControllerBase
    {
        private readonly IMongoCollection<DeliveryInvoice> _invoiceCollection;

        public InvoiceUploadController(IMongoDatabase db)
        {
            _invoiceCollection = db.GetCollection<DeliveryInvoice>("DeliveryInvoices");
        }

        // ================================
        // UPLOAD INVOICE PDF
        // ================================
        [HttpPost("upload")]
        public async Task<IActionResult> UploadInvoice(
            [FromForm] IFormFile file,
            [FromForm] string employeeId)
        {
            if (file == null)
                return BadRequest("File required");

            if (string.IsNullOrWhiteSpace(employeeId))
                return BadRequest(new { message = "employeeId is required" });

            // Create folder if not exists
            var folder = Path.Combine("wwwroot", "invoices");
            Directory.CreateDirectory(folder);

            // Create random filename
            var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
            var path = Path.Combine(folder, fileName);

            // Save file
            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            // Return public URL
            var url = $"{Request.Scheme}://{Request.Host}/invoices/{fileName}";

            var record = new DeliveryInvoice
            {
                EmployeeId = employeeId,
                PdfUrl = url,
                UploadedOn = DateTime.Now
            };

            await _invoiceCollection.InsertOneAsync(record);

            return Ok(new { pdfUrl = url });
        }

        // ================================
        // GET ALL INVOICES FOR EMPLOYEE
        // ================================
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetInvoices(string employeeId)
        {
            var invoices = await _invoiceCollection
                .Find(i => i.EmployeeId == employeeId)
                .SortByDescending(i => i.UploadedOn)
                .ToListAsync();

            return Ok(invoices);
        }
    }
}
