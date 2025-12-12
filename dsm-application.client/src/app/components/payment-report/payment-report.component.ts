import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-report',
  templateUrl: './payment-report.component.html',
  styleUrl: './payment-report.component.css'
})
export class PaymentReportComponent implements OnInit {

  distributorId: string = '';
  fromDate: string = '';
  toDate: string = '';

  reports: any[] = [];
  loading = false;
  errorMessage = '';
  paymentMode: string = '';
handoverStatus: string = '';

totalPages: number = 1;
totalItems: number = 0;
currentPage: number = 1;

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    // ⭐ AUTO-LOAD distributorId from login storage
    this.distributorId = localStorage.getItem('distributorId') || '';

    if (!this.distributorId) {
      this.errorMessage = "Distributor ID not found. Please login again.";
    }
  }

  loadReport() {
    this.errorMessage = '';

    if (!this.distributorId) {
      this.errorMessage = "Distributor ID missing!";
      return;
    }

    this.loading = true;

    this.paymentService
  .getPaymentReport(this.distributorId, this.fromDate, this.toDate, this.paymentMode, this.handoverStatus)
  .subscribe({
    next: (res) => {
      this.reports = res;
       this.applyFilters();
      this.loading = false;
    },
    error: () => {
      this.errorMessage = "Failed to load report";
      this.loading = false;
    }
  });

      
      
  }
  applyFilters() {
  let filtered = [...this.reports];

  if (this.paymentMode) {
    filtered = filtered.filter(r => r.paymentMode === this.paymentMode);
  }

  if (this.handoverStatus) {
    filtered = filtered.filter(r => 
      this.handoverStatus === 'handed'
        ? r.isHandedOver === true
        : r.isHandedOver === false
    );
  }

  this.reports = filtered;
}


  clearFilters() {
    this.fromDate = '';
    this.toDate = '';
    this.reports = [];
    this.errorMessage = '';
  }
getTotalAmount() {
  return this.reports.reduce((sum, r) => sum + (r.amountPaidToday || 0), 0);
}
getHandedOverCount() {
  return this.reports.filter(r => r.isHandedOver === true).length;
}

getPendingCount() {
  return this.reports.filter(r => r.isHandedOver !== true).length;
}
// ---------- Error ----------
clearError() {
  this.errorMessage = '';
}

// ---------- Export ----------
exportToExcel() {
  console.log("EXPORT EXCEL — to be implemented");
}

// ---------- Print ----------
printReport() {
  console.log("PRINT REPORT — to be implemented");
}

// ---------- Icons ----------
getPaymentModeIcon(mode: string) {
  switch (mode?.toLowerCase()) {
    case 'cash': return 'fas fa-money-bill';
    case 'upi': return 'fas fa-mobile-alt';
    case 'card': return 'fas fa-credit-card';
    default: return 'fas fa-receipt';
  }
}

// ---------- Row Actions ----------
viewDetails(r: any) {
  console.log("View details:", r);
}

downloadReceipt(r: any) {
  console.log("Download receipt:", r);
}

// ---------- Pagination ----------
getDisplayRange() {
  const start = (this.currentPage - 1) * 10 + 1;
  const end = Math.min(this.currentPage * 10, this.totalItems);
  return `${start} - ${end}`;
}

previousPage() {
  if (this.currentPage > 1) this.currentPage--;
}

nextPage() {
  if (this.currentPage < this.totalPages) this.currentPage++;
}

getPageNumbers() {
  return Array(this.totalPages).fill(0).map((x, i) => i + 1);
}

goToPage(page: number) {
  this.currentPage = page;
}

// ---------- Default Report ----------
loadDefaultReport() {
  console.log("Loading default report...");
  this.loadReport();
}
}