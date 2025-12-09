import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AddFraudReportDto, FraudReport } from '../models/fraud.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FraudService {
  private endpoint = 'fraud';

   constructor(private api: ApiService) {}
    reportFraud(payload: AddFraudReportDto): Observable<any> {
    return this.api.post(`${this.endpoint}`, payload);
  }

  getPending(): Observable<FraudReport[]> {
    return this.api.get<FraudReport[]>(`${this.endpoint}/pending`);
  }

  takeAction(id: string, action: 'approve' | 'reject'): Observable<any> {
    return this.api.post(`${this.endpoint}/${id}/action?action=${action}`, {});
  }
  getAll(): Observable<FraudReport[]> {
  return this.api.get<FraudReport[]>(`${this.endpoint}/all`);
}
}
