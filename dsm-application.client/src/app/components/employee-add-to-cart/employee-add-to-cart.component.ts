import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Product } from '../../models/products.model';
import { EmployeeCartService } from '../../services/employee-cart.service';
import { OrderService } from '../../services/order.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Distributor } from '../../services/admin.service';
import { ProductService } from '../../services/product.service';
import { CustomerService } from '../../services/customer.service';
import { HttpClient } from '@angular/common/http';
import { DistributorService } from '../../services/distributor.service';
import { CustomerApiService, DistributorDto } from '../../services/customer-api.service';
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
  selector: 'app-employee-add-to-cart',
  templateUrl: './employee-add-to-cart.component.html',
  styleUrl: './employee-add-to-cart.component.css'
})
export class EmployeeAddToCartComponent implements OnInit {


  selectedCustomerId = '';
  customers: any[] = [];
  isProcessing = false;


  @Output() close = new EventEmitter<void>();


 popupMode: 'connect' | 'pending' = 'connect';
   popupMessage: string = '';
 
   isPlacingOrder = false;
 
   apiBaseUrl = environment.apiUrl.replace('/api', '');
 
   @Input() distributorId?: string;
   @Input() selectedProduct: Product | null = null;
   @Input() products: Product[] = [];
 
   @Output() cartUpdated = new EventEmitter<any[]>();
   @Output() goToProductsClicked = new EventEmitter<void>();
 
   filterProducts: Product[] = [];
   categories: string[] = [];
   @Input() employeeCart: { product: Product; quantity: number }[] = [];
 
cart = this.employeeCart;
 
 
   
   orderProducts: any[] = [];
 
   showPopup = false;
   selectedQuantity = 1;
 
 
   searchTerm = '';
   categoryFilter = '';
   stockFilter = '';
   minPriceFilter?: number;
   maxPriceFilter?: number;
 
   customerId!: string;
   customerPhoneNumber: any;
   customerEmail!: string;
   customerName: string = '';
 
   orderedDate: string = '';
   expectedDate: string = '';
 
   productForm: FormGroup;
   loading = true;
   dashboardData!: DashboardResponse;
   email: any;
   password: any;
   error: any;
   @Input() selectedCartProduct: Product | null = null;
 
   showConnectionPopup = false;
   notConnectedDistributors: DistributorDto[] = [];
   connectedDistributorIds: string[] = [];
 
   showCustomerDropdown = false;
 
   expectedDays: number = 1;

//    cart: { product: Product; quantity: number }[] = [];
// customerId = '';
 
 
   CART_KEY = "customer_order_products";
 
   activeTab: string = 'dashboard';
 
   showDropdown = false;
   customerDisplay = ""; // what is shown in input box
   expandedProduct: { [productId: string]: boolean } = {};
   IsActive?: boolean;
   constructor(
     private route: ActivatedRoute,
      private cartService: EmployeeCartService,
  private orderService: OrderService,
  private toastr: ToastrService,
     private fb: FormBuilder,
     private productService: ProductService,
     private router: Router,
     private customerService: CustomerService,  // 👈 ADD THIS
     private http: HttpClient,
     private distributorService: DistributorService,
     private customerApiService: CustomerApiService,
     private elRef: ElementRef,  // << add this
     private employeeCartService:EmployeeCartService,
     
 
   ) {
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
 
   // ---------------------------------------------------
   //  INIT
   // ---------------------------------------------------
ngOnInit(): void {
  this.cart = this.employeeCartService.getCart();
  this.selectedCustomerId = this.employeeCartService.getCustomer() || '';

   this.cart = this.employeeCartService.getCart();

  

  
  // 🟢 Load cart & customer
  this.cart = this.employeeCartService.getCart();
  this.selectedCustomerId = this.employeeCartService.getCustomer() || '';

  // 🟢 Compute expected delivery using distributor setting
  this.updateExpectedDate();
  this.cart = this.employeeCartService.getCart();

  // 2️⃣ Derive distributorId from cart
  if (this.cart.length && this.cart[0].product?.distributorId) {
    this.distributorId = this.cart[0].product.distributorId;
  }

 

  // 4️⃣ Load customer
   this.cart = this.employeeCartService.getCart();

  // Ordered date = today
  const today = new Date();
  this.orderedDate = today.toISOString().split('T')[0];

  // Load selected customer
  const savedCustomerId = this.employeeCartService.getCustomer();
  if (savedCustomerId) {
    this.selectedCustomerId = savedCustomerId;
    this.customerId = savedCustomerId;
    this.loadCustomerDetails(savedCustomerId);
  }

  // 🔥 Calculate expected delivery date
  this.updateExpectedDate();

}

private resolveDistributorId(): string | null {
  if (this.cart.length && this.cart[0]?.product?.distributorId) {
    return this.cart[0].product.distributorId;
  }
  return null;
}


loadCustomerDetails(customerId: string) {
  this.customerService.getCustomerById(customerId).subscribe({
    next: (customer) => {
      this.customerName = customer.customerName || customer.name;
      this.customerEmail = customer.email;
      this.customerPhoneNumber = customer.phoneNumber;

      // 👀 what user sees in UI
      this.customerDisplay = `${this.customerName} `;

      // Optional persistence
      localStorage.setItem('customerId', customerId);
      localStorage.setItem('customerName', this.customerName);
      localStorage.setItem('customerEmail', this.customerEmail);
      localStorage.setItem('customerPhoneNumber', this.customerPhoneNumber);
    },
    error: () => {
      this.toastr.error('Failed to load customer details');
    }
  });
}


increase(item: any) {
  item.quantity++;
  this.persistCart();
}

decrease(item: any) {
  if (item.quantity > 1) {
    item.quantity--;
    this.persistCart();
  }
}

removeFromCart(productId: string) {
  this.employeeCartService.remove(productId);
  this.cart = this.employeeCartService.getCart();
}

persistCart() {
  localStorage.setItem('employee_cart', JSON.stringify(this.cart));
}

 

   
//    getCustomer(): string {
//   return localStorage.getItem(this.CUSTOMER_KEY) || '';
// }

 connectDistributorFromCart(distributorId: string) {
   this.customerApiService
     .connectDistributor(this.customerId, distributorId)
     .subscribe({
       next: res => {
         this.toastr.success(res.message);
 
         this.notConnectedDistributors =
           this.notConnectedDistributors.filter(
             d => d.distributorId !== distributorId
           );
 
         if (this.notConnectedDistributors.length === 0) {
           this.showConnectionPopup = false;
         }
       },
       error: () => {
         this.toastr.error('Failed to send connection request');
       }
     });
 }
 
 
 
   connectAllDistributorsFromCart() {
   const calls = this.notConnectedDistributors.map(d =>
     this.customerApiService.connectDistributor(this.customerId, d.distributorId)
   );
 
   Promise.all(calls.map(c => c.toPromise()))
     .then(() => {
       this.toastr.success('Connection requests sent');
       this.notConnectedDistributors = [];
       this.showConnectionPopup = false;
     })
     .catch(() => {
       this.toastr.error('Some requests failed');
     });
 }
 
 
   checkDistributorConnections(): Promise<boolean> {
     return new Promise((resolve) => {
 
       this.customerApiService
         .getConnectedDistributors(this.customerId)
         .subscribe({
           next: (response: any) => {
 
             const acceptedIds: string[] = response.acceptedDistributors || [];
             const pendingIds: string[] = response.pendingDistributors || [];
 
             const pending: DistributorDto[] = [];
             const unconnected: DistributorDto[] = [];
 
             this.orderProducts.forEach(item => {
               const distId = item.product.distributorId;
               const companyName = item.product.distributorName;
 
               // ✅ Accepted → OK
               if (acceptedIds.includes(distId)) return;
 
               // 🟠 Pending → BLOCK
               // 🔴 PENDING
               this.popupMode = 'pending';
               this.popupMessage =
                 'Connection request is pending. Order cannot be placed until approved.';
               this.showConnectionPopup = true;
 
 
               // 🔴 Not connected → BLOCK
               unconnected.push({ distributorId: distId, companyName });
             });
 
             // 🔴 Priority 1: Pending popup
             if (pending.length > 0) {
               this.notConnectedDistributors = pending;
               this.popupMode = 'pending';
               this.popupMessage =
                 'Connection request is pending. Order cannot be placed until approved.';
               this.showConnectionPopup = true;
               resolve(false);
               return;
             }
 
             // 🔴 Priority 2: Connect popup
             if (unconnected.length > 0) {
               this.notConnectedDistributors = unconnected;
               this.popupMode = 'connect';
               this.popupMessage =
                 'Please connect to the following distributors before placing the order.';
               this.showConnectionPopup = true;
               resolve(false);
               return;
             }
 
             // ✅ All distributors accepted
             resolve(true);
           },
           error: () => {
             alert('Server not reachable');
             resolve(false);
           }
         });
     });
   }
 
 
 
   restoreProductTable() {
     if (!this.distributorId) return;
 
     const key = `${this.CART_KEY}_${this.distributorId}`;
     const saved = localStorage.getItem(key);
 
     if (saved) {
       this.orderProducts = JSON.parse(saved);
       this.cart = [...this.orderProducts];
     } else {
       this.orderProducts = [];
       this.cart = [];
     }
   }
 
   syncProductTable() {
     if (!this.distributorId) return;
 
     const key = `${this.CART_KEY}_${this.distributorId}`;
     this.cart = [...this.orderProducts];
 
     localStorage.setItem(key, JSON.stringify(this.orderProducts));
 
     // Optional global fallback
     localStorage.setItem("cart", JSON.stringify(this.cart));
 
     this.cartUpdated.emit(this.cart);
   }
 
 
 
   // syncCart() {
   //   this.cart = [...this.orderProducts];
   //   localStorage.setItem('cart', JSON.stringify(this.cart));
   //   this.cartUpdated.emit(this.cart);
   // }
 
 
   getCustomerInfo() {
     this.customerId = localStorage.getItem("customerId") ?? "";
     this.customerName = localStorage.getItem("customerName") ?? "";
     this.customerEmail = localStorage.getItem("customerEmail") ?? "";
     this.customerPhoneNumber = localStorage.getItem("customerPhoneNumber") ?? "";
   }
 
 
 
 
 
 
 
   toggleCustomerDropdown() {
     this.showCustomerDropdown = !this.showCustomerDropdown;
   }
 
 
 
   selectCustomer(c: any) {
     this.customerId = c.customerId;
     this.customerName = c.customerName;
     this.customerDisplay = `${c.customerName}  (${c.email})`;
 
     localStorage.setItem("customerId", this.customerId);
     localStorage.setItem("customerName", this.customerName);
     localStorage.setItem("customerEmail", c.email);
     localStorage.setItem("customerPhoneNumber", c.phoneNumber);
 
     this.showCustomerDropdown = false;
   }
 
 
 
   toggleDropdown() {
     this.showDropdown = !this.showDropdown;
   }
 
 
   toggleProductDropdown(productId: string) {
     this.expandedProduct[productId] = !this.expandedProduct[productId];
   }
 
   getImageUrl(imageUrls: string[] | string | null | undefined): string {
     if (!imageUrls) return 'assets/no-image.png';
 
     // Case 1: Already a string → return directly
     if (typeof imageUrls === 'string') {
       return this.apiBaseUrl + imageUrls;
     }
 
     // Case 2: Array → return first image
     if (Array.isArray(imageUrls) && imageUrls.length > 0) {
       return this.apiBaseUrl + imageUrls[0];
     }
 
     return 'assets/no-image.png';
   }
 
 
   onImgError(event: any) {
     event.target.src = 'assets/no-image.png';
   }
 
 
   modalProduct: Product | null = null;
 
   openProductModal(product: Product) {
     this.modalProduct = product;
   }
 
   closeProductModal() {
     this.modalProduct = null;
   }
 
 
 
 
 
   onCustomerChange() {
     const selected = this.customers.find(c => c.customerId === this.customerId);
 
     if (selected) {
       this.customerName = selected.customerName || selected.name;
       localStorage.setItem("customerId", this.customerId);
       localStorage.setItem("customerName", this.customerName);
       localStorage.setItem("customerEmail", this.customerPhoneNumber);
       localStorage.setItem("customerPhoneNumber", this.customerPhoneNumber);
     }
   }
 
 
   // call this when you want to fetch products 
 
   setActiveTab(tab: string) {
     this.activeTab = tab;
   }
 
   onAddToCart(product: Product) {
     this.selectedCartProduct = product;   // store selected product
     this.activeTab = 'cart';              // switch to Add-to-Cart tab
   }
   isActive(tab: string): boolean {
     return this.activeTab === tab;
   }
 
 
 
 
 
 
 
   ngOnChanges(changes: SimpleChanges): void {
 
     if (changes['distributorId'] && this.distributorId) {
 
 
       this.orderProducts = [];
       this.cart = [];
 
       this.restoreProductTable();        // Load cart of this distributor
       this.computeExpectedDateForDistributor(this.distributorId);
     }
 
     // if (changes['DistributorId'] && this.distributorId) {
     //   this.loadDashboard();
     // }  
     // if (changes['selectedProduct'] && this.selectedProduct) {
     //   this.selectedQuantity = 1;
     //   this.showPopup = true;
     // }
 
     // if (changes['products'] && this.products.length > 0) {
     //   this.filterProducts = [...this.products];
     //   this.extractCategories();}
 
 
 
     // if (changes['distributorId'] && this.distributorId) {
     // this.computeExpectedDateForDistributor(this.distributorId);}
 
 
 
 
 
 
   }
 
 
  loadDashboard() {
   this.customerApiService.getDashboard(this.customerId).subscribe({
     next: data => {
       this.dashboardData = data;
       this.loading = false;
 
       if (!data.isGlobal && data.products) {
         this.products = data.products;
       } else if (data.isGlobal && data.distributors?.length) {
         this.products = data.distributors.flatMap(
   (d: { products: Product[] }) => d.products || []
 );
 
       }
     },
     error: () => {
       this.loading = false;
       this.toastr.error('Failed to load dashboard');
     }
   });
 }
 
   // ---------------------------------------------------
   //  LOAD PRODUCTS
   // ---------------------------------------------------
   loadProducts(): void {
     if (!this.distributorId) return;
     this.loading = true;
 
     this.productService.getProductsByDistributor(this.distributorId).subscribe({
       next: (data: Product[]) => {
         this.products = data;
         this.filterProducts = data;
         this.extractCategories();
         this.loading = false;
 
         // ⭐ RESTORE HERE (not in ngOnInit)
         this.restoreProductTable();
       }
     });
   }
 
   extractCategories() {
     this.categories = Array.from(
       new Set(
         this.products
           .map(p => p.category)
           .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
       )
     );
   }
 
   // ---------------------------------------------------
   //  FILTERS
   // ---------------------------------------------------
   getFilteredProducts(): Product[] {
     let list = [...this.filterProducts];
     const t = this.searchTerm.toLowerCase();
 
     if (t) {
       list = list.filter(p =>
         p.productName.toLowerCase().includes(t) ||
         p.productCode.toLowerCase().includes(t) ||
         p.brand?.toLowerCase().includes(t) ||
         p.color?.toLowerCase().includes(t)
       );
     }
 
     if (this.categoryFilter) list = list.filter(p => p.category === this.categoryFilter);
     if (this.stockFilter === 'inStock') list = list.filter(p => p.currentStock > 10);
     else if (this.stockFilter === 'lowStock') list = list.filter(p => p.currentStock > 0 && p.currentStock <= 10);
     else if (this.stockFilter === 'outOfStock') list = list.filter(p => p.currentStock === 0);
 
 
     return list;
   }
 
   // ---------------------------------------------------
   //  POPUP + ADD TO CART
   // ---------------------------------------------------
   openAddToCart(product: Product) {

    
     this.selectedProduct = product;
     this.selectedQuantity = 1;
 
     const newDistId = product.distributorId;
     if (!newDistId) return;
 
     // ⭐ If distributor changes → clear product table
     if (this.distributorId !== newDistId) {
       this.orderProducts = [];     // Clear old distributor items
       this.cart = [];
     }
 
     // ⭐ Switch distributor
     this.distributorId = newDistId;
 
     // ⭐ Load ONLY that distributor’s products
     this.loadProducts();
 
     // ⭐ Load that distributor’s saved cart
     this.restoreProductTable();
 
     // ⭐ Update expected delivery date
     this.computeExpectedDateForDistributor(this.distributorId);
 
     this.showPopup = true;
   }
 
 
 
   increaseQty() {
     if (!this.selectedProduct) return;
     if (this.selectedQuantity < this.selectedProduct.currentStock) this.selectedQuantity++;
   }
 
   decreaseQty() {
     if (this.selectedQuantity > 1) this.selectedQuantity--;
   }
 
 
   // =========================
   //  DELIVERY DATE FUNCTIONS
   // =========================
 
   // Get lead time for a distributor
   getDistLeadTime(distributorId?: string): number {
     if (!distributorId) return 1; // default lead time if missing
     return Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;
   }
 
 
   // Compute delivery ETA for a product
   computeDeliveryDate(product: Product, orderDate: string): string {
     if (!orderDate) return "";
 
     const leadTime = this.getDistLeadTime(product.distributorId);
 
     const date = new Date(orderDate);
     date.setDate(date.getDate() + leadTime);
 
     return date.toISOString().split("T")[0];
   }
 
 
   computeExpectedDateForDistributor(distributorId: string) {
     if (!this.orderedDate) return;
 
     const leadTime = this.getDistLeadTime(distributorId);
 
     const date = new Date(this.orderedDate);
     date.setDate(date.getDate() + leadTime);
 
     this.expectedDate = date.toISOString().split("T")[0];
   }
 
 
   confirmAddToCart() {
     if (!this.selectedProduct) return;
 
     // ⭐ ensure correct distributor
     this.distributorId = this.selectedProduct.distributorId;
 
     // ⭐ Refresh product table according to distributor
     this.restoreProductTable();
 
     const eta = this.computeDeliveryDate(this.selectedProduct, this.orderedDate);
 
     const existing = this.orderProducts.find(
       x => x.product.productId === this.selectedProduct?.productId
     );
 
     if (existing) {
       existing.quantity += this.selectedQuantity;
       existing.deliveryEta = eta;
     } else {
       this.orderProducts.push({
         product: this.selectedProduct,
         quantity: this.selectedQuantity,
         deliveryEta: eta
       });
     }
 
     // ⭐ Store table under correct distributor
     this.syncProductTable();
 
     this.showPopup = false;
     this.selectedProduct = null;
     this.toastr.success("Added to cart");
   }
 
 
 
   closePopup() {
     this.showPopup = false;
     this.selectedProduct = null;
     this.selectedQuantity = 1;
   }
 
   // ---------------------------------------------------
   //  SYNC CART + TABLE
   // ---------------------------------------------------
 
   // ---------------------------------------------------
   //  MODIFY QUANTITY IN TABLE
   // ---------------------------------------------------
   increaseQuantity(item: any) {
     if (item.quantity >= item.product.stock) {
       this.toastr.error('Not enough stock available');
       return;
     }
     item.quantity++;
     this.syncProductTable();
   }
 
 
   decreaseQuantity(item: any) {
     if (item.quantity > 1) {
       item.quantity--;
       this.syncProductTable();
     }
   }
 
   removeFromOrder(productId: string) {
     this.orderProducts = this.orderProducts.filter(x => x.product.productId !== productId);
     this.syncProductTable();
   }
 
   // ---------------------------------------------------
   //  TOTAL
   // ---------------------------------------------------
   getTotal() {
     return this.orderProducts.reduce(
       (sum, i) => sum + i.quantity * (i.product.price || 0),
       0
     );
   }
 
   // ---------------------------------------------------
   //  DATES
   // ---------------------------------------------------
   updateExpectedDate() {
  if (!this.orderedDate) return;

  const distributorId = this.resolveDistributorId();
  if (!distributorId) return;

  const leadTime =
    Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

  const date = new Date(this.orderedDate);
  date.setDate(date.getDate() + leadTime);

  this.expectedDate = date.toISOString().split('T')[0];
}


 
 
   // ---------------------------------------------------
   //  RESET ORDER
   // ---------------------------------------------------
   resetOrder() {
  // 1️⃣ Clear UI state
  this.cart = [];
  this.orderProducts = [];

  // 2️⃣ Clear EmployeeCartService
  this.employeeCartService.clear();

  // 3️⃣ Clear distributor-specific cart
  if (this.distributorId) {
    const key = `${this.CART_KEY}_${this.distributorId}`;
    localStorage.removeItem(key);
  }

  // 4️⃣ Clear global cart fallback
  localStorage.removeItem('cart');
  localStorage.removeItem('employee_cart');

  // 5️⃣ Reset dates
  const today = new Date();
  this.orderedDate = today.toISOString().split('T')[0];
  this.expectedDate = '';

  // 6️⃣ Notify parent (if needed)
  this.cartUpdated.emit([]);

  this.toastr.success('Cart cleared');
}

 
   // ---------------------------------------------------
   //  PLACE ORDER
   // ---------------------------------------------------
   // placeOrder() {
 
 private getDistributorIdFromCart(): string | null {
  return this.cart.length
    ? this.cart[0].product.distributorId ?? null
    : null;
}

   
 placeOrder() {
  if (!this.selectedCustomerId) {
    this.toastr.warning('Select customer');
    return;
  }
 
  if (!this.cart.length) {
    this.toastr.warning('Cart is empty');
    return;
  }
 
  const distributorId = this.getDistributorIdFromCart();
 
  const payload = {
    customerId: this.selectedCustomerId,
    distributorId: distributorId,
    specialDiscountPercent: 0,
    expectedDelivery: this.expectedDate,
    orderedDate: this.orderedDate,
 
    products: this.cart.map(c => ({
      productId: c.product.productId!,
      quantity: c.quantity
    }))
  };
 
  this.orderService.createOrderByCollector(payload).subscribe({
    next: () => {
      this.toastr.success('Order placed successfully');
      this.employeeCartService.clear();
      this.cart = [];
      this.close.emit();
    },
    error: (err) => {
      this.toastr.error(err.error?.message || 'Order failed');
    }
  });
}
 


 
 
 
 
   updateCart(newCart: any[]) {
     this.cart = [...newCart];
     this.orderProducts = [...newCart];
     localStorage.setItem('cart', JSON.stringify(this.cart));
   }
 
 
 
 
 
 
 
   loadCustomerName(id: string) {
     this.customerService.getCustomerById(id).subscribe({
       next: (customer) => {
         this.customerName = customer.customerName || customer.name;
         localStorage.setItem('customerName', this.customerName);
       }
     })
   }
 
 
   loadCustomerEmail(id: string) {
     this.customerService.getCustomerById(id).subscribe({
       next: (customer) => {
         this.customerEmail = customer.email ;
         localStorage.setItem('customerEmail', this.customerEmail);
       }
     })
   }
 
 
   viewProducts(distributor: any) {
 
     localStorage.setItem("distributorId", distributor.distributorId);
 
     // Reset internal table immediately
     this.orderProducts = [];
     this.cart = [];
 
 
     this.router.navigate(['/products', distributor.distributorId]);
     // localStorage.setItem("distributorId", distributor.distributorId);
     // this.router.navigate(['/products', distributor.distributorId]);
   }
 
 
 
   // ---------------------------------------------------
   //  NAVIGATE TO PRODUCTS
   // ---------------------------------------------------
   goToProducts() {
     this.goToProductsClicked.emit();
   }
 
 
 
   goToConnections() {
     this.showConnectionPopup = false;
     this.router.navigate(['/customer/distributors']);
   }
 
 
 }