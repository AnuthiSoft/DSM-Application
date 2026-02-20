import { Component } from '@angular/core';
import { ReviewService } from '../../services/review.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AddReviewDto } from '../../models/review.model';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';

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
    rating: null as any
  };

  ratings = [1, 2, 3, 4, 5];
  success = '';
  error = '';

  constructor(
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cust :CustomerService,
      private router: Router 
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
setRating(value: number) {
  this.model.rating = value;
}
 submit(form: any) {
    this.success = '';
  this.error = '';
   if (form.invalid) {
      form.control.markAllAsTouched(); 
    this.error = 'Please fill all required fields';
    return;
  }
    this.success = '';
    this.error = '';
    // 🔥 Validation
if (!this.model.title || this.model.title.trim() === '') {
  this.error = 'Title is required';
  return;
}

if (!this.model.description || this.model.description.trim() === '') {
  this.error = 'Description is required';
  return;
}

if (!this.model.rating || this.model.rating === 0) {
  this.error = 'Rating is required';
  return;
}

    this.reviewService.submitReview(this.model).subscribe({
      next: (res) => {
        this.success = res.message;
         setTimeout(() => {
        this.router.navigate(['/customer-dashboard'], {
          queryParams: { tab: 'distributors' }
        });
      }, 1500); // wait 1.5 sec so message is visible
    },
      
      error: () => {
        this.error = 'Failed to submit review.';
      }
    });
  }
close() {
  this.router.navigate(['/customer-dashboard'], {
    queryParams: { tab: 'distributors' }
  });
}

}
