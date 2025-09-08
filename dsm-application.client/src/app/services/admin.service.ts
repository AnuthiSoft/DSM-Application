import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Distributor {
  distributorId: string;
  companyName: string;
  name: string;
  email: string;
  phoneNumber: string;
  gst: string;
  address: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://localhost:7189/api/admin';

  constructor(private http: HttpClient) {}

  getDistributors(): Observable<Distributor[]> {
    return this.http.get<Distributor[]>(`${this.apiUrl}/distributors`);
  }

  getDistributor(id: string): Observable<Distributor> {
    return this.http.get<Distributor>(`${this.apiUrl}/distributors/${id}`);
  }

  addDistributor(distributor: Distributor): Observable<any> {
    return this.http.post(`${this.apiUrl}/distributors`, distributor,{ responseType: 'text' });
  }

  updateDistributor(id: string, distributor: Distributor): Observable<any> {
    return this.http.put(`${this.apiUrl}/distributors/${id}`, distributor,{ responseType: 'text' });
  }

  deactivateDistributor(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/distributors/${id}/deactivate`, {},{ responseType: 'text' });
  }

  reactivateDistributor(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/distributors/${id}/reactivate`, {},{ responseType: 'text' });
  }

  deleteDistributor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/distributors/${id}`,{});
  }
}
