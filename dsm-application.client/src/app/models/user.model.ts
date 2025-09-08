export interface User {
  id?: string;
  email: string;
  role: string;
  distributorId?: string;
  name?: string;
  phoneNumber?: string;
  isRegistered: boolean;
  passwordHash?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
}