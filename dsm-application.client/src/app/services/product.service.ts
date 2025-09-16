import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  private apiUrl = 'https://localhost:7189/api/products'; // Change if needed

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData) {
  return this.http.post<Product>(this.apiUrl, formData); // DO NOT set Content-Type manually
}

update(id: string, formData: FormData) {
  return this.http.put<void>(`${this.apiUrl}/${id}`, formData); // DO NOT set Content-Type manually
}
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
   getCategoriesByDistributor(distributorId: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/distributor/${distributorId}/categories`);
}
  

}
