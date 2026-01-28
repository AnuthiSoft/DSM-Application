import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ConnectionRequestDto, DistributorService } from '../../services/distributor.service';
import { CustomerService } from '../../services/customer.service';
import { HttpClient } from '@angular/common/http';
 
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
 
 
@Component({
  selector: 'app-distributor-dashboard',
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.css'
})
export class DistributorDashboardComponent implements OnInit {
  isSidebarCollapsed: boolean = false;

  orderedDate: string = '';
  expectedDate: string = '';
  expectedDays: number = 1; // default
  leadTime: number = 1;
  selectedQrFile: File | null = null;
scannerQrUrl: string | null = null;
 
  constructor(
 
    private auth: AuthService,
    private distributorService: DistributorService,
    private router: Router,   // ✅ ADD THIS
    private customerService: CustomerService,
    private http: HttpClient
  ) { }


  retailerCount: number = 0;
  activeTab: string = 'dashboard'; // default tab
  isMobileMenuOpen = false;
  isDarkTheme = false;
  openSubmenus: string[] = [];
  selectedInvoiceId: string | null = null;

  // pendingRequests: any[] = [];
  distributorId: string = '';
  // ==============================
  // 🚀 LIVE TRACKING VARIABLES
  // ==============================
  selectedEmployeeId: string = "";     // ⬅ added
  employees: any[] = [];               // ⬅ added
  //polylinePath: any[] =[];
 
  @ViewChild('trackingComp') trackingComp: any;
 
 
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
  ngOnInit() {
    this.distributorId = localStorage.getItem('distributorId') || '';
     // ✅ RESTORE ACTIVE TAB
  const savedTab = localStorage.getItem('distributorActiveTab');
  this.activeTab = savedTab ? savedTab : 'dashboard';

  // ✅ RESTORE SUBMENU STATE (optional)
  const savedSubmenus = localStorage.getItem('distributorOpenSubmenus');
  if (savedSubmenus) {
    this.openSubmenus = JSON.parse(savedSubmenus);
  }

    // this.loadRequests();
    // this.loadAcceptedCustomers();
    // this.distributorId = localStorage.getItem('distributorId') || '';
  // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      this.isSidebarCollapsed = savedSidebarState === 'true';
    }
  // Load only ONCE when component is created
  const stored = localStorage.getItem(`leadTime_${this.distributorId}`);
  this.expectedDays = stored ? Number(stored) : 1;
       this.loadRetailerCount();
        this.loadEmployees();              // ⬅ added
        this.loadScannerQr();
            // Check screen width on init
    this.checkScreenWidth();
  }
    @HostListener('window:resize', ['$event'])
 

  checkScreenWidth() {
    if (window.innerWidth <= 768) {
     this.isSidebarCollapsed = false; // disable collapse on mobile
    }
  }

  // Add this method to toggle sidebar
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', this.isSidebarCollapsed.toString());
  }

 
loadRetailerCount() {
  this.customerService.getAllCustomersForDistributor().subscribe({
    next: (res) => {
      this.retailerCount = res.length;
    },
    error: (err) => {
      console.error("Failed to load retailers", err);
      this.retailerCount = 0;
    }
  });
}
loadScannerQr() {
  if (!this.distributorId) return;
 
  this.distributorService.getScannerQr(this.distributorId)
    .subscribe({
      next: res => {
        this.scannerQrUrl = res?.scannerQrUrl || null; // blob name
      },
      error: () => {
        this.scannerQrUrl = null;
      }
    });
}

  // ==============================
  // ⭐ LOAD ALL EMPLOYEES FOR DROPDOWN
  // ==============================
  loadEmployees() {
    this.http.get(`http://192.168.1.21:5164/api/Employees/by-distributor/${this.distributorId}`)
      .subscribe((res: any) => {
        this.employees = res;
        console.log("Loaded Employees:", res);
      });
  }


  // ==============================
  // ▶ START TRIP
  // ==============================
  startTrip() {
    if (!this.selectedEmployeeId) {
      alert("Select employee first!");
      return;
    }

    this.http.post(`http://192.168.1.21:5164/api/Delivery/start`, {
      employeeId: this.selectedEmployeeId
    }).subscribe({
      next: () => {
        alert("Trip Started");

        // ✅ START MAP POLLING
        if (this.trackingComp) {
          this.trackingComp.startPolling();
        }
      },
      error: (err) => {
        console.error(err);
        alert(err.error || "Failed to start trip");
      }
    });
  }



  // ==============================
  // ⏹ STOP TRIP
  // ==============================
  stopTrip() {
    if (!this.selectedEmployeeId) {
      alert("Select employee first!");
      return;
    }

    this.http.post(`http://192.168.1.21:5164/api/Delivery/stop`, {
      employeeId: this.selectedEmployeeId
    }).subscribe({
      next: () => {
        alert("Trip Ended");

        // ✅ REMOVE ONLY THIS EMPLOYEE FROM MAP
        if (this.trackingComp) {
          this.trackingComp.removeEmployee(this.selectedEmployeeId);
        }
      },
      error: err => {
        console.error(err);
        alert("Failed to stop trip");
      }
    });
  }




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
  const isCurrentlyOpen = this.isSubmenuOpen(menu);

  this.closeAllSubmenus();

  if (!isCurrentlyOpen) {
    this.openSubmenus.push(menu);
  }

  // ✅ SAVE SUBMENU STATE
  localStorage.setItem(
    'distributorOpenSubmenus',
    JSON.stringify(this.openSubmenus)
  );
}

 
 
  // isSubmenuOpen(menu: string): boolean {
  //   return this.openSubmenus.includes(menu);
  // }
closeAllSubmenus() {
  this.openSubmenus = [];
  localStorage.removeItem('distributorOpenSubmenus');
}

  // // Update the setActiveTab method to close submenus when switching tabs
  // setActiveTab(tab: string) {
  //   this.activeTab = tab;
  //   // Don't close submenus here to allow navigation within the same section
  // }

setActiveTab(tab: string, invoiceId?: string) {
  this.activeTab = tab;

  // ✅ SAVE ACTIVE TAB
  localStorage.setItem('distributorActiveTab', tab);

  // Close submenus (your existing logic)
  this.closeAllSubmenus();

  if (invoiceId) {
    this.selectedInvoiceId = invoiceId;
  }
}

 
  // Update the toggleMobileMenu method
 
toggleMobileMenu() {
  this.isMobileMenuOpen = !this.isMobileMenuOpen;

  // 🔥 force expanded sidebar on mobile
  if (this.isMobileMenuOpen && window.innerWidth <= 768) {
    this.isSidebarCollapsed = false;
  }
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




  saveLeadTime() {
    localStorage.setItem(`leadTime_${this.distributorId}`, this.leadTime.toString());
    alert("Delivery lead time saved!");
  }

  saveExpectedDayss() {
    localStorage.setItem(`leadTime_${this.distributorId}`, this.expectedDays.toString());
    alert("Expected delivery days saved!");
  }



  getScannerQrUrl(blobName: string | null): string {
    if (!blobName) return '';
    return `${environment.apiUrl}/distributor/scanner-qr/view/${blobName}`;
  }

  //   saveExpectedDays() {
  //   localStorage.setItem("expectedDays", this.expectedDays.toString());
  //   console.log("Expected Days saved:", this.expectedDays);
  // }

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
  Swal.fire({
    title: 'Logout Confirmation',
    text: 'Are you sure you want to logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    allowOutsideClick: false,

    // 🌙 Dark / Light mode support
    background: getComputedStyle(document.documentElement)
      .getPropertyValue('--card-bg'),
    color: getComputedStyle(document.documentElement)
      .getPropertyValue('--text-color'),

    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d'
  }).then((result) => {
    if (result.isConfirmed) {

      // ✅ CLEAR DISTRIBUTOR UI STATE
      localStorage.removeItem('distributorActiveTab');
      localStorage.removeItem('distributorOpenSubmenus');
      localStorage.removeItem('sidebarCollapsed');

      // ✅ AUTH CLEANUP
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('distributorId');

      this.auth.logout();

      // ✅ SUCCESS FEEDBACK
      Swal.fire({
        icon: 'success',
        title: 'Logged out',
        text: 'You have been logged out successfully',
        timer: 1200,
        showConfirmButton: false,
        background: getComputedStyle(document.documentElement)
          .getPropertyValue('--card-bg'),
        color: getComputedStyle(document.documentElement)
          .getPropertyValue('--text-color')
      });

      setTimeout(() => {
        this.router.navigate(['/distributor-login']);
      }, 1200);
    }
  });
}
 
 
  onExpectedDate() {
    if (!this.orderedDate) return;
    const date = new Date(this.orderedDate);
    date.setDate(date.getDate() + 1);
    this.expectedDate = date.toISOString().split('T')[0];
  }
 
  onOrderedDate() {
    console.log("Ordered Date button clicked");
  }


  // onEmployeeSelect() {
  //   console.log("Employee changed → Clearing map polyline");

  //   // Clear map route inside child component
  //   if (this.trackingComp) {
  //     this.trackingComp.clearPolyline();
  //   }

//   // Also clear local route
//   this.polylinePath = [];
// }
onQrSelected(event: any) {
  this.selectedQrFile = event.target.files[0];
}
 
uploadScannerQr() {
  if (!this.selectedQrFile || !this.distributorId) return;
 
  this.distributorService
    .uploadScannerQr(this.distributorId, this.selectedQrFile)
    .subscribe({
      next: (res) => {
        this.scannerQrUrl = res?.scannerQrUrl || null;
        alert('Scanner QR uploaded successfully');
        this.selectedQrFile = null;
      },
      error: () => {
        alert('Failed to upload QR');
      }
    });
}
 
 @HostListener('window:resize')
onResize() {
  if (window.innerWidth <= 768) {
    this.isSidebarCollapsed = false;
  }
}

}
 
 