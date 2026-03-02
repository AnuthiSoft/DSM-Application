// import { Component, OnInit, ViewChild } from '@angular/core';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

import { DistributorProfileService } from '../../services/distributor-profile.service';
import { DistributorService } from '../../services/distributor.service';

import { DistributorDto } from '../../models/distributor.model';

@Component({
  selector: 'app-distributor-profile',
  templateUrl: './distributor-profile.component.html',
  styleUrls: ['./distributor-profile.component.css']
})
// export class DistributorProfileComponent implements OnInit {
export class DistributorProfileComponent implements OnInit, AfterViewInit {

  @ViewChild('searchInput', { static: false })
searchInput!: ElementRef;

  distributor: DistributorDto = {} as DistributorDto;
  originalDistributor: DistributorDto = {} as DistributorDto;

  previewImage: string | null = null;
  selectedFile: File | null = null;

  // Godown Location
isSavingLocation = false;
locationSaved = false;

// ===== MAP VARIABLES =====
showMap = false;

selectedLat!: number;
selectedLng!: number;

mapCenter!: google.maps.LatLngLiteral;
markerPosition!: google.maps.LatLngLiteral;

 
 // ✅ ADD THESE BACK
  showOtpInput = false;
  otp: string = '';
  
  isSaving = false;
  isLoading = false;
  errorMessage = '';

  apiBaseUrl = environment.apiUrl.replace('/api', '');

  @ViewChild('fileInput') fileInput: any;

  constructor(
    private profileService: DistributorProfileService,
    private toastr: ToastrService,
    private distributorService: DistributorService
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }
ngAfterViewInit(): void {

  if (!this.searchInput) return; // safety check

  const autocomplete = new google.maps.places.Autocomplete(
    this.searchInput.nativeElement
  );

  autocomplete.addListener('place_changed', () => {

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) return;

    this.selectedLat = place.geometry.location.lat();
    this.selectedLng = place.geometry.location.lng();

    this.mapCenter = {
      lat: this.selectedLat,
      lng: this.selectedLng
    };

    this.markerPosition = this.mapCenter;
    this.showMap = true;
  });
}
  
  // ================= LOAD PROFILE =================
  loadProfile(): void {

    this.isLoading = true;

    this.profileService.getProfile().subscribe({

      next: (res: DistributorDto) => {

        this.distributor = {
          ...res,
          phoneNumber: res.phoneNumber?.startsWith('+91')
            ? res.phoneNumber.substring(3)
            : res.phoneNumber
        };

        this.originalDistributor = { ...res };
if (res.profileImageBase64) {
  this.previewImage = `data:image/jpeg;base64,${res.profileImageBase64}`;
} else {
  this.previewImage = null;  // No default image
}

        this.isLoading = false;
      },

      error: () => {
        this.errorMessage = 'Failed to load profile';
        this.toastr.error('Failed to load profile');
        this.isLoading = false;
      }
    });
  }


  // ================= IMAGE =================
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

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


  // ================= SAVE =================
  saveProfile(): void {

    this.isSaving = true;

    if (
      !this.distributor.name ||
      !/^[A-Z]/.test(this.distributor.name) ||
      !/^[6-9]\d{9}$/.test(this.distributor.phoneNumber || '') ||
      !this.distributor.pincode
    ) {
      this.toastr.error('Fill all required fields correctly');
      this.isSaving = false;
      return;
    }

    const formData = new FormData();

    formData.append("name", this.distributor.name || "");

    formData.append(
      "phoneNumber",
      this.distributor.phoneNumber
        ? '+91' + this.distributor.phoneNumber
        : ''
    );

    formData.append("email", this.distributor.email || "");
    formData.append("street", this.distributor.street || "");
    formData.append("city", this.distributor.city || "");
    formData.append("state", this.distributor.state || "");
    formData.append("pincode", this.distributor.pincode || "");
    formData.append("country", this.distributor.country || "");

    if (this.selectedFile) {
      formData.append("profileImage", this.selectedFile);
    }

    this.profileService.updateProfile(formData).subscribe({

      next: () => {
        this.toastr.success('Profile updated successfully');
        this.selectedFile = null;
        this.loadProfile();
        this.isSaving = false;
      },

      error: () => {
        this.toastr.error('Update failed');
        this.isSaving = false;
      }

    });
  }


  // ================= CANCEL =================
  cancelEdit() {

    this.distributor = { ...this.originalDistributor };

    this.distributor.phoneNumber =
      (this.distributor.phoneNumber || '').replace(/\D/g, '');

    this.previewImage = this.originalDistributor.profileImageUrl
      ? this.apiBaseUrl + this.originalDistributor.profileImageUrl
      : 'assets/default-user.png';

    this.selectedFile = null;
  }


  hasChanges(): boolean {

    return JSON.stringify(this.distributor) !==
      JSON.stringify(this.originalDistributor) ||
      this.selectedFile !== null;
  }


  // ================= PHONE =================
  restrictPhoneInput(event: any) {

    let value = event.target.value.replace(/\D/g, '');
    value = value.slice(0, 10);

    if (value.length === 1 && !/^[6-9]$/.test(value)) {
      value = '';
    }

    event.target.value = value;
    this.distributor.phoneNumber = value;

    if ('+91' + value !== this.originalDistributor.phoneNumber) {
      this.distributor.phoneVerified = false;
    }
  }


  sendOtp() {

    if (!this.distributor.phoneNumber) {
      alert('Enter phone number');
      return;
    }

    this.distributorService
      .sendOtp('+91' + this.distributor.phoneNumber)
      .subscribe({

        next: (res: any) => {
          alert(`OTP: ${res.otp}`);
          this.showOtpInput = true;
        },

        error: () => {
          alert('OTP send failed');
        }
      });
  }


 verifyOtp() {

  if (!this.otp) {
    this.toastr.error('Enter OTP');
    return;
  }

  const payload = {
    phoneNumber: '+91' + this.distributor.phoneNumber,
    code: this.otp.trim()
  };

  this.profileService.verifyOtp(payload).subscribe({

    next: (res: any) => {

      if (res.success) {
        this.distributor.phoneVerified = true;
        this.showOtpInput = false;
        this.otp = '';

        this.toastr.success('Phone verified successfully');
      } else {
        this.toastr.error(res.message || 'Verification failed');
      }
    },

    error: (err) => {
      this.toastr.error(err?.error?.message || 'Invalid OTP');
    }

  });
}

useCurrentLocation() {

  if (!navigator.geolocation) {
    this.toastr.error('GPS not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {

      this.selectedLat = position.coords.latitude;
      this.selectedLng = position.coords.longitude;

      this.mapCenter = {
        lat: this.selectedLat,
        lng: this.selectedLng
      };

      this.markerPosition = this.mapCenter;
      this.showMap = true;
    },
    () => {
      this.toastr.error('Location permission denied');
    }
  );
}

moveMarker(event: google.maps.MapMouseEvent) {
  if (event.latLng) {
    this.selectedLat = event.latLng.lat();
    this.selectedLng = event.latLng.lng();

    this.markerPosition = {
      lat: this.selectedLat,
      lng: this.selectedLng
    };
  }
}


markerDragged(event: google.maps.MapMouseEvent) {
  if (event.latLng) {
    this.selectedLat = event.latLng.lat();
    this.selectedLng = event.latLng.lng();
  }
}

confirmLocation() {

  const payload = {
    lat: this.selectedLat,
    lng: this.selectedLng
  };

  this.profileService
    .saveGodownLocation(payload)
    .subscribe({

      next: () => {
        this.toastr.success('Godown location saved');
        this.showMap = false;
      },

      error: () => {
        this.toastr.error('Failed to save location');
      }

    });
}

closeMap() {
  this.showMap = false;
}

  // ================= GODOWN GPS =================
setGodownLocation() {

  if (!navigator.geolocation) {
    this.toastr.error('GPS not supported');
    return;
  }

  this.isSavingLocation = true;

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log("GPS:", lat, lng);

      const payload = {
        lat: lat,
        lng: lng
      };

      this.profileService
        .saveGodownLocation(payload)
        .subscribe({

          next: () => {
            this.toastr.success('Godown location saved');
            this.locationSaved = true;
            this.isSavingLocation = false;
          },

          error: () => {
            this.toastr.error('Failed to save location');
            this.isSavingLocation = false;
          }

        });
    },

    (error) => {

      console.error(error);

      this.toastr.error('Location permission denied');

      this.isSavingLocation = false;
    }

  );
}
}