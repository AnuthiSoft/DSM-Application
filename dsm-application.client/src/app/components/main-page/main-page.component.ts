import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../shared/theme.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router,  public themeService: ThemeService) {}

  ngOnInit(): void {
   

    if (this.auth.isLoggedIn()) {

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
   changeTheme(event: any) {
    this.themeService.setTheme(event.target.value);
  }
}
