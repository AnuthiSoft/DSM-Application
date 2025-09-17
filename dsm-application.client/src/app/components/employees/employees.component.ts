import { Component } from '@angular/core';
import { Employee, EmployeeService } from '../../services/employee.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent {
   employees: Employee[] = [];
  employeeForm!: FormGroup;
  distributorId = ''; // ✅ replace with actual logged-in distributorId
  selectedEmployee: Employee | null = null;
  isEdit = false;
  loading = false;

  constructor(
    private employeeService: EmployeeService,private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
      this.distributorId = this.auth.getDistributorId();
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      role: ['Employee', Validators.required],
      designation: ['Employee', Validators.required],
      
      isActive: [true],
       
    });

    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.employeeService.getEmployees(this.distributorId).subscribe({
      next: (data) => {
        this.employees = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.employeeForm.invalid) return;

    const emp: Employee = { ...this.employeeForm.value, distributorId: this.distributorId, isRegistered: true };

    if (this.isEdit && this.selectedEmployee?.employeeId) {
      this.employeeService.updateEmployee(this.distributorId, this.selectedEmployee.employeeId, emp).subscribe({
        next: () => {
          this.loadEmployees();
          this.resetForm();
        }
      });
    } else {
      this.employeeService.addEmployee(this.distributorId, emp).subscribe({
        next: () => {
          this.loadEmployees();
          this.resetForm();
        }
      });
    }
  }

  editEmployee(emp: Employee) {
    this.isEdit = true;
    this.selectedEmployee = emp;
    this.employeeForm.patchValue(emp);
  }

  deleteEmployee(emp: Employee) {
    if (!confirm(`Delete ${emp.name}?`)) return;

    this.employeeService.deleteEmployee(this.distributorId, emp.employeeId!).subscribe({
      next: () => this.loadEmployees()
    });
  }

  toggleActive(emp: Employee) {
    this.employeeService.toggleActive(this.distributorId, emp.employeeId!).subscribe({
      next: (updated) => {
        emp.isActive = updated.isActive;
      }
    });
  }

  resetForm() {
    this.isEdit = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'Employee',
      designation: 'Employee',
      isActive: true
    });
  }

}
