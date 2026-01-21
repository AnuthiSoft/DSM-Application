
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
export interface ConnectionRequestDto {
  connectionId: string;
  customerId: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  connectedOn: string; // or Date
}
export interface CustomerEmployeeStatus {
  permanentEmployeeId: string | null;
  permanentEmployeeAvailable: boolean;
  permanentReason: string | null;

  temporaryEmployeeId: string | null;
  temporaryEmployeeAvailable: boolean;
  temporaryReason: string | null;

  isTemporaryActiveToday: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DistributorService {

private apiUrl = environment.apiUrl;
    constructor(private api: ApiService,private http: HttpClient) {}
      getAcceptedCustomers(distributorId?: string): Observable<ConnectionRequestDto[]> {
    const url = `distributor/accepted-customers${distributorId ? '?distributorId='+distributorId : ''}`;
    return this.api.get<ConnectionRequestDto[]>(url);
  }



disconnectCustomer(payload: { customerId: string; distributorId: string }) {
  return this.http.post(
    `${this.apiUrl}/distributor/disconnect-customer`,
    payload
  );
}




  

  getPendingRequests(distributorId: string): Observable<any[]> {
    return this.api.get<any[]>(`distributor/connection-requests?distributorId=${distributorId}`);
  }

 respondConnection(connectionId: string, accept: boolean): Observable<any> {
  return this.api.post(`distributor/respond-connection`, { ConnectionId: connectionId, Accept: accept });
}
  // Assign permanent employee
  assignPermanentEmployee(distributorId: string, customerId: string, employeeId: string) {
    return this.api.put(
      `distributor/assign-permanent-employee?distributorId=${distributorId}&customerId=${customerId}&employeeId=${employeeId}`,
      {}
    );
  }
//  assignTempToday(distributorId: string, customerId: string, tempEmpId: string) {
//     const body = {
//       distributorId: distributorId,
//       customerId: customerId,
//       temporaryEmployeeId: tempEmpId
//     };

//     return this.api.post(`distributor/assign-temp-today`, body);
//   }
 assignTempToday(distributorId: string, customerId: string, tempEmpId: string) {
  return this.api.post(`distributor/assign-temp-today`, {
    distributorId,
    customerId,
    temporaryEmployeeId: tempEmpId
  });
}

  getCustomerEmployeeStatus(distributorId: string, customerId: string) {
    return this.api.get<CustomerEmployeeStatus>(
      `distributor/customer-employee-status?distributorId=${distributorId}&customerId=${customerId}`
    );
  }


  // For dashboard mapping
  getCustomersWithEmployee(distributorId: string) {
    return this.api.get(`distributor/customers-with-employee?distributorId=${distributorId}`);
  }

// getScannerQr(distributorId: string) {
//   return this.api.get<any>(
//     `distributor/scanner-qr/${distributorId}`
//   );
// }
getScannerQr(distributorId: string) {
  return this.api.get<any>(
    `distributor/scanner-qr/${distributorId}`
  );
}
uploadScannerQr(distributorId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('distributorId', distributorId);

  return this.api.post<any>(
    'distributor/upload-scanner-qr',
    formData
  );
}

  // ✅ Load customer dashboard (global / local distributors)
  getCustomerDashboard(customerId: string): Observable<any> {
    return this.api.get(`customers/dashboard/${customerId}`);
  }

  // ✅ Connect distributor
  connectDistributor(customerId: string, distributorId: string): Observable<any> {
    return this.api.post(`customers/connect-distributor`, {
      customerId,
      distributorId
    });
  }

  // ✅ GET DISTRIBUTOR BY ID (for Fraud Report)
getDistributorById(distributorId: string) {
  return this.http.get<any>(
    `/api/Distributors/${distributorId}`
  );
}


getDistributorName(distributorId: string) {
  return this.api.get<any[]>(
    `distributor/accepted-customers?distributorId=${distributorId}`
  );
}

}

