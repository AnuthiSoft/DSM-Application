import { Component, OnInit } from '@angular/core';
import { AdminService, Distributor } from '../../services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  distributors: Distributor[] = [];
  filteredDistributors: Distributor[] = [];
  selectedDistributor: Distributor | null = null;
  distributorForm!: FormGroup;
  isEdit = false;
  message = '';
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
    private auth: AuthService
  ) {}
  

  ngOnInit(): void {
    this.loadDistributors();
    this.initForm();
    this.role = this.auth.getRole();

    // ✅ Initialize modal instance
    const modalEl = document.getElementById('distributorModal');
    if (modalEl) {
      this.distributorModal = new bootstrap.Modal(modalEl);
    }
  }


  initForm(): void {
    this.distributorForm = this.fb.group({
      distributorId: [''],
      companyName: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      gst: ['', Validators.required],
      address: ['', Validators.required],
       isPremium: [''],
      isActive: [true],
      categories: [[]] , // ✅ new field
       customCategory: [''] // ✅ new form control
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
  if (dist.categories.includes('Others') && dist.customCategory.trim()) {
    dist.categories = dist.categories
      .filter((c: string) => c !== 'Others')
      .concat(dist.customCategory.trim());
  }
    delete dist.customCategory; // ✅ remove before sending to API

  if (this.isEdit && this.selectedDistributor) {
    this.adminService.updateDistributor(this.selectedDistributor.distributorId, dist).subscribe({
      next: res => {
        this.message = res;
        this.loadDistributors();
        this.distributorModal?.hide();
      },
      error: err => {
        console.error('Update error:', err.error);
        alert('Update failed: ' + JSON.stringify(err.error.errors));
      }
    });
  } else {
    this.adminService.addDistributor(dist).subscribe({
      next: res => {
        this.message = res;
        this.loadDistributors();
        this.distributorModal?.hide();
      },
      error: err => {
        console.error('Add error:', err.error);
        alert('Add failed: ' + JSON.stringify(err.error.errors));
      }
    });
  }
}

  deactivate(id: string): void {
    this.adminService.deactivateDistributor(id).subscribe({
      next: (res: any) => {
        console.log("deactivate" + res)
        this.message = typeof res === 'string' ? res : 'Distributor deactivated successfully';
        this.loadDistributors();
      },
      error: err => console.error(err)
    });
  }

  reactivate(id: string): void {
    this.adminService.reactivateDistributor(id).subscribe({
      next: (res: any) => {
        console.log("activate" + res)
        this.message = typeof res === 'string' ? res : 'Distributor reactivated successfully';
        this.loadDistributors();
      },
      error: err => console.error(err)
    });
  }

  delete(id: string): void {
    if (confirm('Are you sure to delete?')) {
      this.adminService.deleteDistributor(id).subscribe(() => {
        this.message = 'Distributor deleted successfully';
        this.loadDistributors();
      });
    }
  }

  logout(): void {
    this.auth.logout();
    window.location.href = "/distributor-login";
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
