import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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
  isVerifying = false;

  constructor(private authService: AuthService) {}
sendOtp() {
  if (!this.email) {
    this.message = 'Please enter your email.';
    return;
  }

  this.authService.forgotPassword(this.email).subscribe({
    next: (res: any) => {
      // ✅ FIX HERE
      this.message = res?.message || 'OTP has been sent to your email';
      this.step = 2;
      this.startTimer();
    },
    error: err => {
      this.message = err.error?.message || 'Failed to send OTP';
    }
  });
}

  

  // ✅ Step 2: Verify OTP
verifyOtp() {
  console.log('Verify OTP clicked');

  if (this.isVerifying) {
    console.log('Blocked: already verifying');
    return;
  }

  if (!this.otp || this.otp.length !== 6) {
    this.message = 'Please enter a valid 6-digit OTP.';
    return;
  }

  this.authService.verifyOtp(this.email, this.otp).subscribe({
    next: (res: any) => {
      this.message = res?.message || 'OTP verified successfully';
      this.step = 3;
      this.clearTimer();
    },
    error: err => {
      this.message = err.error?.message || 'Invalid OTP';
    }
  });
}


  // ✅ Step 3: Reset Password
resetPassword() {
  this.authService
    .resetPassword(this.email, this.otp, this.newPassword)
    .subscribe({
      next: (res: any) => {
        this.message = res?.message || 'Password reset successfully';
        this.resetForm();
      },
      error: err => {
        this.message = err.error?.message || 'Failed to reset password';
      }
    });
}



  // ✅ Resend OTP
resendOtp() {
  this.authService.forgotPassword(this.email).subscribe({
    next: (res: any) => {
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
