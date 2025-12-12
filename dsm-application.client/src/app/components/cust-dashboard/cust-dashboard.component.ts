import { Component, EventEmitter, Output } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/products.model';
interface Distributor {
  distributorId: string;
  companyName: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  isPremium?: boolean;
  isActive?: boolean;
  address?: string;
  categories?: string[];
  createdDate?: string;
   canConnect?: boolean;
   averageRating: number;
  reviewCount: number;
}

// interface Product {
//   productId: string;
//   productName: string;
//   productCode?: string;
//   distributorId: string;
//   categoryId?: string | null;
//   price?: string;
//   stock?: string;
//   brand?: string;
//   imageUrl?: string;
//   category?: string;
//   distributorName?: string;
// }

interface DashboardDistributor {
  distributor: Distributor;
  products: Product[];
  canConnect: boolean;
}

interface DashboardResponse {
  isGlobal: boolean;
  distributors: {
    distributor: Distributor;
    products: Product[];
    canConnect: boolean;   // <-- IMPORTANT: Add this
  }[];
  distributor?: Distributor;
  products?: Product[];
  totalOrders?: number;
  totalProducts?: number;
  totalDistributors?: number;
}

// interface DashboardResponse {
//   isGlobal: boolean;
//   distributors: {
//     distributor: Distributor;
//     products: Product[];
//   }[];

//   distributor?: Distributor;
//   products?: Product[];
//   totalOrders?: number;
//   totalProducts?: number;
//   totalDistributors?: number;
// }
@Component({
  selector: 'app-cust-dashboard',
  templateUrl: './cust-dashboard.component.html',
  styleUrl: './cust-dashboard.component.css'
})
export class CustDashboardComponent {
   customerId: string = '';
  distributors: Distributor[] = [];
  loading = true;

  

  @Output() viewProductsClicked = new EventEmitter<string>();
  dashboardType: 'global' | 'local' = 'global';
  getStars(rating: number): number[] {
  return [1, 2, 3, 4, 5];
}


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    this.loadDistributors();
  }


openProducts(distributorId: string) {
  this.viewProductsClicked.emit(distributorId);
}


loadDistributors() {
  this.loading = true;
  this.http
    .get<DashboardResponse>(`http://localhost:5164/api/customers/dashboard/${this.customerId}`)
    .subscribe({
      next: (res) => {
        console.log('Dashboard response:', res);

        if (res.isGlobal && res.distributors?.length) {
          this.dashboardType = 'global';
          this.distributors = res.distributors.map(d => ({
  ...d.distributor,
  canConnect: d.canConnect
}));

          // this.distributors = res.distributors.map(d => d.distributor);
        } else if (!res.isGlobal && res.distributor) {
          this.dashboardType = 'local';
          this.distributors = [res.distributor];
        } else {
          this.distributors = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading distributors:', err);
        this.loading = false;
      },
    });
}


  connectDistributor(distributorId: string) {
  const body = { customerId: this.customerId, distributorId };
  this.http
    .post<{message: string, status: string}>('http://localhost:5164/api/customers/connect-distributor', body)
    .subscribe({
      next: (res) => {
        alert(res.message);
        // Update the distributor status locally
        const distributor = this.distributors.find(d => d.distributorId === distributorId);
        if (distributor) {
          distributor.status = res.status;
        }
      },
      error: (err) => {
        alert('Error connecting: ' + err.message);
      },
    });
}
}

