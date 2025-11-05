import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{
  customer: any = {};
  isSaving: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
    originalCustomer: any = {}; // keep a copy for change detection

     

  constructor(private http: HttpClient,private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

    loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.customer = res;
        this.originalCustomer = { ...res }; // copy original
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

 // ✅ uses service instead of raw http
  saveProfile(): void {
    this.isSaving = true;
    this.profileService.updateProfile(this.customer).subscribe({
      next: () => {
        alert('Profile updated successfully!');
        this.originalCustomer = { ...this.customer }; // update original copy
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving profile', err);
        alert('Failed to update profile');
        this.isSaving = false;
      }
    });
  }
   cancelEdit() {
    // revert changes
    this.customer = { ...this.originalCustomer };
  }

  hasChanges(): boolean {
    // compare current with original
    return JSON.stringify(this.customer) !== JSON.stringify(this.originalCustomer);
  }
}
