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
  customerAddress?: string;
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
  shippingFee?: number;// ✅ Payment fields
  // ✅ ADD THESE (FROM BACKEND)
  subtotal: number;
  totalDiscount: number;
 
  // totalAmount: number;
 
  paymentCollectedByEmployee?: boolean;
  collectedAmount?: number;
  paymentMethod?: string;
  collectedOn?: string; // ISO string
  loading?: boolean;
    deliveryReceiptUrl?: string;
  deliveredOn?: Date;
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
  customerName: string;
  distributorId: string;
  EmployeeId?: string;
  Name?: string;
  assignedOn?: Date;
  orderedDate: string;
  expectedDeliveryDate: string;
 
  status: string;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  orderDate: Date;
  deliveredOn?: Date;
  products: OrderProduct[];
  paymentCollectedByEmployee?: boolean;
  collectedAmount?: number;
  paymentMethod?: string;
  collectedOn?: Date;
  deliveryRemarks?: string;
 
 
 
  // ➕ Add this field
  // deliveryEta?: string;
 
}
export interface Employee {
 
  id?: string;           // <-- Backend usually sends this
  _id?: string;          // <-- MongoDB style ID (sometimes)
  employeeId?: string;   // <-- Use this in UI
  name: string;
  email: string;
  isActive: boolean;
  distributorId?: string;
  designation?: string;   // <-- Add this line
}
 