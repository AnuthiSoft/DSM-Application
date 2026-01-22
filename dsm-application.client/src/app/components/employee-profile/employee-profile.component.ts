import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-employee-profile',
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.css']
})
export class EmployeeProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  profile: any = {};
  selectedImage: File | null = null;
  profileImageUrl: string = '';

  constructor(
    private employeeService: EmployeeService,
    private toastr: ToastrService,

  ) { }

  ngOnInit() {
    this.loadProfile();
    this.loadImage();

    // Try loading image, but fallback handled in HTML
    // this.profileImageUrl = this.employeeService.getProfileImage();
  }


  // onImgError(event: any) {
  //   event.target.src = 'assets/default-user.png';
  // }


  //   loadProfile() {
  //     this.employeeService.getMyProfile().subscribe({
  //       next: (res) => {
  //         this.profile = {
  //   name: res.name || '',
  //   email: res.email || '',
  //   phoneNumber: res.phoneNumber || '',
  //   address: res.address || ''
  // };
  //       },

  //     error: () => {
  //         Swal.fire({
  //           icon: 'error',
  //           title: 'Failed!',
  //           text: 'Failed to load profile'
  //         });
  //       }
  //     });
  //   }

loadProfile() {
  this.employeeService.getMyProfile().subscribe({
    next: (res) => {
      Object.assign(this.profile, {
        name: res.name,
        email: res.email,
        phoneNumber: res.phoneNumber,
        street: res.street,
        city: res.city,
        state: res.state,
        pincode: res.pincode,
        country: res.country,
        createdDate: res.createdDate,
        updatedDate: res.updatedDate,
        isActive: res.isActive
      });
    }
  });
}






  //   updateProfile() {
  //   console.log("SAVE BUTTON WORKING, profile:", this.profile);

  //   this.employeeService.updateMyProfile(this.profile).subscribe({
  //     next: () => {
  //       // this.toastr.success("Profile updated successfully");
  //        this.toastr.success("Profile saved successfully!", "Success");

  //     },
  //     error: (err) => {
  //       console.log("UPDATE ERROR:", err);
  //       this.toastr.error("Update failed");
  //     }
  //   });
  // }

  // 👉 Trigger hidden file input
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // 👉 Handle selected file
  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    this.selectedImage = file;  // <--- Save file
   const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ======================
  // UPDATE PROFILE
  // ======================
updateProfile() {
  const formData = new FormData();

  formData.append('Name', this.profile.name || '');
  formData.append('PhoneNumber', this.profile.phoneNumber || '');
  formData.append('Street', this.profile.street || '');
  formData.append('City', this.profile.city || '');
  formData.append('State', this.profile.state || '');
  formData.append('Pincode', this.profile.pincode || '');
  formData.append('Country', this.profile.country || '');

  if (this.selectedImage) {
    formData.append('profileImage', this.selectedImage);
  }

 this.employeeService.updateMyProfile(formData).subscribe({
  next: () => {
    this.toastr.success('Profile updated successfully', 'Success');

    setTimeout(() => {
      this.loadProfile();
    }, 200);
  },
  error: () => {
    this.toastr.error('Profile update failed', 'Error');
  }
});
}


  loadImage() {
    this.employeeService.getProfileImage().subscribe({
      next: (blob) => {
        this.profileImageUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.profileImageUrl = ''; // will use default avatar
      }
    });
  }

  uploadImage() {
    if (!this.selectedImage) {
      this.toastr.warning('Please select an image', 'No Image Selected');
      return;
    }

    this.employeeService.uploadProfileImage(this.selectedImage).subscribe({
      next: () => {
        // Swal.fire({
        //   icon: 'success',
        //   title: 'Uploaded!',
        //   text: 'Image uploaded successfully!'
        // });

        this.loadImage(); // FIX: Reload image
        // this.profileImageUrl = this.employeeService.getProfileImage() + '?t=' + Date.now();
      },
      error: () => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Upload Failed',
        this.toastr.error('Image upload failed', 'Error');
      }
    });
  }
}

