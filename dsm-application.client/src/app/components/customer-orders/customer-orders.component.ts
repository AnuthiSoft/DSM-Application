import { Component, EventEmitter, Output } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // ✅ Fix: Import HttpClient
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ReturnApiService } from '../../services/return-api.service';
import { environment } from '../../../environments/environment';
import { CartService } from '../../services/cart.service';

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

  // ===== Pagination =====
  pageSize = 6;
  currentPage = 1;
  totalPages = 1;
  pagesPerGroup = 5;
  currentGroup = 0;
  returnData: ReturnData = {
    returnType: 'Return',
    reason: '',
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
  selectedProductIds: string[] = [];
  returnQuantities: any = {};
  totalReturnQty: number = 0;

  cartCount = 0;
  orders: Order[] = [];
  loading = true;
  selectedOrder: any = null;
  selectedOrderss: any = null;

  selectedFiles: File[] = [];
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
    'Canceled',
    'Return Rejected'
  ];

  filteredOrders: Order[] = [];


  constructor(private orderService: OrderService, private returnApiService: ReturnApiService, private router: Router, private http: HttpClient, private toastr: ToastrService, private cartService: CartService) { }

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
        this.currentPage = 1;
        this.updatePagination();
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

    this.currentPage = 1;
    this.updatePagination();
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

    this.selectedProductIds = [];
    this.returnQuantities = {};
    this.returnQty = 1;
    this.selectedFiles = [];

    this.returnData = {
      returnType: 'Return',
      reason: '',
      otherReason: '',
      resolution: 'Refund',
      files: null
    };

    this.isReturnPopupOpen = true;
  }



  submitReturnRequest() {
    const baseReason =
      this.returnData.reason === 'Other'
        ? this.returnData.otherReason
        : this.returnData.reason;

    const finalReason =
      `[${this.returnData.returnType}] [${this.returnData.resolution}] ${baseReason}`;

    // Build return items for all selected products
    const items = this.selectedProductIds.map(pid => {
      const product = this.selectedOrderForReturn.products
        .find((p: any) => p.productId === pid);

      return {
        orderId: this.currentOrderId,
        productId: pid,
        productName: product?.productName,
        returnQty: this.returnQuantities[pid] || 1,
        reason: finalReason,
        resolution: this.returnData.resolution
      };
    });

    items.forEach(item => {
      this.returnApiService.createReturn(item).subscribe({
        next: (res) => {
          const returnId = res.id;

          if (this.selectedFiles.length > 0) {
            this.returnApiService
              .uploadReturnImages(returnId, this.selectedFiles)
              .subscribe();
          }
        }
      });
    });

    this.toastr.success("Return request submitted");

    // 👉 Update UI instantly
    this.selectedOrderForReturn.status = "Return Initiated";

    const index = this.orders.findIndex(o => o.id === this.currentOrderId);
    if (index !== -1) {
      this.orders[index].status = "Return Initiated";
    }

    this.isReturnPopupOpen = false;

  }

  dropdownOpen: boolean = false;
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleProductSelection(pid: string) {
  const index = this.selectedProductIds.indexOf(pid);

  if (index === -1) {
    this.selectedProductIds.push(pid);

    // ✅ Set max available qty as default
    this.returnQuantities[pid] = this.getMaxReturnQtyForProduct(pid);

  } else {
    this.selectedProductIds.splice(index, 1);
    delete this.returnQuantities[pid];
  }

  this.updateTotalReturnQty(); // ✅ important
}


  getProductName(pid: string) {
    return this.selectedOrderForReturn?.products
      .find((p: any) => p.productId === pid)?.productName || '';
  }

  getMaxReturnQtyForProduct(pid: string): number {
    const p = this.selectedOrderForReturn?.products
      .find((x: any) => x.productId === pid);
    return p ? p.quantity - (p.returnedQty || 0) : 1;
  }

  onProductSelectionChange() {
    // Initialize quantity = 1 for any newly added product
    this.selectedProductIds.forEach(pid => {
      if (!this.returnQuantities[pid]) {
        this.returnQuantities[pid] = 1;
      }
    });

    // Remove quantities for unselected products
    Object.keys(this.returnQuantities).forEach(pid => {
      if (!this.selectedProductIds.includes(pid)) {
        delete this.returnQuantities[pid];
      }
    });

    this.updateTotalReturnQty();
  }
  updateTotalReturnQty() {
    // Enforce max quantity for each product
    this.selectedProductIds.forEach(pid => {
      const maxQty = this.getMaxReturnQtyForProduct(pid);

      if (this.returnQuantities[pid] > maxQty) {
        this.returnQuantities[pid] = maxQty;  // Auto-correct
        this.toastr.warning(`Maximum return quantity for this product is ${maxQty}`);
      }

      if (this.returnQuantities[pid] < 1) {
        this.returnQuantities[pid] = 1; // Prevent 0 or negative
      }
    });

    // Recalculate total
    this.totalReturnQty = Object.values(this.returnQuantities)
      .reduce((sum: number, qty: any) => sum + Number(qty), 0);
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

  // 🔥 IMPORTANT: refresh products page
  // Option 1 (simple reload)
  window.location.reload();

  // OR Option 2 (better if using service)
  // this.productService.triggerRefresh();
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

    this.http.get<any>(`${environment.apiUrl}/orders/${orderId}`).subscribe({
      next: (order) => {

        if (!order || !order.products || order.products.length === 0) {
          this.toastr.error('No products found in this order');
          return;
        }

        const distributorId = order.distributorId;
        const customerId = localStorage.getItem('customerId');

        if (!customerId) {
          this.toastr.error('Customer not found');
          return;
        }

        // ✅ Set distributor for AddToCart screen
        localStorage.setItem('distributorId', distributorId);

        // 🔑 SAME KEY used by AddToCartComponent
        const CART_KEY = `cart_customer_${customerId}`;

        const orderProducts = order.products.map((item: any) => ({
          product: {
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            distributorId: distributorId,

            // 🔥 Required by AddToCartComponent
            currentStock: item.currentStock || 9999,
            brand: item.brand || '',
            category: item.category || '',
            distributorName: order.distributorName || ''
          },
          quantity: item.quantity
        }));

        // ✅ Save where AddToCart actually reads
        localStorage.setItem(CART_KEY, JSON.stringify(orderProducts));

        this.toastr.success('Order items loaded into cart');

        this.router.navigate(['//customer-dashboard/add-to-cart']);
      },
      error: () => {
        this.toastr.error('Failed to load previous order');
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
    return this.orders
      .filter(o => o.status?.toLowerCase() !== 'cancelled' && o.status?.toLowerCase() !== 'canceled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  canReturn(order: any): boolean {
    if (!order || !order.status) return false;

    if (order.status.toLowerCase() !== 'delivered') return false;

    if (!order.products || order.products.length === 0) return false;

    return order.products.every((p: any) => {
      const returned = p.returnedQty ? p.returnedQty : 0;
      return returned < p.quantity;
    });
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

      const creditUsed = order.creditUsed ?? 0;

      const payable =
        order.payableAmount ??
        order.remainingAmount ??
        order.totalAmount ??
        0;

      Swal.fire({
        title: '<i class="fas fa-box" style="margin-right:8px;"></i>Order Items',

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
            <strong>₹${(order.totalAmount ?? 0).toFixed(2)}</strong>
          </div>

          ${creditUsed > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-top:6px; color:#d32f2f;">
              <strong>Credit Used</strong>
              <strong>-₹${creditUsed.toFixed(2)}</strong>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:17px; color:#2e7d32;">
            <strong>Amount to Pay</strong>
            <strong>₹${payable.toFixed(2)}</strong>
          </div>

        </div>
        `,

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
    if (!this.selectedOrderForReturn || !this.selectedProductIds) return 1;

    const product = this.selectedOrderForReturn.products
      .find((p: any) => p.productId === this.selectedProductIds);

    return product ? product.quantity : 1;
  }

  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }


  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    const start = this.currentGroup * this.pagesPerGroup + 1;
    const end = Math.min(start + this.pagesPerGroup - 1, this.totalPages);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    // move group automatically
    this.currentGroup = Math.floor((page - 1) / this.pagesPerGroup);
  }
  prevGroup() {
    if (this.currentGroup > 0) {
      this.currentGroup--;
      this.goToPage(this.currentGroup * this.pagesPerGroup + 1);
    }
  }

  nextGroup() {
    if ((this.currentGroup + 1) * this.pagesPerGroup < this.totalPages) {
      this.currentGroup++;
      this.goToPage(this.currentGroup * this.pagesPerGroup + 1);
    }
  }

  preventExceedingMax(event: KeyboardEvent, pid: string) {

    const input = event.target as HTMLInputElement;

    const max = this.getMaxReturnQtyForProduct(pid);

    const currentValue = Number(input.value || 0);

    // Allow control keys

    if (

      event.key === 'Backspace' ||

      event.key === 'Delete' ||

      event.key === 'ArrowLeft' ||

      event.key === 'ArrowRight' ||

      event.key === 'Tab'

    ) {

      return;

    }

    // Prevent typing if already at max

    if (currentValue >= max) {

      event.preventDefault();

    }

  }

  validateReturnQty(pid: string) {

    const max = this.getMaxReturnQtyForProduct(pid);

    let qty = this.returnQuantities[pid] || 0;

    if (qty > max) {

      this.returnQuantities[pid] = max;

    }

    if (qty < 0) {

      this.returnQuantities[pid] = 0;

    }

  }

}

