import { Component, OnInit, HostListener } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cash-collection',
  templateUrl: './cash-collection.component.html',
  styleUrls: ['./cash-collection.component.css']
})
export class CashCollectionComponent implements OnInit {
  customers: any[] = [];
  selectedCustomer: any = null;
  showModal = false;
  showDetailsModal = false;
  orderDetails: any = null;
  customerLedger: any[] = [];
  customerReceipts: any[] = [];
  scannerQrUrl: string | null = null;

  amountError: string | null = null;
  filteredCustomers: any[] = [];
selectedOrderId: string | null = null;
showOrderPopup = false;
  // Customer filter properties
  showCustomerDropdown: boolean = false;
  selectedCustomerFilter: string = '';
  selectedCustomerName: string = '';
  selectedCustomerPhone: string = '';
  selectedCustomerPending: number = 0;
  orderFullDetails: any = null;
showOrderModal = false;

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

  onPaymentModeChange() {
    if (this.form.paymentMode === 'scanner') {
      const distributorId = localStorage.getItem('distributorId')!;

      this.paymentService.getDistributorScanner(distributorId)
        .subscribe({
          next: res => {
            this.scannerQrUrl =
              `${environment.apiUrl}/distributor/scanner-qr/view/${res.scannerQrUrl}`;
          },
          error: () => {
            this.scannerQrUrl = null;
          }
        });
    } else {
      this.scannerQrUrl = null;
    }
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
      // Initialize filteredCustomers with all customers
      this.filteredCustomers = [...this.customers];
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
      this.selectedCustomer = customer;
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

  // Customer filter methods
  toggleCustomerDropdown() {
    this.showCustomerDropdown = !this.showCustomerDropdown;
  }

  selectCustomerFilter(customerName: string) {
    this.selectedCustomerFilter = customerName;
    this.showCustomerDropdown = false;
    
    if (!customerName) {
      // Show all customers
      this.filteredCustomers = [...this.customers];
      this.selectedCustomerName = '';
      this.selectedCustomerPhone = '';
      this.selectedCustomerPending = 0;
    } else {
      // Show only selected customer
      const customer = this.customers.find(c => c.customerName === customerName);
      if (customer) {
        this.filteredCustomers = [customer];
        this.selectedCustomerName = customer.customerName;
        this.selectedCustomerPhone = customer.customerPhone;
        this.selectedCustomerPending = customer.totalPending;
      }
    }
  }

  clearCustomerFilter() {
    this.selectedCustomerFilter = '';
    this.filteredCustomers = [...this.customers];
    this.selectedCustomerName = '';
    this.selectedCustomerPhone = '';
    this.selectedCustomerPending = 0;
  }

  getTotalPending(): number {
    return this.filteredCustomers.reduce((sum, customer) => 
      sum + (customer.totalPending || 0), 0);
  }

  // Add click outside listener to close dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.customer-dropdown')) {
      this.showCustomerDropdown = false;
    }
  }
  openOrderFullDetails(orderId: string) {
  this.paymentService.getOrderFullDetails(orderId)
    .subscribe(res => {
      this.orderFullDetails = res;
      this.showOrderModal = true;
    });
}

closeOrderModal() {
  this.showOrderModal = false;
  this.orderFullDetails = null;
}
openOrderDetails(orderId: string) {
  this.selectedOrderId = orderId;
  this.showOrderPopup = true;
}
viewReceipt(blobName: string) {
  if (!blobName) {
    alert('Receipt not available');
    return;
  }

  const receiptUrl =
    `${environment.apiUrl}/orders/receipt/${blobName}`;

  window.open(receiptUrl, '_blank');
}

}