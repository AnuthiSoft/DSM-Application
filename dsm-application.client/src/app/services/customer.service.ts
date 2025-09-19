import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Customer, CustomerLoginRequest, CustomerLoginResponse, CustomerRegisterRequest } from '../models/customer.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private api: ApiService) {}

  register(request: CustomerRegisterRequest): Observable<any> {
    return this.api.post(`customers/register`, request);
  }

  login(request: CustomerLoginRequest): Observable<CustomerLoginResponse> {
    return this.api.post<CustomerLoginResponse>(`customers/login`, request).pipe(
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

    return this.api.post(`customers/create-by-distributor`, customer, { headers });
  }

  setPassword(request: CustomerLoginRequest): Observable<any> {
    return this.api.post(`customers/set-password`, request);
  }
    getRole(): string | null {
    return localStorage.getItem('role');
  }

  getMyCustomers(): Observable<Customer[]> {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.api.get<Customer[]>(`customers/my-customers`, { headers });
}

}
