import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
export interface Employee {
  employeeId: string;
  distributorId: string;
  name: string;
  email: string;
  phoneNumber: string;
  designation: string;
  role: string;
  isActive: boolean;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  profileImageUrl?: string;
  invoicePdfUrl?: string;
   phoneVerified: boolean;
}
 

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private apiUrl = environment.apiUrl;   // ✅ ADD THIS


  private readonly baseUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(distributorId: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/${distributorId}`);
  }

  addEmployee(distributorId: string, employee: Employee): Observable<any> {
    return this.http.post(`${this.baseUrl}/${distributorId}`, employee);
  }

  updateEmployee(distributorId: string, employeeId: string, employee: Employee): Observable<any> {
    return this.http.put(`${this.baseUrl}/${distributorId}/${employeeId}`, employee);
  }

  // deleteEmployee(distributorId: string, employeeId: string): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/${distributorId}/${employeeId}`);
  // }

//   deleteEmployee(distributorId: string, employeeId: string): Observable<any> {
//   return this.http.delete(`${this.baseUrl}/api/employees/${distributorId}/${employeeId}`);
// }
deleteEmployee(distributorId: string, employeeId: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${distributorId}/${employeeId}`);
}


  toggleActive(distributorId: string, employeeId: string): Observable<Employee> {
    return this.http.patch<Employee>(
      `${this.baseUrl}/${distributorId}/${employeeId}/toggle`,
      {}
    );
  }

//  getMyProfile() {
//   return this.http.get(`${environment.apiUrl}/employees/my-profile`);
// }

// getMyProfile(): Observable<any> {
//   return this.http.get(`${this.apiUrl}/employee/my-profile`);
// }


// updateMyProfile(profile: any): Observable<any> {
//   return this.http.put(`${this.apiUrl}/employee/my-profile`, profile);
// }


// // updateMyProfile(profile: any) {
// //   const token = localStorage.getItem('token'); 

// //   return this.http.put(
// //     `${environment.apiUrl}/employees/my-profile`,
// //     profile,
// //     {
// //       headers: {
// //         Authorization: `Bearer ${token}`
// //       }
// //     }
// //   );
// // }


// uploadProfileImage(file: File) {
//   const formData = new FormData();
//   formData.append('file', file);

//   return this.http.post(
//     `${this.apiUrl}/employees/my-profile/upload-image`,
//     formData
//   );
// }


// getProfileImage(): Observable<Blob> {
//   return this.http.get(
//     `${this.apiUrl}/employees/my-profile/image`,
//     { responseType: 'blob' }
//   );
// }


// }
  
getMyProfile(): Observable<any> {
  const token = localStorage.getItem("token");

  return this.http.get(
    `${this.apiUrl}/employee-profile/my-profile`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

/** UPDATE logged-in employee profile (FormData + Image) */
  updateMyProfile(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');

   return this.http.put(
  `${this.apiUrl}/employee-profile/my-profile`,
  formData,
  { headers: { Authorization: `Bearer ${token}` } }
);
  }

uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem("token");

  return this.http.post(
    `${this.apiUrl}/employees/my-profile/upload-image`,
    formData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

getProfileImage() {
  const token = localStorage.getItem("token");

  return this.http.get(
    `${this.apiUrl}/employees/my-profile/image`,
    {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}
  markAvailability(payload: {
    employeeId: string;
    date: string;
    isAvailable: boolean;
    reason?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/distributor/employee/mark-availability`, payload);
  }

  getAvailability(employeeId: string, date: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/distributor/employee/availability?employeeId=${employeeId}&date=${date}`
    );
  }

  // ✅ CHECK EMPLOYEE EMAIL EXISTS
checkEmailExists(email: string): Observable<boolean> {
  return this.http.get<boolean>(
    `${this.baseUrl}/email-exists/${encodeURIComponent(email)}`
  );
}

// ✅ CHECK EMPLOYEE PHONE EXISTS
checkPhoneExists(phone: string): Observable<boolean> {
  return this.http.get<boolean>(
    `${this.baseUrl}/phone-exists/${phone}`
  );
}

sendOtp(phoneNumber: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/otp/send`,
    { phoneNumber }
  );
}

verifyOtp(phoneNumber: string, code: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/otp/verify`,
    { phoneNumber, code }
  );
}
}