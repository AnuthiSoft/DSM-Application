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


}