import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Invoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private baseUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  /** CREATE INVOICE */
  create(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, invoice);
  }

  /** UPDATE INVOICE */
  update(id: string, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.baseUrl}/${id}`, invoice);
  }

  /** GET INVOICE BY ID */
  getById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/${id}`);
  }

  /** GET ALL INVOICES */
  getAll(distributorId?: string): Observable<Invoice[]> {
    const url = distributorId
      ? `${this.baseUrl}?distributorId=${distributorId}`
      : this.baseUrl;

    return this.http.get<Invoice[]>(url);
  }

  /** UPDATE ONLY EWAY BILL NUMBER */
  updateEwayBill(id: string, ewayBillNo: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/ewaybill`,
     { ewayBillNo: ewayBillNo }
   // 🔥 MUST BE JSON object
    );
  }

  /** SEND EMAIL TO DRIVER */
  sendEmailCopy(data: any) {
    return this.http.post(`${this.baseUrl}/send-email`, data);
  }

  /** UPLOAD PDF TO SERVER (FOR DRIVER DOWNLOAD) */
  uploadInvoicePdf(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload-pdf`, formData);
  }
}

