import { Component, NgZone, OnInit } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CustomerLoginRequest } from '../../models/customer.model';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-customer-login',
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.css']
})
export class CustomerLoginComponent implements OnInit {
  request: CustomerLoginRequest = { email: '', phoneNumber: '', password: '' };
  email = '';
  message = '';


   customerEmail = '';
  showPassword = false;
  showChangePasswordModal = false;
  newPassword = '';
  confirmPassword = '';
  passwordError = '';


  constructor(
    private customerService: CustomerService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private toastr: ToastrService
  ) { }

ngOnInit() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (token && role === 'Customer') {
    this.router.navigate(['/customer-dashboard']);
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


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  submitNewPassword() {
    this.passwordError = '';

    if (!this.newPassword || this.newPassword.length < 4) {
      this.passwordError = 'Password must be at least 4 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    this.customerService.changePassword({
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.showChangePasswordModal = false;
        this.newPassword = '';
        this.confirmPassword = '';

        this.ngZone.run(() => {
          this.router.navigateByUrl('/customer-dashboard');
        });
      },
      error: () => {
        this.passwordError = 'Failed to update password';
      }
    });
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
    



        // Save new data
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", res.role);
        localStorage.setItem('customerId', res.customer.customerId!);

// 🔐 LOAD CUSTOMER-SPECIFIC CART INTO GLOBAL CART
// 🔐 LOAD CUSTOMER-SPECIFIC CART INTO GLOBAL CART
const customerId = res.customer.customerId;   // ✅ correct id

const customerCart = localStorage.getItem(`cart_customer_${customerId}`);
localStorage.setItem('cart', customerCart ? customerCart : '[]');


        localStorage.setItem('customerName', res.customer.name!);
        localStorage.setItem('customerEmail', res.customer.email!);
        localStorage.setItem('customerPhoneNumber', res.customer.phoneNumber!);


        if (res.mustChangePassword) {
   this.customerEmail = res.customer.email;
  this.showChangePasswordModal = true;
  return; // ⛔ stop dashboard navigation
}
 


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
          this.toastr.success('Welcome Customer', 'Login Successful');
          setTimeout(() => {
            this.ngZone.run(() => {
              this.router.navigateByUrl('/customer-dashboard');
            });
          }, 1500);
        }
      },
      error: (err) => {
        this.toastr.error('Invalid email or password', 'Login Failed');
      }
    });
  }
}
