import { Component, OnInit } from '@angular/core';
import { Product, ProductService } from '../../services/product.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-products-by-dist',
  templateUrl: './products-by-dist.component.html',
  styleUrl: './products-by-dist.component.css'
})
export class ProductsByDistComponent implements OnInit {

  distributorId!: string;
  products: Product[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
    this.loadProducts();
  }

    // call this when you want to fetch products
  loadProducts(): void {
    if (!this.distributorId) return;

    this.loading = true;

    this.productService.getProductsByDistributor(this.distributorId).subscribe({
      next: (data: Product[]) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
      }
    });
  }
}
