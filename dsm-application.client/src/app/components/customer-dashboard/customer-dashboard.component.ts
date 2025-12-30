import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/products.model';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../services/order.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { InventoryService } from '../../services/inventory.service';

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
//    distributorName?: string; // Add this




// }
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
  dashboardData!: DashboardResponse;
  loading = true;
  status: string = '';
  distributorId: string = '';
  products: Product[] = [];

  expectedDays: number = 1;

  orderedDate: string = '';
  expectedDate: string = '';
  productForm: FormGroup;
  @Input() selectedProduct: Product | null = null;
  @Output() cartUpdated = new EventEmitter<any[]>();
  cart: any[] = [];

  activeTab: string = 'dashboard';
  currentDate: Date = new Date();
  orderStats: { total: number } = { total: 0 };
  productStats: { total: number } = { total: 0 };
  distributorStats: { total: number } = { total: 0 };
  revenueStats: { total: number } = { total: 0 };
  recentOrders: any[] = [];
  // products: any[] = [];
  productsLoading: boolean = true;


  selectedCartProduct: Product | null = null;
  customerId = localStorage.getItem('customerId') ?? '';

  constructor(private customerService: CustomerService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService,
    private productservice: ProductService,
    private inventoryService: InventoryService) {
    this.productForm = this.fb.group({
      productName: [''],
      productCode: [''],
      color: [''],
      category: [''],
      description: [''],
      unit: [''],
      price: [0],
      costPrice: [0],
      discount: [0],
      gst: [0],
      stock: [0],
      reorderLevel: [0],
      brand: [''],
      imageUrls: [''],
      distributorName: ['']
    });
  }

  ngOnInit(): void {
    this.customerEmail = localStorage.getItem('customerEmail');
    this.customerId = localStorage.getItem('customerId') || '';
    this.distributorId = localStorage.getItem('distributorId') || '';




    if (!this.customerId) {
      this.toastr.error('Customer ID not found in localStorage', 'Error');



      // console.error('No customerId found in localStorage');

      return;
    }


    this.loadDashboard();



  }



  getExpectedDeliveryDate(orderDate: string, distributorId: string): string {
    if (!orderDate || !distributorId) return '';

    const lead = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

    const date = new Date(orderDate);
    date.setDate(date.getDate() + lead);

    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }


  loadDashboard() {
    this.recentOrders = this.recentOrders.map(o => ({
      ...o,
      distributorId: o.distributorId || this.distributorId
    }));
    this.loading = true;
    this.http
      .get<DashboardResponse>(`http://localhost:5164/api/customers/dashboard/${this.customerId}`)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.loading = false;

          // ❌ DO NOT load products automatically
          // Products should load ONLY after clicking View Products
          this.products = [];

        },
        error: (err) => {
          // console.error('Error loading dashboard', err);
          this.loading = false;
          this.toastr.error(err.error || 'Failed to load dashboard', 'Error');

        }
      });





  }




  //   getExpectedDeliveryDate(orderDate: string, distributorId: string): string {
  //   const leadTime = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

  //   const date = new Date(orderDate);
  //   date.setDate(date.getDate() + leadTime);

  //   return date.toDateString();  // or format as you like
  // }
  connectDistributor(distributor: Distributor) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Send connection request to ${distributor.companyName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send request',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const body = {
        customerId: this.customerId,
        distributorId: distributor.distributorId
      };

      this.http.post('http://localhost:5164/api/customers/connect-distributor', body)
        .subscribe({
          next: (res: any) => {
            // alert(res);
            Swal.fire({
              icon: 'success',
              title: 'Request Sent',
              text: res
            });
            this.loadDashboard();
          },
          error: (err) => {
            //   console.error('Error connecting distributor', err);
            //   alert(err.error || 'Failed to send connection request');

            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: err.error || 'Failed to send request'
            });
          }
        });
    });
  }
  viewProducts(distributor: any) {


    localStorage.setItem("distributorId", distributor.distributorId);
    this.router.navigate(['/products', distributor.distributorId]);
  }


  openProductsForDistributor(distributorId: string) {
    this.distributorId = distributorId;
    localStorage.setItem('distributorId', distributorId);

    this.inventoryService.getStock(distributorId).subscribe(invList => {

      console.log('Inventory:', invList); // 🔍 verify once

      if (!invList || invList.length === 0) {
        this.products = [];
        this.activeTab = 'products';
        return;
      }

      const requests = invList.map(inv =>
        this.productService.getById(inv.productId)
      );

      forkJoin(requests).subscribe(products => {
        this.products = products.map((p, i) => ({
          ...p,
          currentStock:
            invList[i].currentStock ??
            invList[i].quantity ??
            invList[i].stock ??
            0
        }));

        this.activeTab = 'products';
      });
    });
  }






  // setActiveTab(tab: string) {
  //   this.activeTab = tab;
  // }

  onAddToCart(product: Product) {
    this.selectedCartProduct = product;   // store selected product
    this.activeTab = 'cart';              // switch to Add-to-Cart tab
  }
  goToProducts(product: Product) {
    this.selectedCartProduct = product;   // store selected product
    this.activeTab = 'cart';              // switch to Add-to-Cart tab
  }


  updateCart(newCart: any[]) {
    this.cart = [...newCart];
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }


  logout() {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.router.navigate(['/customer/login']);
      }

    });
  }

  switchToProducts() {
    this.activeTab = 'products';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  addToCart(product: any) {
    // console.log('Add to cart:', product);
    // Call your cart service here
    this.toastr.success(`${product.productName} added successfully`, 'Added to Cart');
  }
}