import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { ApiService } from './api.service';
import { Capacitor } from '@capacitor/core';


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
employeeSignup(identifier: string, password: string): Observable<any> {
  const payload = {
    Email: identifier.includes('@') ? identifier : null,
    PhoneNumber: !identifier.includes('@') ? identifier : null,
    Password: password
  };

  return this.api.post<any>('auth/employee-signup', payload);
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
  return this.api.post('auth/forgot-password', { email });
}

verifyOtp(email: string, otp: string) {
  return this.api.post('auth/verify-otp', { email, otp });
}

resetPassword(email: string, otp: string, newPassword: string) {
  return this.api.post('auth/reset-password', {
    email,
    otp,
    newPassword
  });
}

  // ✅ NEW METHOD
  getCurrentCustomer(): any {
    const customer = localStorage.getItem('customer');
    return customer ? JSON.parse(customer) : null;
  }
  
  //Me added this
//   employeeLogin(email: string, password: string): Observable<any> {
//   return this.api.post<any>('auth/employee-login', { email, password }).pipe(
//     tap(res => {
//       const token = res.token;
//       const refreshToken = res.refreshToken;

//       if (token) {
//         localStorage.setItem('token', token);
//         if (refreshToken) {
//           localStorage.setItem('refreshToken', refreshToken);
//         }

//         localStorage.setItem('role', res.role);
//         localStorage.setItem('EmployeeId', res.employeeId);
//         localStorage.setItem('DistributorId', res.distributorId);

//         // ✅ THIS LINE IS THE KEY
//         localStorage.setItem('designation', res.designation);
//       }
//     })
//   );
// }

// employeeLogin(email: string, password: string): Observable<any> {
//   return this.api.post<any>('auth/employee-login', { email, password }).pipe(
//     tap(res => {
//       console.log('EMPLOYEE LOGIN RESPONSE:', res);

//       const token = res.token || res.Token;
//       const refreshToken = res.refreshToken || res.RefreshToken;

//       if (!token) {
//         console.error('Employee login failed: token missing');
//         return;
//       }

//       localStorage.setItem('token', token);
//       if (refreshToken) {
//         localStorage.setItem('refreshToken', refreshToken);
//       }

//       localStorage.setItem('role', res.role || res.Role);
//       localStorage.setItem('EmployeeId', res.employeeId || res.EmployeeId);
//       localStorage.setItem('DistributorId', res.distributorId || res.DistributorId);
//       localStorage.setItem('designation', res.designation || res.Designation);

//       this.authStatus.next(true);

//       // 🔥 PHASE-3.2 — START GPS SILENTLY
//       if (Capacitor.getPlatform() === 'android') {
//         (window as any).Capacitor?.Plugins?.LocationService?.startTracking();
//       }

//       // 🔷 PHASE-4 — REGISTER GEOFENCE
//       if (Capacitor.getPlatform() === 'android') {
        
//         console.log('🔥 PHASE-4: Calling setupGeofence from JS');

//         const GODOWN_LAT = 12.9716;   // 🔴 replace later with backend value
//         const GODOWN_LNG = 77.5946;   // 🔴 replace later with backend value

//       //  (window as any).Capacitor?.Plugins?.LocationService
//       //   ?.setupGeofence({
//       //     lat: GODOWN_LAT,
//       //     lng: GODOWN_LNG,
//       //     radius: 200
//       //   })
//       //   .then(() => {
//       //     console.log('✅ PHASE-4: setupGeofence SUCCESS');
//       //   })
//       //   .catch((err: any) => {
//       //     console.error('❌ PHASE-4: setupGeofence FAILED', err);
//       //   });

//       }
//     })
//   );
// }


// employeeLogin(email: string, password: string): Observable<any> {
//   return this.api.post<any>('auth/employee-login', { email, password }).pipe(
//     tap(res => {

//       const token = res.token || res.Token;
//       const refreshToken = res.refreshToken || res.RefreshToken;

//       if (!token) return;

//       localStorage.setItem('token', token);
//       if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

//       localStorage.setItem('role', res.role || res.Role);
//       localStorage.setItem('EmployeeId', res.employeeId || res.EmployeeId);
//       localStorage.setItem('DistributorId', res.distributorId || res.DistributorId);
//       localStorage.setItem('designation', res.designation || res.Designation);

//       this.authStatus.next(true);

//       // ✅ ONLY THIS IS REQUIRED ON ANDROID
//       if (Capacitor.getPlatform() === 'android') {
//         (window as any).Capacitor?.Plugins?.LocationService?.startTracking();
//       }
//     })
//   );
// }

// employeeLogin(email: string, password: string): Observable<any> {
//   return this.api.post<any>('auth/employee-login', { email, password }).pipe(
//     tap(async res => {

//       const token = res.token || res.Token;
//       const refreshToken = res.refreshToken || res.RefreshToken;

//       if (!token) return;

//       // 🔥 SAVE TO CAPACITOR STORAGE (ANDROID READS THIS)
//       await Preferences.set({ key: 'token', value: token });

//       if (refreshToken) {
//         await Preferences.set({ key: 'refreshToken', value: refreshToken });
//       }

//       await Preferences.set({
//         key: 'EmployeeId',
//         value: res.employeeId || res.EmployeeId || ''
//       });

//       await Preferences.set({
//         key: 'DistributorId',
//         value: res.distributorId || res.DistributorId || ''
//       });

//       await Preferences.set({
//         key: 'role',
//         value: res.role || res.Role || ''
//       });

//       await Preferences.set({
//         key: 'designation',
//         value: res.designation || res.Designation || ''
//       });

//       this.authStatus.next(true);

//       // ✅ START GPS SILENTLY
//       if (Capacitor.getPlatform() === 'android') {
//         (window as any).Capacitor?.Plugins?.LocationService?.startTracking();
//       }
//     })
//   );
// }

employeeLogin(email: string, password: string): Observable<any> {
  return this.api.post<any>('auth/employee-login', { email, password }).pipe(
    tap(async res => {

      const token = res.token || res.Token;
      if (!token) return;

      const employeeId = res.employeeId || res.EmployeeId || '';
      const distributorId = res.distributorId || res.DistributorId || '';
      const role = res.role || res.Role || 'Employee';

      // ✅ 1. SAVE FOR WEB (guards, role checks)
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('EmployeeId', employeeId);
      localStorage.setItem('DistributorId', distributorId);

      // ✅ 2. SAVE FOR ANDROID (Java reads this)
      await Preferences.set({ key: 'token', value: token });
      await Preferences.set({ key: 'EmployeeId', value: employeeId });
      await Preferences.set({ key: 'DistributorId', value: distributorId });
      await Preferences.set({ key: 'role', value: role });

      console.log('✅ Employee Login OK', employeeId, distributorId);

      this.authStatus.next(true);

      // ✅ 3. START GPS ONLY AFTER LOGIN
      if (Capacitor.getPlatform() === 'android') {
        setTimeout(() => {
          (window as any).Capacitor?.Plugins?.LocationService?.startTracking();
        }, 500);
      }
    })
  );
}


 }


