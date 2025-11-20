import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
 constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<any> {
    return this.api.post<any>(`auth/login`, { email, password }).pipe(
      tap(res => {
          const token = res.token || res.tokenc;
  const refreshToken = res.refreshToken;

  if (token) {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('role', res.role);
    if (res.distributorId)
      localStorage.setItem('DistributorId', res.distributorId);
    if (res.employeeId)
      localStorage.setItem('EmployeeId', res.employeeId);

    this.authStatus.next(true);
  }
      })
    );
  }

  signup(identifier: string, password: string): Observable<any> {
  // If identifier contains '@', treat it as email, else as phone number
  const payload = {
    Email: identifier.includes('@') ? identifier : null,
    PhoneNumber: !identifier.includes('@') ? identifier : null,
    Password: password
  };

  return this.api.post(`auth/signup`, payload);
}

  logout(): void {
    localStorage.removeItem('token');
    
    localStorage.removeItem('role');
    this.authStatus.next(false);
     localStorage.removeItem('EmployeeId');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
    // ✅ NEW METHOD: Safely get distributorId from localStorage
  getDistributorId(): string {
    const id = localStorage.getItem('DistributorId');
    return id ? id : ''; // returns empty string if not found
  }
   // Get employeeId from localStorage
  getEmployeeId(): string {
    const id = localStorage.getItem('EmployeeId');
    return id ? id : ''; // return empty string if not found
  }
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

saveTokens(token: string, refreshToken: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
}

refreshAccessToken(): Observable<any> {
  const refreshToken = this.getRefreshToken();
  if (!refreshToken) return throwError(() => new Error('No refresh token'));

  return this.api.post<any>('auth/refresh-token', { refreshToken }).pipe(
    tap(res => {
      if (res.token && res.refreshToken) {
        this.saveTokens(res.token, res.refreshToken);
      }
    }),
    catchError(err => {
      this.logout();
      return throwError(() => err);
    })
  );
}


  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  authStatus$(): Observable<boolean> {
    return this.authStatus.asObservable();
  }
  forgotPassword(email: string) {
  return this.api.post(`auth/forgot-password`, { email });
}

verifyOtp(email: string, otp: string) {
  return this.api.post(`auth/verify-otp`, { email, otp });
}

resetPassword(email: string, otp: string, newPassword: string) {
  return this.api.post(`auth/reset-password`, { email, otp, newPassword });
}

  // ✅ NEW METHOD
  getCurrentCustomer(): any {
    const customer = localStorage.getItem('customer');
    return customer ? JSON.parse(customer) : null;
  }
  
  //Me added this
  employeeLogin(email: string, password: string): Observable<any> {
  return this.api.post<any>(`auth/employee-login`, { email, password }).pipe(
    tap(res => {
      const token = res.token;
      const refreshToken = res.refreshToken;

      if (token) {
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        localStorage.setItem('role', res.role);
        localStorage.setItem('EmployeeId', res.employeeId);
        localStorage.setItem('DistributorId', res.distributorId);
      }
    })
  );
}

}


