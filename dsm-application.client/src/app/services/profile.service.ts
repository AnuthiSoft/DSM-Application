import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { CustomerProfileDto } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly endpoint = 'customers/profile';

  constructor(private api: ApiService) {}

  // GET profile
  getProfile(): Observable<CustomerProfileDto> {
    return this.api.get<CustomerProfileDto>(this.endpoint);
  }

  // UPDATE profile (FormData)
  updateProfile(formData: FormData): Observable<any> {
    return this.api.put<any>(this.endpoint, formData);
  }
  
  // ================= OTP =================

// SEND OTP
sendOtp(data: { phoneNumber: string }) {
  return this.api.post<any>('otp/send', data);
}

// VERIFY OTP
verifyOtp(data: { phoneNumber: string; code: string }) {
  return this.api.post<any>('otp/verify', data);
}

}
