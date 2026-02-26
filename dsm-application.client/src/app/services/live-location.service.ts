import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LiveLocationService {

  constructor(private http: HttpClient) {}

  send(
    employeeId: string,
    distributorId: string,
    lat: number,
    lng: number,
    isInsideGodown: boolean
  ) {
    return this.http.post(
      `${environment.apiUrl}/livelocation`,
      {
        employeeId,
        distributorId,
        latitude: lat,
        longitude: lng,
        isInsideGodown
      }
    );
  }
}
