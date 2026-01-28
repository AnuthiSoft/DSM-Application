export interface Customer {
  customerId?: string;
  customerName?: string;
  isActive: any;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  passwordHash?: string | null;
  isRegistered?: boolean;
  addedByDistributorId?: string | null;
  connectedDistributors?: string[];
  role: 'Customer';
  company?: string;              // ✅ Add this
  registrationDate?: Date;       // ✅ Add this
  permanentEmployeeId?: string;      // 🔵 ADD THIS
  permanentEmployeeName?: string;    // 🔵 ADD THIS


  password?: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
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
  role: string;
}

export interface CustomerProfileDto {
  customerId?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;

  // IMAGE
  profileImageUrl?: string;
  phoneVerified: boolean;

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
export interface CustomerEmployeeStatus {
  permanentEmployeeId: string | null;
  permanentEmployeeAvailable: boolean;

  temporaryEmployeeId: string | null;
  temporaryEmployeeAvailable: boolean;

  isTemporaryActiveToday: boolean;
}


