import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ConnectionRequestDto, DistributorService } from '../../services/distributor.service';
import { CustomerService } from '../../services/customer.service';
import { HttpClient } from '@angular/common/http';

import { Router } from '@angular/router';


@Component({
  selector: 'app-distributor-dashboard',
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.css'
})
export class DistributorDashboardComponent  implements OnInit{


  orderedDate: string = '';
  expectedDate: string = '';
  expectedDays: number = 1; // default
  leadTime:number = 1;
  

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
    // this.loadRequests();
      // this.loadAcceptedCustomers();
      // this.distributorId = localStorage.getItem('distributorId') || '';

  // Load only ONCE when component is created
  const stored = localStorage.getItem(`leadTime_${this.distributorId}`);
  this.expectedDays = stored ? Number(stored) : 1;
       this.loadRetailerCount();
        this.loadEmployees();              // ⬅ added
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

// ==============================
  // ⭐ LOAD ALL EMPLOYEES FOR DROPDOWN
  // ==============================
  loadEmployees(){
  this.http.get(`http://192.168.1.21:5164/api/Employees/by-distributor/${this.distributorId}`)
    .subscribe((res:any)=>{
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

  // // Update the setActiveTab method to close submenus when switching tabs
  // setActiveTab(tab: string) {
  //   this.activeTab = tab;
  //   // Don't close submenus here to allow navigation within the same section
  // }

  setActiveTab(tab: string) {
  this.activeTab = tab;     // ✅ this controls page display
  this.closeAllSubmenus();  // optional
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



  
saveLeadTime() {
  localStorage.setItem(`leadTime_${this.distributorId}`, this.leadTime.toString());
  alert("Delivery lead time saved!");
}

saveExpectedDayss() {
  localStorage.setItem(`leadTime_${this.distributorId}`, this.expectedDays.toString());
  alert("Expected delivery days saved!");
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
    this.auth.logout();
    window.location.href = "/distributor-login";
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


}
