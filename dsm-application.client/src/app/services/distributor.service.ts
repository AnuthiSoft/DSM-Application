
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
export interface ConnectionRequestDto {
  connectionId: string;
  customerId: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  connectedOn: string; // or Date
}

@Injectable({
  providedIn: 'root'
})
export class DistributorService {


    constructor(private api: ApiService) {}
      getAcceptedCustomers(distributorId?: string): Observable<ConnectionRequestDto[]> {
    const url = `distributor/accepted-customers${distributorId ? '?distributorId='+distributorId : ''}`;
    return this.api.get<ConnectionRequestDto[]>(url);
  }

  disconnectCustomer(connectionId: string) {
    return this.api.post(`distributor/disconnect-customer`, { connectionId });
  }
  

  getPendingRequests(distributorId: string): Observable<any[]> {
    return this.api.get<any[]>(`distributor/connection-requests?distributorId=${distributorId}`);
  }

 respondConnection(connectionId: string, accept: boolean): Observable<any> {
  return this.api.post(`distributor/respond-connection`, { ConnectionId: connectionId, Accept: accept });
}

}
