
import { Component } from '@angular/core';
import { Employee, EmployeeService } from '../../services/employee.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { InvoiceUploadService } from '../../services/invoice-upload.service';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../services/admin.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

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
  selectedFileName: string = '';   // ✅ ADD THIS
  showUploadModal = false;
  sheetOpen = false;
  sheetType: 'designation' | 'status' | '' = '';
  sheetTitle = '';
  currentUserRole: string = '';
  originalPhoneNumber: string = '';

  // selectedEmployee: any = null;
  // selectedFile: File | null = null;
  // showUploadModal = false;

  // filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  email = '';
  showModal = false;
  emailExists = false;   // ✅ ADD THIS
  phoneExists = false;   // ✅ ADD THIS
  phoneSubmitted = false; // ✅ ADD THIS


  otpSent = false;
  otpVerified = false;
  otpFailed = false;
  otpCode = '';
  phoneVerifiedUI = false;
  apiUrl = environment.apiUrl;

  // isEdit = false;
  constructor(
    private employeeService: EmployeeService,
    private auth: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,

    private http: HttpClient,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.distributorId = this.auth.getDistributorId();
    this.employeeId = this.auth.getEmployeeId();

    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[6-9]\d{9}$/)
        ]
      ],
      role: [{ value: 'Employee', disabled: true }],
      designation: ['', Validators.required],
      isActive: [true] // ensures value exists
    });

    this.employeeForm.get('phoneNumber')?.valueChanges.subscribe(value => {

      if (!this.isEdit) return;

      // If changed from original
      if (value !== this.originalPhoneNumber) {
        this.phoneVerifiedUI = false;
        this.otpVerified = false;
        this.otpSent = false;
        this.otpFailed = false;
      }

      // If user changed back to original
      if (value === this.originalPhoneNumber) {
        this.phoneVerifiedUI = true;
        this.otpVerified = true;
      }

    });

    this.loadEmployees();
  }


  sendOtp() {
    const phone = '+91' + this.employeeForm.get("phoneNumber")!.value;

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


  // ------------------- OTP VERIFY -------------------
  verifyOtp() {
    const phone = '+91' + this.employeeForm.get("phoneNumber")!.value;

    this.adminService.verifyOtp(phone, this.otpCode).subscribe({
      next: () => {
        this.otpVerified = true;
        this.otpFailed = false;
        this.phoneVerifiedUI = true; // ⭐ Show tick mark
        this.otpSent = false;        // ⭐ Hide OTP inputs
        alert("Phone verified successfully!");
      },
      error: () => {
        this.otpVerified = false;
        this.otpFailed = true;
        alert("Invalid or expired OTP");
      }
    });
  }

  // ✅ Load all employees
  loadEmployees() {
    this.loading = true;

    this.employeeService.getEmployees(this.distributorId).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.filteredEmployees = [...employees];

        // 🔥 FETCH INVOICE FOR EACH EMPLOYEE
        this.employees.forEach(emp => {
          this.http
            .get<any[]>(`${this.apiUrl}/invoice-upload/employee/${emp.employeeId}`)
            .subscribe(invoices => {
              if (invoices && invoices.length > 0) {
                emp.invoicePdfUrl = invoices[0].pdfUrl; // latest invoice
              }
            });
        });

        this.loading = false;
      },
      error: () => this.loading = false
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
          document.body.classList.remove('modal-open');
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
          document.body.classList.remove('modal-open');
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

          if (!this.phoneVerifiedUI) {
            this.toastr.error("Please verify phone number before saving");
            return;
          }
          this.toastr.error('Failed to add employee');
        }

      });
    }
  }

  restrictPhoneInput(event: any) {
    let value = event.target.value;

    value = value.replace(/[^0-9]/g, '');
    value = value.slice(0, 10);

    if (value.length === 1 && !/^[6-9]$/.test(value)) {
      value = '';
    }

    event.target.value = value;
    this.employeeForm.get('phoneNumber')?.setValue(value);
  }

  // ✅ Edit employee (patch form)
  editEmployee(emp: Employee) {
    this.isEdit = true;

    const phoneWithoutCode = emp.phoneNumber?.startsWith('+91')
      ? emp.phoneNumber.slice(3)
      : emp.phoneNumber;

    this.employeeForm.patchValue({
      ...emp,
      phoneNumber: phoneWithoutCode
    });

    // Store original phone
    this.originalPhoneNumber = phoneWithoutCode;

    // Since it's existing employee → verified
    this.phoneVerifiedUI = true;
    this.otpVerified = true;
    this.otpSent = false;
    this.otpFailed = false;

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

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${emp.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {


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
    this.selectedEmployee = null;

    this.employeeForm.reset({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'Employee',
      designation: '',
      isActive: true
    });

    // 🔥 RESET PHONE + OTP STATE
    this.otpSent = false;
    this.otpVerified = false;
    this.otpFailed = false;
    this.phoneVerifiedUI = false;
    this.otpCode = '';
    this.phoneSubmitted = false;

    this.emailExists = false;
    this.phoneExists = false;

    this.showModal = true;
  }

  closeEmployeeModal(): void {
    this.showModal = false;

    // 🔥 reset state here also
    this.otpSent = false;
    this.otpVerified = false;
    this.otpFailed = false;
    this.phoneVerifiedUI = false;
    this.otpCode = '';

    document.body.classList.remove('modal-open');
  }

  openUploadModal(emp: any) {
    this.selectedEmployee = emp;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedFile = null;
    this.selectedFileName = '';   // ✅ RESET
  }

  // closeUploadModal() {
  //   this.showUploadModal = false;
  //   this.selectedFile = null;
  // }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;   // ✅ ADD THIS
    }
  }

  // onFileSelected(event: any) {
  //   this.selectedFile = event.target.files[0];
  // }

  uploadInvoice() {
    if (!this.selectedFile || !this.selectedEmployee) {
      this.toastr.error("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", this.selectedFile);
    formData.append("EmployeeId", this.selectedEmployee.employeeId); // FIXED

    this.http.post(`${this.apiUrl}/invoice-upload/upload`, formData)
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

  viewInvoice(emp: any) {
    const url = `${this.apiUrl}/invoice-upload/view/${emp.employeeId}`;
    window.open(url, '_blank');
  }

  viewPdf(url: string) {
    window.open(url, '_blank');
  }

  openSheet(type: string) {
    console.log('Open sheet for:', type);

    // Example:
    // this.activeSheet = type;
    // this.isSheetOpen = true;
  }

  isDistributor(): boolean {
    const role = localStorage.getItem('Role');
    return role === 'Distributor';
  }
}

