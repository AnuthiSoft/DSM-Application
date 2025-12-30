import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Distributor {
  distributorId: string;
  companyName: string;
  name: string;
  email: string;
  phoneNumber: string;
  gst: string;
  address: string;
  isPremium: boolean;
  isActive: boolean;
  categories?: string[]; // ✅ add this
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  

  constructor(private api: ApiService) {}

  getDistributors(): Observable<Distributor[]> {
    return this.api.get<Distributor[]>(`admin/distributors`);
  }

  getDistributor(id: string): Observable<Distributor> {
    return this.api.get<Distributor>(`admin/distributors/${id}`);
  }

  addDistributor(distributor: Distributor): Observable<any> {
    return this.api.post(`admin/distributors`, distributor, {
      responseType: 'text',
    });
  }

  updateDistributor(id: string, distributor: Distributor): Observable<any> {
    return this.api.put(`admin/distributors/${id}`, distributor, {
      responseType: 'text',
    });
  }

  deactivateDistributor(id: string): Observable<any> {
    return this.api.put(
      `admin/distributors/${id}/deactivate`,
      {},
      { responseType: 'text' }
    );
  }

  reactivateDistributor(id: string): Observable<any> {
    return this.api.put(
      `admin/distributors/${id}/reactivate`,
      {},
      { responseType: 'text' }
    );
  }
  setPremium(id: string): Observable<any> {
    return this.api.put(`admin/distributors/${id}/set-premium`, {});
  }

  removePremium(id: string): Observable<any> {
    return this.api.put(
      `admin/distributors/${id}/remove-premium`,
      {}
    );
  }

  // deleteDistributor(id: string): Observable<any> {
  //   return this.api.delete(`admin/distributors/${id}`, {});
  // }
deleteDistributor(id: string): Observable<string> {
  return this.api.delete<string>(
    `admin/distributors/${id}`,
    { responseType: 'text' }
  );
}

checkPhoneExists(phone: string): Observable<boolean> {
  return this.api.get<boolean>(`admin/phone-exists/${phone}`);
}

checkEmailExists(email: string): Observable<boolean> {
  return this.api.get<boolean>(`admin/email-exists/${email}`);
}



}
