import { Injectable } from '@angular/core';
import { Product } from '../models/products.model';

interface CartItem {
  product: Product;
  quantity: number;
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeCartService {

  private CART_KEY = 'employee_cart';
  private CUSTOMER_KEY = 'employee_cart_customer';

  // --------------------
  // CART
  // --------------------
  getCart(): CartItem[] {
    return JSON.parse(localStorage.getItem(this.CART_KEY) || '[]');
  }

  add(product: Product, qty: number = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.product.productId === product.productId);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ product, quantity: qty });
    }

    this.save(cart);
  }

  update(cart: CartItem[]) {
    this.save(cart);
  }

  remove(productId: string) {
    const cart = this.getCart().filter(
      i => i.product.productId !== productId
    );
    this.save(cart);
  }

  clear() {
    localStorage.removeItem(this.CART_KEY);
    localStorage.removeItem(this.CUSTOMER_KEY);
  }

  getTotal(): number {
    return this.getCart().reduce(
      (sum, i) => sum + i.quantity * i.product.price,
      0
    );
  }

  getCount(): number {
    return this.getCart().reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  // --------------------
  // CUSTOMER (EMPLOYEE FLOW)
  // --------------------
  setCustomer(customerId: string) {
    localStorage.setItem(this.CUSTOMER_KEY, customerId);
  }

  getCustomer(): string | null {
    return localStorage.getItem(this.CUSTOMER_KEY);
  }

  // --------------------
  // INTERNAL
  // --------------------
  private save(cart: CartItem[]) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
  }



clearCustomer() {
  localStorage.removeItem(this.CUSTOMER_KEY);
}

  
}
