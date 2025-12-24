import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InvoiceUploadService {

  private apiUrl = 'http://localhost:5164/api/invoice-upload/upload';

  constructor(private http: HttpClient) {}

  uploadInvoice(file: File, employeeId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);

    return this.http.post<any>(this.apiUrl, formData);
  }
}
