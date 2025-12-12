import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-collector-reports',
  templateUrl: './collector-reports.component.html',
  styleUrl: './collector-reports.component.css'
})
export class CollectorReportsComponent implements OnInit {

  unhandedPayments: any[] = [];

  // Selected payment objects
  selectedPayments: any[] = [];
  showHandoverModal = false;
showSuccessToast = false;
pendingPayments: any[] = [];


  // Extra required fields for HTML template
  todayDate: string = new Date().toISOString().split("T")[0];
  selectedDistributorId = localStorage.getItem('distributorId') || "";
  distributors: any[] = []; // If needed later
  notes: string = "";

  form = {
    cashierId: localStorage.getItem('employeeId') || '',
    distributorId: localStorage.getItem('distributorId') || '',
    cashAmountSubmitted: 0,
    totalAmountSubmitted: 0,
    paymentIds: [] as string[],
    date: new Date().toISOString().split('T')[0],
    notes: ""
  };

  response: any;

  constructor(private router: Router,private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPendingPayments();
  }
onDateChange() {
  this.loadPendingPayments();
}

goToPendingPayments() {
  this.router.navigate(['/pending-payments']);
}
  // Load payments
loadPendingPayments() {
  const cashierId = localStorage.getItem('employeeId')!;
  const selectedDate = this.form.date;

  this.paymentService.getCashierSummary(cashierId, selectedDate).subscribe(res => {
    this.unhandedPayments = res.payments.filter((p: any) => 
      p.isHandedOver === false && p.isSubmittedForHandover !== true
    );
  });
}


  // ---- SELECTION FEATURES ---- //

  isSelected(payment: any) {
    return this.selectedPayments.includes(payment);
  }

  togglePaymentSelection(payment: any, checked: boolean) {
    if (checked) {
      this.selectedPayments.push(payment);

      this.form.paymentIds.push(payment.paymentId);
      this.form.totalAmountSubmitted += payment.amountPaidToday;

      if (payment.paymentMode === "cash") {
        this.form.cashAmountSubmitted += payment.amountPaidToday;
      }

    } else {
      this.selectedPayments = this.selectedPayments.filter(p => p !== payment);

      this.form.paymentIds = this.form.paymentIds.filter(id => id !== payment.paymentId);
      this.form.totalAmountSubmitted -= payment.amountPaidToday;

      if (payment.paymentMode === "cash") {
        this.form.cashAmountSubmitted -= payment.amountPaidToday;
      }
    }
  }

  isAllSelected() {
    return this.selectedPayments.length === this.unhandedPayments.length;
  }

  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.selectedPayments = [...this.unhandedPayments];
      this.form.paymentIds = this.unhandedPayments.map(p => p.paymentId);

      this.form.totalAmountSubmitted = this.unhandedPayments.reduce(
        (sum, p) => sum + p.amountPaidToday, 0);

      this.form.cashAmountSubmitted = this.unhandedPayments
        .filter(p => p.paymentMode === 'cash')
        .reduce((sum, p) => sum + p.amountPaidToday, 0);

    } else {
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedPayments = [];
    this.form.paymentIds = [];
    this.form.cashAmountSubmitted = 0;
    this.form.totalAmountSubmitted = 0;
  }

  // ---- ICON FOR PAYMENT MODE ---- //
  getPaymentModeIcon(mode: string) {
    switch (mode) {
      case 'cash': return 'fas fa-money-bill-wave text-success';
      case 'upi': return 'fas fa-mobile-alt text-primary';
      case 'online': return 'fas fa-globe text-info';
      default: return 'fas fa-question-circle text-muted';
          case 'scanner': return 'fas fa-qrcode';   // ✅ FIXED
    }
  }

  // ---- PAYMENT STATS ---- //
  getCashPaymentCount() {
    return this.selectedPayments.filter(p => p.paymentMode === 'cash').length;
  }

  getOnlinePaymentCount() {
    return this.selectedPayments.filter(
      p => p.paymentMode === 'online' || p.paymentMode === 'upi'
    ).length;
  }

  // ---- VALIDATION ---- //
  canSubmit() {
    return this.selectedPayments.length > 0;
  }

  // ---- SUBMIT HANDOVER ---- //
  submit() {
    if (!this.canSubmit()) {
      alert("Please select at least one payment.");
      return;
    }

    this.form.notes = this.notes;

    this.paymentService.createHandover(this.form).subscribe({
      next: res => {
        this.response = res;
      alert("Handover submitted! Waiting for distributor approval.");
        this.clearSelection();
        this.loadPendingPayments();
      },
      error: err => {
        alert(err.error?.error || "Handover Failed");
      }
    });
  }
}