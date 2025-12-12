import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DistributorOrder, Employee } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import {   EmployeeService } from '../../services/employee.service';
import { DistributorService } from '../../services/distributor.service';

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
assignMode: 'temp' | 'perm' = 'temp';
activeEmployeeId: string = '';
activeEmployeeName = '';
tempEmployeeId = '';
showTempDropdown = false;

  // For assignment modal
  // selectedOrder: DistributorOrder | null = null;
  employeeId = '';
  selectedOrder: any;

employeeAvailability: {
  [customerId: string]: {
    permanentEmployeeId: string | null,
    permanentEmployeeAvailable: boolean,
    permanentReason: string | null,

    temporaryEmployeeId: string | null,
    temporaryEmployeeAvailable: boolean,
    temporaryReason: string | null,

    isTemporaryActiveToday: boolean
  }
} = {}
  constructor(
    private orderService: OrderService,
    private employeeService: EmployeeService, private distService :DistributorService,private cd: ChangeDetectorRef
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
    next: (data) => { 
      this.orders = data; 
      this.loading = false;

      // 🔥 Load availability for each customer on list load
      this.orders.forEach(o => {
        this.loadAvailabilityForCustomer(o.customerId);
      });
    },
    error: (err) => {
      console.error(err); 
      this.loading = false; 
      alert('Failed to load orders'); 
    }
  });
}
loadAvailabilityForCustomer(customerId: string) {
  this.distService.getCustomerEmployeeStatus(this.distributorId, customerId)
    .subscribe(status => {
      this.employeeAvailability[customerId] = status;
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
        this.employees = res
  .map((e: any) => ({
    ...e,
    employeeId: e.employeeId || e.id || e._id
  }))
  .filter(e =>
    e.isActive === true &&
    e.designation === 'Delivery Boy' &&     // 👈 Only Delivery Boys
    e.distributorId === this.distributorId  // 👈 Must belong to this distributor
  );
      this.filteredEmployees = this.employees;
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

  // LOAD employees for dropdown
  this.filteredEmployees = this.employees;

  // 🔥 Load availability from backend
  this.distService.getCustomerEmployeeStatus(
    this.distributorId,
    order.customerId
  ).subscribe(status => {

    // Save availability in object for UI
    this.employeeAvailability[order.customerId] = status;

    // Decide active employee
    this.activeEmployeeId =
      status.temporaryEmployeeId ||
      status.permanentEmployeeId ||
      '';

    const emp = this.employees.find(e => e.employeeId === this.activeEmployeeId);
    this.activeEmployeeName = emp ? emp.name : "No employee assigned";

    // Show temp dropdown ONLY if permanent employee exists AND NOT AVAILABLE
    this.showTempDropdown =
      !!status.permanentEmployeeId &&
      status.permanentEmployeeAvailable === false;

  });
}
closeAssignModal() {
  this.selectedOrder = null;
  this.tempEmployeeId = '';
}

  assignAndShip() {
  if (!this.selectedOrder) return;

  const customerId = this.selectedOrder.customerId;
  const availability = this.employeeAvailability[customerId];

  // ⭐ CASE 1: Permanent Employee Available → AUTO ASSIGN + AUTO SHIP
  if (availability?.permanentEmployeeAvailable && availability.permanentEmployeeId) {

    const empId = availability.permanentEmployeeId;
    const emp = this.employees.find(e => e.employeeId === empId);

    this.orderService.assignOrder(this.selectedOrder.id, {
      employeeId: empId,
      employeeName: emp?.name || '',
      note: "Auto assignment to permanent employee"
    }).subscribe(() => {

      // ⭐ SHIP AUTOMATICALLY
      this.orderService.updateStatus(this.selectedOrder.id, "Shipped").subscribe(() => {

        alert("Order auto-assigned to permanent employee & shipped.");
        this.closeAssignModal();
        this.loadOrders();

      });

    });

    return;
  }

  // ⭐ CASE 2: Permanent NOT available → TEMP chosen
  if (this.tempEmployeeId) {

    this.distService.assignTempToday(
      this.distributorId,
      customerId,
      this.tempEmployeeId
    ).subscribe(() => {

      // Assign to selected temp employee
      this.finalOrderAssign(this.tempEmployeeId);

    });

    return;
  }

  alert("Temporary employee not selected");
}
finalOrderAssign(employeeId: string) {

  const emp = this.employees.find(e => e.employeeId === employeeId);

  this.orderService.assignOrder(this.selectedOrder.id, {
    employeeId: employeeId,
    employeeName: emp?.name || '',
    note: "Assigned manually"
  }).subscribe(() => {

    this.orderService.updateStatus(this.selectedOrder.id, "Shipped").subscribe(() => {
      alert("Order assigned & shipped successfully");
      this.closeAssignModal();
      this.loadOrders();
    });

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
  totalAmount(o: any): number {
  if (!o || !o.products || o.products.length === 0) {
    return o?.totalAmount ?? 0;
  }

  const subtotal = o.products.reduce((sum: number, p: any) => {
    const price = Number(p.price ?? p.unitPrice ?? 0);
    const qty = Number(p.quantity ?? p.qty ?? 1);
    return sum + price * qty;
  }, 0);

  // ✅ Safe fallback discount handling
  const discount = Number((o.discount ?? o.totalDiscount ?? 0) || 0);

  return Math.max(subtotal - discount, 0);
}

   assignTempToCustomer() {
  if (!this.selectedOrder || !this.employeeId) {
    alert('Please select an employee.');
    return;
  }

  const distributorId = this.distributorId;
  const customerId = this.selectedOrder.customerId;

  this.distService.assignTempToday(distributorId, customerId, this.employeeId)
    .subscribe({
      next: () => {
        alert('Temporary employee assigned for today.');
        this.closeAssignModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to assign temporary employee');
      }
    });
}
selectedEmployeeId = '';

savePermanentEmployee() {
  if (!this.selectedOrder || !this.selectedEmployeeId) {
    alert("Select an employee");
    return;
  }

  this.distService.assignPermanentEmployee(
    this.distributorId,
    this.selectedOrder.customerId,
    this.selectedEmployeeId
  ).subscribe({
    next: () => {
      alert("Permanent employee assigned successfully!");
      this.loadOrders();
    },
    error: (err) => {
      console.error(err);
      alert("Failed to assign permanent employee");
    }
  });
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
