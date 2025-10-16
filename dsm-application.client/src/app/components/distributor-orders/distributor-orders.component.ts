import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DistributorOrder, Employee } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import {   EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-distributor-orders',
  templateUrl: './distributor-orders.component.html',
  styleUrl: './distributor-orders.component.css'
})
export class DistributorOrdersComponent implements OnInit{
   distributorId = localStorage.getItem('distributorId') || '';
   empId = localStorage.getItem('employeeId') || '';

  orders: DistributorOrder[] = [];
  employees: Employee[] = [];
  loading = false;
  filteredEmployees: Employee[] = [];   // ✅ for search/filter results
  statusFilter = 'All';
  statuses = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Rejected'];
  showAssignModal = false;


  // For assignment modal
  // selectedOrder: DistributorOrder | null = null;
  employeeId = '';
  selectedOrder: any;

  constructor(
    private orderService: OrderService,
    private employeeService: EmployeeService, private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadEmployees();
  }

  loadOrders(): void {
    if (!this.distributorId) return;
    this.loading = true;
    const status = this.statusFilter === 'All' ? undefined : this.statusFilter;
    this.orderService.getOrdersByDistributor(this.distributorId, status).subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; alert('Failed to load orders'); }
    });
  }

  loadEmployees() {
    if (!this.distributorId) {
      console.error('DistributorId not found in localStorage!');
      return;
    }

    this.orderService.getOrderEmployees(this.distributorId).subscribe({
      next: (res) => {
        console.log('✅ Employees loaded:', res);
        // filter only active employees
        this.employees = res.filter(e => e.isActive);
      },
      error: (err) => console.error('❌ Failed to load employees:', err)
    });
  }
  confirmOrder(order: DistributorOrder) {
    if (!confirm(`Confirm order ${order.id}?`)) return;
    this.updateStatus(order, 'Confirmed');
  }

  rejectOrder(order: DistributorOrder) {
    if (!confirm(`Reject order ${order.id}?`)) return;
    this.updateStatus(order, 'Rejected');
  }

// openAssignModal(orderId: string) {
//   const modal = document.getElementById('assignModal');
//   if (modal) {
//     modal.style.display = 'block';
//     this.selectedOrder = orderId;
//   } else {
//     console.warn('assignModal not found in DOM');
//   }
// }
// ✅ Fixed: accepts full order object
 openAssignModal(order: DistributorOrder) {
  this.selectedOrder = order;
  this.filteredEmployees = this.employees.filter(e => e.isActive);
    this.cd.detectChanges();  // forces Angular to refresh the template
}
 closeAssignModal() {
  this.selectedOrder = null;
  this.employeeId = '';
}

  assignAndShip() {
    if (!this.selectedOrder || !this.employeeId) {
      alert('Please select an employee to assign the order.');
      return;
    }

   this.orderService.assignOrder(this.selectedOrder.id, {
  employeeId: this.employeeId,
  employeeName: this.filteredEmployees.find(e => e.employeeId === this.employeeId)?.name,
   note: 'Assigned by distributor' // ✅ Added note
}).subscribe({
  next: () => {
    alert('Order assigned and shipped successfully!');
    this.closeAssignModal();
    this.loadOrders();
  },
  error: (err) => {
    console.error('Error assigning order:', err);
    alert('Failed to assign order.');
  }
});
  }


  markDelivered(order: DistributorOrder) {
    if (!confirm(`Mark order ${order.id} as Delivered?`)) return;
    this.updateStatus(order, 'Delivered');
  }

  updateStatus(order: DistributorOrder, status: string) {
    this.orderService.updateStatus(order.id, status).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Status updated');
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed update', err);
        alert(err?.error || 'Failed to update status');
      }
    });
  }

  subtotal(o: DistributorOrder) {
    return o.products.reduce((s, p) => s + (p.price * p.quantity), 0);
  }
    // ✅ Added function to fix your template error
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge bg-warning text-dark';
      case 'Confirmed':
        return 'badge bg-primary';
      case 'Shipped':
        return 'badge bg-info text-dark';
      case 'Delivered':
        return 'badge bg-success';
      case 'Rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
