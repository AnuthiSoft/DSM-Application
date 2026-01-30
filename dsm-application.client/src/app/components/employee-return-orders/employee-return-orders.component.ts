import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ReturnApiService } from '../../services/return-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-return-orders',
  templateUrl: './employee-return-orders.component.html',
  styleUrl: './employee-return-orders.component.css'
})
export class EmployeeReturnOrdersComponent {

    constructor(private http: HttpClient,private returnApiService: ReturnApiService) {}


    showModal = false;
selected: any = {};
previewImage: string | null = null;

   ngOnInit(): void {
  const employeeId = localStorage.getItem('employeeId');
  if (!employeeId) return;

  this.returnApiService
    .getReturnsAssignedToEmployee(employeeId)
    .subscribe(res => this.returns = res);
}



  returns: any[] = [];

markReached(r: any) {
  this.selected = r;
  this.previewImage = null;
  this.showModal = true;
}
onModalFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.selected.selectedFile = file;

  const reader = new FileReader();
  reader.onload = e => this.previewImage = e.target?.result as string;
  reader.readAsDataURL(file);
}
closeModal() {
  this.showModal = false;
}
confirmPickupFromModal() {
  if (!this.selected.selectedFile) {
    alert("Please upload product photo");
    return;
  }
  if (!this.selected.tagPresent || !this.selected.packagingIntact) {
    alert("Please check all conditions");
    return;
  }

  this.confirmPickup(this.selected);
  this.showModal = false;
}


onFileSelected(event: any, r: any) {
  r.selectedFile = event.target.files[0];
}

confirmPickup(r: any) {
  if (r.pickupConfirmed) return; // 🛑 safety guard

  this.returnApiService.employeePickup(r.returnId).subscribe(() => {
    r.pickupConfirmed = true;      // ✅ disables buttons
    r.showPickupForm = false;     // hide form
    r.status = 'PickedUp';        // optional but recommended
    r.pickupTime = new Date();    // for UI display
  });
}


contactCustomer(r: any) {
  Swal.fire(
    'Contact Customer',
    `Call customer at ${r.customerPhone || 'N/A'}`,
    'info'
  );
}

navigateToLocation(r: any) {
  Swal.fire(
    'Navigation',
    'Map navigation will be available soon.',
    'info'
  );
}

viewDetails(r: any) {
  Swal.fire({
    title: 'Return Details',
    html: `
      <div style="text-align:left">
        <p><b>Return ID:</b> ${r.returnId}</p>
        <p><b>Order ID:</b> ${r.orderId}</p>
        <p><b>Product:</b> ${r.productName}</p>
        <p><b>Quantity:</b> ${r.returnQty}</p>
        <p><b>Status:</b> ${r.status}</p>
      </div>
    `,
    width: 400
  });
}


cancelPickup(r: any) {
  Swal.fire(
    'Not Allowed',
    'Pickup cancellation is not available yet.',
    'info'
  );
}


// cancelPickup(r: any) {
//   Swal.fire(
//     'Not Allowed',
//     'Pickup cancellation is not available yet.',
//     'info'
//   );
// }

getStatusText(r: any): string {
  switch (r.status) {
    case 'Assigned':
      return 'Assigned for Pickup';
    case 'PickupConfirmed':
      return 'On the Way';
    case 'Received':
      return 'Pickup Completed';
    case 'Cancelled':
      return 'Pickup Cancelled';
    default:
      return 'Assigned';
  }
}

getStatusIcon(r: any): string {
  switch (r.status) {
    case 'Assigned':
      return 'fa-box';
    case 'PickupConfirmed':
      return 'fa-truck';
    case 'Received':
      return 'fa-check-circle';
    case 'Cancelled':
      return 'fa-times-circle';
    default:
      return 'fa-box';
  }
}

getPickupStatus(r: any): string {
  switch (r.status) {
    case 'Assigned':
      return 'assigned';
    case 'PickupConfirmed':
      return 'in-progress';
    case 'Received':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'assigned';
  }
}

refreshPickups() {
  const employeeId = localStorage.getItem('employeeId');
  if (!employeeId) return;

  this.returnApiService
    .getReturnsAssignedToEmployee(employeeId)
    .subscribe(res => this.returns = res);
}

getStatusCount(status: string): number {
  return this.returns.filter(r =>
    (r.status || '').toLowerCase() === status.toLowerCase()
  ).length;
}







}
