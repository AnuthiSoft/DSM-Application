import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

interface Task {
  title: string;
  dueTime: string;
  priority: string;
}
@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css'
})
export class EmployeeDashboardComponent implements OnInit {
  availabilityStatus: 'available' | 'not-available' | 'unknown' = 'unknown';
  availabilityReason: string = '';

  activeTab: string = 'dashboard';
  showAddToCart = false; // 👈 NEW


  employeeName: string = '';
  employeeId: string = '';
  orderStats = { assigned: 0, completed: 0, pending: 0 };
  performanceRating: number = 4.5;
  recentOrders: DistributorOrder[] = [];
  showReasonInput = false;
  reasonText = "";
  designation = '';
  canSeeInvoices = false;
  isCashCollector = false;
  isDeliveryBoy = false;
  // Add these properties for sidebar functionality
  isSidebarCollapsed: boolean = false;
  isMobileMenuOpen = false;
  isDarkTheme = false;
  showLogoutConfirm = false;
  // ✅ Fix: Define as Task[]
  todayTasks: Task[] = [
    { title: 'Check pending deliveries', dueTime: '09:30 AM', priority: 'High' },
    { title: 'Confirm customer payments', dueTime: '01:00 PM', priority: 'Medium' },
    { title: 'Update delivery routes', dueTime: '04:30 PM', priority: 'Low' }
  ];
  employeeRole = '';

  constructor(private orderService: OrderService,
    private router: Router,
    private employeeService: EmployeeService,
    private toastr: ToastrService) { }

  // ngOnInit(): void {
  //   this.employeeName = localStorage.getItem('employeeName') || 'Employee';
  //   this.employeeId = localStorage.getItem('employeeId') || '';
  //   this.employeeRole = (localStorage.getItem('employeeDesignation') || '').toLowerCase();
  //   // Read from the correct key and normalize text
  //   this.designation = (localStorage.getItem("employeeDesignation") || "").trim().toLowerCase();
  //   this.canSeeInvoices = this.designation.includes("delivery boy");

  //   this.loadDashboardData();
  //   this.loadAvailability();
  // 

  ngOnInit(): void {
    // Load sidebar state
    const savedSidebarState = localStorage.getItem('employeeSidebarCollapsed');
    if (savedSidebarState !== null) {
      this.isSidebarCollapsed = savedSidebarState === 'true';
    }

    // Load active tab
    const savedTab = localStorage.getItem('employeeActiveTab');
    this.activeTab = savedTab ? savedTab : 'dashboard';

    // Check screen width
    this.checkScreenWidth();
    this.employeeName = localStorage.getItem('employeeName') || 'Employee';
    this.employeeId = localStorage.getItem('employeeId') || '';

    this.designation = (localStorage.getItem('designation') || '')
      .trim()
      .toLowerCase();

    // ✅ ROLE FLAGS
    this.isCashCollector = this.designation.includes('cash');
    this.canSeeInvoices = this.designation.includes('delivery');
    this.isDeliveryBoy = this.designation.includes('delivery');

    this.loadDashboardData();
    this.loadAvailability();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('employeeSidebarCollapsed', this.isSidebarCollapsed.toString());
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  openEmployeeAddToCart() {
    this.activeTab = 'employee-add-to-cart';
  }

  backToProducts() {
    this.activeTab = 'products';
  }


  setActiveTab(tab: string) {
    console.log("Switched to tab:", tab);
    this.activeTab = tab;
    // Save active tab to localStorage
    localStorage.setItem('employeeActiveTab', tab);
    this.closeMobileMenu();
  }

  openAddToCart() {
    this.showAddToCart = true;
  }






  closeAddToCart() {
    this.showAddToCart = false;
  }



  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  // logout(): void {
  //   localStorage.clear();
  //   this.router.navigate(['/login']);
  // }
  loadAvailability() {
    if (!this.employeeId) return;

    const today = new Date().toISOString().split('T')[0];

    this.employeeService.getAvailability(this.employeeId, today).subscribe({
      next: (res) => {
        this.availabilityStatus = res.isAvailable ? 'available' : 'not-available';
        this.availabilityReason = res.reason || '';
      },
      error: () => {
        this.availabilityStatus = 'unknown';
      }
    });
  }
  markAvailability(isAvailable: boolean) {
    const today = new Date().toISOString().split('T')[0];

    if (isAvailable) {
      // Directly mark available
      this.employeeService.markAvailability({
        employeeId: this.employeeId,
        date: today,
        isAvailable: true,
        reason: ''
      }).subscribe(() => {
        this.toastr.success('Availability updated!');
        this.loadAvailability();
      });
    } else {
      // Show input popup for reason
      this.showReasonInput = true;
    }
  }

  loadDashboardData(): void {
    if (!this.employeeId) return;

    this.orderService.getOrdersByEmployee(this.employeeId).subscribe({
      next: (orders) => {
        this.recentOrders = orders.slice(0, 5);

        // ✅ ASSIGNED = SHIPPED (not delivered yet)
        this.orderStats.assigned = orders.filter(
          o => o.status === 'Shipped'
        ).length;

        // ✅ COMPLETED = DELIVERED
        this.orderStats.completed = orders.filter(
          o => o.status === 'Delivered'
        ).length;

        // ✅ PENDING = everything not delivered
        this.orderStats.pending = orders.filter(
          o => o.status !== 'Delivered'
        ).length;
      },
      error: err => console.error('Error loading orders:', err)
    });
  }

  refreshTasks(): void {
    this.toastr.success('Tasks refreshed successfully!');
  }

  updateStatus(): void {
    this.toastr.success('Status updated successfully!');
  }

  viewSchedule(): void {
    this.toastr.success('Schedule viewed successfully!');
  }
  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }
  // ✅ Proper logout functionality
  logout(): void {
    Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true,

      // Dark mode support
      background: getComputedStyle(document.documentElement)
        .getPropertyValue('--card-bg'),
      color: getComputedStyle(document.documentElement)
        .getPropertyValue('--text-color'),

      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {

        // Clear UI state
        localStorage.removeItem('employeeActiveTab');
        localStorage.removeItem('employeeSidebarCollapsed');

        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('employeeName');
        localStorage.removeItem('employeeId');
        localStorage.removeItem('distributorId');
        localStorage.removeItem('designation');

        Swal.fire({
          html: `
    <div style="
      width:72px;
      height:72px;
      border-radius:50%;
      background: rgba(82,196,26,0.12);
      display:flex;
      align-items:center;
      justify-content:center;
      margin:0 auto 14px;
    ">
      <div style="
        width:48px;
        height:48px;
        border-radius:50%;
        background:#52c41a;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow: 0 6px 16px rgba(82,196,26,0.35);
      ">
        <i class="fas fa-check" style="color:white;font-size:22px;"></i>
      </div>
    </div>

    <h2 style="margin:0 0 6px;font-size:20px;">Logged out</h2>
    <p style="margin:0;font-size:14px;opacity:.8;">
      You have been logged out successfully
    </p>
  `,

          width: 360,
          padding: '1.5rem 1.5rem 1.8rem',

          showConfirmButton: false,
          timer: 1300,
          timerProgressBar: true,

          allowOutsideClick: false,
          allowEscapeKey: false,

          backdrop: 'rgba(0,0,0,0.55)',

          background: getComputedStyle(document.documentElement)
            .getPropertyValue('--card-bg'),
          color: getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color')
        });

        setTimeout(() => {
          this.router.navigate(['/employee-login']);
        }, 1300);
      }
    });
  }


  submitReason() {
    if (!this.reasonText.trim()) {
      this.toastr.warning("Please enter a valid reason.", "warning");
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    this.employeeService.markAvailability({
      employeeId: this.employeeId,
      date: today,
      isAvailable: false,
      reason: this.reasonText
    }).subscribe(() => {
      this.toastr.success("Availability updated!", "Success");
      this.showReasonInput = false;
      this.reasonText = "";
      this.loadAvailability();
    });
  }

  cancelReason() {
    this.showReasonInput = false;
    this.reasonText = "";
  }

  goToTab(tab: string) {
    this.setActiveTab(tab);
  }

}
