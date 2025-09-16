import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css'
})
export class CustomerDashboardComponent {
   customerEmail: string | null = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.customerEmail = localStorage.getItem('customerEmail');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/customer/login']);
  }

}
