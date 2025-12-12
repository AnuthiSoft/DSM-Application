import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-cash-summary',
  templateUrl: './cash-summary.component.html',
  styleUrl: './cash-summary.component.css'
})
export class CashSummaryComponent  {

 cashierId = localStorage.getItem('employeeId') || '';
  date = new Date().toISOString().split('T')[0];

  summary: any = null;
  payments: any[] = [];   // <-- list for table

  constructor(private paymentService: PaymentService) {}

  load() {
    this.paymentService.getCashierSummary(this.cashierId, this.date)
      .subscribe(res => {
        this.summary = res;
        this.payments = res.payments || [];  // <-- extract array
      });
  }
  onDateChange() {
   this.load();
 }

 // -------------------------
 // ICON FOR PAYMENT MODE
 // -------------------------
 getPaymentModeIcon(mode: string) {
   switch (mode) {
     case 'cash': return 'fas fa-money-bill-wave text-success';
     case 'upi': return 'fas fa-mobile-alt text-primary';
     case 'online': return 'fas fa-globe text-info';
       case 'scanner': return 'fas fa-qrcode';   // ✅ FIXED
     default: return 'fas fa-question-circle text-muted';
     
   }
 }

 // -------------------------
 // LOAD YESTERDAY’S DATA
 // -------------------------
 loadYesterday() {
   const yesterday = new Date();
   yesterday.setDate(yesterday.getDate() - 1);

   this.date = yesterday.toISOString().split('T')[0];
   this.load();
 }

 // -------------------------
 // EXPORT TO EXCEL  (placeholder)
 // -------------------------
 exportToExcel() {
   alert("Excel export coming soon!");
 }

 // -------------------------
 // PRINT SUMMARY
 // -------------------------
 printSummary() {
   window.print();
 }

 // -------------------------
 // SHARE SUMMARY (WhatsApp/SMS)
 // -------------------------
 shareSummary() {
   alert("Share summary feature coming soon!");
 }

 // -------------------------
 // DOWNLOAD PDF (placeholder)
 // -------------------------
 downloadPDF() {
   alert("PDF download coming soon!");
 }
}