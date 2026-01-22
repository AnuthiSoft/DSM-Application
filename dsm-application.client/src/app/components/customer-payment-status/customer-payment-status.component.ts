import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-customer-payment-status',
  templateUrl: './customer-payment-status.component.html',
  styleUrl: './customer-payment-status.component.css'
})
export class CustomerPaymentStatusComponent {
 orderId = '';
  date = new Date().toISOString().split('T')[0];
  status: any;

  constructor(private paymentService: PaymentService) {}
  check() {
    if (!this.orderId.trim()) {
      alert("Please enter Order ID");
      return;
    }

    this.paymentService.getCustomerPaymentHistory(this.orderId)
      .subscribe(res => {
        this.status = res;
      });
  }
   // 🔄 Trigger check on date change
  onDateChange() {
    if (this.orderId.trim().length > 0) {
      this.check();
    }
  }

  // 🧹 Clear search details
  clearSearch() {
    this.orderId = '';
    this.status = null;
  }

  // 📊 Payment Percentage (paid vs total)
getPaymentPercentage() {
  if (!this.status) return 0;

  const total = this.status.totalAmount || 0;
  const paid  = this.status.totalPaid || 0;

  if (total === 0) return 0;
  return Math.round((paid / total) * 100);
}

isOrderCancelled(): boolean {
  const status = this.status?.orderStatus?.toLowerCase();
  // const status = this.status?.status?.toLowerCase();
  return status === 'cancelled' || status === 'canceled';
}


  // 💳 Icon for payment mode
  getPaymentModeIcon(mode: string) {
    switch (mode) {
      case 'cash': return 'fas fa-money-bill-wave text-success';
      case 'upi': return 'fas fa-mobile-alt text-primary';
      case 'online': return 'fas fa-globe text-info';
      case 'scanner': return 'fas fa-qrcode text-warning';
      default: return 'fas fa-question-circle text-muted';
    }
  }

  // 🖨 Print
  printStatus() {
    window.print();
  }

  // 📥 Download Report (placeholder)
  downloadReport() {
    alert("Download feature coming soon!");
  }

  // 📤 Share Report (WhatsApp)
  shareStatus() {
    alert("Share feature coming soon!");
  }

  // 👤 View full customer details
  viewCustomerDetails() {
    alert("Customer details feature coming soon!");
  }
}
