import { Component } from '@angular/core';
import { CustomerRegisterRequest } from '../../../../MyTypes/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-register',
  templateUrl: './customer-register.component.html',
  styleUrl: './customer-register.component.css'
})
export class CustomerRegisterComponent {
  request: CustomerRegisterRequest = { name: '', email: '', phoneNumber: '', password: '' };
  message = '';

  constructor(private customerService: CustomerService) {}

  register() {
    this.customerService.register(this.request).subscribe({
      next: (res: any) => {
        this.message = res.message;
      },
      error: (err) => {
        this.message = err.error;
      }
    });
  }

}
