import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-batches',
  templateUrl: './inventory-batches.component.html',
  styleUrls: ['./inventory-batches.component.css']
})
export class InventoryBatchesComponent implements OnInit {

  // 🔹 Product selection
  products: any[] = [];          // load from API
  selectedProductId: string = '';

  batches: any[] = [];

  // 🔹 Add Inventory Form
  newBatch = {
    productId: '',
    distributorId: 'D2001',   // later from JWT
    quantity: 0,
    manufactureDate: '',
    expiryDate: ''
  };

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // 🔹 Load products for dropdown
  loadProducts() {
    // TEMP: hardcoded until product API is wired
    this.products = [
      { productId: 'P1001', name: 'Product 1' },
      { productId: 'P1002', name: 'Product 2' }
    ];
  }

  // 🔹 When product changes
  onProductChange() {
    if (!this.selectedProductId) return;

    this.newBatch.productId = this.selectedProductId;
    this.loadBatches();
  }

  // 🔹 Load batches
  loadBatches() {
    this.inventoryService
      .getBatches(this.selectedProductId)
      .subscribe(data => this.batches = data);
  }

  // 🔹 Add batch
  addBatch() {
    if (
      !this.newBatch.quantity ||
      !this.newBatch.manufactureDate ||
      !this.newBatch.expiryDate
    ) {
      alert('All fields required');
      return;
    }

    if (this.newBatch.expiryDate <= this.newBatch.manufactureDate) {
      alert('Expiry date must be after Manufacture date');
      return;
    }

    this.inventoryService.addInventoryBatch(this.newBatch).subscribe(() => {
      alert('Inventory batch added');
      this.loadBatches();
      this.resetForm();
    });
  }

  resetForm() {
    this.newBatch.quantity = 0;
    this.newBatch.manufactureDate = '';
    this.newBatch.expiryDate = '';
  }

  isExpired(expiry: string): boolean {
    return new Date(expiry) < new Date();
  }

  getTotalStock(): number {
    return this.batches.reduce((sum, b) => sum + b.availableQuantity, 0);
  }

  getStatus(expiryDate: string): 'Expired' | 'Near Expiry' | 'Valid' {
    const diff =
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (diff < 0) return 'Expired';
    if (diff <= 30) return 'Near Expiry';
    return 'Valid';
  }
}
