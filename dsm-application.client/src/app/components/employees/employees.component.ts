import { Component } from '@angular/core';
import { Employee, EmployeeService } from '../../services/employee.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { InvoiceUploadService } from '../../services/invoice-upload.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];   // ✅ for search/filter results
  employeeForm!: FormGroup;
  distributorId = '';
  employeeId = '';
  // selectedEmployee: Employee | null = null;
  isEdit = false;
  loading = false;
  selectedEmployee: any = null;
  selectedFile: File | null = null;
  showUploadModal = false;

  // filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  email = '';
  showModal = false;
  // isEdit = false;
  emailExists = false;
  phoneExists = false;

  constructor(
    private employeeService: EmployeeService,
    private auth: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private uploadService: InvoiceUploadService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.distributorId = this.auth.getDistributorId();
    this.employeeId = this.auth.getEmployeeId();

    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)

      ]],
      role: [{ value: 'Employee', disabled: true }],
      designation: ['', Validators.required],
      isActive: [true] // ensures value exists
    });


    this.loadEmployees();
  }

  // ✅ Load all employees
  loadEmployees() {
    this.loading = true;
    this.employeeService.getEmployees(this.distributorId).subscribe({
      next: (data) => {

        this.employees = data;
        this.filteredEmployees = [...this.employees];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // ✅ Add / Update employee
  onSubmit() {
    if (this.employeeForm.invalid) return;
    this.emailExists = false;
    this.phoneExists = false;

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.toastr.error('Please fill all required fields', 'Validation Error');
      return;
    }

    const email = this.employeeForm.value.email.trim().toLowerCase();
    const phone = '+91' + this.employeeForm.value.phoneNumber;

    // 🔍 DUPLICATE CHECK
    const emailDuplicate = this.employees.some(e =>
      e.email.toLowerCase() === email &&
      (!this.isEdit || e.employeeId !== this.selectedEmployee?.employeeId)
    );

    const phoneDuplicate = this.employees.some(e =>
      e.phoneNumber === phone &&
      (!this.isEdit || e.employeeId !== this.selectedEmployee?.employeeId)
    );

    if (emailDuplicate) {
      this.employeeForm.get('email')?.setErrors({ exists: true });
      this.employeeForm.get('email')?.markAsTouched();
      return;
    }

    if (phoneDuplicate) {
      this.employeeForm.get('phoneNumber')?.setErrors({ exists: true });
      this.employeeForm.get('phoneNumber')?.markAsTouched();
      return;
    }


    const emp: Employee = {
      ...this.employeeForm.getRawValue(),
      phoneNumber: '+91' + this.employeeForm.get('phoneNumber')?.value,

      distributorId: this.distributorId,
      isRegistered: false
    };

    if (this.isEdit && this.selectedEmployee?.employeeId) {
      this.employeeService.updateEmployee(this.distributorId, this.selectedEmployee.employeeId, emp).subscribe({
        next: (res: any) => {
          this.toastr.success(res.message || 'Employee updated successfully!');
          this.loadEmployees();
          this.resetForm();
          this.showModal = false;
        },
        error: (err) => {
          console.error(err);

          const msg = typeof err.error === 'string'
            ? err.error.toLowerCase()
            : '';

          if (msg.includes('email')) {
            const emailCtrl = this.employeeForm.get('email');
            emailCtrl?.setErrors({ exists: true });
            emailCtrl?.markAsTouched();
            return;
          }

          if (msg.includes('phone')) {
            const phoneCtrl = this.employeeForm.get('phoneNumber');
            phoneCtrl?.setErrors({ exists: true });
            phoneCtrl?.markAsTouched();
            return;
          }

          this.toastr.error('Failed to update employee');
        }

      });
    } else {
      this.employeeService.addEmployee(this.distributorId, emp).subscribe({
        next: (res: any) => {
          this.toastr.success(res.message || 'Employee added successfully!');
          this.loadEmployees();
          this.resetForm();
          this.showModal = false;
        },
        error: (err) => {
          console.error(err);

          const msg = typeof err.error === 'string'
            ? err.error.toLowerCase()
            : '';

          if (msg.includes('email')) {
            const emailCtrl = this.employeeForm.get('email');
            emailCtrl?.setErrors({ exists: true });
            emailCtrl?.markAsTouched();
            return;
          }

          if (msg.includes('phone')) {
            const phoneCtrl = this.employeeForm.get('phoneNumber');
            phoneCtrl?.setErrors({ exists: true });
            phoneCtrl?.markAsTouched();
            return;
          }

          this.toastr.error('Failed to add employee');
        }

      });
    }
  }

  restrictPhoneInput(event: any) {
  let value = event.target.value;

  // Allow only digits
  value = value.replace(/\D/g, '');

  // Max 10 digits
  value = value.slice(0, 10);

  // First digit must be 6–9
  if (value.length === 1 && !/^[6-9]$/.test(value)) {
    value = '';
  }

  event.target.value = value;
  this.employeeForm.get('phoneNumber')?.setValue(value, { emitEvent: false });
}


  // ✅ Edit employee (patch form)
  editEmployee(emp: Employee) {
    this.isEdit = true;

    this.employeeForm.patchValue({
      ...emp,
      phoneNumber: emp.phoneNumber?.startsWith('+91')
        ? emp.phoneNumber.slice(3) // remove +91
        : emp.phoneNumber
    });

    this.selectedEmployee = emp;
    this.showModal = true;
  }


  // // ✅ Delete employee
  // deleteEmployee(emp: Employee) {
  //   if (!confirm(`Delete ${emp.name}?`)) return;
  //   this.employeeService.deleteEmployee(this.distributorId, emp.employeeId!).subscribe({
  //     next: () => this.loadEmployees()
  //   });
  // }


  deleteEmployee(emp: Employee) {
    if (!confirm(`Delete ${emp.name}?`)) return;

    this.employeeService.deleteEmployee(this.distributorId, emp.employeeId!).subscribe({
      next: () => {
        this.toastr.success("Employee deleted successfully", "Success");
        this.loadEmployees();
      },
      error: (err) => {
        // ✔ If backend returned text instead of JSON, treat 200 as success
        if (err.status === 200) {
          this.toastr.success("Employee deleted successfully", "Success");
          this.loadEmployees();
        } else {
          this.toastr.error("Failed to delete employee", "Error");
        }
      }
    });
  }




  // ✅ Toggle active/inactive
  toggleActive(emp: Employee) {
    this.employeeService.toggleActive(this.distributorId, emp.employeeId!).subscribe({
      next: (updated) => {
        emp.isActive = updated.isActive;
      }
    });
  }

  // ✅ Search + Filter employees
  applyFilters() {
    this.filteredEmployees = this.employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.roleFilter || emp.designation === this.roleFilter;

      const matchesStatus =
        !this.statusFilter ||
        (this.statusFilter === 'active' && emp.isActive) ||
        (this.statusFilter === 'inactive' && !emp.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // ✅ Reset form after submit/edit
  resetForm() {
    this.isEdit = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'Employee',
      designation: '',
      isActive: true
    });
  }
  openEmployeeModal(): void {
    this.isEdit = false;
    this.employeeForm.reset();
    this.emailExists = false;
    this.phoneExists = false;

    this.employeeForm.reset({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'Employee',
      designation: '',
      isActive: true
    });

    this.showModal = true;
  }

  closeEmployeeModal(): void {
    this.showModal = false;
  }

  openUploadModal(emp: any) {
    this.selectedEmployee = emp;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadInvoice() {
    if (!this.selectedFile || !this.selectedEmployee) {
      this.toastr.error("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", this.selectedFile);
    formData.append("EmployeeId", this.selectedEmployee.employeeId); // FIXED

    this.http.post("http://localhost:5164/api/invoice-upload/upload", formData)
      .subscribe({
        next: (res: any) => {
          this.toastr.success("Invoice uploaded successfully!");
          this.closeUploadModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Upload failed!");
        }
      });
  }

  checkEmployeeEmailExists() {
    const ctrl = this.employeeForm.get('email');
    const email = ctrl?.value;

    if (!ctrl || ctrl.invalid) {
      this.emailExists = false;
      return;
    }

    this.employeeService.checkEmailExists(email).subscribe(exists => {
      if (exists) {
        this.emailExists = true;
        ctrl.setErrors({ ...(ctrl.errors || {}), exists: true });
        ctrl.markAsTouched();
      } else {
        this.emailExists = false;
        this.removeSpecificError(ctrl, 'exists');
      }
    });
  }

  checkEmployeePhoneExists() {
    const ctrl = this.employeeForm.get('phoneNumber');
    const phone = ctrl?.value;

    if (!ctrl || ctrl.invalid) {
      this.phoneExists = false;
      return;
    }

    this.employeeService.checkPhoneExists(phone).subscribe(exists => {
      if (exists) {
        this.phoneExists = true;
        ctrl.setErrors({ ...(ctrl.errors || {}), exists: true });
        ctrl.markAsTouched();
      } else {
        this.phoneExists = false;
        this.removeSpecificError(ctrl, 'exists');
      }
    });
  }

  removeSpecificError(control: any, errorKey: string) {
    if (!control?.errors) return;

    const errors = { ...control.errors };
    delete errors[errorKey];

    control.setErrors(Object.keys(errors).length ? errors : null);
  }

}

