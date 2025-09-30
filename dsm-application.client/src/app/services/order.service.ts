import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { DistributorOrder, Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
   private readonly endpoint = 'orders';

  constructor(private api: ApiService) {}

  placeOrder(payload: any): Observable<any> {
    // assumes ApiService posts to /api/<endpoint>
    return this.api.post<any>(this.endpoint, payload);
  }

 getOrdersByCustomer(customerId: string) {
  return this.api.get<Order[]>(`${this.endpoint}/customer/${customerId}`);
}
  

  // getOrdersByDistributor(distributorId: string) {
  //   return this.api.get<Order[]>(`${this.endpoint}/distributor/${distributorId}`);
  // }

  // updateStatus(orderId: string, status: string) {
  //   return this.api.put(`${this.endpoint}/${orderId}/status`, status);
  // }
   getOrdersByDistributor(distributorId: string, status?: string): Observable<DistributorOrder[]> {
    const url = status && status !== 'All'
      ? `${this.endpoint}/distributor/${distributorId}?status=${encodeURIComponent(status)}`
      : `${this.endpoint}/distributor/${distributorId}`;
    return this.api.get<DistributorOrder[]>(url);
  }

  updateStatus(orderId: string, status: string): Observable<any> {
    return this.api.put(`${this.endpoint}/${orderId}/status`, { status });
  }

}
