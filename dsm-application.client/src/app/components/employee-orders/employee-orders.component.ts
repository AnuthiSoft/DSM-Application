import { Component, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

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


  constructor(
  private http: HttpClient, 
  private orderService: OrderService,
  private toastr: ToastrService
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
    if (!this.selectedOrder) return;

    if (!this.paymentMethod) {
      this.toastr.warning("Please select a payment method","warning");
      return;
    }

    if (this.collectedAmount <= 0 || isNaN(this.collectedAmount)) {
      this.toastr.error("Invalid collected amount","Error");
      return;
    }

    this.orderService.collectPayment(this.selectedOrder.id, {
      collectedAmount: this.collectedAmount,
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: () => {
        this.toastr.success("Payment collected successfully!", "Success"); // ✅ toastr
        this.closePaymentModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error("Error collecting payment", err);
        this.toastr.error(err.error?.message || "Failed to collect payment","Error");
      }
    });
  }
  markDelivered(order: DistributorOrder) {
  this.orderService.updateEmployeeOrderStatus(order.id, {
    status: "Delivered"
  }).subscribe({
    next: () => {
      this.toastr.success("Order marked as Delivered!","Success");
      this.loadOrders();
    },
    error: (err) => {
      console.error(err);
      this.toastr.error("Failed to update order status.","Error");
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
  const formData = new FormData();
  formData.append('receipt', file);

  this.orderService.uploadDeliveryReceipt(orderId, formData)
    .subscribe({
      next: () => {
        this.toastr.success('Receipt uploaded. Order delivered 🚚');
        this.loadOrders();
      },
      error: (err) => {
        console.error(err);
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
}