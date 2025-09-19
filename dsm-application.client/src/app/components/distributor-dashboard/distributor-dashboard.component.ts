import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DistributorService } from '../../services/distributor.service';

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

 ngOnInit(): void {
    this.distributorId = localStorage.getItem('distributorId') || '';
    this.loadRequests();
  }

  loadRequests() {
    this.distributorService.getPendingRequests(this.distributorId).subscribe(res => {

      this.pendingRequests = res;
    });
  }

respond(request: any, accept: boolean) {
  if (!request.ConnectionId) {
    console.error('No connectionId found!', request);
    return;
  }
  this.distributorService.respondConnection(request.ConnectionId, accept)
    .subscribe(() => this.loadRequests());
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
