using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.IO;

namespace DSM_Application.Server.Controllers
{
    [ApiController]
    [Route("api/invoice-upload")]
    public class InvoiceUploadController : ControllerBase
    {
        private readonly IMongoCollection<DeliveryInvoice> _invoiceCollection;
        private readonly BlobService _blobService;
        public InvoiceUploadController(IMongoDatabase db, BlobService blobService )
        {

            _invoiceCollection = db.GetCollection<DeliveryInvoice>("DeliveryInvoices");
            _blobService = blobService;
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
                return BadRequest("employeeId required");

            // 🔥 Upload to Azure Blob
            var blobName = await _blobService.UploadAsync(file);

            var record = new DeliveryInvoice
            {
                EmployeeId = employeeId,
                PdfUrl = blobName,   // store ONLY blob name
                UploadedOn = DateTime.UtcNow
            };

            await _invoiceCollection.InsertOneAsync(record);

            return Ok(new { pdfUrl = blobName });
        }
        [HttpGet("download/{blobName}")]
        public async Task<IActionResult> Download(string blobName)
        {
            var fileBytes = await _blobService.DownloadAsync(blobName);

            if (fileBytes == null)
                return NotFound("File not found");

            var contentType = "application/pdf"; // 👈 IMPORTANT

            return File(fileBytes, contentType);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(string id)
        {
            var invoice = await _invoiceCollection
                .Find(i => i.Id == id)
                .FirstOrDefaultAsync();

            if (invoice == null)
                return NotFound("Invoice not found");

            // 🔥 Delete from Blob
            if (!string.IsNullOrEmpty(invoice.PdfUrl))
            {
                await _blobService.DeleteAsync(invoice.PdfUrl);
            }

            // 🔥 Delete from MongoDB
            await _invoiceCollection.DeleteOneAsync(i => i.Id == id);

            return Ok(new { message = "Invoice deleted successfully" });
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

        // ================= VIEW (EMPLOYEE + DISTRIBUTOR) =================
        [HttpGet("view/{employeeId}")]
        public async Task<IActionResult> ViewInvoice(string employeeId)
        {
            var invoice = await _invoiceCollection
                .Find(i => i.EmployeeId == employeeId)
                .SortByDescending(i => i.UploadedOn)
                .FirstOrDefaultAsync();

            if (invoice == null)
                return NotFound("Invoice not found");

            var fileBytes = await _blobService.DownloadAsync(invoice.PdfUrl);

            if (fileBytes == null)
                return NotFound("PDF missing in blob storage");

            return File(fileBytes, "application/pdf");
        }

    }
}

