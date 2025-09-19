import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-distributor-login',
  templateUrl: './distributor-login.component.html',
  styleUrl: './distributor-login.component.css'
})
export class DistributorLoginComponent {
   email = '';
    password = '';
    error = '';
    showPassword = false; 
  
    constructor(private auth: AuthService, private router: Router) {}

     togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  
    onLogin(): void {
      this.auth.login(this.email, this.password).subscribe({
        next: (res: any) => {
          const role = this.auth.getRole();
             localStorage.setItem('distributorId', res.distributorId); // ✅ Save distributorId
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
        error: err => this.error = err.error || 'Login failed'
      });
    }
}
