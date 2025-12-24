import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-cash-collection',
  templateUrl: './cash-collection.component.html',
  styleUrl: './cash-collection.component.css'
})
export class CashCollectionComponent implements OnInit  {
 customers: any[] = [];
  selectedCustomer: any = null;
  showModal = false;
  showDetailsModal = false;
orderDetails: any = null;
customerLedger: any[] = [];
customerReceipts: any[] = [];


  amountError: string | null = null;

  form = {
    customerId: '',
    customerName: '',
    amountPaid: 0,
    paymentMode: 'cash',
    transactionReference: '',
    cashierId: localStorage.getItem('employeeId') || '',
    distributorId: localStorage.getItem('distributorId') || ''
  };

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadCustomersWithPending();
  }

  // 🔥 GROUP ORDERS BY CUSTOMER
  loadCustomersWithPending() {
    const distributorId = localStorage.getItem('distributorId')!;

    this.paymentService.getDeliveredOrders(distributorId).subscribe(res => {
      const map = new Map<string, any>();

      res.forEach((o: any) => {
        if (!map.has(o.customerId)) {
          map.set(o.customerId, {
            customerId: o.customerId,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            totalPending: 0
          });
        }
        map.get(o.customerId).totalPending += o.pendingAmount;
      });

      this.customers = Array.from(map.values());
    });
  }

  openModal(customer: any) {
    this.selectedCustomer = customer;

    this.form.customerId = customer.customerId;
    this.form.customerName = customer.customerName;
    this.form.amountPaid = customer.totalPending;

    this.amountError = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  validateAmount() {
    if (this.form.amountPaid > this.selectedCustomer.totalPending) {
      this.amountError = 'Amount exceeds total pending';
    } else {
      this.amountError = null;
    }
  }

  canSubmit() {
    return this.form.amountPaid > 0 && !this.amountError;
  }

  submit() {
    this.paymentService.collectCustomerPayment(this.form).subscribe({
      next: res => {
        alert(`Payment collected. Remaining pending: ₹${res.remainingCustomerPending}`);
        this.showModal = false;
        this.loadCustomersWithPending();
      },
      error: err => alert(err.error?.message || 'Payment failed')
    });
  }
viewDetails(customer: any) {
  const distributorId = localStorage.getItem('distributorId')!;

  // 1️⃣ Load order-wise pending (existing)
  this.paymentService
    .getCustomerPending(customer.customerId, distributorId)
    .subscribe(res => {
      this.orderDetails = res;
    });

  // 2️⃣ Load customer-level receipts (NEW)
  this.paymentService
    .getCustomerReceipts(customer.customerId, distributorId)
    .subscribe(res => {
      this.customerReceipts = res;
    });

  this.showDetailsModal = true;
}
closeDetailsModal() {
  this.showDetailsModal = false;
  this.orderDetails = null;
  this.customerReceipts = [];   // ⭐ IMPORTANT
}


}
