import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://localhost:7189/api/auth';
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.token || res.tokenc) {
          localStorage.setItem('token', res.token || res.tokenc);
          localStorage.setItem('role', res.role);
           // Decode JWT to get DistributorId
    // const decoded: any = jwt_decode(res.token);
    // console.log('Decoded JWT:', decoded);
    //  const distributorId = decoded.DistributorId; // ✅ get distributorId
    // localStorage.setItem('distributorId', distributorId);
    //  console.log('DistributorId stored:', distributorId);
            if (res.distributorId) {
    localStorage.setItem('DistributorId', res.distributorId); // ✅ now saved
  }
        }
       
      
      })
    );
  }

  signup(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { email, password });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.authStatus.next(false);
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
    // ✅ NEW METHOD: Safely get distributorId from localStorage
  getDistributorId(): string {
    const id = localStorage.getItem('DistributorId');
    return id ? id : ''; // returns empty string if not found
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  authStatus$(): Observable<boolean> {
    return this.authStatus.asObservable();
  }
  forgotPassword(email: string) {
  return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
}

verifyOtp(email: string, otp: string) {
  return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp });
}

resetPassword(email: string, otp: string, newPassword: string) {
  return this.http.post(`${this.apiUrl}/auth/reset-password`, { email, otp, newPassword });
}
  
}
function jwt_decode(token: any): any {
  throw new Error('Function not implemented.');
}

