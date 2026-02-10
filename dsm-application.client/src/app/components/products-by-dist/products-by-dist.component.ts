import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/products.model';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { CustomerApiService } from '../../services/customer-api.service';
import { environment } from '../../../environments/environment';
import { CartService } from '../../services/cart.service';

// import { environment } from '../../../environments/environment';
// import { Product } from '../../services/customer-api.service';

@Component({
  selector: 'app-products-by-dist',
  templateUrl: './products-by-dist.component.html',
  styleUrl: './products-by-dist.component.css'
})
export class ProductsByDistComponent implements OnInit, OnChanges, AfterViewInit {
  apiBaseUrl = environment.apiUrl.replace('/api', '');



  @Input() distributorId?: string;  // ✅ accept from parent
  @Input() customerId!: string;
  @Input() products: Product[] = [];
  // distributorId!: string;
  // products: Product[] = [];
  loading = true;
  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;


  sortBy: string = 'name';


  cart: { product: Product; quantity: number }[] = [];
  // customerId = localStorage.getItem('customerId') || '';
  showPopup = false;
  selectedProduct: Product | null = null;
  selectedQuantity = 1;
  color = '';
  searchTerm: string = '';
  minPriceFilter?: number;
  maxPriceFilter?: number;
  categoryFilter: string = '';
  stockFilter: string = '';
  categories: string[] = [];

  filterProducts: Product[] = [];

  distributorFilter: string = '';
  distributors: string[] = [];

previousQtyMap: { [productId: string]: number } = {};


  @Output() addToCartClicked = new EventEmitter<Product>();

  @Input() connectedDistributors: { distributorId: string; name: string }[] = [];



  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router,
    private customerApiService: CustomerApiService, private cartService: CartService
  ) {
    // Build product form
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      productCode: ['', Validators.required],
      color: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      unit: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      gst: [0, [Validators.min(0)]],
      stock: [0, [Validators.min(0)]],
      reorderLevel: [0, [Validators.min(0)]],
      brand: [''],
      imageUrls: [''],
    });
  }
  ngOnInit(): void {

  this.route.paramMap.subscribe(params => {
    const distId = params.get('distributorId');

    console.log('Route distributorId =', distId);  // Debug

    if (!distId) {
      this.loading = false;
      return;
    }

    this.distributorId = distId;

    // Save for other screens
    localStorage.setItem('distributorId', distId);
    localStorage.setItem('DistributorId', distId);

    // Load products for this distributor
    this.loadProducts(distId);
  });

  this.extractConnectedDistributors();
  this.loadPreviousQuantities();
}

ngAfterViewInit(): void {
  this.initCarousels();
}

loadProducts(distributorId: string): void {
  this.loading = true;

  this.productService.getProductsByDistributor(distributorId).subscribe({
    next: (data: Product[]) => {
      this.products = data.map(p => ({
        ...p,
        imageUrls: Array.isArray(p.imageUrls)
          ? p.imageUrls
          : p.imageUrls ? [p.imageUrls] : []
      }));

      this.filterProducts = [...this.products];
      this.extractCategories();
      this.loading = false;

      setTimeout(() => this.initCarousels(), 0);
    },
    error: () => {
      this.loading = false;
    }
  });
}



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products']) {

      this.products = this.products.map(p => ({
        ...p,
        imageUrls: Array.isArray(p.imageUrls)
          ? p.imageUrls
          : p.imageUrls ? [p.imageUrls] : []
      }));

      this.filterProducts = [...this.products];
      this.loading = false;

      // 🔥 IMPORTANT
      setTimeout(() => this.initCarousels(), 0);
    }

    this.extractCategories();
  }
  initCarousels(): void {
    const elements = document.querySelectorAll('.carousel');

    elements.forEach(el => {
      bootstrap.Carousel.getOrCreateInstance(el, {
        interval: 3000,
        ride: 'carousel',
        pause: 'hover',
        wrap: true
      });
    });
  }




  // this.productService.getAllProducts().subscribe({
  //   next: (data) => {
  //     this.products = data.map(p => ({
  //       ...p,
  //       imageUrls: Array.isArray(p.imageUrls)
  //         ? p.imageUrls
  //         : p.imageUrls ? [p.imageUrls] : []
  //     }));

  //   const savedCart = localStorage.getItem('cart');
  //   if (savedCart) {
  //     this.cart = JSON.parse(savedCart);
  //   }
  // }


  extractDistributors() {
    this.distributors = Array.from(
      new Set(
        this.products
          .map(p => p.distributorName)
          .filter(d => !!d) as string[]      // 👈 force cast
      )
    );
  }



  onDistributorChange(distributorId: string) {
    if (!distributorId) {
      this.filterProducts = [...this.products];
      return;
    }



    this.filterProducts = this.products.filter(
      p => p.distributorId === distributorId
    );
  }

  extractConnectedDistributors() {
    this.connectedDistributors = Array.from(
      new Map(
        this.products
          .filter(
            (p): p is Product & { distributorId: string; distributorName: string } =>
              !!p.distributorId && !!p.distributorName
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









  // call this when you want to fetch products
  //   loadProducts(): void {
  //     if (!this.distributorId) return;
  //     this.loading = true;

  //     this.productService.getProductsByDistributor(this.distributorId).subscribe({
  //       next: (data: Product[]) => {


  // 🔥 Normalize imageUrls so template never breaks
  // data = data.map(p => ({
  //   ...p,
  //   imageUrls: Array.isArray(p.imageUrls)
  //     ? p.imageUrls
  //     : p.imageUrls
  //       ? [p.imageUrls]  // convert string → array
  //       : []             // no images
  // }));


  //         this.products = data;
  //         this.filterProducts = data;
  //         this.extractCategories();
  //         this.loading = false;
  //       },
  //       error: (err) => {
  //         console.error('Failed to load products', err);
  //         this.loading = false;
  //       }
  //     });
  //   }



  getFullImageUrl(img: string) {
    if (!img) return 'assets/no-image.png';

    // 🔥 ALWAYS go through backend image API
    return `${environment.apiUrl}/images/${img}`;
  }





 openAddToCart(product: Product) {

  const customerId = localStorage.getItem('customerId');
  if (!customerId) return;

  const key = `cart_customer_${customerId}`;

  let cart = JSON.parse(localStorage.getItem(key) || '[]');

  const existing = cart.find(
    (c: any) => c.product.productId === product.productId
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product: product,
      quantity: 1
    });
  }

  localStorage.setItem(key, JSON.stringify(cart));

  // 🔥 Redirect to cart
  this.router.navigate(['/add-to-cart']);
}



  extractCategories() {
    this.categories = Array.from(
      new Set(
        this.products
          .map(p => p.category)
          .filter((c): c is string => !!c) // ✅ ensures only strings remain
      )
    );
  }



  onSmartSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filterProducts = [...this.products];
      return;
    }

    // Parse common keywords for price ranges
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    // Match "under 500", "below 200", "less than 100"
    const underMatch = term.match(/(under|below|less than)\s*(\d+)/);
    if (underMatch) maxPrice = Number(underMatch[2]);

    // Match "above 100", "over 200", "greater than 300"
    const aboveMatch = term.match(/(above|over|greater than)\s*(\d+)/);
    if (aboveMatch) minPrice = Number(aboveMatch[2]);

    // Match "between 100 and 300"
    const betweenMatch = term.match(/between\s*(\d+)\s*(and|-|to)\s*(\d+)/);
    if (betweenMatch) {
      minPrice = Number(betweenMatch[1]);
      maxPrice = Number(betweenMatch[3]);
    }

    // Remove numeric/price words for better text matching
    const cleanedTerm = term
      .replace(/(under|below|less than|above|over|greater than|between|and|to|under|over)\s*\d+/g, "")
      .replace(/\d+/g, "")
      .trim();

    this.filterProducts = this.products.filter(p => {
      const nameMatch = p.productName?.toLowerCase().includes(cleanedTerm);
      const categoryMatch = p.category?.toLowerCase().includes(cleanedTerm);
      const colorMatch = p.color?.toLowerCase().includes(cleanedTerm);
      const brandMatch = p.brand?.toLowerCase().includes(cleanedTerm);

      // Price filtering
      let priceMatch = true;
      if (minPrice !== null && p.price < minPrice) priceMatch = false;
      if (maxPrice !== null && p.price > maxPrice) priceMatch = false;

      // Stock keyword detection
      const stockMatch =
        (term.includes("in stock") && p.currentStock > 0) ||
        (term.includes("out of stock") && p.currentStock === 0) ||
        (!term.includes("stock") && true);

      return (
        (nameMatch || categoryMatch || colorMatch || brandMatch) &&
        priceMatch &&
        stockMatch
      );
    });
  }

  onColorChange(color: string) {
    this.color = color;

    if (!color) {
      this.filterProducts = [...this.products];
      return;
    }

    this.filterProducts = this.products.filter(
      p => p.color?.toLowerCase().includes(color.toLowerCase())
    );
  }

  onCategoryChange(category: string) {
    this.categoryFilter = category;

    if (!category || category.trim() === '') {
      this.filterProducts = [...this.products];
      return;
    }

    this.filterProducts = this.products.filter(
      p => p.category?.toLowerCase() === category.toLowerCase()
    );
  }



  filteredProducts() {
    this.filterProducts = this.products.filter(p => {
      const matchesSearch =
        p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;

      let matchesStock = true;
      if (this.stockFilter === 'inStock') matchesStock = p.currentStock > 10;
      else if (this.stockFilter === 'lowStock') matchesStock = p.currentStock > 0 && p.currentStock <= 10;
      else if (this.stockFilter === 'outOfStock') matchesStock = p.currentStock === 0;

      const matchesColor =
        !this.color || p.color.toLowerCase().includes(this.color.toLowerCase());

      const matchesMinPrice = this.minPriceFilter == null || p.price >= this.minPriceFilter;
      const matchesMaxPrice = this.maxPriceFilter == null || p.price <= this.maxPriceFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock &&
        matchesColor &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }

  // 🧩 Apply filters
  applyFilters() {
    this.filterProducts = this.products.filter(p => {
      const matchesSearch = this.searchTerm
        ? p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.productCode?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      const matchesCategory = this.categoryFilter
        ? p.category === this.categoryFilter
        : true;

      const matchesStock =
        this.stockFilter === 'inStock'
          ? p.currentStock > 10
          : this.stockFilter === 'lowStock'
            ? p.currentStock > 0 && p.currentStock <= 10
            : this.stockFilter === 'outOfStock'
              ? p.currentStock === 0
              : true;

      const matchesPrice =
        (!this.minPriceFilter || p.price >= this.minPriceFilter) &&
        (!this.maxPriceFilter || p.price <= this.maxPriceFilter);

      return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    });
  }




  // addToCart(product: Product) {
  //   const found = this.cart.find(c => c.product.productId === product.productId);
  //   if (found) found.quantity++;
  //   else this.cart.push({ product, quantity: 1 });
  // }
  // ✅ Confirm add to cart
  // confirmAddToCart() {


  //   if (!this.selectedProduct) return;

  //   const existing = this.cart.find(c => c.product.productId === this.selectedProduct?.productId);

  //   if (existing) {
  //     existing.quantity += this.selectedQuantity;
  //   } else {
  //     this.cart.push({
  //       product: this.selectedProduct,
  //       quantity: this.selectedQuantity
  //     });
  //   }
  //   console.log("Add to cart clicked");
  //   // ✅ save updated cart
  //   localStorage.setItem('cart', JSON.stringify(this.cart));

  //   this.showPopup = false;
  //   this.selectedProduct = null;
  // }


  // ❌ Cancel popup
  closePopup() {
    this.showPopup = false;
    this.selectedProduct = null;
  }



  getTotal() {
    return this.cart.reduce((s, c) => s + (c.product.price * c.quantity), 0);
  }






openAddPopup(prod: Product) {
  //  Do not open popup if stock is zero
  if (!prod.currentStock || prod.currentStock <= 0) {
    return;
  }

  this.selectedProduct = prod;
  this.selectedQuantity =
    this.previousQtyMap[prod.productId as string] ?? 1;

  // Limit to available stock
  if (this.selectedQuantity > prod.currentStock) {
    this.selectedQuantity = prod.currentStock;
  }

  this.showPopup = true;
}




  popupIncrease() {
    if (!this.selectedProduct) return;
    if (this.selectedQuantity < this.selectedProduct.currentStock) {
      this.selectedQuantity++;
    }
  }

  popupDecrease() {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

onPopupQtyChange(value: number): void {
  if (!value || value < 1) {
    this.selectedQuantity = 1;
    return;
  }

  if (this.selectedProduct && value > this.selectedProduct.currentStock) {
    this.selectedQuantity = this.selectedProduct.currentStock;
  }
}



 confirmAddToCart() {

  if (!this.selectedProduct) return;

  const customerId = localStorage.getItem('customerId');
  if (!customerId) return;

  const key = `cart_customer_${customerId}`;

  let cart = JSON.parse(localStorage.getItem(key) || '[]');

  const existing = cart.find(
    (c: any) => c.product.productId === this.selectedProduct?.productId
  );

  if (existing) {
    existing.quantity += this.selectedQuantity;
  } else {
    cart.push({
      product: this.selectedProduct,
      quantity: this.selectedQuantity
    });
  }

  localStorage.setItem(key, JSON.stringify(cart));

  // Close popup
  this.showPopup = false;
  this.selectedProduct = null;

  // 🔥 Redirect to cart
  this.router.navigate(['/add-to-cart']);
}



  /* Helper function for TypeScript/JavaScript */
  /* Add this to your component TypeScript file if needed */
  getStockClass(stock: number): string {
    if (stock > 10) return 'stock-high';
    if (stock > 0) return 'stock-low';
    return 'stock-out';
  }
  clearSearch() {
    this.searchTerm = '';
    this.filterProducts = [...this.products];
  }
  applySort() {
    switch (this.sortBy) {
      case 'priceLow':
        this.filterProducts.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        this.filterProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        this.filterProducts.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        break;
      case 'stock':
        this.filterProducts.sort((a, b) =>
          (b.currentStock ?? 0) - (a.currentStock ?? 0)
        );
        break;
    }
  }



  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.categoryFilter ||
      this.stockFilter ||
      this.color ||
      this.distributorFilter ||
      this.minPriceFilter ||
      this.maxPriceFilter
    );
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.stockFilter = '';
    this.color = '';
    this.distributorFilter = '';
    this.minPriceFilter = undefined;
    this.maxPriceFilter = undefined;
    this.filterProducts = [...this.products];
  }
  getDistributorName(id: string): string {
    return this.connectedDistributors.find(d => d.distributorId === id)?.name || '';
  }

  clearDistributorFilter() {
    this.distributorFilter = '';
  }
  getStockFilterLabel(stock: string) {
    return stock === 'inStock'
      ? 'In Stock'
      : stock === 'lowStock'
        ? 'Low Stock'
        : stock === 'outOfStock'
          ? 'Out of Stock'
          : '';
  }

  clearStockFilter() {
    this.stockFilter = '';
  }

  getStockText(stock: number) {
    return stock > 10 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';
  }

  getStockPercentage(current: number, max: number = 100) {
    return Math.min(100, (current / max) * 100);
  }
  get totalStock(): number {
    return this.products.reduce((sum, p) => sum + (p.currentStock || 0), 0);
  }
  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/no-image.png';
  }
  getCartQty(prod: Product): number {
    const item = this.cart.find(c => c.product.productId === prod.productId);
    return item ? item.quantity : 1;
  }

  increaseQty(prod: Product) {
    const item = this.cart.find(c => c.product.productId === prod.productId);
    if (item && item.quantity < prod.currentStock) item.quantity++;
  }

  decreaseQty(prod: Product) {
    const item = this.cart.find(c => c.product.productId === prod.productId);
    if (item && item.quantity > 1) item.quantity--;
  }
   loadPreviousQuantities() {
  if (!this.customerId) return;

  this.orderService
    .getLastBoughtQuantities(this.customerId)
    .subscribe((res: { [productId: string]: number }) => {
      this.previousQtyMap = res;
    });
}




}
