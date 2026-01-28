import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CustomerLedgerDay } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

   private readonly endpoint = 'payment';

  constructor(private api: ApiService) {}

   // 1️⃣ Collect Payment
  collectPayment(data: any): Observable<any> {
    return this.api.post(`${this.endpoint}/collect-payment`, data);
  }

  // 2️⃣ Cashier Daily Summary
 getCashierCustomerSummary(
  cashierId: string,
  date: string
): Observable<any> {
  return this.api.get(
    `${this.endpoint}/cashier-customer-summary/${cashierId}`,
    { params: { date } }
  );
}
getReceiptsForHandover(
  cashierId: string,
  date: string
): Observable<any[]> {
  return this.api.get(
    `${this.endpoint}/receipts-for-handover`,
    { params: { cashierId, date } }
  );
}
  // 3️⃣ Customer Payment Status
  getCustomerPaymentHistory(orderId: string): Observable<any> {
    return this.api.get(`${this.endpoint}/customer-payment-history/${orderId}`);
  }

  // 4️⃣ Create Handover
 createHandover(dto: {
  cashierId: string;
  distributorId: string;
  receiptIds: string[];          // ✅ CHANGED
  cashAmountSubmitted: number;
  totalAmountSubmitted: number;
  date: string;
  notes?: string;
}): Observable<any> {
  return this.api.post(`${this.endpoint}/create-handover`, dto);
}


  // 5️⃣ Distributor Summary
  getDistributorSummary(distributorId: string, date: string): Observable<any> {
    return this.api.get(`${this.endpoint}/distributor-summary`, {
      params: { distributorId, date }
    });
  }

  // Delivered orders for cashier
  getDeliveredOrders(distributorId: string): Observable<any[]> {
    return this.api.get(`orders/delivered-for-cashier/${distributorId}`);
  }

  // Payment Report Filters
  getPaymentReport(
    distributorId: string,
    fromDate: string,
    toDate: string,
    paymentMode?: string,
    handoverStatus?: string
  ): Observable<any[]> {

    let params: any = { distributorId, fromDate, toDate };

    if (paymentMode) params.paymentMode = paymentMode;
    if (handoverStatus) params.handoverStatus = handoverStatus;

    return this.api.get(`orders/payment-report`, { params });
  }

  // 6️⃣ Get all handovers waiting for approval
  getPendingHandovers(distributorId: string): Observable<any[]> {
    return this.api.get(`${this.endpoint}/pending-handovers/${distributorId}`);
  }

  // 7️⃣ Approve a handover
  approveHandover(handoverId: string): Observable<any> {
    return this.api.post(`${this.endpoint}/handover-approve/${handoverId}`, {});
  }

  // 8️⃣ Reject handover (FIXED — now sends JSON)
 rejectHandover(handoverId: string, reason: string): Observable<any> {
  return this.api.post(
    `${this.endpoint}/handover-reject/${handoverId}`,
    JSON.stringify(reason), // MUST SEND RAW STRING
    { headers: { 'Content-Type': 'application/json' } }
  );
}


  // 9️⃣ All pending payments
  getAllPendingPayments(): Observable<any[]> {
    return this.api.get(`payment/all-pending-payments`);
  }
  getHandoverDetails(handoverId: string): Observable<any> {
  return this.api.get(`payment/handover-details/${handoverId}`);
}
// 🔥 Collect consolidated customer payment
collectCustomerPayment(data: any): Observable<any> {
  return this.api.post(`${this.endpoint}/collect-customer-payment`, data);
}

// 🔥 Get customer pending summary
getCustomerPending(customerId: string, distributorId: string) {
  return this.api.get(`payment/customer-pending`, {
    params: { customerId, distributorId }
  });
}
// getCustomerLedger(
//   customerId: string,
//   distributorId: string
// ): Observable<CustomerLedgerDay[]> {
//   return this.api.get<CustomerLedgerDay[]>(
//     'payment/customer-ledger',
//     { params: { customerId, distributorId } }
//   );
// }
// 🔥 NEW — Customer payment receipts (customer-level payments)
getCustomerReceipts(
  customerId: string,
  distributorId: string
): Observable<any[]> {
  return this.api.get<any[]>(
    'payment/customer-receipts',
    { params: { customerId, distributorId } }
  );
}
getCustomerWiseReport(
  distributorId: string,
  fromDate: string,
  toDate: string
) {
  return this.api.get<any[]>(
    'payment/customer-wise-report',
    { params: { distributorId, fromDate, toDate } }
  );
}
// 🔥 Get distributor scanner QR
getDistributorScanner(distributorId: string) {
  return this.api.get<any>(
    'payment/distributor-scanner',
    { params: { distributorId } }
  );
}

// 🔥 NEW — All receipts pending for handover (NO DATE FILTER)
getAllReceiptsForHandover(
  cashierId: string
): Observable<any[]> {
  return this.api.get(
    `${this.endpoint}/receipts-for-handover`,
    { params: { cashierId } } // ❌ no date param
  );
}
}
