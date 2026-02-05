import { Component, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
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
import { CustomerApiService, CustomerDashboardResponse } from '../../services/customer-api.service';
import { Distributor } from '../../services/admin.service';
import { CartService } from '../../services/cart.service';
 
@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css'
})
export class CustomerDashboardComponent {
  
  customerEmail: string | null = '';
  customerName: string | null = '';
  dashboardData!: CustomerDashboardResponse;
  loading = true;
  status: string = '';
  distributorId: string = '';
  products: Product[] = [];
  cartCount = 0;
  expectedDays: number = 1;
 
  orderedDate: string = '';
  expectedDate: string = '';
  productForm: FormGroup;
  @Input() selectedProduct: Product | null = null;
  @Output() cartUpdated = new EventEmitter<any[]>();
  cart: any[] = [];
  // Sidebar state
  isSidebarCollapsed: boolean = false;
  isMobileMenuOpen = false;
  isDarkTheme = false;
  activeTab: string = 'dashboard';
  currentDate: Date = new Date();
  orderStats: { total: number } = { total: 0 };
  productStats: { total: number } = { total: 0 };
  distributorStats: { total: number } = { total: 0 };
  revenueStats: { total: number } = { total: 0 };
  recentOrders: any[] = [];
  // products: any[] = [];
  productsLoading: boolean = true;
  connectedDistributors: { distributorId: string; name: string }[] = [];
 
 
  selectedCartProduct: Product | null = null;
  customerId = localStorage.getItem('customerId') ?? '';
 
  constructor(private customerService: CustomerService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private customerApiService: CustomerApiService,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService,
    private productservice: ProductService,
    private inventoryService: InventoryService, public cartService: CartService) {
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
    // Load sidebar state
    const savedSidebarState = localStorage.getItem('customerSidebarCollapsed');
    if (savedSidebarState !== null) {
      this.isSidebarCollapsed = savedSidebarState === 'true';
    }
 
    // Load active tab
    const savedTab = localStorage.getItem('customerActiveTab');
    this.activeTab = savedTab ? savedTab : 'dashboard';
 
    // Check screen width
    this.checkScreenWidth();
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count; // 🔥 auto updates UI
    });
 
    this.customerEmail = localStorage.getItem('customerEmail');
    this.customerName = localStorage.getItem('customerName'); // ✅ FIXED
 
    this.customerId = localStorage.getItem('customerId') || '';
    this.distributorId = localStorage.getItem('distributorId') || '';
    this.updateCartBadge();
 
 
 
 
    if (!this.customerId) {
      this.toastr.error('Customer ID not found in localStorage', 'Error');
 
 
 
      // console.error('No customerId found in localStorage');
 
      return;
    }
 
 
    this.loadDashboard();
 
 
 
  }
 
 
  //  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenWidth();
  }
 
  checkScreenWidth() {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = false;
    }
  }
 
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('customerSidebarCollapsed', this.isSidebarCollapsed.toString());
  }
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
 
  closeMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }
 
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.isDarkTheme) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }
 
 setActiveTab(tab: string) {
  this.activeTab = tab;
 
  if (tab === 'orders' && this.ordersNeedRefresh) {
    const customerOrdersComponent = document.querySelector('app-customer-orders') as any;
    if (customerOrdersComponent?.loadOrders) {
      customerOrdersComponent.loadOrders();
    }
    this.ordersNeedRefresh = false;
  }
}
 
 
  refreshOrders() {
  // If user is currently viewing the Orders tab, reload immediately
  if (this.activeTab === 'orders') {
    const customerOrdersComponent = document.querySelector('app-customer-orders') as any;
    if (customerOrdersComponent?.loadOrders) {
      customerOrdersComponent.loadOrders();
    }
  }
 
  // If user is NOT on orders, next time they open Orders tab → reload
  this.ordersNeedRefresh = true;
}
ordersNeedRefresh: boolean = false;
 
 
 
  getExpectedDeliveryDate(orderDate: string, distributorId: string): string {
    if (!orderDate || !distributorId) return '';
 
    const lead = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;
 
    const date = new Date(orderDate);
    date.setDate(date.getDate() + lead);
 
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }
 
 
  loadDashboard() {
    this.loading = true;
 
    // 🔹 1. LOAD DASHBOARD (distributors + products)
    this.customerApiService.getDashboard(this.customerId).subscribe({
      next: (data: CustomerDashboardResponse) => {
        this.dashboardData = data;
 
        // ✅ CONNECTED DISTRIBUTORS
        this.connectedDistributors = data.distributors
          .filter(d =>
            d.distributor.status === 'Accepted' ||
            d.distributor.status === 'Connected'
          )
 
          .map(d => ({
            distributorId: d.distributor.distributorId,
            name: d.distributor.companyName || d.distributor.name || 'Distributor'
          }));
 
        // ✅ PRODUCTS FROM CONNECTED DISTRIBUTORS
        this.products = data.distributors
          .filter(d =>
            d.distributor.status === 'Accepted' ||
            d.distributor.status === 'Connected'
          )
 
          .flatMap(d => d.products || []);
 
        // ✅ DISTRIBUTOR + PRODUCT COUNTS
        this.distributorStats.total = this.connectedDistributors.length;
        this.productStats.total = this.products.length;
 
        // 🔹 2. LOAD ORDERS (THIS FIXES YOUR ISSUE)
        this.orderService.getOrdersByCustomer(this.customerId).subscribe(orders => {
 
          // ✅ TOTAL ORDERS
          this.orderStats.total = orders.length;
 
          // ✅ TOTAL SPENT
          this.revenueStats.total = orders.reduce(
            (sum: number, o: any) => sum + (o.totalAmount || 0),
            0
          );
 
          // ✅ RECENT ORDERS (LATEST 5)
          this.recentOrders = orders
            .sort(
              (a: any, b: any) =>
                new Date(b.orderDate).getTime() -
                new Date(a.orderDate).getTime()
            )
            .slice(0, 5);
        });
 
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load dashboard');
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
    }).then(result => {
      if (!result.isConfirmed) return;
 
      this.customerApiService
        .connectDistributor(this.customerId, distributor.distributorId)
        .subscribe({
          next: (res: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Request Sent',
              text: res?.message || 'Connection request sent'
            });
            this.loadDashboard();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: err?.error || 'Failed to send request'
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
 
  // onAddToCart(product: Product) {
  //   let cart = JSON.parse(localStorage.getItem('cart') || '[]');
 
  //   const existing = cart.find(
  //     (c: any) => c.product.productId === product.productId
  //   );
 
  //   if (existing) {
  //     existing.quantity += 1;   // ✅ increment ONLY when user clicks +
  //   } else {
  //     cart.push({ product, quantity: 1 }); // ✅ FIRST TIME = 1
  //   }
 
  //   localStorage.setItem('cart', JSON.stringify(cart));
  //   this.updateCartBadge();
  // }
  onAddToCart(product: Product) {
    const raw = localStorage.getItem('cart');
 
    let cart: any[] = [];
 
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cart = Array.isArray(parsed) ? parsed : [];
    } catch {
      cart = [];
    }
 
    const existing = cart.find(
      c => c.product.productId === product.productId
    );
 
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
 
    localStorage.setItem('cart', JSON.stringify(cart));
    this.updateCartBadge();
  }
 
 
 
  // updateCartBadge() {
  //   const raw = localStorage.getItem('cart');
 
  //   let cart: any[] = [];
 
  //   try {
  //     const parsed = raw ? JSON.parse(raw) : [];
  //     cart = Array.isArray(parsed) ? parsed : [];
  //   } catch {
  //     cart = [];
  //   }
 
  //   this.cartCount = cart.reduce(
  //     (sum: number, c: any) => sum + (c?.quantity || 0),
  //     0
  //   );
  // }
  updateCartBadge() {
    const raw = localStorage.getItem('cart');
 
    let cart: any[] = [];
 
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cart = Array.isArray(parsed) ? parsed : [];
    } catch {
      cart = [];
    }
 
    this.cartCount = cart.reduce(
      (sum: number, c: any) => sum + (c?.quantity || 0),
      0
    );
  }
 
 
  goToProducts(product: Product) {
    this.selectedCartProduct = product;   // store selected product
    this.activeTab = 'cart';              // switch to Add-to-Cart tab
  }
 
 
  updateCart(newCart: any[]) {
    this.cart = [...newCart];
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
 
  logout(): void {
    Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      allowOutsideClick: false,
 
      // 🌙 Dark / Light theme support
      background: getComputedStyle(document.documentElement)
        .getPropertyValue('--card-bg'),
      color: getComputedStyle(document.documentElement)
        .getPropertyValue('--text-color'),
 
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
 
        // ✅ CLEAR CUSTOMER UI STATE
        localStorage.removeItem('customerActiveTab');
        localStorage.removeItem('customerSidebarCollapsed');
 
        // (optional auth cleanup if used later)
        localStorage.removeItem('token');
        localStorage.removeItem('customerId');
 
        // ✅ SUCCESS MESSAGE
        Swal.fire({
          html: `
            <div style="
              width:72px;
              height:72px;
              border-radius:50%;
              background: rgba(82,196,26,0.12);
              display:flex;
              align-items:center;
              justify-content:center;
              margin:0 auto 14px;
            ">
              <div style="
                width:48px;
                height:48px;
                border-radius:50%;
                background:#52c41a;
                display:flex;
                align-items:center;
                justify-content:center;
                box-shadow: 0 6px 16px rgba(82,196,26,0.35);
              ">
                <i class="fas fa-check" style="color:white;font-size:22px;"></i>
              </div>
            </div>
       
            <h2 style="margin:0 0 6px;font-size:20px;">Logged out</h2>
            <p style="margin:0;font-size:14px;opacity:.8;">
              You have been logged out successfully
            </p>
          `,
 
          width: 360,
          padding: '1.5rem 1.5rem 1.8rem',
 
          showConfirmButton: false,
          timer: 1300,
          timerProgressBar: true,
 
          allowOutsideClick: false,
          allowEscapeKey: false,
 
          backdrop: 'rgba(0,0,0,0.55)',
 
          background: getComputedStyle(document.documentElement)
            .getPropertyValue('--card-bg'),
          color: getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color')
        });
 
        setTimeout(() => {
          this.router.navigate(['/customer/login']);
        }, 1300);
      }
    });
  }
  switchToProducts() {
    this.activeTab = 'products';
  }
 
 
  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
 
  addToCart(product: any) {
    // console.log('Add to cart:', product);
    // Call your cart service here
    this.toastr.success(`${product.productName} added successfully`, 'Added to Cart');
  }
  openCart() {
    this.updateCartBadge();   // 🔥 ADD THIS
    this.activeTab = 'cart';   // ✅ OPEN CART TAB
  }
 
  goToTab(tab: string) {
    this.setActiveTab(tab);
  }
 
}
 