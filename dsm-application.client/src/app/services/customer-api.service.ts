import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/products.model';
export interface DistributorDto {
  distributorId: string;
  companyName: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  connectionStatus?: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class CustomerApiService {
  private base = 'https://localhost:7189/api/customers';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token') || '';
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getDashboard(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/dashboard/${customerId}`, this.getHeaders());
  }

  connectDistributor(customerId: string, distributorId: string): Observable<any> {
    return this.http.post(`${this.base}/connect-distributor`, { customerId, distributorId }, this.getHeaders());
  }

  getDistributorProducts(distributorId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products/${distributorId}`, this.getHeaders());
  }

  
}
