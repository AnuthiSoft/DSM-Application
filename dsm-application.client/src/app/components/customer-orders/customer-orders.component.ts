import { Component, EventEmitter, Output } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // ✅ Fix: Import HttpClient
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ReturnApiService } from '../../services/return-api.service';
import { environment } from '../../../environments/environment';

interface ReturnData {
  returnType: string;
  reason: string;
  otherReason: string;
  resolution: string;
  files: FileList | null;
  additionalNotes?: string;   // ✅ ADD
  agreeTerms?: boolean;
}

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent {

  returnData: ReturnData = {
    returnType: 'Return',
    reason: 'Received damaged product',
    otherReason: '',
    resolution: 'Refund',
    files: null,
    additionalNotes: '',
    agreeTerms: false
  };


  // UI flags
  showProgressSteps: boolean = false;
  submitting: boolean = false;

  // Alert message
  returnMessage: string = '';
  returnMessageType: 'alert-success' | 'alert-error' | '' = '';


  orders: Order[] = [];
  loading = true;
  selectedOrder: any = null;
  selectedOrderss: any = null;

  selectedFiles: File[] = [];
  selectedProductId: string = '';
  returnQty: number = 1;
  selectedOrderForReturn: any = null;
  activeTab: string = 'dashboard';



  createdReturnId: string = '';
  @Output() returnSubmitted = new EventEmitter<void>();



  customerId = localStorage.getItem('customerId') || '';
  distributorId = localStorage.getItem('distributorId') || '';

  isReturnPopupOpen = false;

  currentOrderId: string = '';
  statusFilter: string = 'All';

statusOptions: string[] = [
  'All',
  'Pending',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Rejected'
];

filteredOrders: Order[] = [];


  constructor(private orderService: OrderService, private returnApiService: ReturnApiService, private router: Router, private http: HttpClient, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  isCancelled(order: any): boolean {
    const status = order?.status?.toLowerCase();
    return status === 'cancelled' || status === 'canceled';
  }


loadOrders(): void {
  if (!this.customerId) return;
  this.loading = true;

  this.orderService.getOrdersByCustomer(this.customerId).subscribe({
    next: (data: Order[]) => {
      this.orders = data.map(order => ({
        ...order,
        expectedDeliveryDate: this.computeExpectedDelivery(
          order.orderedDate,
          order.distributorId
        )
      }));

      this.applyStatusFilter(); // ✅ IMPORTANT
      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });
}
applyStatusFilter(): void {
  if (this.statusFilter === 'All') {
    this.filteredOrders = [...this.orders];
  } else {
    this.filteredOrders = this.orders.filter(
      o => o.status?.toLowerCase() === this.statusFilter.toLowerCase()
    );
  }
}



  onFilesSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }




  computeExpectedDelivery(orderDate: any, distributorId: string): string {
    if (!distributorId) return "";

    const leadTime =
      Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

    // 🔥 IMPORTANT: Always start from TODAY for reorder
    const baseDate = orderDate ? new Date(orderDate) : new Date();

    baseDate.setDate(baseDate.getDate() + leadTime);

    return baseDate.toISOString().split("T")[0];
  }



  // openReturnPopup(order: any) {
  //   Swal.fire({
  //     title: 'Return / Exchange / Replace',
  //     html: `
  //       <div style="text-align:left">

  //         <label><strong>Select Option:</strong></label>
  //         <select id="returnType" class="swal2-input">
  //           <option value="Return">Return</option>
  //           <option value="Exchange">Exchange</option>
  //           <option value="Replace">Replace (if damaged or defective)</option>
  //         </select>

  //         <br><br>

  //         <label><strong>Reason:</strong></label>
  //         <select id="returnReason" class="swal2-input">
  //           <option value="Received damaged product">Received damaged product</option>
  //           <option value="Wrong item received">Wrong item received</option>
  //           <option value="Item not as described">Item not as described</option>
  //           <option value="Size/fit issue">Size/fit issue</option>
  //           <option value="Quality issue">Quality issue</option>
  //           <option value="Changed my mind">Changed my mind</option>
  //           <option value="Ordered by mistake">Ordered by mistake</option>
  //           <option value="Other">Other</option>
  //         </select>

  //         <textarea id="otherReasonText" class="swal2-textarea"
  //           placeholder="Type your reason here..." style="display:none"></textarea>

  //         <br>

  //         <label><strong>Upload Photos/Videos:</strong></label>
  //         <input type="file" id="returnFiles" multiple class="swal2-file">
  //       </div>
  //     `,
  //     showCancelButton: true,
  //     confirmButtonText: 'Submit Request',
  //     width: 500,
  //     didOpen: () => {
  //       // Show textbox only when "Other" is selected
  //       const reason = document.getElementById("returnReason") as HTMLSelectElement;
  //       const other = document.getElementById("otherReasonText") as HTMLTextAreaElement;

  //       reason.addEventListener("change", () => {
  //         other.style.display = reason.value === "Other" ? "block" : "none";
  //       });
  //     },
  //     preConfirm: () => {
  //       const returnType = (document.getElementById("returnType") as HTMLSelectElement).value;
  //       const reason = (document.getElementById("returnReason") as HTMLSelectElement).value;
  //       const otherReason = (document.getElementById("otherReasonText") as HTMLTextAreaElement).value;
  //       const files = (document.getElementById("returnFiles") as HTMLInputElement).files;

  //       return {
  //         returnType,
  //         reason: reason === "Other" ? otherReason : reason,
  //         files
  //       };
  //     }
  //   }).then(result => {
  //     if (result.isConfirmed) {
  //       console.log("Return data:", result.value);

  //       this.submitReturnRequest(order.id, result.value);
  //     }
  //   });
  // }

  closeReturnPopup() {
    this.isReturnPopupOpen = false;
  }

  openReturnPopup(order: any) {
    this.currentOrderId = order.id;
    this.selectedOrderForReturn = order;

    this.selectedProductId = order.products[0]?.productId;
    this.returnQty = 1;
    this.selectedFiles = [];

    this.returnData = {
      returnType: 'Return',
      reason: 'Received damaged product',
      otherReason: '',
      resolution: 'Refund',
      files: null
    };

    this.isReturnPopupOpen = true;
  }




 submitReturnRequest(): void {

  const baseReason =
    this.returnData.reason === 'Other'
      ? this.returnData.otherReason
      : this.returnData.reason;

  const finalReason =
    `[${this.returnData.returnType}] [${this.returnData.resolution}] ${baseReason}`;

  const selectedProduct = this.selectedOrderForReturn.products
    .find((p: any) => p.productId === this.selectedProductId);

  if (!selectedProduct) {
    this.toastr.error('Invalid product selected');
    return;
  }

  const payload = {
    orderId: this.currentOrderId,
    productId: this.selectedProductId,
    productName: selectedProduct.productName,
    returnQty: this.returnQty,
    reason: finalReason,
    resolution: this.returnData.resolution
  };

  this.submitting = true;

  this.returnApiService.createReturn(payload).subscribe({
    next: (res: any) => {
      const returnId = res.id;

      // upload images if any
      if (this.selectedFiles.length > 0) {
        this.returnApiService
          .uploadReturnImages(returnId, this.selectedFiles)
          .subscribe();
      }

      const order = this.orders.find(o => o.id === this.currentOrderId);
      if (order) {
        order.status = 'Return Pending';
      }

      this.toastr.success('Return request submitted');
      this.isReturnPopupOpen = false;
      this.submitting = false;

      this.router.navigate(['/customer/dashboard'], {
        queryParams: { tab: 'returns' }
      });
    },
    error: () => {
      this.submitting = false;
      this.toastr.error('Failed to submit return request');
    }
  });
}










  //   // Navigate to order details page
  // viewOrderDetails(orderId: string): void {
  //   this.router.navigate(['/orders', orderId]);
  // }

  // Cancel an order
  cancelOrder(orderId: string): void {
              Swal.fire({
                  title: 'Are you sure you want to cancel this order?',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Ok',
                  cancelButtonText: 'Cancel',
                  confirmButtonColor: '#2e7d32',
                  cancelButtonColor: '#aaa',
                  backdrop: true
              }).then((result) => {
                  if (result.isConfirmed) {
                      this.orderService.cancelOrder(orderId).subscribe({
                          next: () => {
                              this.toastr.success('Order cancelled successfully');
                              this.loadOrders();
                          },
                          error: () => {
                              this.toastr.error('Failed to cancel order');
                          }
                      });
                  }
              });
          }

  // Reorder a previous order
  reorder(orderId: string): void {

              const distributorId = localStorage.getItem('distributorId')!;
              const leadTime = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

              const today = new Date();
              today.setDate(today.getDate() + leadTime);

              const expectedDelivery = today.toISOString().split('T')[0];

              this.orderService.reorder(orderId, expectedDelivery).subscribe({
                  next: () => {
                      this.toastr.success('Order placed successfully');
                      this.loadOrders();
                  },
                  error: (err) => {
                      this.toastr.error(err?.error?.message || 'Reorder failed');
                  }
              });
          }




  // Count completed orders
getCompletedCount(): number {
              return this.filteredOrders.filter(
                  o => o.status?.toLowerCase() === 'delivered'
              ).length;
          }

  // Count pending orders
getPendingCount(): number {
              return this.filteredOrders.filter(
                  o => o.status?.toLowerCase() === 'pending'
              ).length;
          }

  // Calculate total spent
getTotalSpent(): number {
              return this.filteredOrders.reduce(
                  (sum, o) => sum + (o.totalAmount || 0),
                  0
              );
          }

  // ✅ FIXED View Details for order
  viewOrderDetails(id: string | null | undefined): void {

              if (!id) {
                  this.toastr.error('Invalid Order ID');
                  return;
              }

              this.http.get<any>(`${environment.apiUrl}/orders/${id}`).subscribe({
                  next: order => {

                      const taxableAmount =
                          (order.subtotal ?? 0) - (order.totalDiscount ?? 0);

                      Swal.fire({
                          title: 'Order Summary',
                          html: `
          <div style="text-align:left; font-size:15px; line-height:1.6">
 
            <p><strong>Subtotal:</strong> ₹${order.subtotal?.toFixed(2)}</p>
 
            <hr>
 
            <p><strong>Discounts</strong></p>
 
            <p>Price Discount (${order.priceDiscountPercent ?? 0}%):
              <span style="color:green">
                - ₹${((order.subtotal * (order.priceDiscountPercent ?? 0)) / 100).toFixed(2)}
              </span>
            </p>
 
            <p>Quantity Discount (${order.quantityDiscountPercent ?? 0}%):
              <span style="color:green">
                - ₹${((order.subtotal * (order.quantityDiscountPercent ?? 0)) / 100).toFixed(2)}
              </span>
            </p>
 
            <p>Special Discount (${order.specialDiscountPercent ?? 0}%):
              <span style="color:green">
                - ₹${((order.subtotal * (order.specialDiscountPercent ?? 0)) / 100).toFixed(2)}
              </span>
            </p>
 
            <p><strong>General Discount:</strong>
              <span style="color:green">
                - ₹${order.products?.[0]?.generalDiscount?.toFixed(2) ?? '0.00'}
              </span>
            </p>
 
            <p style="font-weight:600">
              Total Discount:
              <span style="color:green">
                - ₹${order.totalDiscount?.toFixed(2)}
              </span>
            </p>
 
            <hr>
 
            <p><strong>Taxable Amount:</strong>
              ₹${taxableAmount.toFixed(2)}
            </p>
 
        <p>
        <strong>GST (${order.products?.[0]?.gstPercentage ?? 0}%):</strong>
        ₹${Number(
                              order.products?.reduce(
                                  (sum: number, p: any) => sum + (p.gstAmount ?? 0),
                                  0
                              )
                          ).toFixed(2)}
         
          </p>
            <hr>
 
            <p style="font-size:17px; font-weight:700">
              Total Amount: ₹${order.totalAmount?.toFixed(2)}
            </p>
 
          </div>
        `,
                          icon: 'info',
                          width: 420,
                          confirmButtonText: 'Close'
                      });

                  },
                  error: () => {
                      this.toastr.error('Unable to load order details');
                  }
              });
          }
 
 
 
  viewOrderDetailss(id: string | null | undefined): void {

              console.log('View Items clicked. Order ID =', id);

              // 🛑 STOP if ID is invalid
              if (!id) {
                  this.toastr.error('Invalid Order ID');
                  return;
              }

              this.http.get<any>(`${environment.apiUrl}/orders/${id}`).subscribe({
                  next: order => {

                      const itemsHtml = (order.products || []).map((item: any) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <div>
            <strong>${item.productName}</strong><br>
            Qty: ${item.quantity} × ₹${item.price}
          </div>
          <div>
            ₹${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      `).join('');

                      const totalPrice = (order.products || []).reduce(
                          (sum: number, item: any) => sum + (item.price * item.quantity),
                          0
                      );

                      Swal.fire({
                          title: 'Order Items',
                          html: `
          <div style="text-align:left; font-size:15px;">
 
            ${itemsHtml}
 
            <hr>
 
            <div style="display:flex; justify-content:space-between; font-size:16px;">
              <strong>Total Price</strong>
              <strong>₹${totalPrice.toFixed(2)}</strong>
            </div>
 
            <div style="display:flex; justify-content:space-between; margin-top:6px;">
              <strong>Final Price</strong>
              <strong>₹${order.totalAmount ?? 0}</strong>
            </div>
 
          </div>
        `,
                          icon: 'info',
                          width: 450,
                          confirmButtonText: 'Close'
                      });

                  },
                  error: err => {
                      console.error('Error loading order:', err);
                      Swal.fire('Error', 'Unable to load order details', 'error');
                  }
              });
          }
 
 setStatusFilter(status: string) {
              this.statusFilter = status;
              this.applyStatusFilter();
          }
getStatusCount(status: string): number {
              if (status === 'All') return this.orders.length;

              return this.orders.filter(
                  o => o.status?.toLowerCase() === status.toLowerCase()
              ).length;
          }
 goBackToDashboard() {
              this.router.navigate(['/customer-dashboard']);
          }


  getMaxReturnQuantity(): number {
              if (!this.selectedOrderForReturn || !this.selectedProductId) return 1;

              const product = this.selectedOrderForReturn.products
                  .find((p: any) => p.productId === this.selectedProductId);

              return product ? product.quantity : 1;
          }

  getFilePreview(file: File): string {
              return URL.createObjectURL(file);
          }

  removeFile(index: number) {
              this.selectedFiles.splice(index, 1);
          }

      
        }
      
