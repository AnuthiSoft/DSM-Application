import { Component } from '@angular/core';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.css'
})
export class SetPasswordComponent {
  email = '';
  password = '';
  message = '';
  error = '';

  constructor(private customerService: CustomerService) {}

  setPassword() {
    this.customerService.setPassword({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.message = res;
        this.error = '';
        this.email = '';
        this.password = '';
      },
      error: (err) => {
        this.error = err.error || 'Failed to set password';
        this.message = '';
      }
    });
  }

}
