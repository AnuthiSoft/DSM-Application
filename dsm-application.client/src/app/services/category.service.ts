import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private api = environment.apiUrl + '/categories';

  constructor(private http: HttpClient) {}

  // ✔ Get all categories (approved, pending, rejected)
  getAll() {
    return this.http.get<any[]>(this.api);
  }

  // ✔ Get category by id
  getById(id: string) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  // ✔ Create new category (from Distributor)
  createCategory(dto: any) {
    return this.http.post(this.api, dto);
  }

  // ✔ Update category
  updateCategory(id: string, dto: any) {
    return this.http.put(`${this.api}/${id}`, dto);
  }

  // ✔ Delete (soft delete)
  deleteCategory(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }

  // ⭐ APPROVE CATEGORY
  approve(id: string) {
    return this.http.post(`${this.api}/${id}/approve`, {});
  }

  reject(id: string, reason: string) {
  return this.http.put(`${this.api}/categories/${id}/reject`, { reason });
}



  getMainCategories() {
  return this.http.get<any[]>(`${this.api}/categories/main`);
}

getSubCategories(parentId: string) {
  return this.http.get<any[]>(`${this.api}/categories/sub/${parentId}`);
}

getSubCategoryGst(categoryId: string) {
  return this.http.get<number>(`${this.api}/categories/subcategory/${categoryId}/gst`);
}


  // ✔ Get GST from subcategory
  getGstFromSub(id: string) {
    return this.http.get<number>(`${this.api}/subcategory/${id}/gst`);
  }

  // ✔ Assign categories to Distributor
  setDistributorCategories(distributorId: string, categoryIds: string[]) {
    return this.http.post(`${this.api}/distributor/${distributorId}`, categoryIds);
  }

  // ✔ Get Distributor mapped categories
  getDistributorCategories(distributorId: string) {
    return this.http.get<string[]>(`${this.api}/distributor/${distributorId}`);
  }
  
  getMain() {
  return this.http.get<any[]>(`${this.api}/main`);
}

}
