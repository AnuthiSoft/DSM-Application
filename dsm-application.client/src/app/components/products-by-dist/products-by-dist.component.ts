import { Component, Input, OnInit } from '@angular/core';
import {  ProductService } from '../../services/product.service';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/products.model';
// import { Product } from '../../services/customer-api.service';
 
@Component({
  selector: 'app-products-by-dist',
  templateUrl: './products-by-dist.component.html',
  styleUrl: './products-by-dist.component.css'
})
export class ProductsByDistComponent implements OnInit {
 @Input() distributorId?: string;  // ✅ accept from parent
  @Input() customerId!: string;
  @Input() products: Product[] = [];
  // distributorId!: string;
  // products: Product[] = [];
  loading = true;
 
 
    cart: { product: Product; quantity: number }[] = [];
  // customerId = localStorage.getItem('customerId') || '';
    showPopup = false;
  selectedProduct: Product | null = null;
  selectedQuantity = 1;
 
 
  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,  private orderService: OrderService
  ) {}
 
  ngOnInit(): void {
  if (this.products && this.products.length > 0) {
    this.loading = false; // Products already passed from parent
  } else {
    this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
    this.loadProducts();
  }
}
 
    // call this when you want to fetch products
  loadProducts(): void {
    if (!this.distributorId) return;
 
    this.loading = true;
 
    this.productService.getProductsByDistributor(this.distributorId).subscribe({
      next: (data: Product[]) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
      }
    });
  }
    // 🛒 When user clicks Add to Cart
  openAddToCartPopup(product: Product) {
    this.selectedProduct = product;
    this.selectedQuantity = 1;
    this.showPopup = true;
  }
    // ➕ Increase quantity
  increaseQty() {
    if (this.selectedProduct && this.selectedQuantity < (this.selectedProduct.stock || 1))
      this.selectedQuantity++;
  }
    // ➖ Decrease quantity
  decreaseQty() {
    if (this.selectedQuantity > 1) this.selectedQuantity--;
  }
 
  // addToCart(product: Product) {
  //   const found = this.cart.find(c => c.product.productId === product.productId);
  //   if (found) found.quantity++;
  //   else this.cart.push({ product, quantity: 1 });
  // }
    // ✅ Confirm add to cart
  confirmAddToCart() {
    if (!this.selectedProduct) return;
 
    const existing = this.cart.find(c => c.product.productId === this.selectedProduct!.productId);
    if (existing) {
      existing.quantity += this.selectedQuantity;
    } else {
      this.cart.push({ product: this.selectedProduct, quantity: this.selectedQuantity });
    }
 
    this.showPopup = false;
    this.selectedProduct = null;
    alert('Product added to cart');
  }
 
  // ❌ Cancel popup
  closePopup() {
    this.showPopup = false;
    this.selectedProduct = null;
  }
 
  removeFromCart(productId?: string) {
    this.cart = this.cart.filter(c => c.product.productId !== productId);
  }
 
  getTotal() {
    return this.cart.reduce((s, c) => s + (c.product.price * c.quantity), 0);
  }
 
 placeOrder() {
  if (!this.customerId) return alert('Please login as customer first');
  if (this.cart.length === 0) return alert('Cart is empty');
 
  // Get distributorId from the first product in cart
  const distributorId = this.cart[0]?.product?.distributorId;
  if (!distributorId) return alert('Distributor not found for selected product');
 
  const payload = {
    customerId: this.customerId,
    distributorId: distributorId, // automatically taken
    products: this.cart.map(c => ({
      productId: c.product.productId,
      productName: c.product.productName,
      price: c.product.price,
      quantity: c.quantity
    }))
  };
 
  this.orderService.placeOrder(payload).subscribe({
    next: (res) => {
      alert(res.message || 'Order placed');
      this.cart = [];
    },
    error: (err) => {
      console.error('Order failed', err);
      alert(err?.error || 'Order failed');
    }
  });
}
 
}