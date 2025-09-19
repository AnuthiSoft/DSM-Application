import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DistributorService {
   private apiUrl = 'https://localhost:7189/api/distributor';

  constructor(private http: HttpClient) {}

  getPendingRequests(distributorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/connection-requests?distributorId=${distributorId}`);
  }

 respondConnection(connectionId: string, accept: boolean): Observable<any> {
  return this.http.post(`${this.apiUrl}/respond-connection`, { ConnectionId: connectionId, Accept: accept });
}

}
