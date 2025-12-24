using DistributorManagementSystem.Server.Services;
using DSM_Application.Server.Models;
using DSM_Application.Server.Models.DTOs;
using MongoDB.Driver;
using YourApp.Models;

namespace DSM_Application.Server.Services
{
    public class PaymentService
    {
        
           private readonly MongoDbService _db;

        public PaymentService(MongoDbService db)
        {
            _db = db;
        }

        // ---------------------------------------------------------
        // 1️⃣ SAVE PAYMENT
        // ---------------------------------------------------------
        public async Task<PaymentCollectionHistory> SaveNewPayment(CreatePaymentDto dto)
        {
            var collection = _db.PaymentHistory;

            // 1️⃣ Fetch ALL previous payments for this order (any date)
            var previousPayments = await collection
                .Find(x => x.OrderId == dto.OrderId)
                .ToListAsync();

            decimal totalPaidBefore = previousPayments.Sum(x => x.AmountPaidToday);

            // 2️⃣ New total after adding today's payment
            decimal newTotalPaid = totalPaidBefore + dto.AmountPaidToday;

            // 3️⃣ New pending (correct cumulative calculation)
            decimal newPending = dto.OrderTotalAmount - newTotalPaid;
            if (newPending < 0) newPending = 0;

            // 4️⃣ Create new payment entry
            var record = new PaymentCollectionHistory
            {
                Id = Guid.NewGuid().ToString(),
                PaymentId = Guid.NewGuid().ToString(),

                CustomerId = dto.CustomerId,
                CustomerName = dto.CustomerName,
                OrderId = dto.OrderId,

                OrderTotalAmount = dto.OrderTotalAmount,
                AmountPaidToday = dto.AmountPaidToday,
                PendingAmount = newPending,  // ✅ NOW CORRECT

                PaymentMode = dto.PaymentMode,
                TransactionReference = dto.TransactionReference,

                CashierId = dto.CashierId,
                DistributorId = dto.DistributorId,

                PaymentDate = DateTime.UtcNow,
                IsHandedOver = false,
                 
                IsSubmittedForHandover = false,
                HandoverStatus = null,
                RejectReason = null
            };

            await collection.InsertOneAsync(record);
            return record;
        }


        // ---------------------------------------------------------
        // 2️⃣ CASHIER DAILY SUMMARY
        // ---------------------------------------------------------
        public async Task<object> GetCashierDailySummary(string cashierId, string date)
        {
            var collection = _db.PaymentHistory;

            DateTime selected = DateTime.Parse(date).Date;
            DateTime next = selected.AddDays(1);

            var filter = Builders<PaymentCollectionHistory>.Filter.And(
                Builders<PaymentCollectionHistory>.Filter.Eq(x => x.CashierId, cashierId),
                Builders<PaymentCollectionHistory>.Filter.Gte(x => x.PaymentDate, selected),
                Builders<PaymentCollectionHistory>.Filter.Lt(x => x.PaymentDate, next)
            );

            var list = await collection.Find(filter).ToListAsync();

            return new
            {
                Date = selected.ToString("yyyy-MM-dd"),
                CashierId = cashierId,
                TotalCash = list.Where(x => x.PaymentMode == "cash").Sum(x => x.AmountPaidToday),
                TotalOnline = list.Where(x => x.PaymentMode == "online").Sum(x => x.AmountPaidToday),
                TotalScanner = list.Where(x => x.PaymentMode == "scanner").Sum(x => x.AmountPaidToday),
                TotalCollected = list.Sum(x => x.AmountPaidToday),
                Payments = list
            };
        }

        // ---------------------------------------------------------
        // 3️⃣ CUSTOMER PAYMENT STATUS
        // ---------------------------------------------------------
        public async Task<object> GetCustomerPaymentStatus(string orderId, string date)
        {
            // 1️⃣ Fetch order first
            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null)
                return new { message = "Order not found" };

            decimal orderTotal = order.TotalAmount;

            // 2️⃣ Fetch ALL payments for this order (not only today's)
            var allPayments = await _db.PaymentHistory
                .Find(p => p.OrderId == orderId)
                .SortBy(p => p.PaymentDate)
                .ToListAsync();

            decimal paidSoFar = allPayments.Sum(x => x.AmountPaidToday);
            if (paidSoFar > orderTotal) paidSoFar = orderTotal;

            decimal pending = orderTotal - paidSoFar;
            if (pending < 0) pending = 0;

            // 3️⃣ Fetch payments ONLY for selected date (to show "Paid Today")
            DateTime selected = DateTime.Parse(date).Date;
            DateTime next = selected.AddDays(1);

            var todaysPayments = allPayments
                .Where(p => p.PaymentDate >= selected && p.PaymentDate < next)
                .ToList();

            decimal paidToday = todaysPayments.Sum(x => x.AmountPaidToday);

            // 4️⃣ Return correct result
            return new
            {
                OrderId = order.Id,
                TotalAmount = orderTotal,
                Paid = paidSoFar,
                PaidToday = paidToday,
                Pending = pending,
                Payments = todaysPayments   // keep only today's in list
            };
        }




        // ---------------------------------------------------------
        // 4️⃣ CREATE HANDOVER
        // ---------------------------------------------------------
        public async Task<Handover> CreateHandover(Handover dto)
        {
            var payments = _db.PaymentHistory;

            // Validate only amounts
            var filter = Builders<PaymentCollectionHistory>.Filter.In(x => x.PaymentId, dto.PaymentIds);
            var all = await payments.Find(filter).ToListAsync();

            decimal cash = all.Where(x => x.PaymentMode == "cash").Sum(x => x.AmountPaidToday);
            decimal upi = all.Where(x => x.PaymentMode == "upi").Sum(x => x.AmountPaidToday);
            decimal scanner = all.Where(x => x.PaymentMode == "scanner").Sum(x => x.AmountPaidToday);

            decimal total = cash + upi + scanner;
            if (all.Any(x => x.IsSubmittedForHandover == true))
                throw new Exception("One or more payments are already submitted for handover");


            if (dto.CashAmountSubmitted != cash)
                throw new Exception("Cash amount mismatch!");

            if (dto.TotalAmountSubmitted != total)
                throw new Exception("Total mismatch!");

            dto.Id = Guid.NewGuid().ToString();
            dto.HandoverId = Guid.NewGuid().ToString();
            dto.HandoverDate = DateTime.UtcNow;
            dto.Status = "Pending";

            // Insert handover
            var handovers = _db.Database.GetCollection<Handover>("Handover");
            await handovers.InsertOneAsync(dto);

            // ⭐ NEW PART — Mark payments as SUBMITTED
            await payments.UpdateManyAsync(
                x => dto.PaymentIds.Contains(x.PaymentId),
                Builders<PaymentCollectionHistory>.Update
                    .Set(x => x.IsSubmittedForHandover, true)
                    .Set(x => x.HandoverStatus, null)
                    .Set(x => x.RejectReason, null)
            );

            return dto;
        }

        public async Task<object> ApproveHandover(string handoverId)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");
            var payments = _db.PaymentHistory;

            var handover = await handovers.Find(x => x.HandoverId == handoverId).FirstOrDefaultAsync();
            if (handover == null)
                throw new Exception("Handover not found");

            if (handover.Status != "Pending")
                throw new Exception("Already reviewed");

            // Mark payments as handed over
            await payments.UpdateManyAsync(
     x => handover.PaymentIds.Contains(x.PaymentId),
     Builders<PaymentCollectionHistory>.Update
         .Set(x => x.HandoverStatus, "Accepted")
         .Set(x => x.RejectReason, null)
         .Set(x => x.IsHandedOver, true)
         .Set(x => x.IsSubmittedForHandover, false)
 );

            // Update handover status
            await handovers.UpdateOneAsync(
                x => x.HandoverId == handoverId,
                Builders<Handover>.Update
                    .Set(x => x.Status, "Accepted")
                    .Set(x => x.ReviewedOn, DateTime.UtcNow)
            );

            return new { message = "Handover approved successfully" };
        }
        public async Task<object> RejectHandover(string handoverId, string reason)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");
            var payments = _db.PaymentHistory;

            var handover = await handovers
                .Find(x => x.HandoverId == handoverId)
                .FirstOrDefaultAsync();

            if (handover == null)
                throw new Exception("Handover not found");

            if (handover.Status != "Pending")
                throw new Exception("Already reviewed");

            // ✅ MARK PAYMENTS AS REJECTED
            await payments.UpdateManyAsync(
                x => handover.PaymentIds.Contains(x.PaymentId),
                Builders<PaymentCollectionHistory>.Update
                    .Set(x => x.HandoverStatus, "Rejected")
                    .Set(x => x.RejectReason, reason)
                    .Set(x => x.IsSubmittedForHandover, false)
                    .Set(x => x.IsHandedOver, false)
            );

            // ✅ UPDATE HANDOVER
            await handovers.UpdateOneAsync(
                x => x.HandoverId == handoverId,
                Builders<Handover>.Update
                    .Set(x => x.Status, "Rejected")
                    .Set(x => x.Notes, reason)
                    .Set(x => x.ReviewedOn, DateTime.UtcNow)
            );

            return new { message = "Handover rejected", reason };
        }



        // ---------------------------------------------------------
        // 3️⃣ CUSTOMER PAYMENT HISTORY (FULL — NO DATE REQUIRED)
        // ---------------------------------------------------------
        public async Task<object> GetCustomerPaymentHistory(string orderId)
        {
            // 1️⃣ Fetch order
            var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (order == null)
                return new { message = "Order not found" };

            decimal orderTotal = order.TotalAmount;

            // 2️⃣ Fetch ALL payments for this order
            var payments = await _db.PaymentHistory
                .Find(p => p.OrderId == orderId)
                .SortBy(p => p.PaymentDate)
                .ToListAsync();

            // 3️⃣ Calculate totals
            decimal totalPaid = payments.Sum(x => x.AmountPaidToday);
            if (totalPaid > orderTotal) totalPaid = orderTotal;

            decimal pending = order.RemainingAmount;

            if (pending < 0) pending = 0;

            // 4️⃣ Return ALL payments
            return new
            {
                OrderId = order.Id,
                CustomerName = order.CustomerName,
                TotalAmount = orderTotal,
                TotalPaid = orderTotal - order.RemainingAmount,
                PendingAmount = order.RemainingAmount,
                Payments = payments
            };
        }
        public async Task<List<Handover>> GetPendingHandovers(string distributorId)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");

            return await handovers
                .Find(x => x.DistributorId == distributorId && x.Status == "Pending")
                .SortByDescending(x => x.HandoverDate)
                .ToListAsync();
        }

        // ---------------------------------------------------------
        // 5️⃣ DISTRIBUTOR SUMMARY
        // ---------------------------------------------------------
        public async Task<object> GetDistributorSummary(string distributorId, string date)
        {
            var list = await _db.PaymentHistory
                .Find(x =>
                    x.DistributorId == distributorId &&
                    x.PaymentDate >= DateTime.Parse(date).Date &&
                    x.PaymentDate < DateTime.Parse(date).Date.AddDays(1)
                ).ToListAsync();

            return new
            {
                Date = date,
                DistributorId = distributorId,
                TotalCash = list.Where(x => x.PaymentMode == "cash").Sum(x => x.AmountPaidToday),
                TotalOnline = list.Where(x => x.PaymentMode == "online").Sum(x => x.AmountPaidToday),
                TotalScanner = list.Where(x => x.PaymentMode == "scanner").Sum(x => x.AmountPaidToday),
                Payments = list
            };
        }
        public async Task<List<PaymentCollectionHistory>> GetAllPendingPayments()
        {
            var payments = _db.PaymentHistory;

            return await payments
                .Find(p => p.IsHandedOver == false)
                .SortByDescending(p => p.PaymentDate)
                .ToListAsync();
        }
        public async Task<object> GetHandoverDetails(string handoverId)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");
            var payments = _db.PaymentHistory;

            // 1️⃣ Fetch handover
            var handover = await handovers
                .Find(x => x.HandoverId == handoverId)
                .FirstOrDefaultAsync();

            if (handover == null)
                throw new Exception("Handover not found");

            // 2️⃣ Fetch related payments
            var paymentList = await payments
                .Find(x => handover.PaymentIds.Contains(x.PaymentId))
                .ToListAsync();

            // 3️⃣ Group by payment modes
            decimal cash = paymentList.Where(x => x.PaymentMode == "cash").Sum(x => x.AmountPaidToday);
            decimal upi = paymentList.Where(x => x.PaymentMode == "upi").Sum(x => x.AmountPaidToday);
            decimal scanner = paymentList.Where(x => x.PaymentMode == "scanner").Sum(x => x.AmountPaidToday);

            return new
            {
                HandoverId = handover.HandoverId,
                Date = handover.HandoverDate,
                CashierId = handover.CashierId,
                DistributorId = handover.DistributorId,

                CashAmount = cash,
                UpiAmount = upi,
                ScannerAmount = scanner,
                TotalAmount = cash + upi + scanner,

                Payments = paymentList
            };
        }
        public async Task<object> CollectCustomerPayment(CustomerPaymentDto dto)
        {
            var orders = await _db.Orders
                .Find(o =>
                    o.CustomerId == dto.CustomerId &&
                    o.DistributorId == dto.DistributorId &&
                    o.Status == "Delivered" &&
                    o.RemainingAmount > 0)
                .SortBy(o => o.OrderDate)
                .ToListAsync();

            if (!orders.Any())
                throw new Exception("No pending orders for this customer");

            // ⭐ CREATE CUSTOMER RECEIPT (NEW)
            var receipt = new CustomerPaymentReceipt
            {
                Id = Guid.NewGuid().ToString(),
                ReceiptId = "RCP-" + DateTime.UtcNow.Ticks,
                CustomerId = dto.CustomerId,
                CustomerName = dto.CustomerName,
                DistributorId = dto.DistributorId,
                CashierId = dto.CashierId,
                AmountPaid = dto.AmountPaid,
                PaymentMode = dto.PaymentMode,
                TransactionReference = dto.TransactionReference,
                PaidOn = DateTime.UtcNow,
                 Orders = new List<OrderPaymentSplit>() // ✅ REQUIRED
            
        };

            decimal remaining = dto.AmountPaid;

            foreach (var order in orders)
            {
                if (remaining <= 0)
                    break;

                decimal used = Math.Min(order.RemainingAmount, remaining);
                remaining -= used;

                // ⭐ SAVE SPLIT INFO
                receipt.Orders.Add(new OrderPaymentSplit
                {
                    OrderId = order.Id,
                    AmountApplied = used
                });

                // EXISTING PAYMENT HISTORY (NO CHANGE)
                await _db.PaymentHistory.InsertOneAsync(new PaymentCollectionHistory
                {
                    Id = Guid.NewGuid().ToString(),
                    PaymentId = Guid.NewGuid().ToString(),
                    CustomerId = dto.CustomerId,
                    CustomerName = dto.CustomerName,
                    OrderId = order.Id,
                    OrderTotalAmount = order.TotalAmount,
                    AmountPaidToday = used,
                    PendingAmount = order.RemainingAmount - used,
                    PaymentMode = dto.PaymentMode,
                    TransactionReference = dto.TransactionReference,
                    CashierId = dto.CashierId,
                    DistributorId = dto.DistributorId,
                    PaymentDate = DateTime.UtcNow,
                    IsHandedOver = false,
                    IsSubmittedForHandover = false
                });

                await _db.Orders.UpdateOneAsync(
                    o => o.Id == order.Id,
                    Builders<Order>.Update
                        .Set(o => o.RemainingAmount, order.RemainingAmount - used)
                );
            }

            // ⭐ SAVE CUSTOMER RECEIPT (IMPORTANT)
            await _db.CustomerPaymentReceipts.InsertOneAsync(receipt);

            var remainingPending = await _db.Orders
                .Find(o =>
                    o.CustomerId == dto.CustomerId &&
                    o.DistributorId == dto.DistributorId &&
                    o.RemainingAmount > 0)
                .Project(o => o.RemainingAmount)
                .ToListAsync();

            return new
            {
                message = "Customer payment collected successfully",
                receiptId = receipt.ReceiptId,
                totalPaid = receipt.AmountPaid,
                remainingCustomerPending = remainingPending.Sum()
            };
        }

        public async Task<List<CustomerPaymentReceipt>> GetCustomerReceipts(
    string customerId,
    string distributorId)
        {
            return await _db.CustomerPaymentReceipts
                .Find(x =>
                    x.CustomerId == customerId &&
                    x.DistributorId == distributorId)
                .SortByDescending(x => x.PaidOn)
                .ToListAsync();
        }

        public async Task<object> GetCustomerPendingSummary(
          string customerId,
          string distributorId
      )
        {
            var orders = await _db.Orders
       .Find(o =>
           o.CustomerId == customerId &&
           o.DistributorId == distributorId &&   // ⭐ IMPORTANT
           o.RemainingAmount >= 0
       )
       .SortBy(o => o.OrderDate)
       .ToListAsync();


            return new
            {
                CustomerId = customerId,

                TotalPending = orders.Sum(o => o.RemainingAmount),

                Orders = orders.Select(o => new
                {
                    o.Id,
                    o.TotalAmount,
                    o.RemainingAmount,

                    Status =
                        o.RemainingAmount == 0
                            ? "Completed"
                            : o.RemainingAmount < o.TotalAmount
                                ? "Partial"
                                : "Pending"
                })
            };

        }
        public async Task<List<object>> GetCustomerPaymentLedger(
      string customerId,
      string distributorId)
        {
            customerId = customerId.Trim();
            distributorId = distributorId.Trim();   // ⭐⭐⭐ FIX ⭐⭐⭐

            var payments = await _db.PaymentHistory
                .Find(p =>
                    p.CustomerId == customerId &&
                    p.DistributorId == distributorId &&
                    p.AmountPaidToday > 0
                )
                .SortByDescending(p => p.PaymentDate)
                .ToListAsync();

            var ledger = payments
                .GroupBy(p => p.PaymentDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalPaid = g.Sum(x => x.AmountPaidToday),
                    Payments = g.Select(x => new
                    {
                        x.OrderId,
                        x.AmountPaidToday,
                        x.PaymentMode,
                        x.PaymentDate
                    }).ToList()
                })
                .OrderByDescending(x => x.Date)
                .ToList();

            return ledger.Cast<object>().ToList();
        }



    }
}
