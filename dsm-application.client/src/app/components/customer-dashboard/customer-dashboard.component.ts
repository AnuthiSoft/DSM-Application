import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../../../MyTypes/customer.model';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.css'
})
export class CustomerDashboardComponent {
   customerEmail: string | null = '';
   
  distributors: any[] = [];
  currentCustomer: Customer | null = null; // <-- add this


  constructor(private router: Router,private customerService: CustomerService) {}

  ngOnInit(): void {
    this.customerEmail = localStorage.getItem('customerEmail');
     this.loadDashboard();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/customer/login']);
  }
  
     loadDashboard() {
  this.customerService.getDashboard().subscribe({
  next: (res: any) => {
    this.distributors = res.map((d: any) => ({
      ...d,
      products: d.products || []  // ensures products array exists
    }));
  },
  error: (err) => console.error(err)
});
  }
}
