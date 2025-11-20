// import { HttpClient } from '@angular/common/http';
// import { Component, OnInit } from '@angular/core';
// import { ProfileService } from '../../services/profile.service';
// import { CustomerProfileDto } from '../../models/customer.model';

// @Component({
//   selector: 'app-profile',
//   templateUrl: './profile.component.html',
//   styleUrl: './profile.component.css'
// })
// export class ProfileComponent implements OnInit {

//   customer: CustomerProfileDto = {} as CustomerProfileDto;
//   originalCustomer: CustomerProfileDto = {} as CustomerProfileDto;

//   previewImage: string | null = null;
//   selectedFile: File | null = null;

//   isSaving: boolean = false;
//   isLoading: boolean = false;
//   errorMessage: string = '';

//   constructor(private http: HttpClient, private profileService: ProfileService) {}

//   ngOnInit(): void {
//     this.loadProfile();
//   }

//   loadProfile(): void {
//     this.isLoading = true;

//     this.profileService.getProfile().subscribe({
//       next: (res) => {
//         this.customer = res;
//         this.originalCustomer = { ...res };

//         // Show preview if image exists
//         if (res.profileImageBase64) {
//           this.previewImage = `data:image/jpeg;base64,${res.profileImageBase64}`;
//         }

//         this.isLoading = false;
//       },

//       error: (err) => {
//         console.error('Error loading profile', err);
//         this.errorMessage = 'Failed to load profile';
//         this.isLoading = false;
//       }
//     });
//   }

//   saveProfile(): void {
//     this.isSaving = true;

//     this.profileService.updateProfile(this.customer).subscribe({
//       next: () => {
//         alert('Profile updated successfully!');
//         this.originalCustomer = { ...this.customer };
//         this.isSaving = false;
//       },

//       error: (err) => {
//         console.error('Error saving profile', err);
//         alert('Failed to update profile');
//         this.isSaving = false;
//       }
//     });
//   }

//   cancelEdit() {
//     this.customer = { ...this.originalCustomer };
//   }

//   hasChanges(): boolean {
//     return JSON.stringify(this.customer) !== JSON.stringify(this.originalCustomer);
//   }

//   // 📸 File selection handler (missing earlier)
//   onFileSelected(event: any) {
//     const file = event.target.files[0];
//     if (!file) return;

//     this.selectedFile = file;

//     const reader = new FileReader();
//     reader.onload = () => {
//       this.previewImage = reader.result as string;
//     };
//     reader.readAsDataURL(file);
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { ProfileService } from '../../services/profile.service';
// import { CustomerProfileDto } from '../../models/customer.model';

// @Component({
//   selector: 'app-profile',
//   templateUrl: './profile.component.html',
//   styleUrls: ['./profile.component.css']
// })
// export class ProfileComponent implements OnInit {

//   customer: CustomerProfileDto = {} as CustomerProfileDto;
//   originalCustomer: CustomerProfileDto = {} as CustomerProfileDto;

//   previewImage: string | null = null;
//   selectedFile: File | null = null;

//   isSaving = false;
//   isLoading = false;
//   errorMessage = '';

//   constructor(private profileService: ProfileService) {}

//   ngOnInit(): void {
//     this.loadProfile();
//   }

//   loadProfile(): void {
//     this.isLoading = true;

//     this.profileService.getProfile().subscribe({
//       next: (res) => {
//         this.customer = res;
//         this.originalCustomer = { ...res };

//         this.previewImage = res.profileImageUrl
//           ? 'http://localhost:5164' + res.profileImageUrl
//           : 'assets/default-user.png';

//         this.isLoading = false;
//       },
//       error: () => {
//         this.errorMessage = "Failed to load profile";
//         this.isLoading = false;
//       }
//     });
//   }
  

//   onFileSelected(event: any) {
//     this.selectedFile = event.target.files[0];

//     if (this.selectedFile) {
//       const reader = new FileReader();
//       reader.onload = () => this.previewImage = reader.result as string;
//       reader.readAsDataURL(this.selectedFile);
//     }
//   }

//   saveProfile(): void {
//     this.isSaving = true;

//     const formData = new FormData();

//     formData.append("name", this.customer.name || "");
//     formData.append("phoneNumber", this.customer.phoneNumber || "");

//     formData.append("street", this.customer.street || "");
//     formData.append("city", this.customer.city || "");
//     formData.append("state", this.customer.state || "");
//     formData.append("pincode", this.customer.pincode || "");
//     formData.append("country", this.customer.country || "");

//     if (this.selectedFile) {
//       formData.append("profileImage", this.selectedFile);
//     }

//     this.profileService.updateProfile(formData).subscribe({
//       next: () => {
//         alert("Profile updated successfully!");
//         this.originalCustomer = { ...this.customer };
//         this.isSaving = false;
//         this.loadProfile();
//       },
//       error: () => {
//         alert("Failed to update profile");
//         this.isSaving = false;
//       }
//     });
//   }

//   cancelEdit() {
//     this.customer = { ...this.originalCustomer };
//     this.previewImage = this.originalCustomer.profileImageUrl
//       ? 'http://localhost:5164' + this.originalCustomer.profileImageUrl
//       : 'assets/default-user.png';
//   }

//   hasChanges(): boolean {
//     return JSON.stringify(this.customer) !== JSON.stringify(this.originalCustomer) ||
//            this.selectedFile !== null;
//   }

// }

import { Component, OnInit, ViewChild } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { CustomerProfileDto } from '../../models/customer.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  customer: CustomerProfileDto = {} as CustomerProfileDto;
  originalCustomer: CustomerProfileDto = {} as CustomerProfileDto;

  previewImage: string | null = null;
  selectedFile: File | null = null;

  isSaving = false;
  isLoading = false;
  errorMessage = '';

  @ViewChild('fileInput') fileInput: any;// removed any and replaced this with !

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  // Load existing profile
  loadProfile(): void {
    this.isLoading = true;

    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.customer = res;
        this.originalCustomer = { ...res };

        this.previewImage = res.profileImageUrl
          ? 'http://localhost:5164' + res.profileImageUrl
          : 'assets/default-user.png';

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = "Failed to load profile";
        this.isLoading = false;
      }
    });
  }

  // Trigger hidden file input
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Handle file selection and preview
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Save profile info + image
  saveProfile(): void {
    this.isSaving = true;

    const formData = new FormData();

    formData.append("name", this.customer.name || "");
    formData.append("phoneNumber", this.customer.phoneNumber || "");
    formData.append("email", this.customer.email || "");  // ✅ FIX ADDED
    formData.append("street", this.customer.street || "");
    formData.append("city", this.customer.city || "");
    formData.append("state", this.customer.state || "");
    formData.append("pincode", this.customer.pincode || "");
    formData.append("country", this.customer.country || "");

    if (this.selectedFile) {
      formData.append("profileImage", this.selectedFile);
    }

    this.profileService.updateProfile(formData).subscribe({
      next: () => {
        alert("Profile updated successfully!");
        this.selectedFile = null;
        this.loadProfile();
        this.isSaving = false;
      },
      error: () => {
        alert("Failed to update profile");
        this.isSaving = false;
      }
    });
  }

  cancelEdit() {
    this.customer = { ...this.originalCustomer };
    this.previewImage = this.originalCustomer.profileImageUrl
      ? 'http://localhost:5164' + this.originalCustomer.profileImageUrl
      : 'assets/default-user.png';

    this.selectedFile = null;
  }

  hasChanges(): boolean {
    return JSON.stringify(this.customer) !== JSON.stringify(this.originalCustomer) ||
           this.selectedFile !== null;
  }

  
}
