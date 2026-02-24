import { Component, OnInit } from '@angular/core';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


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
    isActive: true          // ✅ ADD THIS
  };
  employees: any[] = [];
  showPassword = false;

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

  constructor(
    private customerService: CustomerService,
    private router: Router,
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

    if (
      !this.customer.name ||
      !this.customer.email ||
      !this.customer.phoneNumber ||
      !this.customer.address ||
      !this.customer.password
    ) {
      this.toastr.error('All fields are required');

      return;
    }

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
}
