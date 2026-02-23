import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-batches',
  templateUrl: './inventory-batches.component.html',
  styleUrls: ['./inventory-batches.component.css']
})
export class InventoryBatchesComponent implements OnInit {

  rows: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  paginatedRows: any[] = [];

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
          manufactureDate:
            b.manufactureDate && !b.manufactureDate.startsWith('0001')
              ? b.manufactureDate
              : null,

          expiryDate:
            b.expiryDate && !b.expiryDate.startsWith('0001')
              ? b.expiryDate
              : null,

        }));
        this.updatePagination();   // 🔥 important
      },
      error: err => console.error('Batch load error:', err)
    });
  }

  getStatus(expiryDate: string | null):
    'Expired' | 'Near Expiry' | 'Valid' | 'Not Set' {

    // ✅ If no date selected
    if (!expiryDate) return 'Not Set';

    const exp = new Date(expiryDate);

    // ✅ Block 0001 year
    if (exp.getFullYear() === 1) return 'Not Set';

    const today = new Date();
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

  updatePagination() {
    this.totalPages = Math.ceil(this.rows.length / this.pageSize);

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedRows = this.rows.slice(startIndex, endIndex);
  }

  getPageNumbers(): (number | string)[] {

    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    const maxVisible = 5; // middle pages count

    if (total <= 7) {
      // If small pages, show all
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {

      pages.push(1); // always show first page

      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (current <= 3) {
        start = 2;
        end = 4;
      }

      if (current >= total - 2) {
        start = total - 3;
        end = total - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push('...');
      }

      pages.push(total); // always show last page
    }

    return pages;
  }

  goToPage(page: number | string) {

    if (typeof page !== 'number') return;

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.updatePagination();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.rows.length);
    const total = this.rows.length;

    return `Page ${this.currentPage} of ${this.totalPages} `;
  }
}
