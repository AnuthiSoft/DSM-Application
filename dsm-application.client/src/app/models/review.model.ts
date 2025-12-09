export interface AddReviewDto {
  reviewerId: string;
  targetId: string;
  targetType: string; // "Distributor" | "Customer"
  title: string;
  description: string;
  rating: number;
}

export interface Review {
  id: string;
  reviewerId: string;
  targetId: string;
  targetType: string;
  title: string;
  description: string;
  rating: number;
  status: string;
  createdAt: string;
}
