import { Component, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';


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

  onLogin(): void {
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        const role = this.auth.getRole();
        localStorage.setItem('distributorId', res.distributorId); // ✅ Save distributorId
        localStorage.setItem('EmployeeId', res.employeeId);
        localStorage.setItem('employeeId', res.employeeId); // ✅ store employeeId



        if (role === 'Admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (role === 'Distributor') {
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome Distributor',
            timer: 1000,
            showConfirmButton: false
          });
          setTimeout(() => {
            this.router.navigate(['/distributor-dashboard']);
          }, 1000);
        }

        else if (role === 'Employee') {
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome Employee',
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            this.router.navigate(['/employee-dashboard']);
          }, 1000);
        } 
        
        else {
          this.error = 'Unauthorized role';
        }
      },
      error: err => this.error = err.error || 'Login failed'
    });
  }
}


