// export interface DistributorDto {
//   distributorId: string;
//   companyName: string;
//   name?: string;
//   email?: string;
//   phoneNumber?: string;
//   status?: string;
// }

export interface DistributorDto {

  distributorId: string;

  companyName: string;

  name?: string;

  email?: string;

  phoneNumber?: string;

  status?: string;


  // ✅ Profile Fields
  street?: string;

  city?: string;

  state?: string;

  pincode?: string;

  country?: string;


  // ✅ Image
  profileImageUrl?: string;


  // ✅ Meta
  createdDate?: string;

  updatedDate?: string;


  // ✅ Verification
  phoneVerified?: boolean;
  profileImageBase64?: string;


  // ✅ Role
  role?: string;
}