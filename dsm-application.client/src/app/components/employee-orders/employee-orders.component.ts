import { Component, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from '../../services/employee.service';

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

  allOrders: DistributorOrder[] = [];
  filteredOrders: DistributorOrder[] = [];
  selectedStatus: string = 'All';
  showSheet = false;
  availabilityStatus: 'available' | 'not-available' | 'unknown' = 'unknown';
  currentPage = 1;
  itemsPerPage = 5;


  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private toastr: ToastrService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    console.log('Employee ID:', this.employeeId);
    this.loadOrders();
    this.loadAvailability();
  }

  loadOrders(): void {
    if (!this.employeeId) return;

    this.loading = true;
    this.orderService.getOrdersByEmployee(this.employeeId).subscribe({
      next: (data) => {
        this.allOrders = data;
        this.applyStatusFilter(); // 👈 filter after load
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }


  applyStatusFilter() {
    if (this.selectedStatus === 'All') {
      this.filteredOrders = this.allOrders;
    } else {
      this.filteredOrders = this.allOrders.filter(
        o => o.status === this.selectedStatus
      );
    }
    this.currentPage = 1;
  }


  subtotal(order: DistributorOrder) {
    return order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }

  openPaymentModal(order: DistributorOrder) {
    this.selectedOrder = order;
    this.paymentMethod = 'Cash';
    // this.collectedAmount = this.subtotal(order); // pre-fill with subtotal
    this.collectedAmount = order.payableAmount ?? order.totalAmount;


    this.showPaymentModal = true;
  }

  //   placeOrder(orderData: any) {
  //   return this.http.post('http://localhost:5164/api/orders/place', orderData);
  // }
  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedOrder = null;
  }

  confirmPayment() {

    if (this.blockIfUnavailable()) return;

    if (!this.selectedOrder) return;

    if (!this.paymentMethod) {
      this.toastr.warning("Please select a payment method");
      return;
    }

    if (this.collectedAmount <= 0 || isNaN(this.collectedAmount)) {
      this.toastr.error("Invalid collected amount");
      return;
    }

    this.orderService.collectPayment(this.selectedOrder.id, {
      collectedAmount: this.collectedAmount,
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: () => {
        this.toastr.success("Payment collected successfully!");
        this.closePaymentModal();
        this.loadOrders();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || "Failed to collect payment");
      }
    });
  }


  markDelivered(order: DistributorOrder) {

    if (this.blockIfUnavailable()) return;

    this.orderService.updateEmployeeOrderStatus(order.id, {
      status: "Delivered"
    }).subscribe({
      next: () => {
        this.toastr.success("Order marked as Delivered!");
        this.loadOrders();
      },
      error: () => {
        this.toastr.error("Failed to update order status.");
      }
    });
  }


  // getDiscount(order: DistributorOrder): number {
  //   if (order.totalDiscount && order.totalDiscount > 0) {
  //     return order.totalDiscount;
  //   }

  //   if (order.subtotal && order.totalAmount) {
  //     return Math.max(order.subtotal - order.totalAmount, 0);
  //   }

  //   return 0;
  // }

  getTaxableAmount(order: any): number {
    if (order.subtotal && order.discount !== undefined) {
      return order.subtotal - order.discount;
    }
    return order.subtotal || 0;
  }

  openReceiptUpload(order: DistributorOrder) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadReceiptFile(order.id, file);
      }
    };

    input.click();
  }

  uploadReceiptFile(orderId: string, file: File) {

    if (this.blockIfUnavailable()) return;

    const formData = new FormData();
    formData.append('receipt', file);

    this.orderService.uploadDeliveryReceipt(orderId, formData)
      .subscribe({
        next: () => {
          this.toastr.success('Receipt uploaded. Order delivered 🚚');
          this.loadOrders();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Upload failed');
        }
      });
  }


  onReceiptSelected(event: any, order: DistributorOrder) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    this.uploadReceiptFile(order.id, file);
  }

  openBottomSheet() {
    this.showSheet = true;
  }

  closeBottomSheet() {
    this.showSheet = false;
  }

  selectStatus(status: string) {
    this.selectedStatus = status;
    this.applyStatusFilter();
    this.closeBottomSheet();
  }

  loadAvailability() {
    if (!this.employeeId) return;

    const today = new Date().toISOString().split('T')[0];

    this.employeeService.getAvailability(this.employeeId, today).subscribe({
      next: (res) => {
        this.availabilityStatus = res.isAvailable ? 'available' : 'not-available';
      },
      error: () => {
        this.availabilityStatus = 'unknown';
      }
    });
  }

  isAvailable(): boolean {
    return this.availabilityStatus === 'available';
  }

  blockIfUnavailable(): boolean {
    if (!this.isAvailable()) {
      this.toastr.error("You are marked as Not Available today.");
      return true;
    }
    return false;
  }

  get paginatedOrders() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredOrders.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);

      if (this.currentPage > 4) {
        pages.push('...');
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(total - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < total - 3) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  }

  goToPage(page: number | string) {
    if (page === '...') return;

    const pageNumber = Number(page);

    if (pageNumber < 1 || pageNumber > this.totalPages) return;

    this.currentPage = pageNumber;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}