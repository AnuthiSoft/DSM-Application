export interface Product {
  color?: any;
  // Color: any;
  productColor: any;
  colorFilter: any;
  minPriceFilter?: number;
  maxPriceFilter?: number;
  productId?: string;
  productName: string;
  productCode: string;
  category?: string;
  description: string;
  measure: string;
  price: number;
  OrderedDate: Date;
  ExpectedDeliveryDate: Date;
  costPrice?: number;
  discount: number;
  gst: number;
  // stock: number;
  reorderLevel: number;
  isActive?: boolean;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
  brand?: string;
  imageUrls: string[];
  distributorId?: string;
  distributorName?: string; // Add this
  currentStock: number;
  

  priceDiscountPercent?: number;
  quantityDiscountPercent?: number;
  specialDiscountPercent?: number;
  generalDiscount?: number;
  totalDiscount?: number;
  gstPercentage?: number;
  gstAmount?: number;
  // ✅ ADD THIS
  mainCategory: string;   // parent category ID
     // ✅ UI-only / optional fields (FIXES ALL ERRORS)
  featured?: boolean;
  distributorVerified?: boolean;
  oldPrice?: number;
  maxStock?: number;

  discountPercent: number;
  gstPercent: number;
}
// export interface Product {
// //   productId?: string;
// //   productName: string;
// //   productCode?: string;
 
// //   price?: number;
// //   stock?: number;
// //   brand?: string;
// //   imageUrl?: string;
// //   category?: string;
//   // other fields as returned from backend
// }
 