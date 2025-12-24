using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace DSM_Application.Server.Controllers
{
    [ApiController]
    [Route("api/invoices")]
    public class InvoicesController : ControllerBase
    {
        private readonly IMongoCollection<Invoice> _invoiceCollection;

        // ✅ ADD THIS
        private readonly EmailService _emailService;

        // ✅ FIXED CONSTRUCTOR
        public InvoicesController(IMongoDatabase db, EmailService emailService)
        {
            _invoiceCollection = db.GetCollection<Invoice>("Invoices");
            _emailService = emailService;
        }

        // CREATE INVOICE
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] InvoiceDto dto)
        {
            if (dto == null)
                return BadRequest("Invalid data");

            var invoice = new Invoice
            {
                Id = Guid.NewGuid().ToString(),
                DistributorId = dto.DistributorId,
                InvoiceNo = dto.InvoiceNo,
                InvoiceDate = dto.InvoiceDate,
                CustomerId = dto.CustomerId,
                EwayBillNo = dto.EwayBillNo,
                TotalAmount = dto.TotalAmount,
                Items = dto.Items
            };

            await _invoiceCollection.InsertOneAsync(invoice);
            return Ok(invoice);
        }

        // GET INVOICE BY ID  
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var invoice = await _invoiceCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

            if (invoice == null)
                return NotFound();

            return Ok(invoice);
        }

        // UPDATE E-WAY BILL  
        [HttpPatch("{id}/ewaybill")]
        public async Task<IActionResult> UpdateEwayBill(string id, [FromBody] string ewayBillNo)
        {
            if (string.IsNullOrWhiteSpace(ewayBillNo))
                return BadRequest("Invalid E-Way Bill Number");

            var update = Builders<Invoice>.Update.Set(x => x.EwayBillNo, ewayBillNo);

            var result = await _invoiceCollection.UpdateOneAsync(x => x.Id == id, update);

            if (result.MatchedCount == 0)
                return NotFound("Invoice not found");

            return Ok(new { message = "E-Way Bill updated successfully", ewayBillNo });
        }

        // SEND EMAIL  
        [HttpPost("send-email")]
        public async Task<IActionResult> SendEmail([FromBody] EmailInvoiceDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
                return BadRequest("Email required");

            string subject = $"Invoice Copy - {dto.Invoice.InvoiceNo}";
            string body = $"Dear Driver,\nPlease find the invoice.\nE-Way Bill: {dto.Invoice.EwayBillNo}";

            await _emailService.SendEmailAsync(dto.Email, subject, body);

            return Ok(new { message = "Email sent" });
        }

        public class EmailInvoiceDto
        {
            public string Email { get; set; }
            public Invoice Invoice { get; set; }
        }
    }
}
