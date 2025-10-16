export interface OrderProduct {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

// export interface Order {
//  id?: string;
//  orderId :string;
//   customerId: string;
//   distributorId: string;
//   products: OrderProduct[];
//   totalAmount?: number;
//   orderDate?: string;
//   status?: string;
//     orderItems: OrderProduct[]; // ✅ Add this
// }
export interface DistributorOrder {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?:string;
  products: OrderProduct[];
  totalAmount: number;
  orderDate: string;
  status: string;
   // ✅ Add these for assigned employee
    employeeId?: string;
  name?: string;
  assignedOn?: string; // optional if you want to show assignment date
  
  // ✅ Add these two fields to fix errors
  shippingAddress?: string;
  shippingFee?: number;
   // ✅ Payment fields
  paymentCollectedByEmployee?: boolean;
  collectedAmount?: number;
  paymentMethod?: string;
  collectedOn?: string; // ISO string
  loading?: boolean;
}
// export interface OrderProduct {
//   productId: string;
//   productName: string;
//   price: number;
//   quantity: number;
// }

export interface Order {
  id: string;
  customerId: string;
  distributorId: string;
EmployeeId?: string;
 Name?: string;
  assignedOn?: Date;
  status: string;
  totalAmount: number;
  orderDate: Date;
  deliveredOn?: Date;
  products: OrderProduct[];
  paymentCollectedByEmployee?: boolean;
  collectedAmount?: number;
  paymentMethod?: string;
  collectedOn?: Date;
  deliveryRemarks?: string;
}
export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  isActive: boolean;
  distributorId: string;
}