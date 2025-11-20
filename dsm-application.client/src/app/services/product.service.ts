import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../models/products.model';

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

  // -------------------- CRUD --------------------
  getAll(): Observable<Product[]> {
    return this.api.get<Product[]>(this.endpoint);
  }

  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`${this.endpoint}/${id}`);
  }

  create(formData: FormData): Observable<Product> {
    return this.api.post<Product>(this.endpoint, formData);
  }

  update(id: string, formData: FormData): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, formData);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  // -------------------- Distributor --------------------
  getCategoriesByDistributor(distributorId: string): Observable<string[]> {
    return this.api.get<string[]>(`${this.endpoint}/distributor/${distributorId}/categories`);
  }

  getProductsByDistributor(distributorId: string): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.endpoint}/distributor/${distributorId}`);
  }

  // -------------------- Search --------------------
  searchByCategory(distributorId: string, category: string): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.endpoint}/search/category`, {
      params: { distributorId, category }
    });
  }

  searchByName(distributorId: string, name: string): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.endpoint}/search/name`, {
      params: { distributorId, name }
    });
  }

  searchByPrice(distributorId: string, minPrice?: number, maxPrice?: number): Observable<Product[]> {
    const params: any = { distributorId };
    if (minPrice != null) params.minPrice = minPrice;
    if (maxPrice != null) params.maxPrice = maxPrice;

    return this.api.get<Product[]>(`${this.endpoint}/search/price`, { params });
  }

  searchByColor(distributorId: string, color: string): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.endpoint}/search/color`, {
      params: { distributorId, color }
    });
  }
}
