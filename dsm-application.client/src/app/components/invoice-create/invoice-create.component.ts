import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Invoice, InvoiceItem } from '../../models/invoice.model';
import { AuthService } from '../../services/auth.service'; // assuming you have this

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.css']
})
export class InvoiceCreateComponent implements OnInit {

  invoiceForm!: FormGroup;
  loading = false;
  distributorId = '';

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService   // to get distributorId
  ) {}

  ngOnInit(): void {
    this.distributorId = this.auth.getDistributorId();  // or from localStorage

    this.invoiceForm = this.fb.group({
      invoiceNo: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      customerId: ['', Validators.required],

      // ⭐ E-Way Bill No (from Govt portal)
      ewayBillNo: ['', [Validators.pattern(/^[0-9]{12}$/)]],


      totalAmount: ['', Validators.required],

      items: this.fb.array([
        this.createItemGroup()
      ])
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      productId: [''],
      productName: ['', Validators.required],
      hsnCode: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      taxableValue: [0],
      gstRate: [0],
      gstAmount: [0]
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  // Optional: simple calculation of totalAmounts
  recalcTotals(): void {
    let total = 0;
    this.items.controls.forEach(ctrl => {
      const qty = Number(ctrl.get('quantity')?.value || 0);
      const price = Number(ctrl.get('price')?.value || 0);
      const gstRate = Number(ctrl.get('gstRate')?.value || 0);

      const taxable = qty * price;
      const gstAmt = taxable * (gstRate / 100);

      ctrl.patchValue({
        taxableValue: taxable,
        gstAmount: gstAmt
      }, { emitEvent: false });

      total += taxable + gstAmt;
    });

    this.invoiceForm.patchValue({
      totalAmount: total
    }, { emitEvent: false });
  }

  openGovtEwayBillPortal(): void {
    window.open('https://ewaybillgst.gov.in', '_blank');
  }

//   submit(): void {
//     if (this.invoiceForm.invalid) {
//       this.toastr.error('Please fill all required fields');
//       return;
//     }

//     this.loading = true;

//     const formValue = this.invoiceForm.value;

//     const payload: Invoice = {
//       distributorId: this.distributorId,
//       invoiceNo: formValue.invoiceNo,
//       invoiceDate: formValue.invoiceDate,
//       customerId: formValue.customerId,
//       totalAmount: formValue.totalAmount,
//       ewayBillNo: formValue.ewayBillNo || null,
//       items: formValue.items as InvoiceItem[]
//     };

//     this.invoiceService.create(payload).subscribe({
//       next: (res) => {
//         this.loading = false;
//         this.toastr.success('Invoice created successfully');

//         // Optionally navigate to invoice list or detail
//         this.router.navigate(['/invoice', res.id]);

//       },
//       error: (err) => {
//         this.loading = false;
//         console.error(err);
//         this.toastr.error('Failed to create invoice');
//       }
//     });
//   }
// }
submit(): void {
  if (this.invoiceForm.invalid) {
    this.toastr.error('Please fill all required fields');
    return;
  }

  this.loading = true;

  const payload: Invoice = {
    distributorId: this.distributorId,   // REQUIRED
    invoiceNo: this.invoiceForm.value.invoiceNo,
    invoiceDate: this.invoiceForm.value.invoiceDate,
    customerId: this.invoiceForm.value.customerId,
    totalAmount: this.invoiceForm.value.totalAmount,
    ewayBillNo: this.invoiceForm.value.ewayBillNo || null,
    items: this.invoiceForm.value.items
  };

  this.invoiceService.create(payload).subscribe({
    next: (res: any) => {
      this.loading = false;
      this.toastr.success('Invoice created successfully');

      console.log("Response from backend:", res);
      
      const invoiceId = res.id || res.Id || res._id;


      if (!invoiceId) {
        console.error("Invoice ID not returned from server!");
        this.toastr.error("Cannot navigate — invoice ID missing!");
        return;
      }

      this.router.navigate(['/invoice-detail', invoiceId]);
    },
    error: (err) => {
      this.loading = false;
      console.error(err);
      this.toastr.error('Failed to create invoice');
    }
  });
}

toggleTheme() {
  document.body.classList.toggle('dark-theme');
}

}