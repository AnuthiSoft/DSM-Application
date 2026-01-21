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
  pincodes?: string[];
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
  pincodes?: string[];


  // @Output() viewProductsClicked = new EventEmitter<string>();
  dashboardType: 'global' | 'local' = 'global';
  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }


  constructor(private http: HttpClient,private customerService: CustomerService,  private router: Router) {}

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    this.loadDistributors();
  }


// openProducts(distributorId: string) {
//   this.viewProductsClicked.emit(distributorId);
// }
openProducts(distributorId: string) {
  this.router.navigate(['/products', distributorId]);
}

loadDistributors() {
  this.loading = true;

  this.customerService
    .getCustomerDashboard(this.customerId)
    .subscribe({
      next: (res: DashboardResponse) => {
        console.log('Dashboard response:', res);

        if (res.isGlobal && res.distributors?.length) {
          this.dashboardType = 'global';
          this.distributors = res.distributors.map(d => {

          console.log('REPORTING DISTRIBUTOR ID =>', d.distributor.distributorId);

          return {
            ...d.distributor,

            // 🔥 IMPORTANT: force correct business ID
            distributorId: d.distributor.distributorId,

            canConnect: d.canConnect
          };
        });

        } 
        else if (!res.isGlobal && res.distributor) {
          this.dashboardType = 'local';
          this.distributors = [res.distributor];
        } 
        else {
          this.distributors = [];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading distributors:', err);
        this.loading = false;
      }
    });
}


  connectDistributor(distributorId: string) {
  this.customerService
    .connectDistributor(this.customerId, distributorId)
    .subscribe({
      next: (res: any) => {
        alert(res.message);

        const distributor = this.distributors.find(
          d => d.distributorId === distributorId
        );

        if (distributor) {
          distributor.status = res.status;
          distributor.canConnect = false;
        }
      },
      error: (err) => {
        alert('Error connecting: ' + err.message);
      }
    });
}


}

