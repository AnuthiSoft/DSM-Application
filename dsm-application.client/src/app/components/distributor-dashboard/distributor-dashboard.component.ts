import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-distributor-dashboard',
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.css'
})
export class DistributorDashboardComponent {

  constructor(
    
    private auth: AuthService
  ) {}
  activeTab: string = 'dashboard'; // default tab

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
