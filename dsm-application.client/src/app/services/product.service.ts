
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
export interface Product {
  productId?: string;
  productName: string;
  productCode: string;
 category?: string;
  description: string;
  unit: string;
  price: number;
  costPrice: number;
  discount: number;
  gst: number;
  stock: number;
  reorderLevel: number;
  isActive?: boolean;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
  brand?: string;
  imageUrl?: string;
}
export interface Category {
  category: string;
  name: string;
  description?: string;
  distributorId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
   private readonly endpoint = 'products';
  constructor(private api: ApiService) {}

   getAll(): Observable<Product[]> {
    return this.api.get<Product[]>(this.endpoint);
  }

  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`${this.endpoint}/${id}`);
  }

  create(formData: FormData): Observable<Product> {
    // ✅ FormData automatically sets correct headers
    return this.api.post<Product>(this.endpoint, formData);
  }

  update(id: string, formData: FormData): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, formData);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getCategoriesByDistributor(distributorId: string): Observable<string[]> {
    return this.api.get<string[]>(`${this.endpoint}/distributor/${distributorId}/categories`);
  }

  getProductsByDistributor(distributorId: string): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.endpoint}/distributor/${distributorId}`);
  }

}
