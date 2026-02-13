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
import { ToastrService } from 'ngx-toastr';
import { CustomerService } from '../../services/customer.service';
import { environment } from '../../../environments/environment';

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
  phoneChanged = false;
  showOtpInput = false;
  otp = '';
  isVerifyingOtp = false;
  isSaving = false;
  isLoading = false;
  errorMessage = '';
  emailExists = false;
  phoneExists = false;
  receivedOtp: string | null = null;
  apiBaseUrl = environment.apiUrl.replace('/api', '');


  @ViewChild('fileInput') fileInput: any;// removed any and replaced this with !

  constructor(private profileService: ProfileService,
    private toastr: ToastrService,
    private customerService: CustomerService) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  // Load existing profile
  loadProfile(): void {
    this.isLoading = true;

    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.customer = {
          ...res,
          phoneNumber: res.phoneNumber?.startsWith('+91')
            ? res.phoneNumber.substring(3)
            : res.phoneNumber
        };

        this.originalCustomer = { ...res };

        this.previewImage = res.profileImageUrl
  ? this.apiBaseUrl + res.profileImageUrl
  : '/assets/default-user.png';


        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Failed to load profile';
        this.toastr.error('Failed to load profile', 'Error');

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
    if (!this.customer.name ||
      !/^[A-Z]/.test(this.customer.name) ||
      !/^[6-9]\d{9}$/.test(this.customer.phoneNumber || '') ||
      !this.customer.pincode) {

      this.toastr.error('Please fill all required fields correctly', 'Validation Error');
      this.isSaving = false;
      return;
    }

    const formData = new FormData();

    formData.append("name", this.customer.name || "");
    formData.append(
      "phoneNumber",
      this.customer.phoneNumber
        ? '+91' + this.customer.phoneNumber
        : ''
    );

    formData.append("email", this.customer.email || "");  // ✅ FIX ADDED
    formData.append("street", this.customer.street || "");
    formData.append("city", this.customer.city || "");
    formData.append("state", this.customer.state || "");
    formData.append("pincode", this.customer.pincode || "");
    formData.append("country", this.customer.country || "");

    if (this.selectedFile) {
      formData.append("ProfileImage", this.selectedFile);
    }

    this.profileService.updateProfile(formData).subscribe({
      next: () => {
        this.toastr.success('Your profile has been updated successfully!', 'Profile Updated');

        this.selectedFile = null;
        this.loadProfile();
        this.isSaving = false;
      },
      error: (err) => {
        this.toastr.error('Could not update your profile. Try again.', 'Update Failed');


        this.originalCustomer = { ...this.customer }; // update original copy
        this.isSaving = false;
      }
    });
  }

  cancelEdit() {
    this.customer = { ...this.originalCustomer };
    this.customer.phoneNumber = (this.customer.phoneNumber || '').replace(/\D/g, '');
    this.previewImage = this.originalCustomer.profileImageUrl
      ? this.apiBaseUrl + this.originalCustomer.profileImageUrl
      : 'assets/default-user.png';
    this.selectedFile = null;
  }



  hasChanges(): boolean {
    return JSON.stringify(this.customer) !== JSON.stringify(this.originalCustomer) ||
      this.selectedFile !== null;
  }

  checkEmailExists() {
    if (!this.customer.email) return;

    this.customerService.checkEmailExists(this.customer.email).subscribe(exists => {
      this.emailExists = exists;
    });
  }


  restrictPhoneInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.slice(0, 10);

    if (value.length === 1 && !/^[6-9]$/.test(value)) {
      value = '';
    }

    event.target.value = value;
    this.customer.phoneNumber = value;

    // 🔥 detect phone change
    this.phoneChanged =
      ('+91' + value) !== this.originalCustomer.phoneNumber;

    // If phone changed, mark unverified
    if (this.phoneChanged) {
      this.customer.phoneVerified = false;
    }
  }

  sendOtp() {
  if (!this.customer.phoneNumber) {
    alert('Enter phone number first');
    return;
  }

  this.customerService
    .sendOtp('+91' + this.customer.phoneNumber)
    .subscribe({
      next: (res: any) => {
        // 🔥 THIS CREATES THE SAME POPUP YOU SHOWED
        alert(`OTP sent! Your OTP is: ${res.otp}`);

        this.showOtpInput = true;
      },
      error: () => {
        alert('Failed to send OTP');
      }
    });
}



  verifyOtp() {
  if (!this.otp || this.otp.trim() === '') {
    this.toastr.error('Enter OTP');
    return;
  }

  this.profileService.verifyPhone('+91' + this.customer.phoneNumber)
  .subscribe(() => {
    this.customer.phoneVerified = true;
    this.showOtpInput = false;
    this.otp = '';
    this.toastr.success('Phone number verified');
  });
}

checkPhoneExists() {
    if (!this.customer.phoneNumber) return;

    const phone = '+91' + this.customer.phoneNumber;

    this.customerService.checkPhoneExists(phone)
      .subscribe((exists: boolean) => {
        this.phoneExists = exists;
      });
  }

}
