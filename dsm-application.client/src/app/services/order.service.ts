import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { DistributorOrder, Employee, Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
   private readonly endpoint = 'orders';

  constructor(private api: ApiService) {}

  placeOrder(payload: any): Observable<any> {
    // assumes ApiService posts to /api/<endpoint>
    return this.api.post<any>(`${this.endpoint}/create`, payload);
  }

 getOrdersByCustomer(customerId: string) {
  return this.api.get<Order[]>(`${this.endpoint}/customer/${customerId}`);
}
 getOrderEmployees(distributorId: string): Observable<Employee[]> {
    // ✅ no baseUrl, no http, just endpoint
    return this.api.get<Employee[]>(`${this.endpoint}/${distributorId}/employees`);
  }
  
  

  
   getOrdersByDistributor(distributorId: string, status?: string): Observable<DistributorOrder[]> {
    const url = status && status !== 'All'
      ? `${this.endpoint}/distributor/${distributorId}?status=${encodeURIComponent(status)}`
      : `${this.endpoint}/distributor/${distributorId}`;
    return this.api.get<DistributorOrder[]>(url);
  }

  updateStatus(orderId: string, status: string): Observable<any> {
    return this.api.put(`${this.endpoint}/${orderId}/status`, { status });
  }
  
  // Distributor - assign order to employee
  assignOrder(orderId: string, payload: any): Observable<any> {
    return this.api.put(`${this.endpoint}/${orderId}/assign`, payload);
  }

  // ✅ NEW: Fetch orders assigned to employee
getOrdersByEmployee(employeeId: string) {
  // console.log('Employee ID used for fetching orders:', this.currentUser.id);
    return this.api.get<DistributorOrder[]>(`${this.endpoint}/employee/${employeeId}`);
}
  // Employee - mark order delivered or failed
updateEmployeeOrderStatus(orderId: string, payload: any) {
  return this.api.put(`${this.endpoint}/${orderId}/employee-status`, payload);
}
collectPayment(orderId: string, payload: { collectedAmount: number; paymentMethod: string }) {
  return this.api.put(`${this.endpoint}/${orderId}/collect-payment`, payload);
}
  // Employee - mark pickup
  pickupOrder(orderId: string): Observable<any> {
    return this.api.put(`${this.endpoint}/${orderId}/pickup`, {});
  }
    // ✅ NEW: Cancel order (Customer)
  cancelOrder(orderId: string): Observable<any> {
    return this.api.put(`${this.endpoint}/${orderId}/cancel`, {});
  }

  // ✅ NEW: Reorder (Customer)
  reorder(orderId: string): Observable<any> {
    return this.api.post(`${this.endpoint}/${orderId}/reorder`,{});
  }
  uploadDeliveryReceipt(orderId: string, formData: FormData): Observable<any> {
  return this.api.post(
    `${this.endpoint}/${orderId}/upload-receipt`,
    formData
  );
}

}
