import { Component, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-distributor-orders',
  templateUrl: './distributor-orders.component.html',
  styleUrl: './distributor-orders.component.css'
})
export class DistributorOrdersComponent implements OnInit{
  distributorId = localStorage.getItem('distributorId') || '';
  orders: DistributorOrder[] = [];
  loading = false;
  statusFilter = 'All';
  statuses = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Rejected'];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.distributorId) return;
    this.loading = true;
    const status = this.statusFilter === 'All' ? undefined : this.statusFilter;
    this.orderService.getOrdersByDistributor(this.distributorId, status).subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; alert('Failed to load orders'); }
    });
  }

  // Action handlers:
  confirmOrder(order: DistributorOrder) {
    if (!confirm(`Confirm order ${order.id}? This will decrement product stocks.`)) return;
    this.updateStatus(order, 'Confirmed');
  }

  rejectOrder(order: DistributorOrder) {
    if (!confirm(`Reject order ${order.id}?`)) return;
    this.updateStatus(order, 'Rejected');
  }

  markShipped(order: DistributorOrder) {
    if (!confirm(`Mark order ${order.id} as Shipped?`)) return;
    this.updateStatus(order, 'Shipped');
  }

  markDelivered(order: DistributorOrder) {
    if (!confirm(`Mark order ${order.id} as Delivered?`)) return;
    this.updateStatus(order, 'Delivered');
  }

  updateStatus(order: DistributorOrder, status: string) {
    this.orderService.updateStatus(order.id, status).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Status updated');
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed update', err);
        // show server message if available
        if (err?.error) alert(err.error);
        else alert('Failed to update status');
      }
    });
  }

  // Utility to compute subtotal
  subtotal(o: DistributorOrder) {
    return o.products.reduce((s, p) => s + (p.price * p.quantity), 0);
  }

}
