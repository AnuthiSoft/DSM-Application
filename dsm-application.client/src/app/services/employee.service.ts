
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
export interface Employee {
  employeeId: string;
  distributorId: string;
  name: string;
  email: string;
  phoneNumber: string;
  designation: string;
  role: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  getOrderEmployees(distributorId: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private api: ApiService) {}

  getEmployees(distributorId: string): Observable<Employee[]> {
    // ✅ no baseUrl, no http, just endpoint
    return this.api.get<Employee[]>(`employees/${distributorId}`);
  }
 


  addEmployee(distributorId: string, emp: Employee): Observable<Employee> {
    return this.api.post<Employee>(`employees/${distributorId}`, emp);
  }

  updateEmployee(
    distributorId: string,
    employeeId: string,
    emp: Employee
  ): Observable<Employee> {
    return this.api.put<Employee>(
      `employees/${distributorId}/${employeeId}`,
      emp
    );
  }

  deleteEmployee(distributorId: string, employeeId: string): Observable<any> {
    return this.api.delete<any>(`employees/${distributorId}/${employeeId}`);
  }

  toggleActive(
    distributorId: string,
    employeeId: string
  ): Observable<Employee> {
    return this.api.patch<Employee>(
      `employees/toggle/${distributorId}/${employeeId}`,
      {}
    );
  }
}
