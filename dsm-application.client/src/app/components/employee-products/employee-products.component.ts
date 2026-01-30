import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { ToastrService } from 'ngx-toastr';
import { Product } from '../../models/products.model';
import * as bootstrap from 'bootstrap';
import { ApiService } from '../../services/api.service';
import { CustomerService } from '../../services/customer.service';
import { ReturnApiService } from '../../services/return-api.service';
import { Router } from '@angular/router';
import { EmployeeCartService } from '../../services/employee-cart.service';


@Component({
  selector: 'app-employee-products',
  templateUrl: './employee-products.component.html',
  styleUrl: './employee-products.component.css',
})
export class EmployeeProductsComponent {

  
  apiBaseUrl = environment.apiUrl.replace('/api', '');

  products: Product[] = [];
  filterProducts: Product[] = [];
  loading = true;

 
customers: any[] = [];
selectedCustomerId = '';
@Output() addToCart = new EventEmitter<void>();





  // 🔐 EMPLOYEE-ONLY CART
  // employeeCart: { product: Product; quantity: number }[] = [];

  // Filters
  searchTerm = '';
  distributorFilter = '';
  stockFilter = '';
  connectedDistributors: { distributorId: string; name: string }[] = [];

  distributorId = '';
  customerId = '';

    @Input() product!: Product;
  @Input() mode: 'customer' | 'employee' = 'customer';

  @Output() add = new EventEmitter<Product>();

  addClicked() {
    this.add.emit(this.product);
  }

  showAddPopup = false;
popupProduct!: Product;
popupQty = 1;




  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private toastr: ToastrService,
    private api: ApiService,
      private customerService: CustomerService,private returnApi: ReturnApiService,
       private router: Router ,
        private employeeCartService: EmployeeCartService 

  ) {}

   

  ngOnInit(): void {
  this.distributorId = localStorage.getItem('distributorId') || '';

  // ✅ Load products immediately
  this.loadProducts();

  // ✅ Load customers separately (for order placement)
    this.loadCustomers(); // ⭐ NEW

  //   const saved = localStorage.getItem('employeeCart');
  // this.employeeCart = saved ? JSON.parse(saved) : [];
}

onAddToCartClick(product: Product) {
  // optional: store product if needed
  this.addToCart.emit();
}

loadCustomers() {
  this.customerService.getCustomersForCashCollector().subscribe({
    next: res => {
      this.customers = res;
    },
    error: () => {
      this.toastr.error('Failed to load customers');
    }
  });
}





openAddPopup(product: Product) {
  this.popupProduct = product;
  this.popupQty = 1;
  this.showAddPopup = true;
}

closeAddPopup() {
  this.showAddPopup = false;
}
get selectedCustomerName(): string {
  return this.customers.find(c => c.customerId === this.selectedCustomerId)?.name || '';
}


  ngAfterViewInit(): void {
    setTimeout(() => this.initCarousels(), 0);
  }

goToEmployeeCart() {
  // 1️⃣ Cart empty check
  if (!this.employeeCartService.getCount()) {
    this.toastr.info('Cart is empty');
    return;
  }

  // 2️⃣ Customer selected check
  if (!this.employeeCartService.getCustomer()) {
    this.toastr.warning('Please select a customer');
    return;
  }

  // 3️⃣ Emit event instead of routing
  this.addToCart.emit();
}













loadProducts(): void {
  if (!this.distributorId) {
    this.toastr.error('Distributor not found');
    return;
  }

  this.loading = true;

  this.productService.getProductsByDistributor(this.distributorId).subscribe({
    next: (data) => {
      this.products = data.map(p => ({
        ...p,
        imageUrls: Array.isArray(p.imageUrls)
          ? p.imageUrls
          : p.imageUrls ? [p.imageUrls] : []
      }));

      this.filterProducts = [...this.products];
      this.extractConnectedDistributors();
      this.loading = false;
    },
    error: () => {
      this.toastr.error('Failed to load products');
      this.loading = false;
    }
  });
}



  extractConnectedDistributors() {
  this.connectedDistributors = Array.from(
    new Map(
      this.products
        .filter(
          (p): p is Product & { distributorId: string; distributorName: string } =>
            typeof p.distributorId === 'string' &&
            typeof p.distributorName === 'string'
        )
        .map(p => [
          p.distributorId,
          {
            distributorId: p.distributorId,
            name: p.distributorName
          }
        ])
    ).values()
  );
}


  initCarousels(): void {
    document.querySelectorAll('.carousel').forEach(el => {
      bootstrap.Carousel.getOrCreateInstance(el, {
        interval: 3000,
        pause: 'hover',
        wrap: true
      });
    });
  }

  getFullImageUrl(img?: string): string {
    return img ? `${environment.apiUrl}/images/${img}` : 'assets/no-image.png';
  }

  // 🛒 EMPLOYEE CART
// addToCart(product: Product) {
//   const existing = this.employeeCart.find(
//     c => c.product.productId === product.productId
//   );

//   if (existing) {
//     existing.quantity++;
//   } else {
//     this.employeeCart.push({ product, quantity: 1 });
//   }

//   // 🔕 no routing here
// }

confirmAddToCart() {

  // 🚫 CUSTOMER NOT SELECTED → SHOW MESSAGE ONLY
  if (!this.employeeCartService.getCustomer()) {
    this.toastr.warning('Please select a customer first');
    return;
  }

  // ✅ Add product with selected quantity
  this.employeeCartService.add(this.popupProduct, this.popupQty);

  // 🎉 Success message
  this.toastr.success('Added to cart');

  // ❌ CLOSE POPUP
  this.closeAddPopup();
}




get cartCount() {
  return this.employeeCartService.getCount();
}



//   getCartTotal() {
//     return this.employeeCart.reduce(
//       (sum, c) => sum + c.product.price * c.quantity,
//       0
//     );
//   }

//   placeOrder() {
//   if (!this.selectedCustomerId) {
//     this.toastr.warning('Please select a customer');
//     return;
//   }


//   if (!this.employeeCart.length) {
//     this.toastr.warning('No products selected');
//     return;
//   }

//   const payload = {
//     customerId: this.selectedCustomerId,   // ✅ CORRECT CUSTOMER
//     distributorId: this.distributorId,
//     specialDiscountPercent: 0,
//     products: this.employeeCart.map(c => ({
//       productId: c.product.productId,
//       quantity: c.quantity
//     }))
//   };


//   this.orderService.createOrderByCollector(payload).subscribe({
//     next: () => {
//       this.toastr.success('Order placed successfully');
//       this.employeeCart = [];
//     },
//     error: () => {
//       this.toastr.error('Order failed');
//     }
//   });
// }


  // 🔍 FILTERS
  onSmartSearch() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filterProducts = this.products.filter(p =>
      p.productName?.toLowerCase().includes(term) ||
      p.productCode?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term)
    );
  }

  onDistributorChange(id: string) {
    this.filterProducts = id
      ? this.products.filter(p => p.distributorId === id)
      : [...this.products];
  }

  onCustomerChange() {
  if (!this.selectedCustomerId) return;
  this.employeeCartService.setCustomer(this.selectedCustomerId);
}



  onStockFilterChange() {
  if (this.stockFilter === 'inStock') {
    this.filterProducts = this.products.filter(p => p.currentStock > 0);
  } else if (this.stockFilter === 'outOfStock') {
    this.filterProducts = this.products.filter(p => p.currentStock === 0);
  } else {
    this.filterProducts = [...this.products];
  }
}
}


