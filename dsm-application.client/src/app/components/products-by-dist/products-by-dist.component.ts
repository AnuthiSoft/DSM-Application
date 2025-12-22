import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {  ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/products.model';
import { environment } from '../../../environments/environment.prod';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { environment } from '../../../environments/environment';
// import { Product } from '../../services/customer-api.service';

@Component({
  selector: 'app-products-by-dist',
  templateUrl: './products-by-dist.component.html',
  styleUrl: './products-by-dist.component.css'
})
export class ProductsByDistComponent implements OnInit {
  apiBaseUrl = environment.apiUrl.replace('/api', ''); // ✅ remove '/api' for file access


  // ⭐ FIX IMAGE PATH FOR CUSTOMER SIDE
  getFullImageUrl(img: string) {
    if (!img) return "assets/no-image.png";

    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }

    return this.apiBaseUrl + img;
  }
  @Input() distributorId?: string;  // ✅ accept from parent
  @Input() customerId!: string;
  @Input() products: Product[] = [];
  // distributorId!: string;
  // products: Product[] = [];
  loading = true;
  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;



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



  @Output() addToCartClicked = new EventEmitter<Product>();




   constructor(
     private route: ActivatedRoute,
      private productService: ProductService,
      private fb: FormBuilder,
      private orderService: OrderService,
      private router: Router
    ) {
      // Build product form
      this.productForm = this.fb.group({
        productName: ['', Validators.required],
        productCode: ['', Validators.required],
        color:['', Validators.required],
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

  

this.extractDistributors();


    this.customerId = localStorage.getItem('CustomerId') || '';

  // ✅ Load existing cart from localStorage
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    this.cart = JSON.parse(savedCart);
  }

   this.cart = JSON.parse(localStorage.getItem('cart') ?? '[]');
  // existing code
  if (this.products && this.products.length > 0) {
    this.loading = false;
    this.filterProducts = this.products;
    this.extractCategories();
  } else {
    this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
    this.loadProducts();
  }

  
}


extractDistributors() {
  this.distributors = Array.from(
    new Set(
      this.products
        .map(p => p.distributorName)
        .filter(d => !!d) as string[]      // 👈 force cast
    )
  );
}



onDistributorChange(distributor: string) {
  
  this.distributorFilter = distributor;

  if (!distributor || distributor.trim() === '') {
    this.filterProducts = [...this.products];
    return;
  }

  // Filter locally
  this.filterProducts = this.products.filter(
    p => p.distributorName?.toLowerCase() === distributor.toLowerCase()
  );
}



  // call this when you want to fetch products 
  loadProducts(): void {
    if (!this.distributorId) return;
    this.loading = true;

    this.productService.getProductsByDistributor(this.distributorId).subscribe({
      next: (data: Product[]) => {


        // 🔥 Normalize imageUrls so template never breaks
      data = data.map(p => ({
        ...p,
        imageUrls: Array.isArray(p.imageUrls)
          ? p.imageUrls
          : p.imageUrls
          ? [p.imageUrls]  // convert string → array
          : []             // no images
      }));


        this.products = data;
        this.filterProducts = data;
        this.extractCategories();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
      }
    });
  }


 getImageUrl(imageUrls: string[] | string | null | undefined): string {
  if (!imageUrls) return 'assets/no-image.png';

  if (typeof imageUrls === 'string') {
    return this.apiBaseUrl + imageUrls;
  }

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return this.apiBaseUrl + imageUrls[0];
  }

  return 'assets/no-image.png';
}



  openAddToCart(product: Product) {
  this.addToCartClicked.emit(product);


    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Check if product exists
  const existing = cart.find((c: any) => c.product.productId === product.productId);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }

  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));

   localStorage.setItem("selectedProduct", JSON.stringify(product));

  // Navigate to Add-to-Cart page
 this.router.navigate(['/customer/add-to-cart']);
}


AddtoCart(product: Product) {

  // Load existing cart
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Check if product exists
  const existing = cart.find((c: any) => c.product.productId === product.productId);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }

  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));

  // Navigate to Add-to-Cart page
   this.router.navigate(['/customer/add-to-cart']);
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
        (term.includes("in stock") && p.stock > 0) ||
        (term.includes("out of stock") && p.stock === 0) ||
        (!term.includes("stock") && true);

      return (
        (nameMatch || categoryMatch || colorMatch || brandMatch) &&
        priceMatch &&
        stockMatch
      );
    });
  }

  onColorChange(color: string) {

    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.color = color;
    this.productService.searchByColor(distributorId, color).subscribe({
      next: data => this.filterProducts = data,
      error: err => console.error('Error filtering by color:', err)
    });
  }

  onCategoryChange(category: string) {
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.categoryFilter = category;

    // 🔥 If "All Categories" selected → show all products
    if (!category || category.trim() === '') {
      this.filterProducts = [...this.products];
      return;
    }

    // Otherwise, filter by category
    this.productService.searchByCategory(distributorId, category).subscribe({
      next: data => this.filterProducts = data,
      error: err => console.error('Error filtering by categories:', err)
    });
  }
  filteredProducts() {
    this.filterProducts = this.products.filter(p => {
      const matchesSearch =
        p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;

      let matchesStock = true;
      if (this.stockFilter === 'inStock') matchesStock = p.stock > 10;
      else if (this.stockFilter === 'lowStock') matchesStock = p.stock > 0 && p.stock <= 10;
      else if (this.stockFilter === 'outOfStock') matchesStock = p.stock === 0;

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
          ? p.stock > 10
          : this.stockFilter === 'lowStock'
            ? p.stock > 0 && p.stock <= 10
            : this.stockFilter === 'outOfStock'
              ? p.stock === 0
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
  confirmAddToCart() {

    
  if (!this.selectedProduct) return;

    const existing = this.cart.find(c => c.product.productId === this.selectedProduct?.productId);

  if (existing) {
    existing.quantity += this.selectedQuantity;
  } else {
    this.cart.push({
      product: this.selectedProduct,
      quantity: this.selectedQuantity
    });
  }
console.log("Add to cart clicked");
  // ✅ save updated cart
  localStorage.setItem('cart', JSON.stringify(this.cart));

    this.showPopup = false;
    this.selectedProduct = null;
  }


  // ❌ Cancel popup
  closePopup() {
    this.showPopup = false;
    this.selectedProduct = null;
  }



  getTotal() {
    return this.cart.reduce((s, c) => s + (c.product.price * c.quantity), 0);
  }



}