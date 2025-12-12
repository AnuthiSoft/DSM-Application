import { Component, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-distributor-login',
  templateUrl: './distributor-login.component.html',
  styleUrl: './distributor-login.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DistributorLoginComponent {
  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(private auth: AuthService, private router: Router,) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  
restrictPhoneInput(event: any) {
  const input = event.target.value;

  // If the input is only numbers → limit to max 10 digits
  if (/^[0-9]+$/.test(input)) {
    event.target.value = input.substring(0, 10);
    this.email = event.target.value;
  }
}



    onLogin(): void {
  this.auth.login(this.email, this.password).subscribe({
    next: (res: any) => {
      const role = this.auth.getRole();
const distributorId = this.auth.getDistributorId();
localStorage.setItem('distributorId', distributorId);
      localStorage.setItem('EmployeeId', res.employeeId);
      localStorage.setItem('employeeId', res.employeeId);

      if (role === 'Admin') {
        this.router.navigate(['/admin-dashboard']);
      } else if (role === 'Distributor') {
        this.router.navigate(['/distributor-dashboard']);
      } else if (role === 'Employee') {
        this.router.navigate(['/employee-dashboard']);
      } else {
        this.error = 'Unauthorized role';
      }
    },
    error: err => {
      if (err.status === 401 && err.error === 'Distributor Inactive') {
        this.error = 'Your distributor account is inactive. Please contact admin.';
      } 
      else {
        this.error = err.error || 'Login failed';
      }
    }
  });
}

}


