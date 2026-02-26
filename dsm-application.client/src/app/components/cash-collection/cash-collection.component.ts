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
  showInlinePaymentOptions = false;
  currentPage = 1;
  itemsPerPage = 3;

  form = {
    customerId: '',
    customerName: '',
    amountPaid: 0,
    paymentMode: 'cash',
    transactionReference: '',
    cashierId: localStorage.getItem('employeeId') || '',
    distributorId: localStorage.getItem('distributorId') || ''
  };

  constructor(private paymentService: PaymentService) { }

  ngAfterViewInit() {
    const isMobileOrTab = window.innerWidth <= 1024;
    const select = document.querySelector('.payment-select') as HTMLSelectElement;

    if (isMobileOrTab && select) {
      select.size = 1;

      select.addEventListener('focus', () => {
        select.size = select.options.length; // 🔥 inline expand
      });

      select.addEventListener('blur', () => {
        select.size = 1; // collapse back
      });

      select.addEventListener('change', () => {
        select.size = 1; // collapse after selection
      });
    }
  }

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
    // 🔥 If cash selected, clear reference
    if (this.form.paymentMode === 'cash') {
      this.form.transactionReference = '';
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
    this.currentPage = 1;
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
    const isReferenceRequired =
      this.form.paymentMode === 'upi' ||
      this.form.paymentMode === 'scanner';

    if (isReferenceRequired && !this.form.transactionReference?.trim()) {
      return false;
    }

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
    this.currentPage = 1;

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
    this.currentPage = 1;
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

  togglePaymentOptions() {
    this.showInlinePaymentOptions = !this.showInlinePaymentOptions;
  }

  selectInlinePayment(mode: string) {
    this.form.paymentMode = mode;
    this.showInlinePaymentOptions = false;
    this.onPaymentModeChange();
  }

  get paginatedCustomers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const width = window.innerWidth;

    let maxVisible = 7;
    if (width <= 992) maxVisible = 5;
    if (width <= 576) maxVisible = 3;

    const pages: number[] = [];

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}