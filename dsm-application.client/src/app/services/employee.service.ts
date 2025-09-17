import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface Employee {
  employeeId?: string;
  distributorId: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  designation: string;
  isRegistered: boolean;
  isActive: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
   private baseUrl = 'https://localhost:7189/api/employees'; // matches ASP.NET controller route

  constructor(private http: HttpClient) {}

  getEmployees(distributorId: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/${distributorId}`);
  }

  addEmployee(distributorId: string, emp: Employee): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/${distributorId}`, emp);
  }

  updateEmployee(distributorId: string, employeeId: string, emp: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${distributorId}/${employeeId}`, emp);
  }

  deleteEmployee(distributorId: string, employeeId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${distributorId}/${employeeId}`);
  }

  toggleActive(distributorId: string, employeeId: string): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/toggle/${distributorId}/${employeeId}`, {});
  }

 
}
