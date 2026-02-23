import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { DistributorDto } from './customer-api.service';

@Injectable({
  providedIn: 'root'
})
export class DistributorProfileService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

 getProfile() {
  return this.http.get<DistributorDto>(`${this.api}/distributors/profile`);
}

 updateProfile(formData: FormData) {
  return this.http.post(`${environment.apiUrl}/distributors/update-profile`, formData);
}
  verifyOtp(data: any) {
  return this.http.post(`${this.api}/otp/verify`, data);
}

//   saveGodownLocation(data: any) {
//   return this.http.post(
//     `${this.api}/distributors/godown/location`,
//     data
//   );
// }
saveGodownLocation(data: any) {
  return this.http.post(
    `${this.api}/godown/godown/location`,
    data
  );
}
}