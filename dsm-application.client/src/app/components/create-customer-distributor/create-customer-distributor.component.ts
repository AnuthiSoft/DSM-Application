import { Component, OnInit } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-create-customer-distributor',
  templateUrl: './create-customer-distributor.component.html',
  styleUrl: './create-customer-distributor.component.css'
})
export class CreateCustomerDistributorComponent implements OnInit {
  customer: Customer = {
    name: '', email: '', phoneNumber: '',
    role: 'Customer',
    address: '',
    isActive: undefined
  };
  message = '';
  customers: Customer[] = [];

  constructor(private customerService: CustomerService) {}
  ngOnInit(): void {
    this.loadCustomers();
  }

  createCustomer() {
    this.customerService.createByDistributor(this.customer).subscribe({
      next: (res: any) => this.message = res.message,
      error: (err) => this.message = err.error
    });
  }
  loadCustomers() {
  this.customerService.getMyCustomers().subscribe({
    next: (res: Customer[]) => {
      // If you want to store the list in a separate array
      this.customers = res; 
      this.message = ''; // clear message on success
    },
    error: (err) => {
      this.customers = [];
      this.message = err.error || 'Failed to load customers';
    }
  });
}
  // Update customer
  updateCustomer(cust: Customer) {
    this.customerService.updateCustomer(cust.customerId!, cust).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.loadCustomers(); // Refresh after update
      },
      error: (err) => this.message = err.error || 'Failed to update customer'
    });
  }

  // Delete customer
  deleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    this.customerService.deleteCustomer(customerId!).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.loadCustomers(); // Refresh after delete
      },
      error: (err) => this.message = err.error || 'Failed to delete customer'
    });
  }
  

}
