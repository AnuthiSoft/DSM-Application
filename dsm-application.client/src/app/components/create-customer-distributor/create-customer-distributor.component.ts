import { Component } from '@angular/core';
import { Customer } from '../../../../MyTypes/customer.model';
import { CustomerService } from '../../services/customer.service';

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
