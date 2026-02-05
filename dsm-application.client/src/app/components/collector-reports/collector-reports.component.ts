import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Router } from '@angular/router';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-collector-reports',
  templateUrl: './collector-reports.component.html',
  styleUrl: './collector-reports.component.css'
})
export class CollectorReportsComponent implements OnInit {



  // Selected payment objects
 
  showHandoverModal = false;
showSuccessToast = false;
pendingPayments: any[] = [];
unhandedReceipts: any[] = [];
selectedReceipts: any[] = [];
 showModal: boolean = false;
 rehandoverReason: string = '';
  
  // Extra required fields for HTML template
  todayDate: string = new Date().toISOString().split("T")[0];
  selectedDistributorId = localStorage.getItem('distributorId') || "";
  distributors: any[] = []; // If needed later
  notes: string = "";

form = {
  cashierId: localStorage.getItem('employeeId') || '',
  distributorId: localStorage.getItem('distributorId') || '',
  receiptIds: [] as string[],        // ✅ CHANGED
  cashAmountSubmitted: 0,
  totalAmountSubmitted: 0,
  date: new Date().toISOString().split('T')[0],
  notes: ''
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

  this.paymentService
    .getAllReceiptsForHandover(cashierId)
    .subscribe(receipts => {
      this.unhandedReceipts = receipts;

      const rejected = receipts.filter(
        r => r.handoverStatus === 'Rejected'
      );

      if (rejected.length > 0) {
        alert(`⚠️ ${rejected.length} payment(s) were rejected by distributor.`);
      }
    });
}


  // ---- SELECTION FEATURES ---- //

isSelected(receipt: any) {
  return this.selectedReceipts.includes(receipt);
}
hasRejectedSelected(): boolean {
  return this.selectedReceipts.some(r => r.handoverStatus === 'Rejected');
}

toggleReceiptSelection(receipt: any, checked: boolean) {
    // ⛔ HARD BLOCK
  if (receipt.handoverStatus === 'Pending') {
    return;
  }
  if (checked) {
    this.selectedReceipts.push(receipt);
    this.form.receiptIds.push(receipt.receiptId);

    this.form.totalAmountSubmitted += receipt.amountPaid;

    if (receipt.paymentMode === 'cash') {
      this.form.cashAmountSubmitted += receipt.amountPaid;
    }

  } else {
    this.selectedReceipts = this.selectedReceipts.filter(r => r !== receipt);
    this.form.receiptIds = this.form.receiptIds.filter(
      id => id !== receipt.receiptId
    );

    this.form.totalAmountSubmitted -= receipt.amountPaid;

    if (receipt.paymentMode === 'cash') {
      this.form.cashAmountSubmitted -= receipt.amountPaid;
    }
  }
}


  isAllSelected() {
    return this.selectedReceipts.length === this.unhandedReceipts.length;
  }
toggleSelectAll(checked: boolean) {
  if (checked) {
    this.selectedReceipts = [...this.unhandedReceipts];
    this.form.receiptIds = this.unhandedReceipts.map(r => r.receiptId);

    this.form.totalAmountSubmitted = this.unhandedReceipts.reduce(
      (sum, r) => sum + r.amountPaid, 0
    );

    this.form.cashAmountSubmitted = this.unhandedReceipts
      .filter(r => r.paymentMode === 'cash')
      .reduce((sum, r) => sum + r.amountPaid, 0);

  } else {
    this.clearSelection();
  }
}
hasPendingReceipts(): boolean {
  return this.unhandedReceipts.some(
    r => r.handoverStatus === 'Pending'
  );
}

clearSelection() {
  this.selectedReceipts = [];
  this.form.receiptIds = [];
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
  return this.selectedReceipts.filter(r => r.paymentMode === 'cash').length;
}

getOnlinePaymentCount() {
  return this.selectedReceipts.filter(
    r => r.paymentMode === 'online' || r.paymentMode === 'upi'
  ).length;
}
  // ---- VALIDATION ---- //
  canSubmit() {
    return this.selectedReceipts.length > 0;
  }

  // ---- SUBMIT HANDOVER ---- //
 submit() {

  if (this.selectedReceipts.length === 0) {
    alert('Please select at least one receipt.');
    return;
  }

  // 🔥 REQUIRE reason for rejected receipts
  if (this.hasRejectedSelected() && !this.rehandoverReason.trim()) {
    alert('Re-handover reason is required.');
    return;
  }

  // attach to payload
  (this.form as any).rehandoverNote = this.rehandoverReason;

  this.paymentService.createHandover(this.form).subscribe({
    next: () => {
      alert('Handover submitted! Waiting for distributor approval.');

      this.rehandoverReason = '';
      this.clearSelection();
      this.loadPendingPayments();
    },
    error: err => {
      alert(err.error?.error || 'Handover Failed');
    }
  });
}

 // Open the modal popup
  openHandoverModal(): void {
    this.showModal = true;
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }
  
  // Close the modal popup
  closeModal(): void {
    this.showModal = false;
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  }
  
  // Handle the final submission
  submitHandover(): void {
    // Call your existing submit function
    this.submit();
    // Close the modal after submission
    this.closeModal();
  }
  
  // ... rest of your existing methods ...
  
  // Modify your existing submit method to show success message
  // submit(): void {
  //   // Your existing submit logic here
    
  //   // After successful submission, show success message
  //   this.toastr.success('Handover submitted successfully!', 'Success');
  // }
  
}