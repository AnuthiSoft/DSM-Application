import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-distributor-signup',
  templateUrl: './distributor-signup.component.html',
  styleUrl: './distributor-signup.component.css'
})
export class DistributorSignupComponent {
 identifier = '';
    password = '';
    confirmPassword = '';
    message = '';
    error = '';
  
    showPassword = false;
    showConfirmPassword = false;
  
    passwordStrength = 0;
    passwordMatchMessage = '';
    passwordMatchClass = 'text-muted';
  
    constructor(private auth: AuthService, private router: Router) {}
  
    togglePassword(): void {
      this.showPassword = !this.showPassword;
    }
  
    toggleConfirmPassword(): void {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  
    checkPasswordStrength(): void {
      const pwd = this.password;
      let strength = 0;
  
      if (pwd.length > 0) strength += 20;
      if (pwd.length >= 8) strength += 20;
      if (/[A-Z]/.test(pwd)) strength += 20;
      if (/[0-9]/.test(pwd)) strength += 20;
      if (/[^A-Za-z0-9]/.test(pwd)) strength += 20;
  
      this.passwordStrength = strength;
    }
  
    checkPasswordMatch(): void {
      if (this.confirmPassword.length === 0) {
        this.passwordMatchMessage = '';
        this.passwordMatchClass = 'text-muted';
      } else if (this.password === this.confirmPassword) {
        this.passwordMatchMessage = 'Passwords match';
        this.passwordMatchClass = 'text-success';
      } else {
        this.passwordMatchMessage = 'Passwords do not match';
        this.passwordMatchClass = 'text-danger';
      }
    }
  
    onSignup(): void {
  if (this.password !== this.confirmPassword) {
    this.error = 'Passwords do not match';
    return;
  }

  this.auth.signup(this.identifier, this.password).subscribe({
    next: (res: any) => {
      this.message = res?.message || "Signup successful";
      this.error = "";
      setTimeout(() => this.router.navigate(['/distributor-login']), 1500);
    },
    error: (err) => {
      this.error = err.error?.message || 'Signup failed';
      this.message = "";
    }
      });
    }

    // onSignup(): void {
    //   if (this.password !== this.confirmPassword) {
    //     this.error = 'Passwords do not match';
    //     return;
    //   }
  
    //   this.auth.signup(this.identifier, this.password).subscribe({
    //     next: res => {
    //       this.message = res;
    //       setTimeout(() => this.router.navigate(['/distributor-login']), 1500);
    //     },
    //     error: err => this.error = err.error || 'Signup failed'
    //   });
    // }

}
