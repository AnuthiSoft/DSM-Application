import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReturnApiService {

  private base = `${environment.apiUrl}/returns`;
  private apiUrl = environment.apiUrl; 

  

  constructor(private http: HttpClient) {}

  // 🔐 Attach JWT token
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  // ===============================
  // 1️⃣ CREATE RETURN (Customer)
  // ===============================
  createReturn(payload: {
    orderId: string;
    productId: string;
    returnQty: number;
    reason: string;
  }): Observable<any> {
    return this.http.post(
      `${this.base}/create`,
      payload,
      this.getHeaders()
    );
  }



  getReturnHistoryForDistributor(distributorId: string) {
  return this.http.get<any[]>(
    `${this.apiUrl}/returns/distributor/${distributorId}`,
     this.getHeaders() 
  );
}

  // ===============================
  // 2️⃣ GET RETURN BY ID
  // ===============================
  getReturnById(returnId: string): Observable<any> {
    return this.http.get(
      `${this.base}/${returnId}`,
      this.getHeaders()
    );
  }

  // ===============================
  // 3️⃣ GET RETURN HISTORY
  // ===============================
  getReturnHistory(status?: string): Observable<any[]> {
    const url = status
      ? `${this.base}/history?status=${status}`
      : `${this.base}/history`;

    return this.http.get<any[]>(url, this.getHeaders());
  }

  // ===============================
  // 4️⃣ APPROVE RETURN (Distributor)
  // ===============================
  approveReturn(returnId: string): Observable<any> {
    return this.http.put(
      `${this.base}/approve/${returnId}`,
      {},
      this.getHeaders()
    );
  }

  // ===============================
  // 5️⃣ RECEIVE RETURN (Employee)
  // ===============================
  receiveReturn(returnId: string): Observable<any> {
    return this.http.put(
      `${this.base}/receive/${returnId}`,
      {},
      this.getHeaders()
    );
  }

  // ===============================
  // 6️⃣ COMPLETE RETURN (Distributor)
  // ===============================
  completeReturn(returnId: string): Observable<any> {
    return this.http.put(
      `${this.base}/complete/${returnId}`,
      {},
      this.getHeaders()
    );
  }


// return images
  uploadReturnImages(returnId: string, files: File[]) {
  const formData = new FormData();

  files.forEach(file => formData.append('files', file));

  return this.http.post(
    `${this.base}/${returnId}/images`,
    formData,
    this.getHeaders()
  );
}

// ===============================
// 8️⃣ EMPLOYEE CONFIRM PICKUP
// ===============================
employeePickup(returnId: string): Observable<any> {
  return this.http.put(
    `${this.base}/picked-up/${returnId}`,
    {},
    this.getHeaders()
  );
}



schedulePickup(
  returnId: string,
  payload: {
    pickupDate: string;
    pickupSlot: string;
    employeeId: string;
    message?: string;
  }
): Observable<any> {
  return this.http.post(
    `${this.base}/${returnId}/schedule-pickup`,
    payload,
    this.getHeaders()
  );
}

getReturnsAssignedToEmployee(employeeId: string): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.base}/assigned-to-employee/${employeeId}`,
    this.getHeaders()
  );
}

getPendingReturnsForDistributor(distributorId: string): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.base}/pending/${distributorId}`,
    this.getHeaders()
  );
}



  // ===============================
  // 7️⃣ REJECT RETURN (Distributor)
  // ===============================
rejectReturn(returnId: string, reason: string): Observable<any> {
  return this.http.put(
    `${this.base}/reject/${returnId}`,
    { reason },
    this.getHeaders()
  );
}


}
