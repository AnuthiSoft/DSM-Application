import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-main-inventory',
  templateUrl: './main-inventory.component.html',
  styleUrl: './main-inventory.component.css'
})
export class MainInventoryComponent implements OnInit {

  stockList: any[] = [];
  products: any[] = [];
  filteredStock: any[] = [];
  searchTerm = '';

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const distributorId = localStorage.getItem("DistributorId");
    if (distributorId) {
      this.loadStock(distributorId);
      this.loadProducts(distributorId);
    }
  }

  loadStock(distributorId: string) {
    this.inventoryService.getStock(distributorId).subscribe({
      next: (res) => {
        this.stockList = res;
        this.filteredStock = res;
        
      this.createPieChart();
      this.createBarChart();
      }
    });
  }

  loadProducts(distributorId: string) {
    this.productService.getProductsByDistributor(distributorId).subscribe({
      next: (res) => this.products = res
    });
  }
  createBarChart() {
  const labels = this.stockList.map(x => x.productName);
  const data = this.stockList.map(x => x.currentStock);

  new Chart("barChart", {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Stock',
        data: data,
        backgroundColor: '#2196f3'
      }]
    }
  });
}
createPieChart() {
  const labels = this.stockList.map(x => x.productName);
  const data = this.stockList.map(x => x.currentStock);

  new Chart("pieChart", {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#4caf50', '#ff9800', '#03a9f4', '#e91e63', '#9c27b0'],
      }]
    }
  });
}
// fixDate(dateString: string) {
//   // Convert "27-11-2025 04:58:09" → "2025-11-27T04:58:09"
//   if (!dateString) return null;

//   const [datePart, timePart] = dateString.split(" ");
//   const [day, month, year] = datePart.split("-");

//   return `${year}-${month}-${day}T${timePart}`;
// }
 onSearch() {
  const term = this.searchTerm?.toLowerCase() ?? '';

  this.filteredStock = this.stockList.filter(s => {
    const name = s.productName?.toLowerCase() ?? '';
    const code = s.productCode?.toLowerCase() ?? '';

    return name.includes(term) || code.includes(term);
  });
}
}
