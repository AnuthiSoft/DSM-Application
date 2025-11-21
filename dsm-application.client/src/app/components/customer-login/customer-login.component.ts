import { Component, NgZone } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CustomerLoginRequest } from '../../models/customer.model';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-customer-login',
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.css']
})
export class CustomerLoginComponent {
 request: CustomerLoginRequest = { email: '', phoneNumber: '', password: '' };

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
     // Determine if input is a phone number (all digits)
  const identifier = this.request.email?.trim();
  if (!identifier) {
    this.message = "Please enter email or phone number";
    return;
  }

  if (/^\d+$/.test(identifier)) {
    // all digits → phone
    this.request.phoneNumber = identifier;
    this.request.email = '';
  } else {
    // otherwise → email
    this.request.email = identifier;
    this.request.phoneNumber = '';
  }

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
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome Customer',
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            this.ngZone.run(() => {
              this.router.navigateByUrl('/customer-dashboard');
            });
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.message = err?.error?.message || "❌ Invalid email or password";
      }
    });
  }
}
