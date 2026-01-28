import { Component } from '@angular/core';
import { ConnectionRequestDto, DistributorService } from '../../services/distributor.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-distributor-connection-requests',
  templateUrl: './distributor-connection-requests.component.html',
  styleUrl: './distributor-connection-requests.component.css'
})
export class DistributorConnectionRequestsComponent {
  pendingRequests: any[] = [];
  acceptedCustomers: ConnectionRequestDto[] = [];

  loading = false;
  distributorId: string = '';
  constructor(private distributorService: DistributorService, private toastr: ToastrService) { }
  ngOnInit(): void {
    this.distributorId = localStorage.getItem('distributorId') || '';
    this.loadRequests();
    this.loadAcceptedCustomers();


  }
  loadRequests() {
    this.distributorService.getPendingRequests(this.distributorId).subscribe(res => {
      console.log('Pending Requests:', res);
      this.pendingRequests = res;
    });
  }

  respond(request: any, accept: boolean) {
    if (!request.connectionId) {
      console.error('No connectionId found!', request);
      return;
    }
    this.distributorService.respondConnection(request.connectionId, accept)
      .subscribe(() => this.loadRequests());
  }
  loadAcceptedCustomers() {
    this.loading = true;
    this.distributorService.getAcceptedCustomers(this.distributorId || undefined).subscribe({
      next: data => { this.acceptedCustomers = data; this.loading = false; },
      error: err => { console.error(err); this.loading = false; }
    });
  }

disconnect(customerId: string, distributorId: string) {
  Swal.fire({
    title: 'Are you sure you want to disconnect this customer?',
    icon: 'warning',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Ok',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'swal-confirm-popup',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      this.distributorService
        .disconnectCustomer({ customerId, distributorId })
        .subscribe({
          next: () => {
            this.toastr.success(' Customer Disconnected successfully');
            this.loadAcceptedCustomers();
      },
      error: () => {
        this.toastr.error('Failed to disconnect customer');
      }
    });
    }
  });
}



}
