import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { HttpClient } from '@angular/common/http';
import { DistributorService } from '../../services/distributor.service';
import { HostListener } from '@angular/core';
import { Product } from '../../models/products.model';
import { ToastrService } from 'ngx-toastr';

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
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.css']
})
export class AddToCartComponent implements OnInit, OnChanges {


  apiBaseUrl = environment.apiUrl.replace('/api', '');

  @Input() distributorId?: string;
  @Input() selectedProduct: Product | null = null;
  @Input() products: Product[] = [];

  @Output() cartUpdated = new EventEmitter<any[]>();
  @Output() goToProductsClicked = new EventEmitter<void>();

  filterProducts: Product[] = [];
  categories: string[] = [];

  cart: { product: Product; quantity: number }[] = [];
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


  showCustomerDropdown = false;

  expectedDays: number = 1;


  CART_KEY = "customer_order_products";

  activeTab: string = 'dashboard';
  customers: any[] = [];

  showDropdown = false;
  customerDisplay = ""; // what is shown in input box
  expandedProduct: { [productId: string]: boolean } = {};
  IsActive?: boolean;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private customerService: CustomerService,  // 👈 ADD THIS
    private http: HttpClient,
    private distributorService: DistributorService,
    private elRef: ElementRef,  // << add this
    private toastr: ToastrService

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



    this.route.paramMap.subscribe(params => {
      const newDistributorId = params.get('distributorId');

      if (newDistributorId) {
        this.distributorId = newDistributorId;

        // Load products for this distributor
        this.loadProducts();

        // Load THIS distributor’s saved cart
        this.restoreProductTable();

        // Recompute expected date
        this.computeExpectedDateForDistributor(this.distributorId);
      }
    });



    this.distributorId = localStorage.getItem('distributorId') ?? '';
    if (this.distributorId) {
      this.computeExpectedDateForDistributor(this.distributorId);
    }

    this.restoreProductTable();

    this.getCustomerInfo();



    //console.log("Stored Orders:", localStorage.getItem("cart"));


    //   const savedProducts = localStorage.getItem('products');
    // if (savedProducts) {
    //   this.products = JSON.parse(savedProducts);
    //   this.filterProducts = [...this.products];
    //   this.extractCategories();
    // }

    this.customerId = localStorage.getItem('customerId') ?? '';
    if (this.customerId) {
      this.loadCustomerName(this.customerId);
      this.loadCustomerEmail(this.customerId);

    }


    const id = localStorage.getItem("customerId");

    this.customerService.getCustomerById(id!).subscribe(c => {
      console.log(c.email);
      console.log(c.phoneNumber);
    });





    // console.log(this.customerId);
    // console.log(this.customerName);
    // console.log(this.customerEmail);
    // console.log(this.customerPhoneNumber);

    this.expectedDays = Number(localStorage.getItem("expectedDays")) || 1;
    this.orderedDate = new Date().toISOString().split('T')[0];
    this.updateExpectedDate();

    const saved = localStorage.getItem('cart');
    if (saved) {
      this.cart = JSON.parse(saved);
      this.orderProducts = [...this.cart];
    }
    this.distributorId = localStorage.getItem('distributorId') ?? '';
    //  this.distributorId = this.route.snapshot.paramMap.get('distributorId') ?? '';

    // if (this.distributorId) {
    //   this.loadDashboard();
    // } else {
    //   console.warn("Distributor ID missing from route");
    // }
    // ✅ Load existing cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }



    const savedProduct = localStorage.getItem("selectedProduct");
    if (savedProduct) {
      this.selectedProduct = JSON.parse(savedProduct);
      this.selectedQuantity = 1;
      this.showPopup = true;  // open popup automatically
    }


    //  this.cart = JSON.parse(localStorage.getItem('cart') ?? '[]');
    // existing code
    if (this.products && this.products.length > 0) {
      this.loading = false;
      this.filterProducts = this.products;
      this.extractCategories();
    } else {
      this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
      this.loadProducts();
    }




    this.customerService.getCustomerById(this.customerId).subscribe(res => {
      console.log("Full Customer Data:", res);
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

    //     const saved = localStorage.getItem("customer_order_products");
    // if (saved) {
    //   this.orderProducts = JSON.parse(saved);
    //   this.cart = [...this.orderProducts];
    //   this.loading = true;
    // }
    this.http
      .get<DashboardResponse>(`http://localhost:5164/api/customers/dashboard/${this.customerId}`)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.loading = false;

          // ✅ If non-global customer, load products directly
          if (!data.isGlobal && data.products) {
            this.products = data.products;
          }

          // ✅ If global customer, gather products from each distributor
          else if (data.isGlobal && data.distributors?.length) {
            this.products = data.distributors.flatMap(d => d.products || []);
          }

          console.log('Loaded products:', this.products);
        },
        error: (err) => {
          console.error('Error loading dashboard', err);
          this.loading = false;
        },
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
    if (this.stockFilter === 'inStock') list = list.filter(p => p.stock > 10);
    else if (this.stockFilter === 'lowStock') list = list.filter(p => p.stock > 0 && p.stock <= 10);
    else if (this.stockFilter === 'outOfStock') list = list.filter(p => p.stock === 0);


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
    if (this.selectedQuantity < this.selectedProduct.stock) this.selectedQuantity++;
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
    if (!this.distributorId) return;
    this.computeExpectedDateForDistributor(this.distributorId);
  }


  // ---------------------------------------------------
  //  RESET ORDER
  // ---------------------------------------------------
  // resetOrder() {
  //   this.cart = [];
  //   this.orderProducts = [];
  //   localStorage.removeItem('cart');
  //   this.cartUpdated.emit([]);
  // }

  // ---------------------------------------------------
  //  PLACE ORDER
  // ---------------------------------------------------
  // placeOrder() {
  //   if (!this.customerId) return alert('Please login first');
  //   if (this.orderProducts.length === 0) return alert('Cart is empty');

  //   const groupedOrders: { [key: string]: any[] } = {};

  //   this.orderProducts.forEach(item => {
  //     const distId = item.product.distributorId;

  //     if (!groupedOrders[distId]) {
  //       groupedOrders[distId] = [];
  //     }

  //     groupedOrders[distId].push(item);
  //   });

  //   const distributorIds = Object.keys(groupedOrders);

  //   distributorIds.forEach(distId => {
  //     const items = groupedOrders[distId];

  //     // ⭐ Compute expected delivery PER distributor
  //     const leadTime = this.getDistLeadTime(distId);

  //     const expectedDeliveryDate = (() => {
  //       const d = new Date(this.orderedDate);
  //       d.setDate(d.getDate() + leadTime);
  //       return d.toISOString().split("T")[0];
  //     })();

  //     const payload = {
  //       customerId: this.customerId,
  //       distributorId: distId,
  //       products: items.map(c => ({
  //         productId: c.product.productId,
  //         productName: c.product.productName,
  //         price: c.product.price,
  //         quantity: c.quantity,
  //         distributorName: c.distributorName,
  //         distributorId: c.product.distributorId,  // must NOT be null

  //         deliveryEta: c.deliveryEta,
  //         leadTime: c.leadTimeValue
  //       })),

  //       // ⭐ FIXED — Now correct per distributor
  //       expectedDeliveryDate: expectedDeliveryDate,

  //       orderedDate: this.orderedDate
  //     };

  //     this.orderService.placeOrder(payload).subscribe({
  //       next: () => console.log(`Order placed for Distributor ${distId}`),
  //       error: err => console.error(`Failed for Distributor ${distId}`, err)
  //     });
  //   });



  //   this.toastr.success(
  //     'Orders placed successfully for all distributors!',
  //     'Order Placed'
  //   );

  //   // give toastr time to show
  //   setTimeout(() => {
  //     this.resetOrder();
  //     this.router.navigate(['/customer/orders']);
  //   }, 800);
  // }

  
  // ---------------------------------------------------
  // PLACE ORDER
  // ---------------------------------------------------
  placeOrder() {
    // FINAL STOCK CHECK
    for (const item of this.orderProducts) {
      if (item.quantity > item.product.stock) {
        this.toastr.error(
          `Only ${item.product.stock} available for ${item.product.productName}`
        );
        return;
      }
    }

    if (!this.customerId) {
      this.toastr.warning('Please login first');
      return;
    }

    if (this.orderProducts.length === 0) {
      this.toastr.warning('Cart is empty');
      return;
    }

    const payload = {
      customerId: this.customerId,
      distributorId: this.distributorId,
      products: this.orderProducts.map(i => ({
        productId: i.product.productId,
        quantity: i.quantity,
        price: i.product.price
      })),
      orderedDate: this.orderedDate,
      expectedDeliveryDate: this.expectedDate
    };

    this.orderService.placeOrder(payload).subscribe({
      next: () => {
        this.toastr.success('Order placed successfully');
        setTimeout(() => {
          this.resetOrder();
          this.router.navigate(['/customer/orders']);
        }, 800);
      },
      error: () => this.toastr.error('Order failed')
    });
  }

  resetOrder() {
    this.orderProducts = [];
    this.cart = [];
    localStorage.removeItem(`${this.CART_KEY}_${this.distributorId}`);
    this.cartUpdated.emit([]);
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
        this.customerEmail = customer.email || customer.Email;
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
}