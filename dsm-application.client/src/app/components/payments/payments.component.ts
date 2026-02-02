import { Component } from '@angular/core';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {
  activeSection: 'reports' | 'handovers' | 'customers' = 'reports';
  activeTab = 'payments';
  // activeSection: 'reports' | 'handovers' | 'customers' = 'reports';
  isMobileSheetOpen = false;

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
  currentDate: Date = new Date();

  /* -------------------------
     LOADING STATE
  ------------------------- */
  loading = false;


  switch(section: 'reports' | 'handovers' | 'customers') {
    this.activeSection = section;
    if (window.innerWidth <= 1024) {
    this.isMobileSheetOpen = true;
  }
  }
  getCompletedCount(): number { return 0; }
  getPendingCount(): number { return 0; }

  getReportCount(): number { return 0; }
  getHandoverCount(): number { return 0; }
  getCustomerCount(): number { return 0; }

  /* -------------------------
     ACTIVE SECTION HELPERS
  ------------------------- */
  getActiveLabel(): string {
    switch (this.activeSection) {
      case 'reports': return 'Reports';
      case 'handovers': return 'Handovers';
      case 'customers': return 'Customers';
      default: return '';
    }
  }

  getActiveTitle(): string {
    return `${this.getActiveLabel()} Payments`;
  }

  getActiveSubtitle(): string {
    switch (this.activeSection) {
      case 'reports': return 'View and export payment reports';
      case 'handovers': return 'Track today’s cash handovers';
      case 'customers': return 'Customer-wise payment overview';
      default: return '';
    }
  }

  getActiveIcon(): string {
    switch (this.activeSection) {
      case 'reports': return 'fas fa-file-invoice';
      case 'handovers': return 'fas fa-hand-holding-usd';
      case 'customers': return 'fas fa-users';
      default: return 'fas fa-credit-card';
    }
  }

  /* -------------------------
     ACTION BUTTONS (STUBS)
  ------------------------- */
  refreshContent() {
    this.loading = true;
    setTimeout(() => this.loading = false, 500);
  }

  exportData() {
    alert('Export coming soon');
  }

  generateReport() {
    alert('Generate report coming soon');
  }

  sendReminders() {
    alert('Send reminders coming soon');
  }
  refreshHandovers() {
    if (this.activeSection !== 'handovers') {
      this.activeSection = 'handovers';
    }
    this.refreshContent();
  }

  refreshCustomers() {
    if (this.activeSection !== 'customers') {
      this.activeSection = 'customers';
    }
    this.refreshContent();
  }

  closeSheet() {
  this.isMobileSheetOpen = false;
}

}
