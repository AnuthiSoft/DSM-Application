import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { DistributorOrder, Employee, Order, OrderPreview } from '../models/order.model';
import { Product } from '../models/products.model';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
private baseUrl = environment.apiUrl + '/orders';

   private readonly endpoint = 'orders';
 apiUrl = environment.apiUrl;
  constructor(private api: ApiService,private http: HttpClient) {}

  reorderToCart(orderId: string) {
  return this.api.post(`${this.endpoint}/${orderId}/reorder-to-cart`, {});
}
getCart() {
  return this.api.get('orders/customer/cart');
}

 previewOrder(payload: any) {
  const token = localStorage.getItem("token");
  return this.http.post(
    `${environment.apiUrl}/orders/preview`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}


  

  placeOrder(payload: any): Observable<any> {
    // assumes ApiService posts to /api/<endpoint>
    return this.api.post<any>(`${this.endpoint}/create`, payload);
  }
 
 getOrdersByCustomer(customerId: string) {
  return this.api.get<Order[]>(`${this.endpoint}/customer/${customerId}`);
}
 getOrderEmployees(distributorId: string): Observable<Employee[]> {
    //  no baseUrl, no http, just endpoint
    return this.api.get<Employee[]>(`${this.endpoint}/${distributorId}/employees`);
  }
 
getLastBoughtQuantities(customerId: string) {
  return this.api.get<Record<string, number>>(
    `${this.endpoint}/customer/${customerId}/last-quantities`
  );
}


previewDiscount(payload: any) {
  return this.http.post<OrderPreview>(
    `${environment.apiUrl}/orders/preview-discount`,
    payload
  );
}


 
 
  
 // ✅ Cash Collector creates order
createOrderByCollector(data: any) {
  return this.api.post<any>(
    'orders/create-by-collector',
    data
  );
}

// ✅ Get products by distributor
getProductsByDistributor(distributorId: string) {
  return this.api.get<Product[]>(
    `products/distributor/${distributorId}`
  );
}

getOrderById(orderId: string) {
  return this.api.get<any>(`orders/${orderId}`);
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
  reorder(orderId: string, expectedDelivery: string) {
  return this.api.post(
    `orders/${orderId}/reorder`,
    {},
    { params: { expectedDelivery } }
  );
}



  uploadDeliveryReceipt(orderId: string, formData: FormData): Observable<any> {
  return this.api.post(
    `${this.endpoint}/${orderId}/upload-receipt`,
    formData
  );
}

approveCredit(orderId: string, amount: number) {
  return this.http.post(
    `${environment.apiUrl}/orders/${orderId}/approve-credit?amount=${amount}`,
    {}
  );
}

}
 