import { Component, OnDestroy, OnInit } from '@angular/core';
import { DistributorOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';

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
    
 
    activeTab: string = 'dashboard';
  employeeName: string = '';
  employeeId: string = '';
  orderStats = { assigned: 0, completed: 0, pending: 0 };
  performanceRating: number = 4.5;
  recentOrders: DistributorOrder[] = [];

  // ✅ Fix: Define as Task[]
  todayTasks: Task[] = [
    { title: 'Check pending deliveries', dueTime: '09:30 AM', priority: 'High' },
    { title: 'Confirm customer payments', dueTime: '01:00 PM', priority: 'Medium' },
    { title: 'Update delivery routes', dueTime: '04:30 PM', priority: 'Low' }
  ];

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.employeeName = localStorage.getItem('employeeName') || 'Employee';
    this.employeeId = localStorage.getItem('employeeId') || '';
    this.loadDashboardData();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  // logout(): void {
  //   localStorage.clear();
  //   this.router.navigate(['/login']);
  // }

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
    alert('Tasks refreshed successfully!');
  }

  updateStatus(): void {
    alert('Status updated successfully!');
  }

  viewSchedule(): void {
    alert('Schedule viewed successfully!');
  }
    // ✅ Proper logout functionality
  logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('employeeName');
  localStorage.removeItem('employeeId');
  localStorage.removeItem('distributorId');

  this.router.navigate(['/employee-login']);
}

}
