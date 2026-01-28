import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-pending-payments',
  templateUrl: './pending-payments.component.html',
  styleUrl: './pending-payments.component.css'
})
export class PendingPaymentsComponent implements OnInit {

  pendingPayments: any[] = [];
    filteredPayments: any[] = [];   // ✅ FIX 1: Needed for filtering
  searchTerm: string = '';        // ✅ FIX 2: For ngModel search box


  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPendingPayments();
  }

  loadPendingPayments() {
    this.paymentService.getAllPendingPayments().subscribe(res => {
      this.pendingPayments = res;
      this.filteredPayments = res;
    });
  }
   // ✅ FIX 3: Search function used in your HTML
  filterPayments() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredPayments = this.pendingPayments;
      return;
    }

    this.filteredPayments = this.pendingPayments.filter(p =>
      p.customerName?.toLowerCase().includes(term) ||
      p.paymentMode?.toLowerCase().includes(term) ||
      p.paymentId?.toLowerCase().includes(term)
    );
  }

  /* Add this to your component TypeScript if you want payment mode icons */
  // Existing icon function
  getPaymentModeIcon(mode: string) {
    switch (mode?.toLowerCase()) {
      case 'cash': return 'fas fa-money-bill-wave';
      case 'online': return 'fas fa-credit-card';
      case 'upi': return 'fas fa-mobile-alt';
      case 'scanner': return 'fas fa-qrcode';
      case 'card': return 'fas fa-credit-card';
      default: return 'fas fa-money-check';
    }
  }

  // ✅ FIX 4: Your HTML expects this class helper
  getPaymentModeClass(mode: string): string {
    switch (mode?.toLowerCase()) {
      case 'cash': return 'cash';
      case 'online': return 'online';
      case 'upi': return 'upi';
      case 'scanner': return 'scanner';
      default: return '';
    }
  }
  // ✅ Highlight recent payments (last 24 hours)
isRecent(paymentDate: string | Date): boolean {
  if (!paymentDate) return false;

  const paymentTime = new Date(paymentDate).getTime();
  const now = Date.now();

  const diffHours = (now - paymentTime) / (1000 * 60 * 60);
  return diffHours <= 24;
}

// ✅ Total pending amount summary
getTotalPending(): number {
  return this.filteredPayments.reduce((sum, p) => {
    return sum + (Number(p.amount) || 0);
  }, 0);
}

// ✅ Refresh list (re-fetch from backend)
refreshPayments() {
  this.loadPendingPayments();
}

// ✅ Export stub (can wire Excel later)
exportToExcel() {
  alert('Export to Excel feature coming soon');
}

  
}
