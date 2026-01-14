import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/products.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    this.emitCount(); // ✅ initialize on app load
  }

  private getCart(): any[] {
    const raw = localStorage.getItem('cart');

    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveCart(cart: any[]) {
    localStorage.setItem('cart', JSON.stringify(cart));
    this.emitCount(); // 🔥 notify immediately
  }

  addWithQuantity(product: any, qty: number) {
    const cart = this.getCart();

    const existing = cart.find(
      c => c.product.productId === product.productId
    );

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ product, quantity: qty });
    }

    this.saveCart(cart); // 🔥 triggers badge update
  }

  private emitCount() {
    const count = this.getCart().reduce((s, c) => s + (c.quantity || 0), 0);
    this.cartCountSubject.next(count);
  }

  getCount(): number {
    return this.getCart().reduce((s, c) => s + c.quantity, 0);
  }
}