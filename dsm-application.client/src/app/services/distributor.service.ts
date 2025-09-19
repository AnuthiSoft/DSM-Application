
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DistributorService {


    constructor(private api: ApiService) {}
  

  getPendingRequests(distributorId: string): Observable<any[]> {
    return this.api.get<any[]>(`distributor/connection-requests?distributorId=${distributorId}`);
  }

 respondConnection(connectionId: string, accept: boolean): Observable<any> {
  return this.api.post(`distributor/respond-connection`, { ConnectionId: connectionId, Accept: accept });
}

}
