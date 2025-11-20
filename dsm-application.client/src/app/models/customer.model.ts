export interface Customer {
  isActive: any;
  customerId?: string;
  name: string;
  email: string;
  phoneNumber: string;
  address:string;
  passwordHash?: string | null;
  isRegistered?: boolean;
  addedByDistributorId?: string | null;
   connectedDistributors?: string[];
   role: 'Customer';
    company?: string;              // ✅ Add this
  registrationDate?: Date;       // ✅ Add this
}

export interface CustomerRegisterRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface CustomerLoginRequest {
    email?: string;       // optional
  phoneNumber?: string; // optional
  password: string;
}

export interface CustomerLoginResponse {
  token: string;
  customer: Customer;
  role:string;
}

export interface CustomerProfileDto {
  customerId?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;

  // IMAGE
  profileImageUrl?: string;
  

  // Address
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;

  // Old single address field (your HTML uses this!)
  address?: string;

  // Metadata
  role?: string;
  isRegistered?: boolean;
  addedByDistributorId?: string;

  createdDate?: string;
  updatedDate?: string;
}


