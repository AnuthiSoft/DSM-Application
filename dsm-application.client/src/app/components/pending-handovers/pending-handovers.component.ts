import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-pending-handovers',
  templateUrl: './pending-handovers.component.html',
  styleUrl: './pending-handovers.component.css'
})
export class PendingHandoversComponent implements OnInit {

  distributorId = localStorage.getItem('distributorId') || '';
  handovers: any[] = [];
  loading = true;
  selectedDetails: any = null;
showModal = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPendingHandovers();
  }

  loadPendingHandovers() {
    this.loading = true;

    this.paymentService.getPendingHandovers(this.distributorId)
      .subscribe({
        next: (data) => {
          this.handovers = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  approve(h: any) {
  this.paymentService.approveHandover(h.handoverId).subscribe(() => {
    alert("Approved successfully!");
    this.loadPendingHandovers();
  });
}

reject(h: any) {
  const reason = prompt("Enter reject reason:");
  if (!reason) return;

  this.paymentService.rejectHandover(h.handoverId, reason).subscribe(() => {
    alert("Rejected successfully!");
    this.loadPendingHandovers();
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