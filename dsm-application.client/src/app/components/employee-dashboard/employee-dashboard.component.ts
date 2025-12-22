import { Component, OnDestroy, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ToastrService } from 'ngx-toastr';

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
  employeeName: string = '';
  employeeId: string = '';
  orderStats = { assigned: 0, completed: 0, pending: 0 };
  performanceRating: number = 4.5;
  recentOrders: DistributorOrder[] = [];
  showReasonInput = false;
  reasonText = "";
  designation: string | null = null;
  canSeeInvoices: boolean = false;


  // ✅ Fix: Define as Task[]
  todayTasks: Task[] = [
    { title: 'Check pending deliveries', dueTime: '09:30 AM', priority: 'High' },
    { title: 'Confirm customer payments', dueTime: '01:00 PM', priority: 'Medium' },
    { title: 'Update delivery routes', dueTime: '04:30 PM', priority: 'Low' }
  ];
  employeeRole = '';

  constructor(private orderService: OrderService, private router: Router, private employeeService: EmployeeService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.employeeName = localStorage.getItem('employeeName') || 'Employee';
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.employeeRole = (localStorage.getItem('employeeDesignation') || '').toLowerCase();
    // Read from the correct key and normalize text
    this.designation = (localStorage.getItem("employeeDesignation") || "").trim().toLowerCase();
    this.canSeeInvoices = this.designation.includes("delivery boy");

    this.loadDashboardData();
    this.loadAvailability();
  }

  setActiveTab(tab: string) {
    console.log("Switched to tab:", tab);
    this.activeTab = tab;
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
        alert('Availability updated!');
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
        this.orderStats.assigned = orders.filter(o => o.status === 'Assigned').length;
        this.orderStats.completed = orders.filter(o => o.status === 'Delivered').length;
        this.orderStats.pending = orders.filter(o => o.status !== 'Delivered').length;
      },
      error: (err) => console.error('Error loading orders:', err)
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
  // ✅ Proper logout functionality
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('distributorId');
    localStorage.removeItem('designation');
    this.router.navigate(['/employee-login']);
  }
  submitReason() {
    if (!this.reasonText.trim()) {
      this.toastr.warning("Please enter a valid reason.","warning");
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    this.employeeService.markAvailability({
      employeeId: this.employeeId,
      date: today,
      isAvailable: false,
      reason: this.reasonText
    }).subscribe(() => {
      this.toastr.success("Availability updated!","Success");
      this.showReasonInput = false;
      this.reasonText = "";
      this.loadAvailability();
    });
  }

  cancelReason() {
    this.showReasonInput = false;
    this.reasonText = "";
  }

}
