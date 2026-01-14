using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using DSM_Application.Server.Services;
using Microsoft.AspNetCore.Mvc;
using YourApp.Models;

namespace DSM_Application.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }
        

        // ================================================================
        // 1️⃣ COLLECT PAYMENT (Cashier collects customer payment)
        // ================================================================
        [HttpPost("collect-payment")]
        public async Task<IActionResult> CollectPayment([FromBody] CreatePaymentDto dto)
        {
            if (dto == null)
                return BadRequest("Invalid payment data");

            var result = await _paymentService.SaveNewPayment(dto);
            return Ok(result);
        }



        // ================================================================
        // 2️⃣ CASHIER DAILY SUMMARY
        // ================================================================
        [HttpGet("cashier-customer-summary/{cashierId}")]
        public async Task<IActionResult> GetCashierSummary(string cashierId, [FromQuery] string date)
        {
            var summary = await _paymentService.GetCashierDailySummary(cashierId, date);
            return Ok(summary);
        }



        // ================================================================
        // 3️⃣ CUSTOMER PAYMENT STATUS (For viewing pending amount)
        // ================================================================
        [HttpGet("customer-payment-history/{orderId}")]
        public async Task<IActionResult> GetCustomerPaymentHistory(string orderId)
        {
            var result = await _paymentService.GetCustomerPaymentHistory(orderId);
            return Ok(result);
        }



        // ================================================================
        // 4️⃣ CASHIER → DISTRIBUTOR HANDOVER
        // ================================================================
        [HttpPost("create-handover")]
        public async Task<IActionResult> CreateHandover([FromBody] Handover dto)
        {
            try
            {
                // dto.ReceiptIds (customer-wise) is now expected
                var created = await _paymentService.CreateHandover(dto);
                return Ok(created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("handover-approve/{handoverId}")]
        public async Task<IActionResult> ApproveHandover(string handoverId)
        {
            try
            {
                var result = await _paymentService.ApproveHandover(handoverId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpPost("handover-reject/{handoverId}")]
        public async Task<IActionResult> RejectHandover(
       string handoverId,
       [FromBody] string reason)
        {
            try
            {
                var result = await _paymentService.RejectHandover(handoverId, reason);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("pending-handovers/{distributorId}")]
        public async Task<IActionResult> GetPendingHandovers(string distributorId)
        {
            var result = await _paymentService.GetPendingHandovers(distributorId);
            return Ok(result);
        } 
        [HttpGet("all-pending-payments")]
        public async Task<IActionResult> GetAllPendingPayments()
        {
            var result = await _paymentService.GetAllPendingPayments();
            return Ok(result);
        }

        // ================================================================
        // 5️⃣ DISTRIBUTOR SUMMARY (Daily view)
        // ================================================================
        [HttpGet("distributor-summary")]
        public async Task<IActionResult> GetDistributorSummary([FromQuery] string distributorId, [FromQuery] string date)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest("DistributorId required");

            var result = await _paymentService.GetDistributorSummary(distributorId, date);
            return Ok(result);
        }
        [HttpGet("handover-details/{handoverId}")]
        public async Task<IActionResult> GetHandoverDetails(string handoverId)
        {
            try
            {
                var result = await _paymentService.GetHandoverDetails(handoverId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("receipts-for-handover")]
        public async Task<IActionResult> GetReceiptsForHandover(
    [FromQuery] string cashierId,
    [FromQuery] string date)
        {
            var result = await _paymentService.GetReceiptsForHandover(cashierId, date);
            return Ok(result);
        }


        [HttpPost("collect-customer-payment")]
        public async Task<IActionResult> CollectCustomerPayment(
       [FromBody] CustomerPaymentDto dto)
        {
            if (dto.AmountPaid <= 0)
                return BadRequest("Invalid payment amount");

            var result = await _paymentService.CollectCustomerPayment(dto);
            return Ok(result);
        }
        [HttpGet("customer-pending")]
        public async Task<IActionResult> GetCustomerPending(
           [FromQuery] string customerId,
           [FromQuery] string distributorId)
        {
            return Ok(await _paymentService.GetCustomerPendingSummary(customerId, distributorId));
        }
        // ================================================================
        //  CUSTOMER LEDGER (DATE-WISE PAYMENT HISTORY)
        // ================================================================
        [HttpGet("customer-ledger")]
        public async Task<IActionResult> GetCustomerLedger(
    [FromQuery] string customerId,
    [FromQuery] string distributorId)
        {
            if (string.IsNullOrWhiteSpace(customerId) ||
                string.IsNullOrWhiteSpace(distributorId))
                return BadRequest("customerId and distributorId are required");

            var result = await _paymentService.GetCustomerPaymentLedger(
                customerId.Trim(),
                distributorId.Trim()
            );

            return Ok(result);
        }


        [HttpGet("customer-wise-report")]
        public async Task<IActionResult> GetCustomerWiseReport(
            [FromQuery] string distributorId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            if (string.IsNullOrEmpty(distributorId))
                return BadRequest("DistributorId required");

            // ✅ Default to current month if dates missing
            DateTime from = fromDate ?? DateTime.UtcNow.AddDays(-30);
            DateTime to = toDate ?? DateTime.UtcNow;

            var result = await _paymentService
                .GetCustomerWisePaymentReport(distributorId, from, to);

            return Ok(result);
        }

        // ================================================================
        // CUSTOMER RECEIPTS (FOR CASH SUMMARY MODAL)
        // ================================================================
        [HttpGet("customer-receipts")]
        public async Task<IActionResult> GetCustomerReceipts(
            [FromQuery] string customerId,
            [FromQuery] string distributorId)
        {
            if (string.IsNullOrWhiteSpace(customerId) ||
                string.IsNullOrWhiteSpace(distributorId))
                return BadRequest("customerId and distributorId are required");

            var result = await _paymentService.GetCustomerReceipts(
                customerId.Trim(),
                distributorId.Trim()
            );

            return Ok(result);
        }


        [HttpGet("distributor-scanner")]
        public async Task<IActionResult> GetDistributorScanner(
    [FromQuery] string distributorId)
        {
            var distributor = await _paymentService.GetDistributorScanner(distributorId);
            if (distributor == null)
                return NotFound();

            return Ok(new
            {
                scannerQrUrl = distributor.ScannerQrUrl
            });
        }



    }
}
