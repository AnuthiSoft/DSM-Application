import { Component } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { CustomerRegisterRequest } from '../../models/customer.model';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-customer-register',
  templateUrl: './customer-register.component.html',
  styleUrl: './customer-register.component.css'
})
export class CustomerRegisterComponent {
  isProcessing = false;
  error = '';

  passwordStrength = '';
  passwordStrengthText = '';
  request: CustomerRegisterRequest = { name: '', email: '', phoneNumber: '', password: '' };
  message = '';

  // OTP vars
  otpSent = false;
  otpVerified = false;
  otpFailed = false;
  otpCode = '';
  phoneVerifiedUI = false;

  constructor(private customerService: CustomerService, private router: Router, private adminService: AdminService) { }



  sendOtp() {
    const phone: string = (this.request.phoneNumber || '').replace(/\D/g, '');


    if (!this.isPhoneValid()) {
      this.error = "Enter a valid 10-digit phone number";
      return;
    }

    this.adminService.sendOtp(phone).subscribe({
      next: (res) => {
        this.otpSent = true;
        this.otpFailed = false;

        // show OTP for testing
        alert("OTP sent! Your OTP is: " + res.otp);
      },
      error: () => {
        this.error = "Failed to send OTP";
      }
    });
  }

  verifyOtp() {
    const phone: string = (this.request.phoneNumber || '').replace(/\D/g, '');


    this.adminService.verifyOtp(phone, this.otpCode).subscribe({
      next: (res) => {
        if (res.valid || res.success) {
          this.otpVerified = true;
          this.phoneVerifiedUI = true;
          this.otpFailed = false;
          alert("Phone number verified!");
        } else {
          this.otpFailed = true;
        }
      },
      error: () => {
        this.otpFailed = true;
        this.error = "OTP verification failed";
      }
    });
  }
  checkPasswordStrength() {
    const pwd = this.request.password || '';

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasMinLen = pwd.length >= 8;

    if (hasUpper && hasLower && hasNumber && hasMinLen) {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = 'Strong';
    } else if (pwd.length >= 6) {
      this.passwordStrength = 'medium';
      this.passwordStrengthText = 'Medium';
    } else {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = 'Weak';
    }
  }

  // hasMinLength(): boolean { return this.request.password.length >= 8; }
  // hasUpperCase(): boolean { return /[A-Z]/.test(this.request.password); }
  // hasLowerCase(): boolean { return /[a-z]/.test(this.request.password); }
  // hasNumber(): boolean { return /\d/.test(this.request.password); }



  isPhoneValid(): boolean {
    const phone = (this.request.phoneNumber || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(phone);
  }

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.request.email || '');
  }



  isFormValid(): boolean {
    const name = this.request.name?.trim() ?? '';
    const email = this.request.email?.trim() ?? '';
    const phone = this.request.phoneNumber?.trim() ?? '';
    const password = this.request.password ?? '';

    return (
      name !== '' &&
      email !== '' &&
      this.isEmailValid() &&

      phone !== '' &&
      this.isPhoneValid() &&
      // this.phoneVerifiedUI === true &&

      password !== '' &&
      this.passwordStrength === 'strong' &&

      !this.isProcessing
    );
  }



  resetForm() {
    this.request = { name: '', email: '', phoneNumber: '', password: '' };
    this.message = '';
    this.error = '';
    this.passwordStrength = '';
    this.checkPasswordStrength();
    this.passwordStrengthText = '';
  }


  allowOnlyNumbers(event: any) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(-10);
    this.request.phoneNumber = digits;
  }



  register() {
    if (!this.isFormValid()) {
      if (!this.isPhoneValid()) {
        this.error = "Phone number must be exactly 10 digits.";
      }
      return;
    }
    this.isProcessing = true;

    this.customerService.register(this.request).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.error = '';
        this.isProcessing = false;
        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/customer/login']);
        }, 1500);   // show message for 1.5 sec

      },
      error: (err) => {
        this.error = err.error || 'Registration failed';
        this.isProcessing = false;
      }
    });
  }

  // register() {
  //   this.customerService.register(this.request).subscribe({
  //     next: (res: any) => {
  //       this.message = res.message;
  //     },
  //     error: (err) => {
  //       this.message = err.error;
  //     }
  //   });
  // }
}
