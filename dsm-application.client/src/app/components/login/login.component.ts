import { Component } from '@angular/core';
import { LoginRequest } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
     email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(): void {
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        debugger
     
        const role = this.auth.getRole();
        if (role === 'Admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'Distributor' ) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Unknown role'; 
        }
      },
      error: err => this.error = err.error || 'Login failed'
    });
  }

}
