import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../models/products.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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
private baseUrl = environment.apiUrl + '/products';

  constructor(private api: ApiService,private http: HttpClient) {}

  // -------------------- CRUD --------------------
  getAll(): Observable<Product[]> {
    return this.api.get<Product[]>(this.endpoint);
  }

  getAllProducts(): Observable<Product[]> {
  return this.api.get<Product[]>(`products/all`);
}




  // Load ALL products (no distributor needed)
 


  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`${this.endpoint}/${id}`);
  }

  create(formData: FormData): Observable<Product> {
    return this.api.post<Product>(this.endpoint, formData);
  }

  update(id: string, formData: FormData): Observable<Product> {
    return this.api.put<Product>(`${this.endpoint}/${id}`, formData);
  }

  delete(id: string): Observable<Product> {
    return this.api.delete<Product>(`${this.endpoint}/${id}`);
  }
  getMeasures(): Observable<string[]> {
  return this.api.get<string[]>(`${this.endpoint}/measures`);
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

  // 🔍 Justdial-style distributor search
searchDistributorsByProduct(keyword: string) {
  return this.api.get<any[]>(
    `search/distributors`,
    { params: { keyword } }
  );
}

  getMainCategories() {
  return this.api.get<any[]>('categories/main');
}

getSubCategories(parentId: string) {
  return this.api.get<any[]>(`categories/sub/${parentId}`);
}

getGstByHsn(hsnCode: string) {
  return this.api.get<number>(`categories/gst/${hsnCode}`);
}
increaseStock(productId: string, quantity: number): Observable<any> {
  return this.api.put(
    `${this.endpoint}/${productId}/increase-stock`,
    null,
    {
      params: { quantity }
    }
  );
}




}
