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

  constructor(private reviewService: ReviewService, private dashboard: AdminDashboardComponent) {}

  ngOnInit() {
   this.loadHistory();
 
  }
   loadHistory() {
    this.reviewService.getAll().subscribe({
      next: res => {
        this.reviews = res;
        this.loading = false;
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

}