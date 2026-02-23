import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';
import {
  Chart,
  ChartConfiguration,
  ChartTypeRegistry,
  PieController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { HostListener } from '@angular/core';
Chart.register(PieController, ArcElement, Tooltip, Legend);


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
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService
  ) { }
  pieColors: string[] = [
    '#4caf50',
    '#ff9800',
    '#03a9f4',
    '#e91e63',
    '#9c27b0',
    '#00bcd4',
    '#8bc34a',
    '#ffc107'
  ];
  @HostListener('window:resize')
  onResize() {
    // Just trigger change detection by recalculating
    this.currentPage = this.currentPage;
  }
  
  ngOnInit(): void {
    const distributorId = localStorage.getItem("DistributorId");
    if (!distributorId) return;

    this.productService.getProductsByDistributor(distributorId).subscribe({
      next: (products) => {
        this.products = products;

        // 🔥 load stock AFTER products
        this.loadStock(distributorId);
      }
    });
  }


  loadStock(distributorId: string) {
    this.inventoryService.getStock(distributorId).subscribe({
      next: (stockRes) => {

        // 🔥 MERGE stock with product details
        this.stockList = stockRes.map((s: any) => {
          const product = this.products.find(
            p => p.productId === s.productId
          );

          return {
            productId: s.productId,
            currentStock: s.currentStock,

            // ⬇️ from Products API
            productName: product?.productName ?? 'N/A',
            productCode: product?.productCode ?? 'N/A',
            measure: product?.measure ?? '-',
            reorderLevel: product?.reorderLevel ?? 0,
            updatedAt: product?.updatedDate ?? null
          };
        });

        this.filteredStock = this.stockList;

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

  // createPieChart() {
  //   const labels = this.stockList.map(x => x.productName);
  //   const data = this.stockList.map(x => x.currentStock);

  //   const isDark =
  //     document.documentElement.getAttribute('data-theme') === 'dark';

  //   // 🔥 ALWAYS destroy before create
  //   if (this.pieChart) {
  //     this.pieChart.destroy();
  //   }

  //   this.pieChart = new Chart('pieChart', {
  //     type: 'pie',
  //     data: {
  //       labels,
  //       datasets: [{
  //         data,
  //         backgroundColor: [
  //           '#4caf50',
  //           '#ff9800',
  //           '#03a9f4',
  //           '#e91e63',
  //           '#9c27b0'
  //         ],
  //         borderColor: isDark ? '#1a2530' : '#ffffff',
  //         borderWidth: 2
  //       }]
  //     },
  //     options: {
  //       plugins: {
  //         legend: {
  //           position: 'top',
  //           labels: {
  //             color: isDark ? '#ffffff' : '#000000', // ✅ GUARANTEED
  //             font: {
  //               size: 14,
  //               weight: 600
  //             },
  //             padding: 20,
  //             boxWidth: 18
  //           }
  //         }
  //       }
  //     }
  //   });
  // }

  private pieChart?: Chart<'pie', number[], unknown>;

  createPieChart() {
    const labels = this.stockList.map(x => x.productName);
    const data = this.stockList.map(x => x.currentStock);

    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    this.pieChart = new Chart('pieChart', {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.stockList.map(
            (_, i) => this.pieColors[i % this.pieColors.length]
          ),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        }
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
    this.currentPage = 1;
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';

    html.setAttribute('data-theme', isDark ? 'light' : 'dark');

    // 🔥 RECREATE chart
    this.createPieChart();
  }

  get paginatedStock() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredStock.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStock.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const width = window.innerWidth;

    let maxVisible = 7; // desktop
    if (width <= 992) maxVisible = 5;  // tablet
    if (width <= 576) maxVisible = 3;  // mobile

    const pages: number[] = [];

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
