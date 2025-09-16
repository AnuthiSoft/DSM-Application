import { Component, ElementRef, ViewChild } from '@angular/core';
import { Category, Product, ProductService } from '../../services/product.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
   products: Product[] = [];
  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;
selectedFile?: File;
previewUrl: string | ArrayBuffer | null = null;
//  categories: Category[] = [];
  categories: any[] = [];
  currentDistributorId: string = ''; // <-- replace with actual distributor ID



  constructor(private productService: ProductService,private fb: FormBuilder) {
    this.productForm = this.fb.group({
  productName: ['', Validators.required],
  productCode: ['', Validators.required],
   category: ['', Validators.required], // ← must match backend DTO
  description: [''],
  unit: ['', Validators.required],
  price: [0, [Validators.required, Validators.min(0)]],
  costPrice: [0, [Validators.required, Validators.min(0)]],
  discount: [0, [Validators.min(0)]],
  gst: [0, [Validators.min(0)]],
  stock: [0, [Validators.min(0)]],
  reorderLevel: [0, [Validators.min(0)]],
  brand: [''],
  imageUrl: [''],
});
  }

  ngOnInit(): void {
    this.loadProducts();
   const distributorId = localStorage.getItem('DistributorId');
  if (distributorId) {
    this.productService.getCategoriesByDistributor(distributorId).subscribe({
      next: data => this.categories = data, // data is ["Clothing", "Electronics", "Furniture"]
      error: err => console.error(err)
    });
  }
     


  }
  

  loadProducts() {
    this.productService.getAll().subscribe(data => {
      this.products = data;
    });
  }

// submitForm() {
//   const product = this.productForm.value;
//   const formData = new FormData();

//   Object.keys(product).forEach(key => {
//     const value = product[key as keyof Product];
//     if (value !== null && value !== undefined) {
//       formData.append(key, value.toString());
//     }
//   });

//   if (this.selectedFile) {
//     formData.append('Image', this.selectedFile, this.selectedFile.name);
//   }

//   if (this.isEdit && this.selectedProductId) {
//     this.productService.update(this.selectedProductId, formData).subscribe(() => {
//       this.loadProducts();
//       this.resetForm();
//     });
//   } else {
//     this.productService.create(formData).subscribe(() => {
//       this.loadProducts();
//       this.resetForm();
//     });
//   }
// }
submitForm() {
  const product = this.productForm.value;
  const formData = new FormData();

  // Append all other fields
  Object.keys(product).forEach(key => {
    const value = product[key as keyof Product];
    if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  // ✅ Append category explicitly
  formData.append('Category', this.productForm.value.category);

  // Append DistributorId
  const distributorId = localStorage.getItem('DistributorId');
  if (distributorId) {
    formData.append('DistributorId', distributorId);
  }

  // Append file if selected
  if (this.selectedFile) {
    formData.append('Image', this.selectedFile, this.selectedFile.name);
  }

  // Send request
  if (this.isEdit && this.selectedProductId) {
    this.productService.update(this.selectedProductId, formData).subscribe(() => {
      this.loadProducts();
      this.resetForm();
    });
  } else {
    this.productService.create(formData).subscribe(() => {
      this.loadProducts();
      this.resetForm();
    });
  }
}



onFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return; // no file selected

  this.selectedFile = file;

  // Preview uploaded image
  const reader = new FileReader();
  reader.onload = () => this.previewUrl = reader.result;
  reader.readAsDataURL(file); // safe, file is not undefined
}

  editProduct(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product.productId || null;
    this.productForm.patchValue(product);
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe(() => {
        this.loadProducts();
      });
    }
  }


  resetForm() {
    this.productForm.reset();
    this.selectedFile = undefined; 
    this.previewUrl = null;
    this.selectedProductId = null;
    this.isEdit = false;

    // ✅ clear file input too
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

}
