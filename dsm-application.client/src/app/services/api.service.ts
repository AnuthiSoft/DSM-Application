import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, options: object = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
      ...options,
      observe: 'body' as const
    });
  }

  post<T>(endpoint: string, body: any, options: object = {}): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
      ...options,
      observe: 'body' as const
    });
  }

  put<T>(endpoint: string, body: any, options: object = {}): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
      ...options,
      observe: 'body' as const
    });
  }

  delete<T>(endpoint: string, options: object = {}): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, {
      ...options,
      observe: 'body' as const
    });
  }

  patch<T>(endpoint: string, body: any, options: object = {}): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body, {
      ...options,
      observe: 'body' as const
    });
  }
}
