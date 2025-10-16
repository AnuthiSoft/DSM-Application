import { Component } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
 styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent {
  orders: Order[] = [];
  loading = true;
  customerId = localStorage.getItem('customerId') || '';
  distributorId = localStorage.getItem('distributorId') || '';
  
  

  constructor(private orderService: OrderService,   private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.customerId) return;
    this.loading = true;

    this.orderService.getOrdersByCustomer(this.customerId).subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load customer orders', err);
        this.loading = false;
      }
    });
  }
  //   // Navigate to order details page
  // viewOrderDetails(orderId: string): void {
  //   this.router.navigate(['/orders', orderId]);
  // }

  // Cancel an order
  cancelOrder(orderId: string): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        alert('Order canceled successfully');
        this.loadOrders(); // refresh
      },
      error: (err: any) => {
        console.error('Failed to cancel order', err);
        alert('Failed to cancel order');
      }
    });
  }

  // Reorder a previous order
  reorder(orderId: string): void {
    this.orderService.reorder(orderId).subscribe({
      next: () => {
        alert('Order placed successfully');
        this.loadOrders();
      },
      error: (err: any) => {
        console.error('Failed to reorder', err);
        alert('Failed to place reorder');
      }
    });
  }

  // Count completed orders
  getCompletedCount(): number {
    return this.orders.filter(o => o.status === 'Delivered').length;
  }

  // Count pending orders
  getPendingCount(): number {
    return this.orders.filter(o => o.status === 'Pending').length;
  }

  // Calculate total spent
  getTotalSpent(): number {
    return this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

}
