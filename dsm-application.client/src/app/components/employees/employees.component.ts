import { Component } from '@angular/core';
import { Employee, EmployeeService } from '../../services/employee.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
// import { InvoiceUploadService } from '../../services/invoice-upload.service';
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
  constructor(
    private employeeService: EmployeeService,
    private auth: AuthService,
    private fb: FormBuilder, 
    private toastr: ToastrService,

    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.distributorId = this.auth.getDistributorId();
    this.employeeId = this.auth.getEmployeeId();

    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: [''],
      phoneNumber: ['', Validators.required],
      role: ['Employee', Validators.required],
      designation: ['', Validators.required],
      isActive: [true],
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
 
  const emp: Employee = {
    ...this.employeeForm.value,
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
        this.toastr.error('Failed to update employee.');
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
        this.toastr.error('Failed to add employee.');
      }
    });
  }
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

  // ✅ Edit employee (patch form)
  editEmployee(emp: Employee) {
    this.isEdit = true;
    this.employeeForm.patchValue(emp);
    this.showModal = true; // ✅ this opens the modal automatically
    this.selectedEmployee = emp; // ✅ Add this line
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


}

