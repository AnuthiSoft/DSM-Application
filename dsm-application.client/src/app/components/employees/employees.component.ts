import { Component } from '@angular/core';
import { Employee, EmployeeService } from '../../services/employee.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

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
  employeeId='';
  selectedEmployee: Employee | null = null;
  isEdit = false;
  loading = false;
 
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
    private fb: FormBuilder, private toastr: ToastrService
  ) {}
 
  ngOnInit(): void {
    this.distributorId = this.auth.getDistributorId();
    this.employeeId = this.auth.getEmployeeId();
 
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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

  const id = emp.employeeId; // <– use MongoDB id

  if (!id) {
    this.toastr.error("Employee ID missing!");
    return;
  }

  this.employeeService.deleteEmployee(this.distributorId, id).subscribe({
    next: () => this.loadEmployees(),
    error: (err) => console.error("Delete error:", err)
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
}
 
 