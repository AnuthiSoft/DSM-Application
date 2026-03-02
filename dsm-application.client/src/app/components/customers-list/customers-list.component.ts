import { Component, OnInit } from '@angular/core';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../../services/admin.service';


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
    password: '',        // ✅ EMPTY
    address: '',
    role: 'Customer',
    isRegistered: false,
    isActive: true  
            // ✅ ADD THIS
  };
  employees: any[] = [];
  showPassword = false;
phoneTouched = false;
  searchTerm = '';
  statusFilter = '';
  showModal = false;
  isEdit = false;
  message = '';
  showAssignModal = false;
  selectedCustomerId = '';
  selectedEmployeeId = '';
  // 🔐 Phone + OTP
  phoneError = '';
  otpSent = false;
  otpVerified = false;
  otpCode = '';
  generatedOtp = '';
  formSubmitted = false;
  showStatusSheet = false;
  isSidebarOpen = false;
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedCustomers: Customer[] = [];
  showEmployeeSheet = false;
  selectedEmployeeName = '';

customerOtpSent = false;
customerOtpVerified = false;
customerOtpError = "";
showCustomerOtpPopup = false;

custOtp: string[] = ["", "", "", "", "", ""];
fullCustomerOtp = "";

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private adminService: AdminService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadAllCustomers();
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


  sendCustomerOtp() {
 const phone = this.customer?.phoneNumber;
  if (!phone) return;

  this.adminService.sendOtp(phone).subscribe({
    next: (res) => {
      this.customerOtpSent = true;
      this.customerOtpError = "";
      alert("Customer OTP is: " + res.otp); // remove in production
    },
    error: () => {
      this.customerOtpError = "Failed to send OTP";
    }
  });
}

openCustomerOtpPopup() {
  this.showCustomerOtpPopup = true;
}

closeCustomerOtpPopup() {
  this.showCustomerOtpPopup = false;
}

joinOtp() {
  this.fullCustomerOtp = this.custOtp.join("");
}

focusNext(event: any, nextInput: any) {
  if (event.target.value.length === 1) {
    nextInput.focus();
  }
}


verifyCustomerOtp() {
  this.joinOtp();

  const phone = this.customer.phoneNumber;

  this.adminService.verifyOtp(phone, this.fullCustomerOtp).subscribe({
    next: () => {
      this.customerOtpVerified = true;
      this.customerOtpSent = false;
      this.showCustomerOtpPopup = false; // close popup
      this.customerOtpError = "";
    },
    error: () => {
      this.customerOtpError = "Invalid OTP. Try again.";
    }
  });
}

handleBackspace(event: any, prevInput: any, index: number) {
  if (event.key === "Backspace") {

    // If current box is not empty → clear it
    if (this.custOtp[index]) {
      this.custOtp[index] = "";
      return;
    }

    // If empty → move to previous box
    if (prevInput) {
      prevInput.focus();
      this.custOtp[index - 1] = "";
    }
  }
}
  reportFraudAgainstDistributor() {
    const distributorId = localStorage.getItem('distributorId');

    if (!distributorId) {
      alert('Distributor not found');
      return;
    }

    // 🔴 Customer → Distributor
    this.router.navigate([
      '/report-fraud',
      'DISTRIBUTOR',
      distributorId
    ]);
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

  closeModal() {
    this.customer.password = '';
    this.showPassword = false;

    this.otpSent = false;
    this.otpVerified = false;
    this.otpCode = '';
    this.phoneError = '';

    this.showModal = false;
    document.body.classList.remove('modal-open');
  }




  savePermanentEmployee() {
    if (!this.selectedEmployeeId) {
      this.toastr.warning('Please select an employee');

      return;
    }

    const distributorId = localStorage.getItem('distributorId')!;

    this.customerService.assignPermanentEmployee(
      distributorId,
      this.selectedCustomerId,
      this.selectedEmployeeId
    ).subscribe({
      next: () => {
        this.toastr.success('Permanent employee assigned successfully');

        this.closeAssignModal();
        this.loadAllCustomers();
      },
      error: (err) => {
        this.toastr.error('Failed to assign permanent employee');

      }
    });
  }



  applyFilters() {
    this.filteredCustomers = this.allCustomers.filter(c => {
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
    this.currentPage = 1;
    this.setupPagination();
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
      password: '',
      isActive: true        // ✅ ADD THIS
    };

    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  editCustomer(c: Customer) {
    this.customer = { ...c, customerId: c.customerId ?? (c as any)._id };
    this.isEdit = true;
    this.showModal = true;
  }


 saveCustomer() {
  this.formSubmitted = true;

  // Field-level validation
  if (!this.validateForm()) {
    this.toastr.error('Please fix the highlighted fields');
    return;
  }

  // OTP validation
  if (!this.otpVerified) {
    this.toastr.warning('Please verify phone number using OTP');
    return;
  }

  this.isEdit ? this.updateCustomer() : this.createCustomer();
}


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
    const toast = this.toastr.warning(
      'Click YES to delete this customer',
      'Confirm Delete',
      {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: true,
        tapToDismiss: false
      }
    );

    toast.onTap.subscribe(() => {
      this.customerService.deleteCustomer(customerId).subscribe({
        next: (res: any) => {
          this.toastr.success('Customer deleted successfully');
          this.loadAllCustomers();
        },
        error: () => {
          this.toastr.error('Failed to delete customer');
        }
      });
    });
  }

  loadAllCustomers() {
    this.customerService.getAllCustomersForDistributor()
      .subscribe({
        next: (res) => {
          this.allCustomers = res;
          this.filteredCustomers = res;
          this.setupPagination();
        },
        error: (err) => console.error(err)
      });
  }

  validatePhone(event: any) {
    // allow only digits
    const value = event.target.value.replace(/\D/g, '');
    this.customer.phoneNumber = value;

    // ❌ must start with 6–9 and be max 10 digits
    if (!/^[6-9]\d{0,9}$/.test(value)) {
      this.phoneError = 'Mobile number must start with 6, 7, 8, or 9';
      this.otpSent = false;
      this.otpVerified = false;
      return;
    }

    // ❌ must be exactly 10 digits for OTP
    if (value.length !== 10) {
      this.phoneError = '';
      this.otpVerified = false;
      return;
    }

    // ✅ valid phone
    this.phoneError = '';
  }



  sendOtp() {
    if (this.phoneError || this.customer.phoneNumber.length !== 10) {
      return;
    }

    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpSent = true;
    this.otpVerified = false;
    this.otpCode = '';

    alert(`OTP sent! Your OTP is: ${this.generatedOtp}`);

    // 🔥 Replace later with SMS API
  }

  verifyOtp() {
    if (this.otpCode === this.generatedOtp) {
      this.otpVerified = true;
      this.toastr.success('Phone verified successfully');

    } else {
      this.toastr.error('Invalid OTP');

    }
  }

  openStatusSheet() {
    if (window.innerWidth < 992) {
      this.showStatusSheet = true;
      document.body.classList.add('modal-open');
    }
  }

  closeStatusSheet() {
    this.showStatusSheet = false;
    document.body.classList.remove('modal-open');
  }

  selectStatus(value: string) {
    this.statusFilter = value;
    this.applyFilters();
    this.closeStatusSheet();
  }

  openSidebar() {
    this.isSidebarOpen = true;
    document.body.classList.add('sidebar-open');
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    document.body.classList.remove('sidebar-open');
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(start, end);
  }

  goToPage(page: any) {
    if (typeof page !== 'number') return;

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.updatePaginatedData();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];

    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (this.currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (this.currentPage < this.totalPages - 2) {
      pages.push('...');
    }

    pages.push(this.totalPages);

    return pages;
  }

  openEmployeeSheet() {
    this.showEmployeeSheet = true;
    document.body.classList.add('modal-open');
  }

  closeEmployeeSheet() {
    this.showEmployeeSheet = false;
    document.body.classList.remove('modal-open');
  }

  selectEmployee(emp: any) {
    this.selectedEmployeeId = emp.employeeId;
    this.selectedEmployeeName = emp.name;
    this.closeEmployeeSheet();
  }

validateField(field: string): boolean {
  const value = (this.customer as any)[field]?.toString().trim() || '';
  let error = '';

  switch (field) {
    case 'name':
      if (!value) error = 'Full name is required';
      else if (value.length < 2) error = 'Name must be at least 2 characters';
      break;

    case 'email':
      if (!value) error = 'Email is required';
      else if (!this.emailRegex.test(value))
        error = 'Enter a valid email address';
      break;

    case 'phoneNumber':
      if (!value) error = 'Phone number is required';
      else if (!this.phoneRegex.test(value))
        error = 'Enter valid 10 digit mobile number';
      break;

    case 'password':
      if (!this.isEdit) { // Password required only on create
        if (!value) error = 'Password is required';
        else if (value.length < 6)
          error = 'Password must be at least 6 characters';
      }
      break;

    case 'address':
      if (!value) error = 'Address is required';
      else if (value.length < 5)
        error = 'Address is too short';
      break;
  }

  this.fieldErrors[field] = error;
  return !error;
}
validateForm(): boolean {
  let valid = true;

  valid = this.validateField('name') && valid;
  valid = this.validateField('email') && valid;
  valid = this.validateField('phoneNumber') && valid;
  valid = this.validateField('password') && valid;
  valid = this.validateField('address') && valid;

  return valid;
}

onFieldBlur(field: string) {
  this.validateField(field);
}


onPhoneInput(event: any) {
  let value = event.target.value.replace(/\D/g, '');

  // Limit to 10 digits
  if (value.length > 10) {
    value = value.slice(0, 10);
  }

  this.customer.phoneNumber = value;

  // Reset OTP if number changes
  this.otpSent = false;
  this.otpVerified = false;

  // Clear required error while typing
  this.fieldErrors.phoneNumber = '';

  // Format validation (only if not empty)
  if (value && !/^[6-9]/.test(value)) {
    this.phoneError = 'Mobile number must start with 6, 7, 8, or 9';
  } else {
    this.phoneError = '';
  }
}

onPhoneBlur() {
  this.phoneTouched = true;

  const value = this.customer.phoneNumber;

  if (!value) {
    this.fieldErrors.phoneNumber = 'Phone number is required';
    return;
  }

  if (!/^[6-9]\d{9}$/.test(value)) {
    this.fieldErrors.phoneNumber = 'Enter a valid 10 digit mobile number';
    return;
  }

  this.fieldErrors.phoneNumber = '';
}
  // ================= FIELD VALIDATION =================
fieldErrors: any = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  address: ''
};

// Email regex (production safe)
private emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Phone regex (India)
private phoneRegex =
  /^[6-9]\d{9}$/;


}

