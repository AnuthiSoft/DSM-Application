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
  // PAGINATION
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedFrauds: FraudReport[] = [];

  constructor(private fraudService: FraudService, private dashboard: AdminDashboardComponent) { }

  ngOnInit() {
    this.loadPendingReports();
  }

  loadPendingReports() {
    this.fraudService.getPending().subscribe({
      next: (res) => {
        this.pendingFrauds = res;
        this.setupPagination();
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

  setupPagination() {
    this.totalPages = Math.ceil(this.pendingFrauds.length / this.pageSize) || 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedFrauds = this.pendingFrauds.slice(start, end);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];

    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
        if (i > 1 && i < this.totalPages) {
          pages.push(i);
        }
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      pages.push(this.totalPages);
    }

    return pages;
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }
}
