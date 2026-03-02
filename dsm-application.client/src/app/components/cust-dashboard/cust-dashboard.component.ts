import { Component, EventEmitter, Output } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/products.model';
import { ToastrService } from 'ngx-toastr';


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
connectedDistributors: Distributor[] = [];
availableDistributors: Distributor[] = [];
pendingDistributors: Distributor[] = [];
activeTab: 'available' | 'connected' | 'pending' = 'available';

  // @Output() viewProductsClicked = new EventEmitter<string>();
  dashboardType: 'global' | 'local' = 'global';
  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }


  constructor(private http: HttpClient,private customerService: CustomerService,  private router: Router, private toastr: ToastrService ) {}

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
     const allDistributors = res.distributors.map(d => ({
  ...d.distributor,
  distributorId: d.distributor.distributorId,
  canConnect: d.canConnect
}));

// 🔥 Split into 2 sections
this.connectedDistributors = allDistributors.filter(d =>
  d.status === 'Accepted' || d.status === 'Connected'
);

this.pendingDistributors = allDistributors.filter(d =>
  d.status === 'Pending'
);

this.availableDistributors = allDistributors.filter(d =>
  d.status !== 'Accepted' &&
  d.status !== 'Connected' &&
  d.status !== 'Pending'
);

this.distributors = allDistributors; // optional if needed

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
        // ✅ TOASTR SUCCESS
        this.toastr.success(
          res.message || 'Connection request sent successfully',
          'Success'
        );

        const distributor = this.distributors.find(
          d => d.distributorId === distributorId
        );

        if (distributor) {
          distributor.status = res.status;
          distributor.canConnect = false;
        }
      },
      error: (err) => {
        // ✅ TOASTR ERROR
        this.toastr.error(
          err.error?.message || 'Failed to send connection request',
          'Error'
        );
      }
    });
}

openReview(id: string) {
  this.router.navigate(
    ['/customer-dashboard/review', 'Distributor', id],
    { queryParams: { tab: 'distributors' } }
  );
}

}

