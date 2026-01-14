import { Component } from '@angular/core';
import { ProductService } from '../../services/product.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-search',
  templateUrl: './customer-search.component.html',
  styleUrls: ['./customer-search.component.css']
})
export class CustomerSearchComponent {

  keyword = '';
  distributors: any[] = [];
  loading = false;

  customerId = localStorage.getItem('customerId') || '';

  constructor(
    private productService: ProductService,
   private customerService: CustomerService
  ) {}

  search() {
    if (!this.keyword.trim()) {
      Swal.fire('Enter product name');
      return;
    }

    this.loading = true;

    this.productService.searchDistributorsByProduct(this.keyword)
      .subscribe({
        next: (res) => {
          this.distributors = res;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire('Error', err.error || 'Search failed', 'error');
        }
      });
  }

connect(distributorId: string) {
  this.customerService
    .connectDistributor(this.customerId, distributorId)
    .subscribe({
      next: () => {
        Swal.fire('Request Sent', 'Connection request sent', 'success');
        this.search(); // refresh status
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'Failed', 'error');
      }
    });
}

}
