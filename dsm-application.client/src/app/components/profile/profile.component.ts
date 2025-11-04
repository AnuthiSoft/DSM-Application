import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    const headers = new HttpHeaders({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});
    this.http.get('http://localhost:5164/api/customers/profile',{ headers }).subscribe({
      next: (res) => {
        this.customer = res;
         this.originalCustomer = { ...res }; // store original data
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.http.put('http://localhost:5164/api/customers/profile', this.customer).subscribe({
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
