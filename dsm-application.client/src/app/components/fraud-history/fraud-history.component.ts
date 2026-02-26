import { Component, OnInit } from '@angular/core';
import { FraudReport } from '../../models/fraud.model';
import { FraudService } from '../../services/fraud.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-fraud-history',
  templateUrl: './fraud-history.component.html',
  styleUrl: './fraud-history.component.css'
})
export class FraudHistoryComponent implements OnInit {

  historyFrauds: FraudReport[] = [];
  loading = true;
  // PAGINATION
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedHistoryFrauds: FraudReport[] = [];

  constructor(private fraudService: FraudService, private dashboard: AdminDashboardComponent) { }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.fraudService.getAll().subscribe({
      next: res => {
        this.historyFrauds = res;
        this.loading = false;
        this.setupPagination();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'fa-check-circle text-success';
      case 'rejected': return 'fa-times-circle text-danger';
      case 'pending': return 'fa-clock text-warning';
      default: return 'fa-question-circle';
    }
  }

  goBack() {
    this.dashboard.setActiveTab('fraud-reports');
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.historyFrauds.length / this.pageSize) || 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedHistoryFrauds = this.historyFrauds.slice(start, end);
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