import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.css'
})
export class OrderDetailsModalComponent {
  
  @Input() orderId!: string;
  @Input() visible = false;

  @Output() closed = new EventEmitter<void>();

  order: any;

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnChanges() {
    if (this.visible && this.orderId) {
      this.loadOrder();
    }
  }

  loadOrder() {
  this.orderService.getOrderById(this.orderId).subscribe(res => {
      this.order = res;

      this.order.products.forEach((item: any) => {
        this.productService.getById(item.productId).subscribe(p => {
          item.brand = p.brand;
          item.imageUrl = p.imageUrls?.length
            ? `${environment.apiUrl}/images/${p.imageUrls[0]}`
            : 'assets/no-image.png';
        });
      });
    });
  }

  close() {
    this.closed.emit();
  }

}
