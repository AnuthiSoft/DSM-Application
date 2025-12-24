import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeLocation {
  id: string;
  employeeId: string;
  lat: number;
  long: number;
  time: string;
  orderId?: string;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private apiUrl = 'http://localhost:5164/api/Tracking';

  constructor(private http: HttpClient) {}

  getLatestAll(): Observable<EmployeeLocation[]> {
    return this.http.get<EmployeeLocation[]>(`${this.apiUrl}/latest`);
  }

  getHistory(employeeId: string): Observable<EmployeeLocation[]> {
    return this.http.get<EmployeeLocation[]>(`${this.apiUrl}/history/${employeeId}`);
  }

  getHistoryByOrder(orderId: string): Observable<EmployeeLocation[]> {
    return this.http.get<EmployeeLocation[]>(`${this.apiUrl}/history/by-order/${orderId}`);
  }
}
