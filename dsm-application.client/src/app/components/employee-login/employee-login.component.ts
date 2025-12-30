import { Component, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-employee-login',
  templateUrl: './employee-login.component.html',
  styleUrl: './employee-login.component.css'
})
export class EmployeeLoginComponent {
   email = '';
      password = '';
      error = '';
      showPassword = false; 
    
      constructor(private auth: AuthService, 
        private router: Router,
        private toastr: ToastrService,
        private ngZone: NgZone) {}
  
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



    validateEmailOrPhone(input: string): boolean {
  const phoneRegex = /^[0-9]{10}$/;        // 10 digits only
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (phoneRegex.test(input)) {
    return true; // valid phone
  }

  if (emailRegex.test(input)) {
    return true; // valid email
  }

  return false; // neither valid
}

    
      onLogin(): void {

         if (!this.validateEmailOrPhone(this.email)) {
    this.error = "Enter a valid email or 10-digit phone number.";
    return;
  }




  this.auth.employeeLogin(this.email, this.password).subscribe({
    next: (res: any) => {
      // Save IDs
      localStorage.setItem('distributorId', res.distributorId);
      localStorage.setItem('EmployeeId', res.employeeId);
      localStorage.setItem('employeeId', res.employeeId);
              localStorage.setItem('employeeDesignation', res.designation);
          localStorage.setItem('employeeName', res.name);
 
  this.router.navigate(['/employee-dashboard']);

      const role = this.auth.getRole();

      if (role === 'Admin') {
        this.router.navigate(['/admin-dashboard']);
      } else if (role === 'Distributor') {
        this.router.navigate(['/distributor-dashboard']);
      } else if (role === 'Employee') {
        this.toastr.success('Welcome Distributor', 'Login Successfull');
          setTimeout(() => {
            this.ngZone.run(() => {
              this.router.navigate(['/employee-dashboard']);
            });
          }, 1000);
      } else {
        this.error = 'Unauthorized role';
      }
    },

    error: (err) => {
  console.log("LOGIN ERROR:", err);

  const backendMessage = err.error?.message || err.error;

  // Detect inactive employee
  if (err.status === 401 || err.status === 403) {
    if (backendMessage?.toString().toLowerCase().includes('inactive')) {
      this.error = 'Your account is inactive. Please contact your distributor.';
      return;
    }
  }

  this.error = backendMessage || 'Login failed';
}
  });
}

}
