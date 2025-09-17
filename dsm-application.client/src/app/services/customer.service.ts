import { Injectable } from '@angular/core';

import { Observable, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Customer, CustomerLoginRequest, CustomerLoginResponse, CustomerRegisterRequest } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
    private apiUrl = 'https://localhost:7189/api/customers';

  constructor(private http: HttpClient) {}

  register(request: CustomerRegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
  }

  login(request: CustomerLoginRequest): Observable<CustomerLoginResponse> {
    return this.http.post<CustomerLoginResponse>(`${this.apiUrl}/login`, request).pipe(
          tap(res => {
            if (res.token || res.token) {
              localStorage.setItem('token', res.token || res.token);
              localStorage.setItem('role', res.role);
              console.log('Role from API:', res.role);
              
            }
          
          })
        );;
    
  }

  createByDistributor(customer: Customer): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/create-by-distributor`, customer, { headers });
  }

  setPassword(request: CustomerLoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/set-password`, request);
  }
    getRole(): string | null {
    return localStorage.getItem('role');
  }

  getMyCustomers(): Observable<Customer[]> {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.get<Customer[]>(`${this.apiUrl}/my-customers`, { headers });
}
 getDashboard(): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get(`${this.apiUrl}/dashboard`, { headers });
}
}
