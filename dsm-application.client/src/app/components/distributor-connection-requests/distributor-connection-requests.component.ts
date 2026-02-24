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
  currentPage = 1;
  itemsPerPage = 5;

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
      next: data => { this.acceptedCustomers = data; this.currentPage = 1; this.loading = false; },
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

  get paginatedCustomers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.acceptedCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.acceptedCustomers.length / this.itemsPerPage);
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
