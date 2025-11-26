import { Component } from '@angular/core';
import { ReviewService } from '../../services/review.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AddReviewDto } from '../../models/review.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-review-submit',
  templateUrl: './review-submit.component.html',
  styleUrl: './review-submit.component.css'
})
export class ReviewSubmitComponent {
   model: AddReviewDto = {
    reviewerId: '',
    targetId: '',
    targetType: '',
    title: '',
    description: '',
    rating: 0
  };

  ratings = [1, 2, 3, 4, 5];
  success = '';
  error = '';

  constructor(
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cust :CustomerService
  ) {}

  ngOnInit() {
    this.model.reviewerId =
      this.auth.getDistributorId() ||
      this.auth.getEmployeeId() ||
      this.cust.getCustomerId() ||
      '';

    this.model.targetId = this.route.snapshot.paramMap.get('targetId') || '';
    this.model.targetType = this.route.snapshot.paramMap.get('targetType') || '';
  }

  submit() {
    this.success = '';
    this.error = '';

    this.reviewService.submitReview(this.model).subscribe({
      next: (res) => {
        this.success = res.message;
      },
      error: () => {
        this.error = 'Failed to submit review.';
      }
    });
  }
  close() {
  // Go back to customer dashboard tab
  window.location.href = '/customer-dashboard'; 
}

}
