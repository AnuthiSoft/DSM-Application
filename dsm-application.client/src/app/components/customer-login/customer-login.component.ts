import { Component, NgZone } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CustomerLoginRequest } from '../../models/customer.model';

@Component({
  selector: 'app-customer-login',
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.css']
})
export class CustomerLoginComponent {
 request: CustomerLoginRequest = { email: '', password: '' };
  message = '';
   showPassword = false; 

  constructor(
    private customerService: CustomerService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.customerService.login(this.request).subscribe({
      next: (res: any) => {
        // ✅ Clear any old data
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('customerId');

        // ✅ Save new auth data
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
       
          localStorage.setItem('customerId', res.customerId);
      

        this.message = "✅ Login successful!";

        // ✅ Navigate to dashboard only for customers
        if (res.role === 'Customer') {
          console.log('Navigating to customer dashboard...');
          this.ngZone.run(() => {
            this.router.navigateByUrl('/customer-dashboard');
          });
        }
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.message = err?.error?.message || "❌ Invalid email or password";
      }
    });
  }
}
