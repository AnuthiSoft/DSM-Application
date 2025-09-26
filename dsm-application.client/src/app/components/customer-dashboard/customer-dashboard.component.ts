import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';


interface Distributor {
  distributorId: string;
  companyName: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  IsPremium?: boolean;
  IsActive?: boolean;
  address?: string;
  categories?: string[];
  createdDate?: string;
  

}

interface Product {
  productId: string;
  productName: string;
  productCode?: string;
  distributorId: string;
  categoryId?: string | null;
  price?: string;
  stock?: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  

  
               
}
interface DistributorWrapper {
  distributor: Distributor;
  products?: Product[];
  
  
}

interface DashboardResponse {
  isGlobal: boolean;
  distributors: {
    distributor: Distributor;
    products: Product[];
  }[];
   distributor?: Distributor;  
  products?: Product[];  
   totalOrders?: number;    
  totalProducts?: number;   
  totalDistributors?: number;
 
  
}
@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css'
})
export class CustomerDashboardComponent {
    customerEmail: string | null = '';
  customerId: string = '';
  dashboardData!: DashboardResponse;
  loading = true;
  status:string='';
  distributorId: string='';
  products: Product[] = [];

       activeTab: string = 'dashboard';
         currentDate: Date = new Date();


  constructor(private customerService: CustomerService,private router: Router, private http: HttpClient,private productservice:ProductService) {}

  ngOnInit(): void {
    this.customerEmail = localStorage.getItem('customerEmail');
      this.customerId = localStorage.getItem('customerId') || '';
         this.distributorId = localStorage.getItem('distributorId') || '';
          
    
       if (!this.customerId) {
    console.error('No customerId found in localStorage');
    
    return;
  }
  
 
  this.loadDashboard();

  
  
  }
   loadDashboard() {
    this.loading = true;
    this.http.get<DashboardResponse>(`https://localhost:7189/api/customers/dashboard/${this.customerId}`)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading dashboard', err);
          this.loading = false;
        }
      });
  }
  connectDistributor(distributor: Distributor) {
  const body = {
    customerId: this.customerId,
    distributorId: distributor.distributorId
  };

  this.http.post('https://localhost:7189/api/customers/connect-distributor', body)
    .subscribe({
      next: (res: any) => {
        alert(res);  
       
        this.loadDashboard();
      },
      error: (err) => {
        console.error('Error connecting distributor', err);
        alert(err.error || 'Failed to send connection request');
      }
    });
}
viewProducts(distributorId: string) {
  this.router.navigate(['/products', distributorId]);
}

  logout() {
    localStorage.clear();
    this.router.navigate(['/customer/login']);
  }
  
}
