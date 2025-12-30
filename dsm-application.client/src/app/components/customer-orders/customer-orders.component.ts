import { Component } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // ✅ Fix: Import HttpClient
import { ToastrService } from 'ngx-toastr';
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



  constructor(private orderService: OrderService, private router: Router, private http: HttpClient, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.customerId) return;
    this.loading = true;

    this.orderService.getOrdersByCustomer(this.customerId).subscribe({
      next: (data) => {
        this.orders = data.map(order => ({
          ...order,
          expectedDeliveryDate: this.computeExpectedDelivery(order.orderedDate, order.distributorId)
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load orders", err);
        this.loading = false;
      }
    });
  }

  computeExpectedDelivery(orderDate: any, distributorId: string): string {
    if (!orderDate || !distributorId) return "";

    const leadTime = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

    // Convert Date OR string to Date object
    const date = new Date(orderDate);

    date.setDate(date.getDate() + leadTime);

    return date.toISOString().split("T")[0];
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
        this.toastr.success('Order cancelled successfully');
        this.loadOrders(); // refresh
      },
      error: (err: any) => {
        console.error('Failed to cancel order', err);
        this.toastr.error('Failed to cancel order');
      }
    });
  }

  // Reorder a previous order
  reorder(orderId: string): void {
    this.orderService.reorder(orderId).subscribe({
      next: () => {
        this.toastr.success('Order placed successfully');
        this.loadOrders();
      },
      error: (err: any) => {
        console.error('Failed to reorder', err);
        this.toastr.error('Failed to place reorder');
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

      <p style="color:green">
        <strong>Product Discount:</strong>
        - ₹${order.totalDiscount}
      </p>

      <p style="color:green">
        <strong>General Discount:</strong>
        - ₹${order.generalDiscount || 0}
      </p>

      <hr>

      <p style="font-size:17px">
        <strong>Total Amount:</strong>
        ₹${order.totalAmount}
      </p>


            <hr>

            <p><strong>Special Discount (%):</strong> ${order.specialDiscountPercent}%</p>
            <p><strong>Quantity Discount (%):</strong> ${order.quantityDiscountPercent}%</p>
            <p><strong>Price Discount (%):</strong> ${order.priceDiscountPercent}%</p>
            <p><strong>Total Discount (%):</strong> ${order.totalDiscountPercent}%</p>
          </div>
        `,
          icon: 'info',
          width: 300,
          confirmButtonText: 'Close'
        });
      },
      error: err => {
        console.error("Error loading order:", err);
        this.toastr.error('Unable to load order details');
      }
    });
  }
}
