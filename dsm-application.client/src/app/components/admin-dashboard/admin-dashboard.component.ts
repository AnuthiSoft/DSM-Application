import { Component, HostListener, OnInit } from '@angular/core';
import { AdminService, Distributor } from '../../services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import Swal from 'sweetalert2';


// Capital letter validator
export function firstLetterCapital(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return control.value[0] === control.value[0].toUpperCase()
    ? null
    : { firstLetterCapital: true };
}

// GST Validator (India – 15 chars)
export function gstValidator(control: AbstractControl): ValidationErrors | null {
  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(control.value) ? null : { invalidGST: true };
}

export function firstLetterCapitalValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const firstChar = value.charAt(0);
  return firstChar === firstChar.toUpperCase()
    ? null
    : { firstLetterCapital: true };
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})



export class AdminDashboardComponent implements OnInit {
  isSidebarCollapsed: boolean = false;
  isMobileMenuOpen = false;

  // ⭐ Required for tab switching
  activeTab: string = 'dashboard';
  otpSent = false;
  otpVerified = false;
  otpFailed = false;
  otpCode = "";
  phoneVerifiedUI = false;

  categories: any[] = [];
  pendingCategories: any[] = [];
  isModalOpen = false;
  isMobileView = false;
  // PAGINATION
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedDistributors: Distributor[] = [];


  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
otpArray = [1, 2, 3, 4, 5, 6];
otpValues: string[] = ["", "", "", "", "", ""];

onOtpKeyUp(event: any, index: number) {
  const input = event.target;

  if (input.value && index < 5) {
    const next = input.nextElementSibling;
    if (next) next.focus();
  }
}

onOtpKeyDown(event: KeyboardEvent, index: number) {
  const key = event.key;

  // Block non-numeric input except Backspace
  if (!/[0-9]/.test(key) && key !== "Backspace") {
    event.preventDefault();
    return;
  }

  // Handle Backspace
  if (key === "Backspace") {

    // CASE 1: If current box has a number → clear it only
    if (this.otpValues[index]) {
      this.otpValues[index] = "";
      return; 
    }

    // CASE 2: If empty → move to previous box and delete it
    if (index > 0) {
      const prevInput = document.querySelectorAll(".otp-box")[index - 1] as HTMLInputElement;
      this.otpValues[index - 1] = "";
      prevInput.focus();
    }
  }
}



  // ------------------- OTP VERIFY -------------------
  verifyOtp() {
  const otp = this.otpValues.join("");

  if (otp.length !== 6) {
    alert("Please enter all 6 digits");
    return;
  }

  const phone = this.distributorForm.get("phoneNumber")!.value;

  this.adminService.verifyOtp(phone, otp).subscribe({
    next: () => {
      this.otpVerified = true;
      this.phoneVerifiedUI = true;
      this.otpSent = false;
    },
    error: () => {
      this.otpFailed = true;
    }
  });
}



  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
  distributors: Distributor[] = [];
  filteredDistributors: Distributor[] = [];
  selectedDistributor: Distributor | null = null;
  distributorForm!: FormGroup;
  isEdit = false;
  message = '';
  email = '';
  searchText = '';
  role: string | null = null;
  customCategory: string = "";
  totalDistributors = 0;
  activeDistributors = 0;
  inactiveDistributors = 0;
  premiumDistributors = 0;
  formSubmitted = false;
  pendingDeleteId: string | null = null;
  isDarkMode = false;

  private distributorModal: bootstrap.Modal | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private auth: AuthService,
    private categoryService: CategoryService,
    private toastr: ToastrService,

  ) { }



  ngOnInit(): void {
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('adminSidebarCollapsed');
    if (savedSidebarState !== null) {
      this.isSidebarCollapsed = savedSidebarState === 'true';
    }
    this.loadDistributors();
    this.initForm();
    this.role = this.auth.getRole();
    this.loadCategories();
    this.loadPendingCategories();

    // 🔴 Clear phone duplicate error on change
    this.distributorForm.get('phoneNumber')?.valueChanges.subscribe(() => {
      this.distributorForm.get('phoneNumber')?.setErrors(null);
    });

    // 🔵 Initialize modal instance (UI only)
    const modalEl = document.getElementById('distributorModal');
    if (modalEl) {
      this.distributorModal = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.isModalOpen = false;
      });

      modalEl.addEventListener('shown.bs.modal', () => {
        this.isModalOpen = true;
      });
    }


  // Enable Bootstrap Tooltips
  setTimeout(() => {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map((el: any) => new bootstrap.Tooltip(el));
  }, 500);
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = true;
    }

    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
  }

  checkScreen() {
    this.isMobileView = window.innerWidth <= 768;
  }

  // Toggle sidebar collapse/expand
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('adminSidebarCollapsed', this.isSidebarCollapsed.toString());
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = false;
    }
  }

  loadCategories() {
    this.categoryService.getAll().subscribe(res => {
      this.categories = res;
    });
  }

  loadPendingCategories() {
    this.categoryService.getAll().subscribe((cats: any[]) => {
      this.pendingCategories = cats.filter(c => c.status === 'pending');
    });
  }

  approve(id: string) {
    this.categoryService.approve(id).subscribe(() => {
      this.toastr.success("Category Approved");
      this.loadPendingCategories();
    });
  }

  reject(id: string) {
    const reason = prompt("Enter rejection reason");

    if (!reason) return;

    this.categoryService.reject(id, reason).subscribe(() => {
      this.toastr.error("Category Rejected");
      this.loadCategories();
    });
  }






  restrictPhoneInput(event: any) {
    const input = event.target.value;

    // Allow unlimited characters for email,
    // but restrict pure numbers to max 10 digits.
    if (/^[0-9]+$/.test(input)) {
      event.target.value = input.substring(0, 10);
      this.email = event.target.value;
    }
  }

  initForm(): void {
    this.distributorForm = this.fb.group({
      distributorId: [''],

      companyName: [
        '',
        [
          Validators.required,
          firstLetterCapitalValidator   // 👈 ADD HERE
        ]
      ],

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          firstLetterCapital   // ✅ Capital letter check
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(254)
        ]
      ],

      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(\+91)?[6-9]\d{9}$/)
        ]
      ],

      gst: [
        '',
        [
          Validators.required,
          gstValidator // ✅ Proper GST validation
        ]
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.minLength(10) // ✅ Address length
        ]
      ],

      isPremium: [false],
      isActive: [false, Validators.requiredTrue]
    });
  }




  loadDistributors(): void {
    this.adminService.getDistributors().subscribe({
      next: res => {
        this.distributors = res;
        this.filteredDistributors = res;

        this.totalDistributors = res.length;
        this.activeDistributors = res.filter(d => d.isActive).length;
        this.inactiveDistributors = res.filter(d => !d.isActive).length;
        this.premiumDistributors = res.filter(d => d.isPremium).length;
        this.setupPagination();
      },
      error: err => console.error(err)
    });
  }

 openAdd(): void {
  this.isEdit = false;
  this.selectedDistributor = null;

  this.otpSent = false;
  this.otpVerified = false;
  this.otpFailed = false;
  this.phoneVerifiedUI = false;
  this.otpValues = ["", "", "", "", "", ""]; // reset 6 boxes

  this.distributorForm.reset({ isActive: true, isPremium: true });
  this.isModalOpen = true;
  this.distributorModal?.show();
}

  openEdit(d: Distributor): void {
    this.isEdit = true;
    this.selectedDistributor = d;
    this.formSubmitted = false;

    this.distributorForm.reset();

    this.distributorForm.patchValue({
      distributorId: d.distributorId,
      companyName: d.companyName,
      name: d.name,
      email: d.email,

      // 🔥 REMOVE +91 IF PRESENT
      phoneNumber: d.phoneNumber?.replace(/^(\+91)/, ''),

      gst: d.gst,
      address: d.address,
      isActive: d.isActive,
      isPremium: d.isPremium
    });
    this.isMobileMenuOpen = false;
    this.isModalOpen = true;
    this.selectedDistributor = d;
    this.distributorModal?.show();
  }

  otpModalRef: any;

openOtpPopup() {
  const modalEl = document.getElementById("otpModal");
  this.otpModalRef = new bootstrap.Modal(modalEl!);
  this.otpModalRef.show();
}

closeOtpPopup() {
  this.otpModalRef?.hide();
}

// When clicking Send OTP button
sendOtp() {
  const phone = this.distributorForm.get("phoneNumber")!.value;

  this.adminService.sendOtp(phone).subscribe({
    next: (res) => {
      this.otpSent = true;
      this.otpFailed = false;

      // Open OTP Popup
      this.openOtpPopup();

      alert("OTP sent! Your OTP is: " + res.otp);
    },
    error: () => alert("Failed to send OTP")
  });
}

// When verifying OTP from popup
verifyOtpPopup() {
  const otp = this.otpValues.join("");

  if (otp.length !== 6) {
    alert("Please enter all 6 digits");
    return;
  }

  const phone = this.distributorForm.get("phoneNumber")!.value;

  this.adminService.verifyOtp(phone, otp).subscribe({
    next: () => {
      this.otpVerified = true;
      this.phoneVerifiedUI = true;
      this.otpSent = false;
      this.closeOtpPopup();
    },
    error: () => {
      this.otpFailed = true;
    }
  });
}

resendOtpFromPopup() {
  this.sendOtp(); // reuse logic
}

  togglePremium(d: Distributor) {
    if (d.isPremium) {
      this.adminService.removePremium(d.distributorId).subscribe({
        next: () => d.isPremium = false,
        error: (err) => console.error(err)
      });
    } else {
      this.adminService.setPremium(d.distributorId).subscribe({
        next: () => d.isPremium = true,
        error: (err) => console.error(err)
      });
    }
  }

  // saveDistributor(): void {
  //   if (this.distributorForm.invalid) {
  //     this.distributorForm.markAllAsTouched();
  //     return;
  //   }

  //   const dist = this.distributorForm.value;
  //   console.log("Submitting distributor:", dist);
  //   // if (dist.categories.includes('Others') && dist.customCategory.trim()) {
  //   //   dist.categories = dist.categories
  //   //     .filter((c: string) => c !== 'Others')
  //   //     .concat(dist.customCategory.trim());
  //   // }
  //   // delete dist.customCategory; // ✅ remove before sending to API

  //   if (this.isEdit && this.selectedDistributor) {
  //     this.adminService.updateDistributor(this.selectedDistributor!.distributorId, dist).subscribe({
  //       next: () => {
  //         this.toastr.success('Distributor updated successfully', 'Updated');
  //         this.loadDistributors();
  //         this.distributorModal?.hide();
  //       },
  //       error: () => {
  //         this.toastr.error('Update failed', 'Error');
  //       }
  //     });

  //   } else {
  //     this.adminService.addDistributor(dist).subscribe({
  //       next: () => {
  //         this.toastr.success('Distributor added successfully', 'Success');
  //         this.loadDistributors();
  //         this.distributorModal?.hide();
  //       },
  //       error: () => {
  //         this.toastr.error('Failed to add distributor', 'Error');
  //       }
  //     });
  //   }
  // }

  saveDistributor(): void {
    this.formSubmitted = true;

    if (this.distributorForm.invalid) {
      this.distributorForm.markAllAsTouched();
      return;
    }

    const dist = { ...this.distributorForm.value };

    if (this.isEdit && this.selectedDistributor) {
      this.adminService
        .updateDistributor(this.selectedDistributor.distributorId, dist)
        .subscribe(() => {
          this.toastr.success('Distributor updated successfully');
          this.loadDistributors();
          this.distributorModal?.hide();
        });
    } else {
      this.adminService.addDistributor(dist).subscribe({
        next: () => {
          if (this.isMobileView) {
            alert('Distributor added successfully');
          } else {
            this.toastr.success('Distributor added successfully');
          }

          this.loadDistributors();
          this.distributorModal?.hide();
        },
        error: (err) => {
          const msg = err.error;
          if (typeof msg === 'string') {
            if (msg.toLowerCase().includes('email')) {
              this.distributorForm.get('email')?.setErrors({ exists: true });
              return;
            }
            if (msg.toLowerCase().includes('phone')) {
              this.distributorForm.get('phoneNumber')?.setErrors({ exists: true });
              return;
            }
          }
          this.toastr.error(msg || 'Failed to add distributor');
        }
      });
    }
  }

  deactivate(id: string): void {
    this.adminService.deactivateDistributor(id).subscribe({
      next: () => {
        this.toastr.warning('Distributor deactivated', 'Status');
        this.loadDistributors();
      },
      error: () => this.toastr.error('Action failed', 'Error')
    });
  }

  reactivate(id: string): void {
    this.adminService.reactivateDistributor(id).subscribe({
      next: () => {
        this.toastr.success('Distributor reactivated', 'Status');
        this.loadDistributors();
      },
      error: () => this.toastr.error('Action failed', 'Error')
    });
  }


  delete(id: string): void {

    // 🔹 MOBILE → Native confirm
    if (this.isMobileView) {
      const confirmDelete = confirm('This distributor will be permanently deleted. Continue?');

      if (!confirmDelete) return;

      this.adminService.deleteDistributor(id).subscribe({
        next: () => {
          alert('Distributor deleted successfully');
          this.loadDistributors();
        },
        error: () => {
          alert('Failed to delete distributor');
        }
      });

      return;
    }

    // 🔹 DESKTOP → SweetAlert
    Swal.fire({
      title: 'Are you sure?',
      text: 'This distributor will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteDistributor(id).subscribe({
          next: (res: any) => {
            this.toastr.success(res?.message || 'Distributor deleted successfully');
            this.loadDistributors();
          },
          error: () => {
            this.toastr.error('Failed to delete distributor');
          }
        });
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.toastr.info('Logged out successfully');
    window.location.href = '/distributor-login';
  }
  applyFilter(): void {
    if (!this.searchText) {
      this.filteredDistributors = this.distributors;
      return;
    }
    this.filteredDistributors = this.distributors.filter(d =>
      d.companyName.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.email.toLowerCase().includes(this.searchText.toLowerCase())
    );
    this.currentPage = 1;
    this.setupPagination();
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;

    // remove non-digits
    let value = input.value.replace(/\D/g, '');

    // first digit must be 6–9
    if (value.length === 1 && !/^[6-9]/.test(value)) {
      value = '';
    }

    // limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    this.distributorForm.get('phoneNumber')?.setValue(value, {
      emitEvent: false
    });
  }


  checkEmailExists() {
    const email = this.distributorForm.get('email')?.value;
    if (!email) return;

    this.adminService.checkEmailExists(email)
      .subscribe((exists: boolean) => {
        if (exists) {
          this.distributorForm.get('email')?.setErrors({ exists: true });
        }
      });
  }

  checkPhoneExists() {
    const phoneCtrl = this.distributorForm.get('phoneNumber');
    if (!phoneCtrl || phoneCtrl.invalid) return;

    this.adminService.checkPhoneExists(phoneCtrl.value).subscribe(exists => {
      if (exists) {
        phoneCtrl.setErrors({ exists: true });
        phoneCtrl.markAsTouched(); // 🔥 IMPORTANT
      }
    });
  }

  setupPagination() {
    const data = this.searchText ? this.filteredDistributors : this.distributors;
    this.totalPages = Math.ceil(data.length / this.pageSize) || 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const data = this.searchText ? this.filteredDistributors : this.distributors;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedDistributors = data.slice(start, end);
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

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];

    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
        if (i > 1 && i < this.totalPages) {
          pages.push(i);
        }
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      pages.push(this.totalPages);
    }

    return pages;
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }
}
