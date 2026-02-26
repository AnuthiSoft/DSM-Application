import { Component, OnInit } from '@angular/core';
import { Review } from '../../models/review.model';
import { ReviewService } from '../../services/review.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-admin-review-history',
  templateUrl: './admin-review-history.component.html',
  styleUrl: './admin-review-history.component.css'
})
export class AdminReviewHistoryComponent implements OnInit {
  reviews: Review[] = [];
  loading = true;
  //  historyFrauds: FraudReport[] = [];
  //   loading = true;
  // PAGINATION
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedReviews: Review[] = [];

  constructor(private reviewService: ReviewService, private dashboard: AdminDashboardComponent) { }

  ngOnInit() {
    this.loadHistory();

  }
  loadHistory() {
    this.reviewService.getAll().subscribe({
      next: res => {
        this.reviews = res;
        this.loading = false;
        this.setupPagination();
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-danger';
      case 'pending': return 'text-warning';
      default: return '';
    }
  }
  getTargetTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'customer': return 'badge-customer';
      case 'distributor': return 'badge-distributor';
      default: return 'badge-default';
    }
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
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

  goBack() {
    this.dashboard.setActiveTab('admin/reviews');
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.reviews.length / this.pageSize) || 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedReviews = this.reviews.slice(start, end);
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