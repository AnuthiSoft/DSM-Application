import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  customerId = localStorage.getItem('customerId') || '';

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    if (!this.customerId) return;
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getOrdersByCustomer(this.customerId).subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

}
