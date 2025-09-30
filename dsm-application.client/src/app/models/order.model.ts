export interface OrderProduct {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
 id?: string;
 orderId :string;
  customerId: string;
  distributorId: string;
  products: OrderProduct[];
  totalAmount?: number;
  orderDate?: string;
  status?: string;
    orderItems: OrderProduct[]; // ✅ Add this
}
export interface DistributorOrder {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  products: OrderProduct[];
  totalAmount: number;
  orderDate: string;
  status: string;
}