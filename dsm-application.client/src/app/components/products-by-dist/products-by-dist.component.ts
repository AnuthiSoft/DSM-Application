import { Component, OnInit } from '@angular/core';
import { Product, ProductService } from '../../services/product.service';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-products-by-dist',
  templateUrl: './products-by-dist.component.html',
  styleUrl: './products-by-dist.component.css'
})
export class ProductsByDistComponent implements OnInit {

  distributorId!: string;
  products: Product[] = [];
  loading = true;

    cart: { product: Product; quantity: number }[] = [];
  customerId = localStorage.getItem('customerId') || '';


  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,  private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
    this.loadProducts();
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
  
  addToCart(product: Product) {
    const found = this.cart.find(c => c.product.productId === product.productId);
    if (found) found.quantity++;
    else this.cart.push({ product, quantity: 1 });
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

    const payload = {
      customerId: this.customerId,
      distributorId: this.distributorId,
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
