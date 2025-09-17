import { Component } from '@angular/core';

import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-create-customer-distributor',
  templateUrl: './create-customer-distributor.component.html',
  styleUrl: './create-customer-distributor.component.css'
})
export class CreateCustomerDistributorComponent {
  customer: Customer = {
    name: '', email: '', phoneNumber: '',
    role: 'Customer'
  };
  message = '';

  constructor(private customerService: CustomerService) {}

  createCustomer() {
    this.customerService.createByDistributor(this.customer).subscribe({
      next: (res: any) => this.message = res.message,
      error: (err) => this.message = err.error
    });
  }

}
