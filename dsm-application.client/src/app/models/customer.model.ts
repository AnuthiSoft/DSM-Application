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


