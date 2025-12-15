import { Component, OnInit } from '@angular/core';

import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css']
})
export class CustomersListComponent implements OnInit {
  allCustomers: Customer[] = [];
  // filteredCustomers: Customer[] = [];
   customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
customer: Customer = {
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  role: 'Customer',
  isRegistered: false,
  isActive: true          // ✅ ADD THIS
};
employees: any[] = [];

  searchTerm = '';
  statusFilter = '';
  showModal = false;
  isEdit = false;
  message = '';
showAssignModal = false;
selectedCustomerId = '';
selectedEmployeeId = '';
  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this. loadAllCustomers();
        this.loadEmployees();
    
  }
   loadEmployees() {
  const distId = localStorage.getItem('distributorId')!;

  this.customerService.getEmployees(distId).subscribe((res: any[]) => {
    this.employees = res
      .filter(e => e.isActive)                           // only active
      .filter(e => e.designation === "Delivery Boy");    // only delivery boys
  });
}
openAssignModal(customerId: string) {
  this.selectedCustomerId = customerId;
  this.selectedEmployeeId = '';
  this.showAssignModal = true;
}

closeAssignModal() {
  this.showAssignModal = false;
  this.selectedEmployeeId = '';
}
savePermanentEmployee() {
  if (!this.selectedEmployeeId) {
    alert("Select an employee");
    return;
  }

  const distributorId = localStorage.getItem('distributorId')!;

  this.customerService.assignPermanentEmployee(
    distributorId,
    this.selectedCustomerId,
    this.selectedEmployeeId
  ).subscribe({
    next: () => {
      alert("Permanent employee assigned successfully");
      this.closeAssignModal();
      this.loadAllCustomers();
    },
    error: (err) => {
      alert("Failed to assign permanent employee");
    }
  });
}


  applyFilters() {
    this.filteredCustomers = this.customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.phoneNumber ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        !this.statusFilter ||
        (this.statusFilter === 'registered' && c.isRegistered) ||
        (this.statusFilter === 'unregistered' && !c.isRegistered);

      return matchesSearch && matchesStatus;
    });
  }

  /* ----------------------------- Modal ------------------------------ */

  openCustomerModal() {
    this.isEdit = false;
    this.customer = {
      
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  role: 'Customer',
  isRegistered: false,
  isActive: true        // ✅ ADD THIS
};

    this.showModal = true;
  }

editCustomer(c: Customer) {
  this.customer = { ...c, customerId: c.customerId ?? (c as any)._id };
  this.isEdit = true;
  this.showModal = true;
}
  closeModal() {
    this.showModal = false;
  }

  saveCustomer() {
    this.isEdit ? this.updateCustomer() : this.createCustomer();
  }

  /* ----------------------------- CREATE ------------------------------ */

 

  /* ----------------------------- UPDATE ------------------------------ */
createCustomer() {
    this.customerService.createByDistributor(this.customer).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.closeModal();
        this.loadAllCustomers();
      },
      error: (err) => {
        this.message = err.error || 'Failed to create customer';
      }
    });
  }
updateCustomer() {
  if (!this.customer.customerId) {
    console.error("Missing customerId for update");
    return;
  }

  this.customerService.updateCustomer(this.customer.customerId, this.customer)
    .subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.closeModal();
        this.loadAllCustomers();
      },
      error: (err) => {
        this.message = err.error || 'Failed to update customer';
      }
    });
}

  /* ----------------------------- DELETE ------------------------------ */

  deleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    this.customerService.deleteCustomer(customerId).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this. loadAllCustomers();
      },
      error: (err) => {
        this.message = err.error || 'Failed to delete customer';
      }
    });
  }
    loadAllCustomers() {
    this.customerService.getAllCustomersForDistributor()
      .subscribe({
        next: (res) => {
          this.allCustomers = res;
          this.filteredCustomers = res;
        },
        error: (err) => console.error(err)
      });
  }
}
