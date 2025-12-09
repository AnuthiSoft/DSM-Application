import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Customer,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerRegisterRequest,
  CustomerProfileDto
} from '../models/customer.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(private api: ApiService, private http: HttpClient) {}

  // ---------------------- AUTH ----------------------
  register(request: CustomerRegisterRequest): Observable<any> {
    return this.api.post(`customers/register`, request);
  }

  login(request: CustomerLoginRequest): Observable<CustomerLoginResponse> {
    return this.api.post<CustomerLoginResponse>(`customers/login`, request).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          console.log('Role from API:', res.role);
        }
      })
    );
  }

  // ---------------------- CUSTOMER CREATION ----------------------
  createByDistributor(customer: Customer): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.api.post(`customers/create-by-distributor`, customer, { headers });
  }

  setPassword(request: CustomerLoginRequest): Observable<any> {
    return this.api.post(`customers/set-password`, request);
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
getCustomerId(): string {
  return localStorage.getItem('customerId') || '';
}
  // ---------------------- MY CUSTOMERS ----------------------
  getMyCustomers(): Observable<Customer[]> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    return this.api.get<Customer[]>(`customers/my-customers`, { headers });
  }

  updateCustomer(customerId: string, customer: Customer): Observable<any> {
    return this.api.put(`customers/update-customer/${customerId}`, customer);
  }

  deleteCustomer(customerId: string): Observable<any> {
    return this.api.delete(`customers/delete-customer/${customerId}`);
  }

  // ---------------------- PROFILE ----------------------

  /** GET PROFILE (GET /customers/profile) */
  getProfile(): Observable<CustomerProfileDto> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.api.get<CustomerProfileDto>(`customers/profile`, { headers });
  }

  /** UPDATE PROFILE (PUT /customers/profile) */
  updateProfile(data: CustomerProfileDto): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.api.put(`customers/profile`, data, { headers });
  }

  /** UPLOAD IMAGE (POST /customers/upload-profile-picture) */
  uploadProfilePicture(file: File): Observable<any> {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('file', file);

  return this.api.post(`customers/upload-profile-picture`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

}
