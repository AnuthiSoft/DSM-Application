import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
    email = '';
  password = '';
  message = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSignup(): void {
    this.auth.signup(this.email, this.password).subscribe({
      next: res => {
        this.message = res;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: err => this.error = err.error || 'Signup failed'
    });
  }
}
