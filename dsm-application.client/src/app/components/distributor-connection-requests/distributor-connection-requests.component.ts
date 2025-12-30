import { Component } from '@angular/core';
import { ConnectionRequestDto, DistributorService } from '../../services/distributor.service';

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
constructor(private distributorService: DistributorService) {}
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
  if (!confirm('Are you sure you want to disconnect this customer?')) return;

  this.distributorService
    .disconnectCustomer({ customerId, distributorId })
    .subscribe({
      next: () => {
        alert('Customer disconnected');
        this.loadAcceptedCustomers();
      },
      error: () => alert('Failed to disconnect customer')
    });
}


}
