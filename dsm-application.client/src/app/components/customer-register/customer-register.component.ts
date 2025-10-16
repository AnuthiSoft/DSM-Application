import { Component } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { CustomerRegisterRequest } from '../../models/customer.model';

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

  constructor(private customerService: CustomerService) {}
  
checkPasswordStrength() {
  const pwd = this.request.password;
  if (pwd.length >= 12) {
    this.passwordStrength = 'strong';
    this.passwordStrengthText = 'Strong';
  } else if (pwd.length >= 8) {
    this.passwordStrength = 'medium';
    this.passwordStrengthText = 'Medium';
  } else {
    this.passwordStrength = 'weak';
    this.passwordStrengthText = 'Weak';
  }
}

hasMinLength(): boolean { return this.request.password.length >= 8; }
hasUpperCase(): boolean { return /[A-Z]/.test(this.request.password); }
hasLowerCase(): boolean { return /[a-z]/.test(this.request.password); }
hasNumber(): boolean { return /\d/.test(this.request.password); }

isFormValid(): boolean {
  return (
    this.request.name !== '' &&
    this.request.email !== '' &&
    this.request.phoneNumber !== '' &&
    this.request.password !== '' &&
    this.hasMinLength() &&
    this.hasUpperCase() &&
    this.hasLowerCase() &&
    this.hasNumber()
  );
}

resetForm() {
  this.request = { name: '', email: '', phoneNumber: '', password: '' };
  this.message = '';
  this.error = '';
  this.passwordStrength = '';
  this.passwordStrengthText = '';
}

register() {
  if (!this.isFormValid()) return;
  this.isProcessing = true;

  this.customerService.register(this.request).subscribe({
    next: (res: any) => {
      this.message = res.message;
      this.error = '';
      this.isProcessing = false;
      this.resetForm();
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
