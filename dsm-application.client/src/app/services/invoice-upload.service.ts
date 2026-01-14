import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceUploadService {

private apiUrl = `${environment.apiUrl}/invoice-upload/upload`;

  constructor(private http: HttpClient) {}

  uploadInvoice(file: File, employeeId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);

    return this.http.post<any>(this.apiUrl, formData);
  }
}
