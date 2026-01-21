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
  selectedOrderss: any = null;

  customerId = localStorage.getItem('customerId') || '';
  distributorId = localStorage.getItem('distributorId') || '';

  isReturnPopupOpen = false;
  returnData = {
    returnType: 'Return',
    reason: 'Received damaged product',
    otherReason: '',
    files: null as FileList | null
  };
  currentOrderId: string = '';


  constructor(private orderService: OrderService, private router: Router, private http: HttpClient, private toastr: ToastrService) { }

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
          expectedDeliveryDate: this.computeExpectedDelivery(order.orderedDate, order.distributorId)
        }));
        this.loading = false;
      },
      error: (err: any) => {
        console.error("Failed to load orders", err);
        this.loading = false;
      }
    });
  }


  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.returnData.files = input.files;
    }
  }


  computeExpectedDelivery(orderDate: any, distributorId: string): string {
    if (!orderDate || !distributorId) return "";

    const leadTime = Number(localStorage.getItem(`leadTime_${distributorId}`)) || 1;

    // Convert Date OR string to Date object
    const date = new Date(orderDate);

    date.setDate(date.getDate() + leadTime);

    return date.toISOString().split("T")[0];
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
    this.isReturnPopupOpen = true;
  }


  submitReturnRequest() {

    const finalReason =
      this.returnData.reason === 'Other'
        ? this.returnData.otherReason
        : this.returnData.reason;

    const formData = new FormData();
    formData.append("orderId", this.currentOrderId);
    formData.append("returnType", this.returnData.returnType);
    formData.append("reason", finalReason);

    if (this.returnData.files) {
      for (let i = 0; i < this.returnData.files.length; i++) {
        formData.append("files", this.returnData.files[i]);
      }
    }

    this.http.post("http://localhost:5164/api/returns/create", formData)
      .subscribe({
        next: () => {
          this.toastr.success("Return request submitted!");

          this.isReturnPopupOpen = false;

          // 🔥 Redirect to Return Orders
          this.router.navigate(['/customer/dashboard'], {
            queryParams: { tab: 'returns' }
          });
        },
        error: () => {
          this.toastr.error("Failed to submit return request");
        }
      });
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
  // getCompletedCount(): number {
  //   return this.orders.filter(o => o.status === 'Delivered').length;
  // }
  getCompletedCount(): number {
  return this.activeOrders.filter(
    o => o.status?.toLowerCase() === 'delivered'
  ).length;
}

  // Count pending orders
  getPendingCount(): number {
  return this.activeOrders.filter(
    o => o.status?.toLowerCase() === 'pending'
  ).length;
}
  // getPendingCount(): number {
  //   return this.orders.filter(o => o.status === 'Pending').length;
  // }

  // Calculate total spent
  getTotalSpent(): number {
  return this.activeOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
}
  // getTotalSpent(): number {
  //   return this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  // }

  // ✅ FIXED View Details for order
  viewOrderDetails(id: string | null | undefined): void {

    if (!id) {
      this.toastr.error('Invalid Order ID');
      return;
    }

    this.http.get<any>(`http://localhost:5164/api/orders/${id}`).subscribe({
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

    this.http.get<any>(`http://localhost:5164/api/orders/${id}`).subscribe({
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


}