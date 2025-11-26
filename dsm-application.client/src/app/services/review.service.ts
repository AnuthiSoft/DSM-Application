import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AddReviewDto, Review } from '../models/review.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

   private endpoint = 'reviews';

  constructor(private api: ApiService) {}

  // ⭐ Submit review
  submitReview(payload: AddReviewDto): Observable<any> {
    return this.api.post(`${this.endpoint}`, payload);
  }

  // ⭐ Get pending reviews (Admin)
  getPending(): Observable<Review[]> {
    return this.api.get<Review[]>(`${this.endpoint}/pending`);
  }

// getReviewHistory() {
//   return this.api.get<Review[]>(`${this.endpoint}/history`);
// }
  // ⭐ Approve/Reject
  takeAction(id: string, action: 'approve' | 'reject'): Observable<any> {
    return this.api.post(`${this.endpoint}/${id}/action?action=${action}`, {});
  }
  getAll(): Observable<Review[]> {
    return this.api.get<Review[]>(`${this.endpoint}/all`);
  }
}
