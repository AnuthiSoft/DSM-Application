export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  orderId?: string;
  customerId: string;
  distributorId: string;
  orderItems: OrderItem[];
  createdAt?: string;
}