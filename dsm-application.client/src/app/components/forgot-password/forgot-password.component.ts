import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnDestroy {
  step = 1; // 1: enter email, 2: enter OTP, 3: reset password
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  timer = 0;
  private timerInterval: any;
  showPassword = false; 
  showConfirmPassword=false;

  constructor(private http: HttpClient) {}

 
  sendOtp() {
    if (!this.email) {
      this.message = 'Please enter your email.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.message = 'Please enter a valid email address.';
      return;
    }

    this.http.post('https://localhost:7189/api/auth/forgot-password',
      { email: this.email },
      { responseType: 'text' }
    ).subscribe({
      next: (res: string) => {
        this.step = 2;
        this.message = res || 'OTP has been sent to your email';
        this.startTimer();
      },
      error: err => {
        this.message = err.error || 'Failed to send OTP';
      }
    });
  }

  // ✅ Step 2: Verify OTP
  verifyOtp() {
    if (!this.otp || this.otp.length !== 6) {
      this.message = 'Please enter a valid 6-digit OTP.';
      return;
    }

    this.http.post('https://localhost:7189/api/auth/verify-otp',
      { email: this.email, otp: this.otp },
      { responseType: 'text' }
    ).subscribe({
      next: (res: string) => {
        this.message = res || 'OTP verified successfully.';
        this.step = 3;
        this.clearTimer();
      },
      error: err => {
        this.message = err.error || 'Invalid OTP';
      }
    });
  }

  // ✅ Step 3: Reset Password
  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.message = 'Please enter password and confirm password.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Passwords do not match!';
      return;
    }
    if (this.newPassword.length < 8) {
      this.message = 'Password must be at least 8 characters long.';
      return;
    }

    this.http.post('https://localhost:7189/api/auth/reset-password',
      {
        email: this.email,
        otp: this.otp,
        newPassword: this.newPassword
      },
      { responseType: 'text' }
    ).subscribe({
      next: (res: string) => {
        this.message = res || 'Password reset successfully!';
        this.resetForm();
      },
      error: err => {
        this.message = err.error || 'Failed to reset password';
      }
    });
  }

  // ✅ Resend OTP
  resendOtp() {
    this.http.post('https://localhost:7189/api/auth/forgot-password',
      { email: this.email },
      { responseType: 'text' }
    ).subscribe({
      next: (res: string) => {
        this.message = res || 'New OTP sent to your email';
        this.timer = 300;
        this.startTimer();
      },
      error: err => {
        this.message = err.error || 'Failed to resend OTP';
      }
    });
  }

  // ✅ Timer logic
  private startTimer() {
    this.clearTimer();
    this.timer = 300;
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.clearTimer();
        this.message = 'OTP has expired. Please request a new one.';
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTimer(): string {
  const minutes = Math.floor(this.timer / 60);
  const seconds = this.timer % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

  
    togglePassword(): void {
      this.showPassword = !this.showPassword;
    }
  
    toggleConfirmPassword(): void {
      this.showConfirmPassword = !this.showConfirmPassword;
    }

  // ✅ Reset form after successful password reset
  private resetForm() {
    this.step = 1;
    this.email = '';
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.clearTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }
}
