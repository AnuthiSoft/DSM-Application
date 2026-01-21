using DistributorManagementSystem.Server.Models;
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
            // 1️⃣ Fetch receipts
            var receipts = await _db.CustomerPaymentReceipts
                .Find(r => dto.ReceiptIds.Contains(r.ReceiptId))
                .ToListAsync();

            if (!receipts.Any())
                throw new Exception("No valid receipts found");
            // 🚫 BLOCK DUPLICATE / ALREADY SUBMITTED HANDOVER
            if (receipts.Any(r => r.HandoverStatus == "Pending"))
                throw new Exception("Some receipts are already pending distributor approval");

            if (receipts.Any(r => r.HandoverStatus == "Accepted"))
                throw new Exception("Some receipts are already handed over");
            // 2️⃣ Validate totals
            decimal cash = receipts
                .Where(r => r.PaymentMode == "cash")
                .Sum(r => r.AmountPaid);

            decimal total = receipts.Sum(r => r.AmountPaid);

            if (dto.CashAmountSubmitted != cash)
                throw new Exception("Cash amount mismatch");

            if (dto.TotalAmountSubmitted != total)
                throw new Exception("Total amount mismatch");

            // 3️⃣ Create handover
            dto.Id = Guid.NewGuid().ToString();
            dto.HandoverId = Guid.NewGuid().ToString();
            dto.HandoverDate = DateTime.UtcNow;
            dto.Status = "Pending";

            var handovers = _db.Database.GetCollection<Handover>("Handover");
            await handovers.InsertOneAsync(dto);
            await _db.CustomerPaymentReceipts.UpdateManyAsync(
    r => dto.ReceiptIds.Contains(r.ReceiptId),
    Builders<CustomerPaymentReceipt>.Update
        .Set(r => r.HandoverStatus, "Pending")
);

            // 4️⃣ Mark related payment history as submitted
            foreach (var receipt in receipts)
            {
                var orderIds = receipt.Orders.Select(o => o.OrderId).ToList();

                await _db.PaymentHistory.UpdateManyAsync(
                    p =>
                        p.CustomerId == receipt.CustomerId &&
                        p.DistributorId == receipt.DistributorId &&
                        orderIds.Contains(p.OrderId),
                    Builders<PaymentCollectionHistory>.Update
                   .Set(p => p.IsSubmittedForHandover, true)
.Set(p => p.HandoverStatus, "Pending")
.Set(p => p.RejectReason, null)

                );
            }

            return dto;
        }

        public async Task<object> ApproveHandover(string handoverId)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");

            var handover = await handovers
                .Find(x => x.HandoverId == handoverId)
                .FirstOrDefaultAsync();

            if (handover == null)
                throw new Exception("Handover not found");

            if (handover.Status != "Pending")
                throw new Exception("Already reviewed");

            var receipts = await _db.CustomerPaymentReceipts
                .Find(r => handover.ReceiptIds.Contains(r.ReceiptId))
                .ToListAsync();

            foreach (var receipt in receipts)
            {
                var orderIds = receipt.Orders.Select(o => o.OrderId).ToList();

                await _db.PaymentHistory.UpdateManyAsync(
                    p =>
                        p.CustomerId == receipt.CustomerId &&
                        orderIds.Contains(p.OrderId),
                    Builders<PaymentCollectionHistory>.Update
                        .Set(p => p.IsHandedOver, true)
                        .Set(p => p.HandoverStatus, "Accepted")
                        .Set(p => p.IsSubmittedForHandover, false)
                );
            }

            await handovers.UpdateOneAsync(
                x => x.HandoverId == handoverId,
                Builders<Handover>.Update
                    .Set(x => x.Status, "Accepted")
                    .Set(x => x.ReviewedOn, DateTime.UtcNow)
            );
            await _db.CustomerPaymentReceipts.UpdateManyAsync(
      r => handover.ReceiptIds.Contains(r.ReceiptId),
      Builders<CustomerPaymentReceipt>.Update
          .Set(r => r.HandoverStatus, "Accepted")
          .Set(r => r.RejectReason, null)   // ✅ CLEAR OLD REASON
  );


            return new { message = "Handover approved successfully" };
        }

        public async Task<object> RejectHandover(string handoverId, string reason)
        {
            var handovers = _db.Database.GetCollection<Handover>("Handover");

            var handover = await handovers
                .Find(x => x.HandoverId == handoverId)
                .FirstOrDefaultAsync();

            if (handover == null)
                throw new Exception("Handover not found");

            if (handover.Status != "Pending")
                throw new Exception("Already reviewed");

            var receipts = await _db.CustomerPaymentReceipts
                .Find(r => handover.ReceiptIds.Contains(r.ReceiptId))
                .ToListAsync();

            foreach (var receipt in receipts)
            {
                var orderIds = receipt.Orders.Select(o => o.OrderId).ToList();

                await _db.PaymentHistory.UpdateManyAsync(
                    p =>
                        p.CustomerId == receipt.CustomerId &&
                        orderIds.Contains(p.OrderId),
                    Builders<PaymentCollectionHistory>.Update
                        .Set(p => p.HandoverStatus, "Rejected")
                        .Set(p => p.RejectReason, reason)
                        .Set(p => p.IsHandedOver, false)
                        .Set(p => p.IsSubmittedForHandover, false)
                );
            }

            await handovers.UpdateOneAsync(
                x => x.HandoverId == handoverId,
                Builders<Handover>.Update
                    .Set(x => x.Status, "Rejected")
                    .Set(x => x.Notes, reason)
                    .Set(x => x.ReviewedOn, DateTime.UtcNow)
            );
            await _db.CustomerPaymentReceipts.UpdateManyAsync(
      r => handover.ReceiptIds.Contains(r.ReceiptId),
      Builders<CustomerPaymentReceipt>.Update
          .Set(r => r.HandoverStatus, "Rejected")
          .Set(r => r.RejectReason, reason)   // ✅ THIS LINE IS MANDATORY
  );
            return new { message = "Handover rejected", reason };
        }




        // ---------------------------------------------------------
        // 3️⃣ CUSTOMER PAYMENT HISTORY (FULL — NO DATE REQUIRED)
        // ---------------------------------------------------------
        public async Task<CustomerPaymentStatusDto> GetCustomerPaymentHistory(string orderId)
        {
            // 1️⃣ Fetch order
            var order = await _db.Orders
                .Find(o => o.Id == orderId)
                .FirstOrDefaultAsync();

            if (order == null)
                throw new Exception("Order not found");

            // 2️⃣ Fetch all payments
            var payments = await _db.PaymentHistory
                .Find(p => p.OrderId == orderId)
                .SortBy(p => p.PaymentDate)
                .ToListAsync();

            decimal totalPaid = payments.Sum(p => p.AmountPaidToday);
            if (totalPaid > order.TotalAmount)
                totalPaid = order.TotalAmount;

            // 3️⃣ Detect cancellation (🔥 CRITICAL)
            bool isCancelled =
                order.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) ||
                order.Status.Equals("Canceled", StringComparison.OrdinalIgnoreCase);

            // 4️⃣ Business rule for cancelled orders
            decimal pendingAmount = isCancelled
                ? 0
                : order.TotalAmount - totalPaid;

            if (pendingAmount < 0)
                pendingAmount = 0;

            // 5️⃣ Return DTO (🔥 THIS IS WHAT FE NEEDS)
            return new CustomerPaymentStatusDto
            {
                OrderId = order.Id,
                OrderStatus = order.Status,          // ✅ REQUIRED FOR FE
                TotalAmount = order.TotalAmount,
                TotalPaid = isCancelled ? 0 : totalPaid,
                PendingAmount = pendingAmount,

                Payments = payments.Select(p => new CustomerPaymentHistoryItemDto
                {
                    PaymentId = p.PaymentId,
                    AmountPaidToday = p.AmountPaidToday,
                    PendingAmount = isCancelled ? 0 : p.PendingAmount,
                    PaymentMode = p.PaymentMode,
                    CashierId = p.CashierId,
                    PaymentDate = p.PaymentDate,
                    IsHandedOver = p.IsHandedOver
                }).ToList()
            };
        }

        public async Task<List<object>> GetPendingHandovers(string distributorId)
        {
            var handoverCollection = _db.Database.GetCollection<Handover>("Handover");

            var handovers = await handoverCollection
                .Find(x => x.DistributorId == distributorId && x.Status == "Pending")
                .SortByDescending(x => x.HandoverDate)
                .ToListAsync();

            // 🔥 STEP 1: Collect all cashierIds
            var cashierIds = handovers
                .Select(h => h.CashierId)
                .Distinct()
                .ToList();

            // 🔥 STEP 2: Fetch cashier names (Employees collection)
            var cashiers = await _db.Employees
                .Find(e => cashierIds.Contains(e.EmployeeId))
                .Project(e => new
                {
                    e.EmployeeId,
                    e.Name
                })
                .ToListAsync();

            var cashierMap = cashiers.ToDictionary(x => x.EmployeeId, x => x.Name);

            // 🔥 STEP 3: Shape final response
            return handovers.Select(h => new
            {
                h.Id,
                h.HandoverId,
                h.HandoverDate,
                h.DistributorId,
                h.ReceiptIds,
                h.CashAmountSubmitted,
                h.TotalAmountSubmitted,
                h.Status,
                h.Notes,
                h.ReviewedOn,

                h.CashierId,

                // ✅ THIS IS WHAT YOU NEED
                CashierName = cashierMap.ContainsKey(h.CashierId)
                    ? cashierMap[h.CashierId]
                    : "Unknown"
            }).Cast<object>().ToList();
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

            var handover = await handovers
                .Find(x => x.HandoverId == handoverId)
                .FirstOrDefaultAsync();

            if (handover == null)
                throw new Exception("Handover not found");

            var receipts = await _db.CustomerPaymentReceipts
                .Find(r => handover.ReceiptIds.Contains(r.ReceiptId))
                .ToListAsync();

            var payments = receipts.SelectMany(r =>
                r.Orders.Select(o => new
                {
                    ReceiptId = r.ReceiptId,
                    CustomerName = r.CustomerName,
                    PaymentMode = r.PaymentMode,
                    AmountPaid = o.AmountApplied,
                    OrderId = o.OrderId,
                    PaidOn = r.PaidOn
                })
            ).ToList();

            return new
            {
                Date = handover.HandoverDate,
                CashierId = handover.CashierId,
                TotalAmount = payments.Sum(p => p.AmountPaid),

                CashAmount = payments.Where(p => p.PaymentMode == "cash").Sum(p => p.AmountPaid),
                UpiAmount = payments.Where(p => p.PaymentMode == "upi").Sum(p => p.AmountPaid),
                ScannerAmount = payments.Where(p => p.PaymentMode == "scanner").Sum(p => p.AmountPaid),

                Payments = payments
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
           o.Status == "Delivered"          // ✅ KEY FIX
       )
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
            // 🔥 FETCH ALL DELIVERED ORDERS (NO REMAINING FILTER)
            var orders = await _db.Orders
                .Find(o =>
                    o.CustomerId == customerId &&
                    o.DistributorId == distributorId &&
                    o.Status == "Delivered"
                )
                .SortBy(o => o.OrderDate)
                .ToListAsync();

            return new
            {
                CustomerId = customerId,

                // ✅ Total pending = sum of remaining amounts
                TotalPending = orders.Sum(o => o.RemainingAmount),

                Orders = orders.Select(o => new
                {
                    o.Id,
                    o.TotalAmount,
                    o.RemainingAmount,

                    // ✅ STATUS CALCULATION (KEY FIX)
                    Status =
                        o.RemainingAmount == 0
                            ? "COMPLETED"
                            : o.RemainingAmount < o.TotalAmount
                                ? "PARTIAL"
                                : "PENDING"
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

        public async Task<List<CustomerPaymentReceipt>> GetReceiptsForHandover(
    string cashierId,
    string date)
        {
            DateTime selected = DateTime.Parse(date).Date;
            DateTime next = selected.AddDays(1);

            return await _db.CustomerPaymentReceipts
    .Find(r =>
        r.CashierId == cashierId &&
        r.PaidOn >= selected &&
        r.PaidOn < next &&
        (r.HandoverStatus == null || r.HandoverStatus == "Rejected")
    )
    .SortByDescending(r => r.PaidOn)
    .ToListAsync();

        }
        public async Task<List<object>> GetCustomerWisePaymentReport(
     string distributorId,
     DateTime fromDate,
     DateTime toDate)
        {
            DateTime from = fromDate.Date;
            DateTime to = toDate.Date.AddDays(1);

            var payments = await _db.PaymentHistory
                .Find(p =>
                    p.DistributorId == distributorId &&
                    p.PaymentDate >= from &&
                    p.PaymentDate < to
                )
                .ToListAsync();

            // 🔥 1️⃣ Get all cashierIds used
            var cashierIds = payments
                .Select(p => p.CashierId)
                .Distinct()
                .ToList();

            // 🔥 2️⃣ Load cashier names
            var cashiers = await _db.Employees
                .Find(e => cashierIds.Contains(e.EmployeeId))
                .Project(e => new
                {
                    e.EmployeeId,
                    e.Name
                })
                .ToListAsync();

            var cashierMap = cashiers.ToDictionary(x => x.EmployeeId, x => x.Name);

            // 🔥 3️⃣ Group by customer
            var result = payments
                .GroupBy(p => p.CustomerId)
                .Select(g =>
                {
                    var lastPayment = g.OrderByDescending(x => x.PaymentDate).First();

                    return new
                    {
                        CustomerId = g.Key,
                        CustomerName = g.First().CustomerName,

                        TotalCollected = g.Sum(x => x.AmountPaidToday),

                        CashAmount = g.Where(x => x.PaymentMode == "cash").Sum(x => x.AmountPaidToday),
                        OnlineAmount = g.Where(x => x.PaymentMode == "online").Sum(x => x.AmountPaidToday),
                        ScannerAmount = g.Where(x => x.PaymentMode == "scanner").Sum(x => x.AmountPaidToday),

                        LastPaymentDate = lastPayment.PaymentDate,

                        LastCashierId = lastPayment.CashierId,
                        LastCashierName = cashierMap.ContainsKey(lastPayment.CashierId)
                            ? cashierMap[lastPayment.CashierId]
                            : "Unknown",

                        Orders = g.Select(x => new
                        {
                            x.OrderId,
                            x.OrderTotalAmount,
                            x.AmountPaidToday,
                            x.PendingAmount,
                            x.IsHandedOver,
                            x.HandoverStatus,
                            x.RejectReason,
                            x.PaymentDate,

                            x.CashierId,
                            CashierName = cashierMap.ContainsKey(x.CashierId)
                                ? cashierMap[x.CashierId]
                                : "Unknown"
                        }).ToList()
                    };
                })
                .OrderByDescending(x => x.LastPaymentDate)
                .ToList();

            return result.Cast<object>().ToList();
        }


        public async Task<Distributor> GetDistributorScanner(string distributorId)
        {
            return await _db.Distributors
                .Find(d => d.DistributorId == distributorId)
                .FirstOrDefaultAsync();
        }

    }
}
