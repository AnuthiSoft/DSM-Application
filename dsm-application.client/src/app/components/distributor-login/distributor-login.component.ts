import { Component, ViewEncapsulation, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-distributor-login',
  templateUrl: './distributor-login.component.html',
  styleUrl: './distributor-login.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DistributorLoginComponent {
  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
  private ngZone: NgZone) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  restrictPhoneInput(event: any) {
    const input = event.target.value;

    // If the input is only numbers → limit to max 10 digits
    if (/^[0-9]+$/.test(input)) {
      event.target.value = input.substring(0, 10);
      this.email = event.target.value;
    }
  }

  onLogin(): void {
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        const role = this.auth.getRole();
        const distributorId = this.auth.getDistributorId();
        localStorage.setItem('distributorId', distributorId);
        localStorage.setItem('EmployeeId', res.employeeId);
        localStorage.setItem('employeeId', res.employeeId);

        if (role === 'Admin') {
          this.toastr.success('Welcome Admin', 'Login Successfull');
          setTimeout(() => {
            this.ngZone.run(() => {
          this.router.navigate(['/admin-dashboard']);
          });
          }, 1000);
        } else if (role === 'Distributor') {
          this.toastr.success('Welcome Distributor', 'Login Successfull');
          setTimeout(() => {
            this.ngZone.run(() => {
              this.router.navigate(['/distributor-dashboard']);
            });
          }, 1000);
        } else if (role === 'Employee') {
          this.router.navigate(['/employee-dashboard']);
        } else {
          this.error = 'Unauthorized role';
        }
      },
      error: err => {
        if (err.status === 401 && err.error === 'Distributor Inactive') {
          this.error = 'Your distributor account is inactive. Please contact admin.';
        }
        else {
          this.error = err.error || 'Login failed';
        }
      }
    });
  }

}


