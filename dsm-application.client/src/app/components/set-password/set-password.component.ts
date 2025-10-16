import { Component } from '@angular/core';
import { CustomerService } from '../../services/customer.service';
import { CustomerLoginRequest } from '../../models/customer.model';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.css'
})
export class SetPasswordComponent {
  identifier = ''; // email or phone number
  password = '';
  message = '';
  error = '';
  isProcessing = false;


  constructor(private customerService: CustomerService) {}

  setPassword() {
  if (!this.isFormValid()) return;
  this.isProcessing = true;

  const request: CustomerLoginRequest = { password: this.password };
  if (/^\d+$/.test(this.identifier)) request.phoneNumber = this.identifier;
  else request.email = this.identifier;

  this.customerService.setPassword(request).subscribe({
    next: (res: any) => {
      this.message = res;
      this.error = '';
      this.identifier = '';
      this.password = '';
      this.isProcessing = false;
    },
    error: (err) => {
      this.error = err.error || 'Failed to set password';
      this.message = '';
      this.isProcessing = false;
    }
  });
}
  getPasswordStrength(): string {
  if (this.password.length >= 12) return 'strong';
  if (this.password.length >= 8) return 'medium';
  return 'weak';
}

getPasswordStrengthText(): string {
  const len = this.password.length;
  if (len >= 12) return 'Strong';
  if (len >= 8) return 'Medium';
  return 'Weak';
}

hasMinLength(): boolean {
  return this.password.length >= 8;
}

hasUpperCase(): boolean {
  return /[A-Z]/.test(this.password);
}

hasLowerCase(): boolean {
  return /[a-z]/.test(this.password);
}

hasNumber(): boolean {
  return /\d/.test(this.password);
}

isFormValid(): boolean {
  return this.identifier !== '' && this.password !== '' && this.hasMinLength() && this.hasUpperCase() && this.hasLowerCase() && this.hasNumber();
}

}
