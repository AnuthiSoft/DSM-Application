import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ThemeService } from './shared/theme.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
 
  constructor(
    private themeService: ThemeService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {

    const token = this.auth.getToken();

    if (token) {

      const role = this.auth.getRole();

      if (role === 'Admin') {
        this.router.navigate(['/admin-dashboard']);
      }
      else if (role === 'Distributor') {
        this.router.navigate(['/distributor-dashboard']);
      }
      else if (role === 'Employee') {
        this.router.navigate(['/employee-dashboard']);
      }
      else if (role === 'Customer') {
        this.router.navigate(['/customer-dashboard']);
      }

    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
