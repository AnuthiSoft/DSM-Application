import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {


   private readonly endpoint = 'customers/profile'; // 👈 match controller route

  constructor(private api: ApiService) {}

  getProfile(): Observable<Profile> {
    return this.api.get<Profile>(this.endpoint);
  }

  updateProfile(profile: Profile): Observable<void> {
    return this.api.put<void>(this.endpoint, profile);
  }
}
