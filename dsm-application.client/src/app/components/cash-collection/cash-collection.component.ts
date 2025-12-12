import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-cash-collection',
  templateUrl: './cash-collection.component.html',
  styleUrl: './cash-collection.component.css'
})
export class CashCollectionComponent implements OnInit  {
 form = {
    orderId: '',
    customerId: '',
    customerName: '',
    orderTotalAmount: 0,
    amountPaidToday: 0,
    paymentMode: 'cash',
    transactionReference: '',
     notes: '',
    cashierId: localStorage.getItem('employeeId') || '',
    distributorId: localStorage.getItem('distributorId') || ''
  };

  deliveredOrders: any[] = [];
  response: any;
selectedOrder: any = null;
showModal = false;
showSuccessToast = false;
amountError: string | null = null;

// Optional Notes field (your HTML uses it)
formNotes: string = "";
  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadDeliveredOrders();
  }
openCollectionModal(order: any) {
  this.selectedOrder = order;   

  this.form.orderId = order.orderId;
  this.form.customerId = order.customerId;
  this.form.customerName = order.customerName;
  this.form.orderTotalAmount = order.totalAmount;
  this.form.amountPaidToday = order.pendingAmount;
  this.form.notes = "";

  this.amountError = null;
  this.showModal = true;
}

// Close modal
closeModal() {
  this.showModal = false;
}

// Validation for amount input
validateAmount() {
  if (this.form.amountPaidToday > this.getMaxAmount()) {
    this.amountError = "Amount exceeds pending balance";
  } else {
    this.amountError = null;
  }
}

// Enable/disable submit button
canSubmit() {
  return this.form.amountPaidToday > 0 && !this.amountError;
}

// Close toast message
closeToast() {
  this.showSuccessToast = false;
}

// Payment status styling for pending/paid
getPaymentStatusClass(order: any) {
  return order.pendingAmount === 0 ? "status-paid" : "status-pending";
}

getPaymentStatusText(order: any) {
  return order.pendingAmount === 0 ? "Paid" : "Pending";
}
  loadDeliveredOrders() {
    const distributorId = localStorage.getItem('distributorId')!;
    this.paymentService.getDeliveredOrders(distributorId).subscribe({
      next: res => this.deliveredOrders = res,
      error: err => console.error("Failed to load delivered orders", err)
    });
  }

  selectOrder(order: any) {
  this.form.orderId = order.orderId;
  this.form.customerId = order.customerId;
  this.form.customerName = order.customerName;

  this.form.orderTotalAmount = order.totalAmount;   // ✔ required
  this.form.amountPaidToday = order.pendingAmount; // autofill max
}

submit() {
  if (this.form.amountPaidToday <= 0) {
    alert("Enter a valid amount");
    return;
  }

  this.paymentService.collectPayment(this.form).subscribe({
    next: res => {
      alert("Payment collected!");

      this.resetForm();
      this.loadDeliveredOrders(); // reload with updated pending
    },
    error: err => {
      console.error(err);
      alert("Payment failed");
    }
  });
}
  resetForm() {
    this.form = {
      orderId: '',
      customerId: '',
      customerName: '',
      orderTotalAmount: 0,
      amountPaidToday: 0,
      paymentMode: 'cash',
      transactionReference: '',
       notes: '',
      cashierId: localStorage.getItem('employeeId') || '',
      distributorId: localStorage.getItem('distributorId') || ''
    };
  }
getMaxAmount() {
  return this.selectedOrder ? this.selectedOrder.pendingAmount : 0;
}
clearForm() {
  this.form = {
    orderId: '',
    customerId: '',
    customerName: '',
    orderTotalAmount: 0,
    amountPaidToday: 0,
    paymentMode: 'cash',
    transactionReference: '',
     notes: '',
    cashierId: localStorage.getItem('employeeId') || '',
    distributorId: localStorage.getItem('distributorId') || ''
  };

  this.selectedOrder = null;
}
}
