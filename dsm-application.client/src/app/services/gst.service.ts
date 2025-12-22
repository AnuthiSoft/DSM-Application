import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GstService {

  private baseUrl = 'http://localhost:5164/api/gst';

  constructor(private http: HttpClient) {}

  getGst(productName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auto-gst?productName=${productName}`);
  }
}
