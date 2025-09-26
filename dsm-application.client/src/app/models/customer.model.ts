export interface Customer {
  customerId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address:string;
  passwordHash?: string | null;
  isRegistered?: boolean;
  addedByDistributorId?: string | null;
   connectedDistributors?: string[];
   role: 'Customer'
}

export interface CustomerRegisterRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export interface CustomerLoginResponse {
  token: string;
  customer: Customer;
  role:string;
}


