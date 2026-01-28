import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-batches',
  templateUrl: './inventory-batches.component.html',
  styleUrls: ['./inventory-batches.component.css']
})
export class InventoryBatchesComponent implements OnInit {

  rows: any[] = [];

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.inventoryService.getAllInventoryBatches(distributorId).subscribe({
      next: (data: any[]) => {
        this.rows = data.map(b => ({
          batchId: b.batchId,
          productName: b.productName,
          productCode: b.productCode,
          // 👇 MUST match backend property names
          initialQuantity: b.initialQuantity,



          
          quantityAvailable: b.quantityAvailable,
          manufactureDate: b.manufactureDate,
          expiryDate: b.expiryDate
        }));

      },
      error: err => console.error('Batch load error:', err)
    });
  }




  getStatus(expiryDate: string): 'Expired' | 'Near Expiry' | 'Valid' {
    if (!expiryDate) return 'Valid';

    const today = new Date();
    const exp = new Date(expiryDate);

    const diffDays =
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Near Expiry';
    return 'Valid';
  }

  updateBatchDates(row: any, value: string, type: 'mfg' | 'exp') {
  if (type === 'mfg') {
    row.manufactureDate = value;
  } else {
    row.expiryDate = value;
  }

  this.inventoryService.updateBatchDates({
    batchId: row.batchId,
    manufactureDate: row.manufactureDate, // ✅ string "YYYY-MM-DD"
    expiryDate: row.expiryDate              // ✅ string "YYYY-MM-DD"
  }).subscribe({
    error: () => alert('Failed to update batch dates')
  });
}

}
