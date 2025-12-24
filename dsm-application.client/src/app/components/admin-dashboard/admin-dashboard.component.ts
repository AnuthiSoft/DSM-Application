import { Component, OnInit } from '@angular/core';
import { AdminService, Distributor } from '../../services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import { AbstractControl, ValidationErrors } from '@angular/forms';



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
  // ⭐ Required for tab switching
  activeTab: string = 'dashboard';
  categories: any[] = [];
  pendingCategories: any[] = [];

  setActiveTab(tab: string) {
    this.activeTab = tab;
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

  private distributorModal: bootstrap.Modal | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private auth: AuthService,
    private categoryService: CategoryService,
    private toastr: ToastrService,
    
  ) { }


  
  ngOnInit(): void {
    this.loadDistributors();
    this.initForm();
    this.role = this.auth.getRole();
    this.loadCategories();
    this.loadPendingCategories();

    // ✅ Initialize modal instance
    const modalEl = document.getElementById('distributorModal');
    if (modalEl) {
      this.distributorModal = new bootstrap.Modal(modalEl);
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
      [Validators.required, Validators.email]
    ],

    phoneNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/) // ✅ 10 digits only
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
    isActive: [true]
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
      },
      error: err => console.error(err)
    });
  }

  openAdd(): void {
    this.isEdit = false;
    this.selectedDistributor = null;
    this.distributorForm.reset({ isActive: true });
    this.distributorForm.reset({ isPremium: true });
    this.distributorModal?.show();
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


  openEdit(d: Distributor): void {
    this.isEdit = true;
    this.selectedDistributor = d;
    this.distributorForm.patchValue(d);
    this.distributorModal?.show();
  }

  saveDistributor(): void {
    if (this.distributorForm.invalid) {
      this.distributorForm.markAllAsTouched();
      return;
    }

    const dist = this.distributorForm.value;
    console.log("Submitting distributor:", dist);
    // if (dist.categories.includes('Others') && dist.customCategory.trim()) {
    //   dist.categories = dist.categories
    //     .filter((c: string) => c !== 'Others')
    //     .concat(dist.customCategory.trim());
    // }
    // delete dist.customCategory; // ✅ remove before sending to API

    if (this.isEdit && this.selectedDistributor) {
      this.adminService.updateDistributor(this.selectedDistributor!.distributorId, dist).subscribe({
        next: () => {
          this.toastr.success('Distributor updated successfully', 'Updated');
          this.loadDistributors();
          this.distributorModal?.hide();
        },
        error: () => {
          this.toastr.error('Update failed', 'Error');
        }
      });

    } else {
      this.adminService.addDistributor(dist).subscribe({
        next: () => {
          this.toastr.success('Distributor added successfully', 'Success');
          this.loadDistributors();
          this.distributorModal?.hide();
        },
        error: () => {
          this.toastr.error('Failed to add distributor', 'Error');
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
  if (!confirm('Are you sure to delete?')) return;

  this.adminService.deleteDistributor(id).subscribe({
    next: (msg: string) => {
      this.toastr.success(msg, 'Success');
      this.loadDistributors();
    },
    error: err => {
      const message =
        typeof err.error === 'string'
          ? err.error
          : 'Failed to delete distributor';

      this.toastr.error(message, 'Error');
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
  }

}
