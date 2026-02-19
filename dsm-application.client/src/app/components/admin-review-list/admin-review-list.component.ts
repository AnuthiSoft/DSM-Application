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

  constructor(private reviewService: ReviewService, private dashboard: AdminDashboardComponent) {}

  ngOnInit(): void {
    this.loadPendingReviews();
  }

  loadPendingReviews() {
    this.reviewService.getPending().subscribe(res => {
      this.pending = res;
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
}