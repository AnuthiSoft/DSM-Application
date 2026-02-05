import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-pending-handovers',
  templateUrl: './pending-handovers.component.html',
  styleUrl: './pending-handovers.component.css'
})
export class PendingHandoversComponent implements OnInit {
  flatRows: any[] = [];

  distributorId = localStorage.getItem('distributorId') || '';
  handovers: any[] = [];
  loading = true;
  selectedDetails: any = null;
  showModal = false;
  rehandoverNote: string = '';
showRehandoverReason = false;


selectedCashier: string = 'ALL';
cashiers: string[] = [];

filteredRows: any[] = [];

cashierTotals: {
  total: number;
  modes: Record<string, number>;
} = {
  total: 0,
  modes: {}
};


  constructor(private paymentService: PaymentService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadPendingHandovers();
  }

loadPendingHandovers() {
  this.loading = true;

  this.paymentService.getPendingHandovers(this.distributorId)
    .subscribe({
      next: (data: any[]) => {

        this.handovers = data;

        // 🔥 FLATTEN HANDOVERS INTO RECEIPT ROWS
      this.flatRows = [];

data.forEach((h: any) => {
  h.receipts.forEach((r: any) => {

    // 🔥 SHOW ONLY NON-FINAL RECEIPTS
    if (r.handoverStatus === 'Accepted') return;
this.flatRows.push({
  handoverId: h.handoverId,
  handoverDate: h.handoverDate,
  cashierName: h.cashierName,
  handoverStatus: h.status,

  receiptId: r.receiptId,
  customerName: r.customerName,
  amountPaid: r.amountPaid,
  paymentMode: r.paymentMode,
  paidOn: r.paidOn,
  receiptStatus: r.handoverStatus,

  // 🔥 re-handover flags
  receiptIsRehandover: r.isRehandover,
  distributorRejectReason: r.previousRejectReason,
  cashierRehandoverNote: r.rehandoverNote
});
  });
});

        console.log('FLAT ROWS =>', this.flatRows);
        // ✅ REMOVE DUPLICATE RECEIPTS — keep latest handover only
const map = new Map<string, any>();

this.flatRows.forEach(row => {
  const existing = map.get(row.receiptId);

  if (!existing) {
    map.set(row.receiptId, row);
  } else {
    // keep the newer handover by date
    const oldDate = new Date(existing.handoverDate).getTime();
    const newDate = new Date(row.handoverDate).getTime();

    if (newDate > oldDate) {
      map.set(row.receiptId, row);
    }
  }
});

this.flatRows = Array.from(map.values());
// 🔥 extract unique cashiers
this.cashiers = [
  ...new Set(this.flatRows.map(r => r.cashierName))
];

// default
this.applyCashierFilter();


        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
}
applyCashierFilter() {

  if (this.selectedCashier === 'ALL') {
    this.filteredRows = [...this.flatRows];
  } else {

    const selected = this.selectedCashier.trim().toLowerCase();

    this.filteredRows = this.flatRows.filter(r =>
      r.cashierName?.trim().toLowerCase() === selected
    );
  }

  this.calculateCashierTotals();
}


// -------------------------

calculateCashierTotals() {

  this.cashierTotals = {
    total: 0,
    modes: {}
  };

  this.filteredRows.forEach(r => {

    this.cashierTotals.total += r.amountPaid;

    const mode = r.paymentMode?.toUpperCase() || 'OTHER';

    if (!this.cashierTotals.modes[mode]) {
      this.cashierTotals.modes[mode] = 0;
    }

    this.cashierTotals.modes[mode] += r.amountPaid;
  });
}


approveReceipt(row: any) {
  this.paymentService.approveReceipt(row.receiptId)
    .subscribe({
      next: () => {
        this.toastr.success('Receipt approved');
        this.loadPendingHandovers();
      },
      error: err => {
        this.toastr.error(err?.error?.error || 'Already processed');
      }
    });
}

rejectReceipt(row: any) {
  const reason = prompt('Enter reject reason:');
  if (!reason) return;

  this.paymentService.rejectReceipt(row.receiptId, reason)
    .subscribe({
      next: () => {
        this.toastr.success('Receipt rejected');
        this.loadPendingHandovers();
      },
      error: err => {
        this.toastr.error(err?.error?.error || 'Already processed');
      }
    });
}


viewDetails(h: any) {
  this.paymentService.getHandoverDetails(h.handoverId)
    .subscribe(res => {
      this.selectedDetails = res;
      this.showModal = true;
    });
}
closeModal() {
  this.showModal = false;
  this.selectedDetails = null;
}

// ✅ Payment mode icon helper
getPaymentModeIcon(mode: string): string {
  switch ((mode || '').toLowerCase()) {
    case 'cash':
      return 'fas fa-money-bill-wave text-success';
    case 'upi':
      return 'fas fa-mobile-alt text-primary';
    case 'card':
      return 'fas fa-credit-card text-info';
    case 'bank':
      return 'fas fa-university text-warning';
    default:
      return 'fas fa-question-circle text-muted';
  }
}


}