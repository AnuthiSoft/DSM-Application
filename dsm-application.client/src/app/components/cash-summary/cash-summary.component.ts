import { Component, HostListener } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-cash-summary',
  templateUrl: './cash-summary.component.html',
  styleUrl: './cash-summary.component.css'
})
export class CashSummaryComponent {

  cashierId = localStorage.getItem('employeeId') || '';
  distributorId = localStorage.getItem('distributorId') || '';
  date = new Date().toISOString().split('T')[0];
  

  summary: {
    totalCash: number;
    totalOnline: number;
    totalScanner: number;
    totalCollected: number;
  } | null = null;

  customerSummaries: any[] = [];
  selectedCustomer: any = null;
  customerReceipts: any[] = [];   // ✅ RECEIPTS
  showModal = false;

  constructor(private paymentService: PaymentService) {}

  // ===============================
  // LOAD DAILY SUMMARY
  // ===============================
  load() {
    if (!this.date) return;

    this.paymentService
      .getCashierCustomerSummary(this.cashierId, this.date)
      .subscribe((res: any) => {

        // SUMMARY CARDS
        this.summary = {
          totalCash: res.totalCash,
          totalOnline: res.totalOnline,
          totalScanner: res.totalScanner,
          totalCollected: res.totalCollected
        };

        const customerMap = new Map<string, any>();

        for (const p of res.payments || []) {

          // -------------------------------
          // CUSTOMER LEVEL
          // -------------------------------
          if (!customerMap.has(p.customerId)) {
            customerMap.set(p.customerId, {
              customerId: p.customerId,
              customerName: p.customerName,
              paymentMode: p.paymentMode,
              transactionReference: p.transactionReference,   // ✅ ADD THIS
              totalPaid: 0,
              orders: new Map<string, any>()
            });
          }

          const customer = customerMap.get(p.customerId);
          customer.totalPaid += p.amountPaidToday;

          // -------------------------------
          // ORDER LEVEL (GROUP BY ORDER)
          // -------------------------------
          if (!customer.orders.has(p.orderId)) {
            customer.orders.set(p.orderId, {
              orderId: p.orderId,
              orderTotal: p.orderTotalAmount,
              paid: 0,
              pending: p.pendingAmount
            });
          }

          const order = customer.orders.get(p.orderId);
          order.paid += p.amountPaidToday;
          order.pending = p.pendingAmount; // latest pending only
        }

        // FINAL CONVERSION
        this.customerSummaries = Array.from(customerMap.values()).map(c => ({
          customerId: c.customerId,
          customerName: c.customerName,
          paymentMode: c.paymentMode,
          totalPaid: c.totalPaid,
          orders: Array.from(c.orders.values())
        }));

        console.log('Cash summary loaded', this.customerSummaries);
      });
  }

  // ===============================
  // OPEN DETAILS MODAL
  // ===============================
  openDetailsModal(customer: any) {
    this.selectedCustomer = customer;
    this.showModal = true;
    document.body.style.overflow = 'hidden';

    // ✅ LOAD CUSTOMER RECEIPTS (COLLECTION-WISE)
    this.paymentService
      .getCustomerReceipts(customer.customerId, this.distributorId)
      .subscribe(res => {
        this.customerReceipts = res;
      });
  }

  closeModal() {
    this.showModal = false;
    this.selectedCustomer = null;
    this.customerReceipts = [];
    document.body.style.overflow = 'auto';
  }

  // ===============================
  // TOTAL CALCULATIONS
  // ===============================
  getTotalPaid(): number {
    return this.selectedCustomer?.orders
      ?.reduce((s: number, o: any) => s + o.paid, 0) || 0;
  }

  getTotalPending(): number {
    return this.selectedCustomer?.orders
      ?.reduce((s: number, o: any) => s + o.pending, 0) || 0;
  }

  getTotalAmount(): number {
    return this.selectedCustomer?.orders
      ?.reduce((s: number, o: any) => s + o.orderTotal, 0) || 0;
  }

  // ===============================
  // STATUS HELPERS
  // ===============================
  getStatusClass(order: any): string {
    if (order.pending === 0) return 'completed';
    if (order.paid > 0) return 'partial';
    return 'pending';
  }

  getStatusText(order: any): string {
    if (order.pending === 0) return 'Completed';
    if (order.paid > 0) return 'Partial';
    return 'Pending';
  }

  // ===============================
  // ICON HELPERS
  // ===============================
  getPaymentModeIcon(mode: string) {
    switch (mode) {
      case 'cash': return 'fas fa-money-bill-wave text-success';
      case 'upi': return 'fas fa-mobile-alt text-primary';
      case 'online': return 'fas fa-globe text-info';
      case 'scanner': return 'fas fa-qrcode';
      default: return 'fas fa-question-circle text-muted';
    }
  }

  // ===============================
  // UX HELPERS
  // ===============================
  onDateChange() {
    this.load();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.showModal) this.closeModal();
  }

  printDetails() {
    window.print();
  }
}
