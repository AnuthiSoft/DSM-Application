import { Component, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee-orders',
  templateUrl: './employee-orders.component.html',
  styleUrl: './employee-orders.component.css'
})
export class EmployeeOrdersComponent implements OnInit {
  employeeId = localStorage.getItem('employeeId') || '';
  orders: DistributorOrder[] = [];
  loading = false;

     apiBaseUrl = environment.apiUrl.replace('/api', ''); // ✅ remove '/api' for file access
  
  // Payment modal state
  showPaymentModal = false;
  selectedOrder: DistributorOrder | null = null;
  paymentMethod: string = 'Cash';
  collectedAmount: number = 0;

  constructor(
  private http: HttpClient, 
  private orderService: OrderService
) {}
  ngOnInit(): void {
    console.log('Employee ID:', this.employeeId);
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.employeeId) return;
    this.loading = true;
    this.orderService.getOrdersByEmployee(this.employeeId).subscribe({
      next: (data) => { 
        this.orders = data; 
        this.loading = false; 
      },
      error: (err) => { 
        console.error(err); 
        this.loading = false; 
      }
    });
  }

  subtotal(order: DistributorOrder) {
    return order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }

  openPaymentModal(order: DistributorOrder) {
    this.selectedOrder = order;
    this.paymentMethod = 'Cash';
    this.collectedAmount = this.subtotal(order); // pre-fill with subtotal
    this.showPaymentModal = true;
  }

  placeOrder(orderData: any) {
  return this.http.post('http://localhost:5164/api/orders/place', orderData);
}
  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedOrder = null;
  }

  confirmPayment() {
    if (!this.selectedOrder) return;

    if (!this.paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (this.collectedAmount <= 0 || isNaN(this.collectedAmount)) {
      alert("Invalid collected amount");
      return;
    }

    this.orderService.collectPayment(this.selectedOrder.id, {
      collectedAmount: this.collectedAmount,
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: () => {
        this.closePaymentModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error("Error collecting payment", err);
        alert(err.error?.message || "Failed to collect payment");
      }
    });
  }
  markDelivered(order: DistributorOrder) {
  this.orderService.updateEmployeeOrderStatus(order.id, {
    status: "Delivered"
  }).subscribe({
    next: () => {
      alert("Order marked as Delivered!");
      this.loadOrders();
    },
    error: (err) => {
      console.error(err);
      alert("Failed to update order status.");
    }
  });
}

  
}