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
 email = '';
  message = '';
   showPassword = false; 

  constructor(
    private customerService: CustomerService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}




  restrictPhoneInput(event: any) {
  const input = event.target.value;

  // Allow unlimited characters for email,
  // but restrict pure numbers to max 10 digits.
  if (/^[0-9]+$/.test(input)) {
    event.target.value = input.substring(0, 10);
    this.email = event.target.value;
  }
}


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  

  login() {
  const identifier = this.request.email?.trim();
  if (!identifier) {
    this.message = "Please enter email or phone number";
    return;
  }

  if (/^\d+$/.test(identifier)) {
    this.request.phoneNumber = identifier;
    this.request.email = '';
  } else {
    this.request.email = identifier;
    this.request.phoneNumber = '';
  }

  this.customerService.login(this.request).subscribe({
    next: (res: any) => {
      // Clear old data

      
     // Clear old data
   // Remove only auth-related old data — NOT the cart!
localStorage.removeItem("token");
localStorage.removeItem("role");



    // Save new data
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);
    localStorage.setItem("customerId", res.customerId);
    localStorage.setItem("customerName", res.name);
    localStorage.setItem("customerEmail", res.email);
    localStorage.setItem("customerPhoneNumber", res.phoneNumber);



      // ⭐ SAVE DISTRIBUTOR ID HERE

     // const role = this.auth.getRole();
if (res.distributorId) {
  localStorage.setItem("distributorId", res.distributorId);
}

      localStorage.setItem('EmployeeId', res.employeeId);
      localStorage.setItem('employeeId', res.employeeId);
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
