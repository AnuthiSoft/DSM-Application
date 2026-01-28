import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-summary',
  templateUrl: './payment-summary.component.html',
  styleUrl: './payment-summary.component.css'
})
export class PaymentSummaryComponent {
  distributorId = localStorage.getItem('distributorId') || '';
  date = new Date().toISOString().split('T')[0];
  summary: any;
  pendingHandovers: any[] = [];
  showRejectModal = false;
  rejectReason = "";
  selectedHandoverId = "";
  constructor(private paymentService: PaymentService) { }
  loadPendingHandovers() {
    this.paymentService.getPendingHandovers(this.distributorId)
      .subscribe(res => {
        this.pendingHandovers = res;
      });
  }

  approve(id: string) {
    if (!confirm("Approve this handover?")) return;

    this.paymentService.approveHandover(id)
      .subscribe(res => {
        alert("Handover Approved Successfully!");
        this.loadPendingHandovers();
      });
  }
  openRejectModal(id: string) {
    console.log("Reject clicked for:", id);   // DEBUG
    this.selectedHandoverId = id;
    this.showRejectModal = true;
  }

  submitReject() {
    if (!this.rejectReason.trim()) {
      alert("Please enter reason");
      return;
    }

    this.paymentService.rejectHandover(this.selectedHandoverId, this.rejectReason)
      .subscribe(res => {
        alert("Handover Rejected!");
        this.showRejectModal = false;
        this.rejectReason = "";
        this.loadPendingHandovers();
      });
  }

  load() {
    this.paymentService.getDistributorSummary(this.distributorId, this.date)
      .subscribe(res => this.summary = res);
    this.loadPendingHandovers();
  }
  onDateChange() {
    this.load();
  }
  getCashPercentage() {
    if (!this.summary) return 0;
    const total = this.summary.totalCash + this.summary.totalOnline + this.summary.totalScanner;
    return total === 0 ? 0 : Math.round((this.summary.totalCash / total) * 100);
  }

  getOnlinePercentage() {
    if (!this.summary) return 0;
    const total = this.summary.totalCash + this.summary.totalOnline + this.summary.totalScanner;
    return total === 0 ? 0 : Math.round((this.summary.totalOnline / total) * 100);
  }

  getScannerPercentage() {
    if (!this.summary) return 0;
    const total = this.summary.totalCash + this.summary.totalOnline + this.summary.totalScanner;
    return total === 0 ? 0 : Math.round((this.summary.totalScanner / total) * 100);
  }
  getPaymentModeIcon(mode: string) {
    switch (mode) {
      case 'cash': return 'fas fa-money-bill-wave text-success';
      case 'online': return 'fas fa-globe text-info';
      case 'upi': return 'fas fa-mobile-alt text-primary';
      case 'scanner': return 'fas fa-qrcode text-warning';
      default: return 'fas fa-question-circle text-muted';
    }
  }
  exportToExcel() {
    console.log("Export to Excel clicked");
  }

  printSummary() {
    window.print();
  }

  downloadPDF() {
    console.log("Download PDF clicked");
  }

  viewAnalytics() {
    console.log("View analytics clicked");
  }

}
