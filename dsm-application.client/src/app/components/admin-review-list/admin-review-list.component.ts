import { Component, OnInit } from '@angular/core';
import { Review } from '../../models/review.model';
import { ReviewService } from '../../services/review.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-admin-review-list',
  templateUrl: './admin-review-list.component.html',
  styleUrl: './admin-review-list.component.css'
})
export class AdminReviewListComponent implements OnInit {

  pending: Review[] = [];
  // PAGINATION
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedReviews: Review[] = [];

  constructor(private reviewService: ReviewService, private dashboard: AdminDashboardComponent) { }

  ngOnInit(): void {
    this.loadPendingReviews();
  }

  loadPendingReviews() {
    this.reviewService.getPending().subscribe(res => {
      this.pending = res;
      this.setupPagination();
    });
  }

  approve(id: string) {
    this.reviewService.takeAction(id, 'approve').subscribe(() => this.loadPendingReviews());
  }

  reject(id: string) {
    this.reviewService.takeAction(id, 'reject').subscribe(() => this.loadPendingReviews());
  }
  // ⭐ Add this method for target-type badge colors
  getTargetTypeClass(type: string) {
    if (!type) return '';
    const t = type.toLowerCase();

    if (t === 'distributor') return 'badge-distributor';
    if (t === 'customer') return 'badge-customer';

    return '';
  }

  // ⭐ Add this method for star display
  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  goToReviewHistory() {
    this.dashboard.setActiveTab('review-history');
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.pending.length / this.pageSize) || 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedReviews = this.pending.slice(start, end);
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