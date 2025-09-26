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
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}


export interface Order {
  customerId: string;
  distributorId: string;
  items: OrderItem[];
}