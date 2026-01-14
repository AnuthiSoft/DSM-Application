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


  loading = false;
  errorMessage = '';
  paymentMode: string = '';
handoverStatus: string = '';
customerReports: any[] = [];
selectedCustomer: any = null;
showCustomerModal = false;
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
     const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  this.fromDate = firstDay.toISOString().split('T')[0];
  this.toDate = today.toISOString().split('T')[0];
  }

loadReport() {
  this.loading = true;
  this.errorMessage = '';

  this.paymentService
    .getCustomerWiseReport(this.distributorId, this.fromDate, this.toDate)
    .subscribe({
      next: (res) => {
        this.customerReports = res || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load report';
        this.loading = false;
      }
    });
}

 

 
getTotalAmount() {
  return this.customerReports.reduce(
    (sum, c) => sum + (c.totalCollected || 0),
    0
  );
}

getHandedOverCount() {
  return this.customerReports.reduce((count, c) =>
    count + c.orders.filter((o: any) => o.isHandedOver).length
  , 0);
}
getPendingCount() {
  return this.customerReports.reduce((count, c) =>
    count + c.orders.filter((o: any) => !o.isHandedOver).length
  , 0);
}
// ---------- Error ----------
clearError() {
  this.errorMessage = '';
}
closeModal() {
  this.showCustomerModal = false;
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
viewDetails(customer: any) {
  this.selectedCustomer = customer;
  this.showCustomerModal = true;
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