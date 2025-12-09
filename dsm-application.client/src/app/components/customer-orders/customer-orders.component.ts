import { Component } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // ✅ Fix: Import HttpClient
import Swal from 'sweetalert2';


@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent {
  orders: Order[] = [];
  loading = true;
  selectedOrder: any = null;

  customerId = localStorage.getItem('customerId') || '';
  distributorId = localStorage.getItem('distributorId') || '';



  constructor(private orderService: OrderService, private router: Router, private http: HttpClient  ) { }

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

  // ✅ FIXED View Details for order
  viewOrderDetails(id: string) {
    this.http.get<any>(`http://localhost:5164/api/orders/${id}`).subscribe({
      next: res => {
        const order = res;

      Swal.fire({
        title: `Order Summary`,
        html: `
          <div style="text-align:left; font-size:16px;">
            <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
            <p><strong>Total Discount:</strong> ₹${order.totalDiscount}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>

            <hr>

            <p><strong>Special Discount (%):</strong> ${order.specialDiscountPercent}%</p>
            <p><strong>Quantity Discount (%):</strong> ${order.quantityDiscountPercent}%</p>
            <p><strong>Price Discount (%):</strong> ${order.priceDiscountPercent}%</p>
            <p><strong>Total Discount (%):</strong> ${order.totalDiscountPercent}%</p>
          </div>
        `,
        icon: 'info',
        width: 400,
        confirmButtonText: 'Close'
      });
    },
    error: err => {
      console.error("Error loading order:", err);
      Swal.fire('Error', 'Unable to load order details', 'error');
    }
  });
}

}

