export interface Profile {
  customerId?: string;       // Unique ID (from JWT claim or MongoDB)
  name?: string;             // Customer name
  email?: string;            // Email ID
  phoneNumber?: string;      // Mobile number
  address?: string;          // Address (optional)
  createdAt?: string;        // Optional: for display or audit
  updatedAt?: string;        // Optional: for display or audit
}