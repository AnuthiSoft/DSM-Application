import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private endpoint = 'inventory';

  constructor(private api: ApiService) {}

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
  
}
