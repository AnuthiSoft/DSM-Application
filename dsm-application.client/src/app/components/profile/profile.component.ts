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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    const headers = new HttpHeaders({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});
    this.http.get('https://localhost:7189/api/customers/profile',{ headers }).subscribe({
      next: (res) => {
        this.customer = res;
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
    this.http.put('https://localhost:7189/api/customers/profile', this.customer).subscribe({
      next: () => {
        alert('Profile updated successfully!');
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error saving profile', err);
        alert('Failed to update profile');
        this.isSaving = false;
      }
    });
  }
}
