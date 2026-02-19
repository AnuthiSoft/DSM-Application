import { Component, OnInit } from '@angular/core';
import { FraudReport } from '../../models/fraud.model';
import { FraudService } from '../../services/fraud.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-admin-fraud-list',
  templateUrl: './admin-fraud-list.component.html',
  styleUrl: './admin-fraud-list.component.css'
})
export class AdminFraudListComponent implements OnInit {

   pendingFrauds: FraudReport[] = [];
  loading = true;
  historyFrauds: FraudReport[] = [];   // <-- ADD THI

  constructor(private fraudService: FraudService, private dashboard: AdminDashboardComponent) {}

  ngOnInit() {
    this.loadPendingReports();
  }

  loadPendingReports() {
    this.fraudService.getPending().subscribe({
      next: (res) => {
        this.pendingFrauds = res;
        this.loading = false;
      }
    });
    this.fraudService.getAll().subscribe(res => {
      this.historyFrauds = res;
      this.loading = false;
    });
  }

  approve(id: string) {
    this.fraudService.takeAction(id, 'approve').subscribe({
      next: () => this.loadPendingReports()
    });
  }

  reject(id: string) {
    this.fraudService.takeAction(id, 'reject').subscribe({
      next: () => this.loadPendingReports()
    });
  }
  getTargetTypeClass(type: string): string {
  switch (type?.toLowerCase()) {
    case 'customer': return 'badge-customer';
    case 'distributor': return 'badge-distributor';
    default: return 'badge-default';
  }
}

getStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    case 'pending': return 'status-pending';
    default: return 'status-default';
  }
}

getStatusIcon(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved': return 'fa-check-circle text-success';
    case 'rejected': return 'fa-times-circle text-danger';
    case 'pending': return 'fa-clock text-warning';
    default: return 'fa-question-circle text-muted';
  }
}

viewHistory() {
  this.dashboard.setActiveTab('fraud-history');
}
}
