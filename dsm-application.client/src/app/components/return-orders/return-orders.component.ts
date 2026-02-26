import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import Swal from 'sweetalert2';
import { ReturnApiService } from '../../services/return-api.service'

@Component({
  selector: 'app-return-orders',
  templateUrl: './return-orders.component.html',
  styleUrl: './return-orders.component.css'
})
export class ReturnOrdersComponent implements OnInit {
  pageSize = 4;          // 4 returns per page
currentPage = 1;
totalPages = 1;

pagesPerGroup = 5;     // show 1–5, 6–10
currentGroup = 0;

  @Output() returnUpdated = new EventEmitter<void>();
 
 returnOrders: any[] = [];
  loading = true;

  // UI-only state (frontend driven)
  selectedResolution: Record<string, string> = {};
  selectedMethod: Record<string, string> = {};
  selectedSlot: Record<string, string> = {};

  constructor(private returnApiService: ReturnApiService) { }

  ngOnInit(): void {
    this.loadReturnOrders();
  }

  loadReturnOrders() {
    this.loading = true;

    this.returnApiService.getReturnHistory().subscribe({
      next: (res) => {
  this.returnOrders = res;

  this.currentPage = 1;
  this.currentGroup = 0;
  this.totalPages = Math.ceil(this.returnOrders.length / this.pageSize) || 1;

  this.loading = false;
},
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Failed to load return orders', 'error');
      }
    });
  }

  get paginatedReturns() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.returnOrders.slice(start, start + this.pageSize);
}

get pages(): number[] {
  const start = this.currentGroup * this.pagesPerGroup + 1;
  const end = Math.min(start + this.pagesPerGroup - 1, this.totalPages);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

goToPage(page: number) {
  if (page < 1 || page > this.totalPages) return;

  this.currentPage = page;
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

  // Helpers
  isPending(r: any) {
    return r.status === 'Pending';
  }

  isApproved(r: any) {
    return r.status === 'Approved' || r.status === 'PickupConfirmed';
  }



  isReceived(r: any) {
    return r.status === 'Received';
  }

  isCompleted(r: any) {
    return r.status === 'Completed';
  }

  timelineActive(step: string, r: any): boolean {
    const order = [
      'Pending',
      'PickupConfirmed',
      'Received',
      'Completed'
    ];

    return order.indexOf(r.status) >= order.indexOf(step);
  }


  viewDetails(r: any) {
    Swal.fire({
      title: 'Return Details',
      html: `
        <div style="text-align:left">
          <p><b>Return ID:</b> ${r.id}</p>
          <p><b>Order ID:</b> ${r.orderId}</p>
          <p><b>Product ID:</b> ${r.productId}</p>
           <p><b>Product Name:</b> ${r.productName || 'N/A'}</p>
        <p><b>Price:</b> ₹${r.price?.toFixed(2) || 'N/A'}</p>
          <p><b>Quantity:</b> ${r.returnQty}</p>
          <p><b>Status:</b> ${r.status}</p>
          <p><b>Reason:</b> ${r.reason}</p>
          <p><b>Created:</b> ${new Date(r.createdAt).toLocaleString()}</p>
        </div>
      `,
      width: 500
    });
  }
  // ✅ Can customer cancel return?
  canCancel(r: any): boolean {
    // Allow cancel only if still pending
    return r.status === 'Pending';
  }

// ✅ Cancel return
cancelReturn(r: any) {
  Swal.fire({
    title: 'Cancel Return?',
    text: 'Are you sure you want to cancel this return request?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel it'
  }).then(result => {
    if (result.isConfirmed) {
      this.returnApiService
        .rejectReturn(r.id, 'Cancelled by customer')
        .subscribe(() => {
 
          r.status = 'Rejected';
          this.returnUpdated.emit();   // 🔥 Notify parent to refresh orders
 
          Swal.fire('Cancelled', 'Return request cancelled', 'success');
        });
    }
  });
}
 

  // ✅ Does this return need user action?
  needsAction(r: any): boolean {
    // Example: customer needs to confirm pickup
    return r.status === 'PickupConfirmed';
  }

  // ✅ Customer confirms pickup
  confirmPickup(r: any) {
    if (r.pickupConfirmed || r.status === 'Received') return;

    this.returnApiService.employeePickup(r.returnId).subscribe({
      next: () => {
        r.pickupConfirmed = true;
        r.showPickupForm = false;
        r.status = 'Received';   // MATCH backend
        r.pickupTime = new Date();
      },
      error: err => {
        Swal.fire('Error', err.error?.message || 'Failed', 'error');
      }
    });
  }
}