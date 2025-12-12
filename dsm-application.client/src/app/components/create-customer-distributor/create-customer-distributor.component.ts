// import { Component, OnInit } from '@angular/core';

// import { CustomerService } from '../../services/customer.service';
// import { Customer } from '../../models/customer.model';

// @Component({
//   selector: 'app-create-customer-distributor',
//   templateUrl: './create-customer-distributor.component.html',
//   styleUrl: './create-customer-distributor.component.css'
// })
// export class CreateCustomerDistributorComponent implements OnInit {
//   customer: Customer = {
//     name: '', email: '', phoneNumber: '',
//     role: 'Customer',
//     address: '',
//     isActive: undefined
//   };
//   message = '';
//   customers: Customer[] = [];

//   constructor(private customerService: CustomerService) {}
//   ngOnInit(): void {
//     this.loadCustomers();
//   }

//   createCustomer() {
//     this.customerService.createByDistributor(this.customer).subscribe({
//       next: (res: any) => this.message = res.message,
//       error: (err) => this.message = err.error
//     });
//   }
//   loadCustomers() {
//   this.customerService.getMyCustomers().subscribe({
//     next: (res: Customer[]) => {
//       // If you want to store the list in a separate array
//       this.customers = res; 
//       this.message = ''; // clear message on success
//     },
//     error: (err) => {
//       this.customers = [];
//       this.message = err.error || 'Failed to load customers';
//     }
//   });
// }
//   // Update customer
//   updateCustomer(cust: Customer) {
//     this.customerService.updateCustomer(cust.customerId!, cust).subscribe({
//       next: (res: any) => {
//         this.message = res.message;
//         this.loadCustomers(); // Refresh after update
//       },
//       error: (err) => this.message = err.error || 'Failed to update customer'
//     });
//   }

//   // Delete customer
//   deleteCustomer(customerId: string) {
//     if (!confirm('Are you sure you want to delete this customer?')) return;

//     this.customerService.deleteCustomer(customerId!).subscribe({
//       next: (res: any) => {
//         this.message = res.message;
//         this.loadCustomers(); // Refresh after delete
//       },
//       error: (err) => this.message = err.error || 'Failed to delete customer'
//     });
//   }
  

// }

import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-create-customer-distributor',
  templateUrl: './create-customer-distributor.component.html',
  styleUrl: './create-customer-distributor.component.css'
})
export class CreateCustomerDistributorComponent implements OnInit {

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

showAssignModal = false;
selectedCustomerId = '';
selectedEmployeeId = '';

  searchTerm = '';
  statusFilter = '';
  showModal = false;
  isEdit = false;
  message = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadEmployees();
  }

  loadCustomers() {
    this.customerService.getMyCustomers().subscribe({
      next: (res: Customer[]) => {
        this.customers = res;
        this.applyFilters();
      },
      error: () => {
        this.customers = [];
        this.filteredCustomers = [];
        this.message = 'Failed to load customers';
      }
    });
  }
  loadEmployees() {
  const distId = localStorage.getItem('distributorId')!;

  this.customerService.getEmployees(distId).subscribe((res: any[]) => {
    this.employees = res
      .filter(e => e.isActive)                           // only active
      .filter(e => e.designation === "Delivery Boy");    // only delivery boys
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
      this.loadCustomers();
    },
    error: (err) => {
      alert("Failed to assign permanent employee");
    }
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
    this.customer = { ...c };
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

  createCustomer() {
    this.customerService.createByDistributor(this.customer).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.closeModal();
        this.loadCustomers();
      },
      error: (err) => {
        this.message = err.error || 'Failed to create customer';
      }
    });
  }

  /* ----------------------------- UPDATE ------------------------------ */

  updateCustomer() {
    if (!this.customer.customerId) return;

    this.customerService.updateCustomer(this.customer.customerId, this.customer).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.closeModal();
        this.loadCustomers();
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
        this.loadCustomers();
      },
      error: (err) => {
        this.message = err.error || 'Failed to delete customer';
      }
    });
  }
  
}

