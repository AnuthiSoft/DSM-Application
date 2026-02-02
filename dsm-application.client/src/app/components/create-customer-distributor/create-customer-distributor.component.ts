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
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-customer-distributor',
  templateUrl: './create-customer-distributor.component.html',
  styleUrl: './create-customer-distributor.component.css'
})
export class CreateCustomerDistributorComponent implements OnInit {

  otpSent = false;
  otpVerified = false;
  otpFailed = false;
  otpCode = '';
  phoneVerifiedUI = false;
  allowPhoneEdit = false;
  originalPhoneNumber = '';


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

  email = '';
  confirmDelete: string | null = null;

  constructor(private customerService: CustomerService,
    private toastr: ToastrService
    , private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadEmployees();
  }


  sendOtp() {
    const phone = this.customer.phoneNumber;

    if (!phone || phone.length < 10) {
      alert('Enter a valid 10-digit phone number');
      return;
    }

    this.adminService.sendOtp(phone).subscribe({
      next: (res) => {
        this.otpSent = true;
        this.otpFailed = false;

        // ⭐ SHOW THE OTP FROM BACKEND
        alert("OTP sent! Your OTP is: " + res.otp);

        console.log("OTP from backend:", res.otp);
      },
      error: () => alert("Failed to send OTP")
    });
  }

  verifyOtp() {
    const phone = this.customer.phoneNumber;

    this.adminService.verifyOtp(phone, this.otpCode).subscribe({
      next: (res) => {

        console.log("Verify response:", res);

        if (res.valid || res.success === true) {
          this.otpVerified = true;
          this.phoneVerifiedUI = true;
          this.otpFailed = false;
          alert("Phone number verified!");
        } else {
          this.otpFailed = true;
        }
      },
      error: (err) => {
        console.error("OTP verification error:", err);
        this.otpFailed = true;
        alert('OTP verification failed!');
      }
    });
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
      password: '', // ✅ ADD

      isActive: true        // ✅ ADD THIS
    };
    this.otpSent = false;
    this.otpVerified = false;
    this.otpFailed = false;
    this.otpCode = '';
    this.phoneVerifiedUI = false;


    this.showModal = true;
  }

  editCustomer(c: Customer) {
    this.isEdit = true;
    this.showModal = true;

    this.customer = {
      ...c,
      phoneNumber: c.phoneNumber?.startsWith('+91')
        ? c.phoneNumber.slice(3)
        : c.phoneNumber
    };

    this.originalPhoneNumber = this.customer.phoneNumber || '';

    this.allowPhoneEdit = false;     // 🔒 readonly
    this.phoneVerifiedUI = true;     // ✅ already verified

    this.otpSent = false;
    this.otpVerified = true;
    this.otpFailed = false;
  }

  enablePhoneEdit() {
    this.allowPhoneEdit = true;
    this.phoneVerifiedUI = false;
    this.otpSent = false;
    this.otpVerified = false;
    this.otpCode = '';
  }


  closeModal() {
    this.showModal = false;
  }

  saveCustomer() {

    if (
      this.isEdit &&
      this.allowPhoneEdit &&
      this.customer.phoneNumber !== this.originalPhoneNumber &&
      !this.phoneVerifiedUI
    ) {
      this.toastr.warning('Please verify the new phone number');
      return;
    }

    if (this.isEdit && !this.customer.password?.trim()) {
      delete (this.customer as any).password;
    }

    const payload: Customer = {
      ...this.customer,
      phoneNumber: '+91' + this.customer.phoneNumber
    };

    this.isEdit
      ? this.updateCustomer(payload)
      : this.createCustomer(payload);
  }

  /* ----------------------------- CREATE ------------------------------ */

  restrictPhoneInput(event: any) {
    let value = event.target.value;

    // allow digits only
    value = value.replace(/\D/g, '');

    // max 10 digits
    value = value.slice(0, 10);

    // first digit must be 6–9
    if (value.length === 1 && !/^[6-9]$/.test(value)) {
      value = '';
    }

    event.target.value = value;
    this.customer.phoneNumber = value;
  }



  createCustomer(customer: Customer) {
    this.customerService.createByDistributor(customer).subscribe({
      next: () => {
        this.toastr.success('Customer created successfully', 'Success');
        this.closeModal();
        this.loadCustomers();
      },
      error: () => {
        this.toastr.error('Failed to create customer', 'Error');
      }
    });
  }

  /* ----------------------------- UPDATE ------------------------------ */

  updateCustomer(customer: Customer) {
    if (!customer.customerId) return;

    this.customerService.updateCustomer(customer.customerId, customer).subscribe({
      next: () => {
        this.toastr.success('Customer updated successfully', 'Updated');
        this.closeModal();
        this.loadCustomers();
      },
      error: () => {
        this.toastr.error('Failed to update customer', 'Error');
      }
    });
  }

  deleteCustomer(customerId: string): void {
  Swal.fire({
    title: 'Are you sure you want to delete this customer?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#aaa',
    backdrop: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.customerService.deleteCustomer(customerId).subscribe({
        next: () => {
          this.toastr.success('Customer deleted successfully');
          this.loadCustomers();
        },
        error: () => {
          this.toastr.error('Failed to delete customer');
        }
      });
    }
  });
}

}
