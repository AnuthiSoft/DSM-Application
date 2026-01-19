import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private endpoint = 'inventory';

  constructor(private api: ApiService) { }

  getStock(distributorId: string) {
    return this.api.get<any[]>(`${this.endpoint}/stock/${distributorId}`);
  }

  stockIn(data: any) {
    return this.api.post(`${this.endpoint}/stock-in`, data);
  }

  stockOut(data: any) {
    return this.api.post(`${this.endpoint}/stock-out`, data);
  }

  getMovements(distributorId: string) {
    return this.api.get<any[]>(`${this.endpoint}/movements/${distributorId}`);
  }

  // 🔥 NEW FIFO / BATCH APIs
  getBatches(productId: string) {
  return this.api.get<any[]>(
    `${this.endpoint}/batches/${productId}`
  );
}


  addInventoryBatch(data: any) {
    return this.api.post(`${this.endpoint}/add`, data);
  }
  getExpiringStock(distributorId: string, days: number = 30) {
  return this.api.get<any[]>(
    `${this.endpoint}/expiring/${distributorId}?days=${days}`
  );
}

  getProductsForInventory(distributorId: string) {
    return this.api.get<any[]>(
      `${this.endpoint}/stock/${distributorId}`
    );
  }

  getInventoryProducts(distributorId: string) {
  return this.api.get<any[]>(
    `${this.endpoint}/distributor/${distributorId}`
  );
}

getAllInventoryBatches(distributorId: string) {
  return this.api.get<any[]>(
    `${this.endpoint}/batches-by-distributor/${distributorId}`
  );
}



}




