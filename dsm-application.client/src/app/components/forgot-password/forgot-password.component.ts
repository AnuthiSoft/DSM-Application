import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
step = 1; // Step 1: enter email, Step 2: enter OTP, Step 3: reset password
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  message = '';

  constructor(private http: HttpClient) {}

  // Step 1: Send OTP
  sendOtp() {
    if (!this.email) {
      this.message = "Please enter your email.";
      return;
    }

    this.http.post('https://localhost:7189/api/auth/forgot-password', { email: this.email }, { responseType: 'text' })
    .subscribe({
      next: (res: string) => {
        this.step = 2; // ✅ show OTP input
        this.message = res; // ✅ now it will show "OTP sent to your email"
      },
      error: err => {
        this.message = err.error;
      }
    });
  }

 verifyOtp() {
  if (!this.otp) {
    this.message = "Please enter OTP.";
    return;
  }

  this.http.post('https://localhost:7189/api/auth/verify-otp', 
    { email: this.email, otp: this.otp }, 
    { responseType: 'text' })  // ✅ expecting plain string response
    .subscribe({
      next: (res: string) => {
        this.message = res; // e.g. "OTP verified successfully"
        this.step = 3;      // ✅ move to reset password form
      },
      error: err => {
        this.message = err.error;
      }
    });
}
 resetPassword() {
  if (!this.newPassword || !this.confirmPassword) {
    this.message = "Please enter password and confirm password.";
    return;
  }
  if (this.newPassword !== this.confirmPassword) {
    this.message = "Passwords do not match!";
    return;
  }

  this.http.post('https://localhost:7189/api/auth/reset-password', {
    email: this.email,
    otp: this.otp, // ✅ Pass OTP again here
    newPassword: this.newPassword
  }, { responseType: 'text' })
  .subscribe({
    next: (res: string) => {
      this.message = res; // "Password reset successfully"
      this.step = 1; // ✅ Reset UI to step 1
      this.email = '';
      this.otp = '';
      this.newPassword = '';
      this.confirmPassword = '';
    },
    error: err => {
      this.message = err.error;
    }
  });
}
}
