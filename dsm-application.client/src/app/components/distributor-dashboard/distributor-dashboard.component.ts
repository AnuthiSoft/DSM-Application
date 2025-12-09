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
  isMobileMenuOpen = false;
isDarkTheme = false;
openSubmenus: string[] = [];

    // pendingRequests: any[] = [];
  distributorId: string = '';
submenuState: { [key: string]: boolean } = {
  inventory: false,
  orders: false,
  sales: false,
  retailers: false,
  payments: false,
  settings: false
};

// toggleSubmenu(menu: string) {
//   this.submenuState[menu] = !this.submenuState[menu];
// }


isSubmenuOpen(menu: string): boolean {
  return this.openSubmenus.includes(menu);
}
// Add these methods to your component
// toggleMobileMenu() {
//   this.isMobileMenuOpen = !this.isMobileMenuOpen;
// }

// closeMobileMenu() {
//   if (this.isMobileMenuOpen) {
//     this.isMobileMenuOpen = false;
//   }
// }
// Update these methods in your component
toggleSubmenu(menu: string) {
  // Check if the clicked menu is already open
  const isCurrentlyOpen = this.isSubmenuOpen(menu);
  
  // Close all submenus first
  this.closeAllSubmenus();
  
  // If the clicked menu wasn't already open, open it
  if (!isCurrentlyOpen) {
    this.openSubmenus.push(menu);
  }
}


// isSubmenuOpen(menu: string): boolean {
//   return this.openSubmenus.includes(menu);
// }
closeAllSubmenus() {
  this.openSubmenus = [];
}

// Update the setActiveTab method to close submenus when switching tabs
setActiveTab(tab: string) {
  this.activeTab = tab;
  // Don't close submenus here to allow navigation within the same section
}

// Update the toggleMobileMenu method

toggleMobileMenu() {
  this.isMobileMenuOpen = !this.isMobileMenuOpen;
}
// Update the closeMobileMenu method
closeMobileMenu() {
  if (this.isMobileMenuOpen) {
    this.isMobileMenuOpen = false;
  }
}
toggleTheme() {
  this.isDarkTheme = !this.isDarkTheme;
  // You can add logic to apply the theme to the document
  if (this.isDarkTheme) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
}
currentDate: Date = new Date();
  // acceptedCustomers: ConnectionRequestDto[] = [];
  // loading = false;

 ngOnInit(): void {
    this.distributorId = localStorage.getItem('distributorId') || '';
    // this.loadRequests();
      // this.loadAcceptedCustomers();
  }

//   loadRequests() {
//     this.distributorService.getPendingRequests(this.distributorId).subscribe(res => {

//       this.pendingRequests = res;
//     });
//   }

// respond(request: any, accept: boolean) {
//   if (!request.connectionId) {
//     console.error('No connectionId found!', request);
//     return;
//   }
//   this.distributorService.respondConnection(request.connectionId, accept)
//     .subscribe(() => this.loadRequests());
// }
//   loadAcceptedCustomers() {
//     this.loading = true;
//     this.distributorService.getAcceptedCustomers(this.distributorId || undefined).subscribe({
//       next: data => { this.acceptedCustomers = data; this.loading = false; },
//       error: err => { console.error(err); this.loading = false; }
//     });
//   }
//    disconnect(connectionId: string) {
//     if (!confirm('Are you sure you want to disconnect this customer?')) return;
//     this.distributorService.disconnectCustomer(connectionId).subscribe({
//       next: (res: any) => {
//         alert(res?.message || 'Customer disconnected');
//         this.loadAcceptedCustomers();
//       },
//       error: err => {
//         console.error(err);
//         alert('Failed to disconnect customer');
//       }
//     });
//   }
  // Switch tab
  // setActiveTab(tab: string): void {
  //   this.activeTab = tab;
  // }

  // Check if a tab is active
  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

   logout(): void {
    this.auth.logout();
    window.location.href = "/distributor-login";
  }
}
