import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/products.model';
import { environment } from '../../environments/environment';

export interface DashboardDistributor {
  distributor: {
    distributorId: string;
    companyName?: string;
    name?: string;
    status: string;
  };
  products: Product[];
  canConnect: boolean;
}

export interface CustomerDashboardResponse {
  isGlobal: boolean;
  distributors: DashboardDistributor[];
}

export interface ConnectedDistributorsResponse {
  acceptedDistributors: string[];
  pendingDistributors: string[];
  creatorDistributorId: string | null;
}

export interface DistributorDto {
  distributorId: string;
  companyName: string;
}
@Injectable({
  providedIn: 'root'
})
export class CustomerApiService {
 
  private base = `${environment.apiUrl}/customers`;
 
  constructor(private http: HttpClient) {}
 
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }
 
  getDashboard(customerId: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}/dashboard/${customerId}`,
      this.getHeaders()
    );
  }
 
  connectDistributor(customerId: string, distributorId: string): Observable<any> {
    return this.http.post(
      `${this.base}/connect-distributor`,
      { customerId, distributorId },
      this.getHeaders()
    );
  }
 
  getDistributorProducts(distributorId: string): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.base}/products/${distributorId}`,
      this.getHeaders()
    );
  }
 
getConnectedDistributors(
  customerId: string
): Observable<ConnectedDistributorsResponse> {
  return this.http.get<ConnectedDistributorsResponse>(
    `${this.base}/${customerId}/connected-distributors`,
    this.getHeaders()
  );
}

  
}