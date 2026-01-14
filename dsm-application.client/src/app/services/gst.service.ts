import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GstService {

private baseUrl = `${environment.apiUrl}/gst`;

  constructor(private http: HttpClient) {}

  getGst(productName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auto-gst?productName=${productName}`);
  }
}
