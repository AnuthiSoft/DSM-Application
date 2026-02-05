import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-customer-ledger',
  templateUrl: './customer-ledger.component.html',
  styleUrl: './customer-ledger.component.css'
})
export class CustomerLedgerComponent implements OnInit {

  customerId!: string;
  distributorId!: string;

  receipts: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {

    this.customerId = this.route.snapshot.paramMap.get('customerId')!;
    this.distributorId = localStorage.getItem('distributorId')!;

    this.loadReceipts();
  }

  loadReceipts() {
    this.loading = true;

    this.paymentService
      .getCustomerReceipts(this.customerId, this.distributorId)
      .subscribe({
        next: res => {
          this.receipts = res;
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.loading = false;
        }
      });
  }

}