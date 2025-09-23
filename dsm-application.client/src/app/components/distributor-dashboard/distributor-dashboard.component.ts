import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ConnectionRequestDto, DistributorService } from '../../services/distributor.service';

@Component({
  selector: 'app-distributor-dashboard',
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.css'
})
export class DistributorDashboardComponent {

  constructor(
    
    private auth: AuthService,private distributorService: DistributorService
  ) {}
  activeTab: string = 'dashboard'; // default tab
    pendingRequests: any[] = [];
  distributorId: string = '';
  
  acceptedCustomers: ConnectionRequestDto[] = [];
  loading = false;

 ngOnInit(): void {
    this.distributorId = localStorage.getItem('distributorId') || '';
    this.loadRequests();
      this.loadAcceptedCustomers();
  }

  loadRequests() {
    this.distributorService.getPendingRequests(this.distributorId).subscribe(res => {

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
   disconnect(connectionId: string) {
    if (!confirm('Are you sure you want to disconnect this customer?')) return;
    this.distributorService.disconnectCustomer(connectionId).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Customer disconnected');
        this.loadAcceptedCustomers();
      },
      error: err => {
        console.error(err);
        alert('Failed to disconnect customer');
      }
    });
  }
  // Switch tab
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Check if a tab is active
  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

   logout(): void {
    this.auth.logout();
    window.location.href = "/distributor-login";
  }
}
