import { Component, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-employee-orders',
  templateUrl: './employee-orders.component.html',
  styleUrl: './employee-orders.component.css'
})
export class EmployeeOrdersComponent implements OnInit {
 employeeId = localStorage.getItem('employeeId') || '';
  orders: DistributorOrder[] = [];
  loading = false;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
   console.log('Employee ID:', this.employeeId); // ✅ Add this here
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.employeeId) return;
    this.loading = true;
   this.orderService.getOrdersByEmployee(this.employeeId).subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
    console.log('Employee ID:', this.employeeId);
  }

 markDelivered(order: DistributorOrder): void {
  const paymentMethod = prompt("Enter payment method (Cash/Online):", "Cash");
  if (!paymentMethod) return;

  const collectedAmountStr = prompt("Enter amount collected:");
  const collectedAmount = Number(collectedAmountStr);
  if (isNaN(collectedAmount) || collectedAmount <= 0) {
    alert("Invalid amount");
    return;
  }

  if (!confirm(`Confirm delivery for Order ${order.id} with ₹${collectedAmount} (${paymentMethod})?`))
    return;

  // ✅ Use dedicated collectPayment API
  this.orderService.collectPayment(order.id, { collectedAmount, paymentMethod }).subscribe({
    next: () => {
      alert("✅ Payment collected and order marked as delivered");
      this.loadOrders();
    },
    error: (err) => {
      console.error("❌ Error collecting payment", err);
      alert(err.error?.message || "Failed to collect payment");
    }
  });
}


  subtotal(order: DistributorOrder) {
    return order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }
}
