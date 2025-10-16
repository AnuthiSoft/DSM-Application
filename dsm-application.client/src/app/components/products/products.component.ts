import { Component, ElementRef, ViewChild } from '@angular/core';
import { Category, ProductService } from '../../services/product.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Product } from '../../models/products.model';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  products: Product[] = [];
  filteredProducts: Product[] = [];

  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;

  selectedFile?: File;
  previewUrl: string | ArrayBuffer | null = null;

  categories: any[] = [];
  searchTerm = '';
  categoryFilter = '';
  stockFilter = '';

  modalRef: any;

  constructor(private productService: ProductService, private fb: FormBuilder) {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      productCode: ['', Validators.required],
      category: ['', Validators.required],
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
        next: data => this.categories = data,
        error: err => console.error(err)
      });
    }
      

  }

  loadProducts() {
    this.productService.getAll().subscribe(data => {
      this.products = data;
       this.filteredProducts = [...data];
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            p.productCode.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;
debugger
      let matchesStock = true;
      if (this.stockFilter === 'inStock') matchesStock = p.stock > 10;
      else if (this.stockFilter === 'lowStock') matchesStock = p.stock > 0 && p.stock <= 10;
      else if (this.stockFilter === 'outOfStock') matchesStock = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }

  getStockStatus(stock: number) {
    if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
    if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'out-of-stock', text: 'Out of Stock' };
  }

  submitForm() {
    const product = this.productForm.value;
    const formData = new FormData();

    Object.keys(product).forEach(key => {
      const value = product[key as keyof Product];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const distributorId = localStorage.getItem('DistributorId');
    if (distributorId) {
      formData.append('DistributorId', distributorId);
    }

    if (this.selectedFile) {
      formData.append('Image', this.selectedFile, this.selectedFile.name);
    }

    if (this.isEdit && this.selectedProductId) {
      this.productService.update(this.selectedProductId, formData).subscribe(() => {
        this.loadProducts();
        this.resetForm();
        this.modalRef.hide();
      });
    } else {
      this.productService.create(formData).subscribe(() => {
        this.loadProducts();
        
        this.resetForm();
         this.modalRef.hide();
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
  }

  editProduct(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product.productId || null;
    this.productForm.patchValue(product);
    this.previewUrl = product.imageUrl ? 'https://localhost:7189' + product.imageUrl : null;
  }

 deleteProduct(id: string) {
  console.log("Deleting product with id:", id);  
  if (confirm('Are you sure you want to delete this product?')) {
    this.productService.delete(id).subscribe({
      next: () => {
        console.log("Deleted successfully");
       this.products = this.products.filter(p => p.productId !== id);
        this.filteredProducts = this.filteredProducts.filter(p => p.productId !== id);
      },
      error: err => {
        console.error("Delete failed:", err);
      }
    });
  }
}


  resetForm() {
    this.productForm.reset();
    this.selectedFile = undefined;
    this.previewUrl = null;
    this.selectedProductId = null;
    this.isEdit = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openModal(isEdit = false, product?: any) {
  this.isEdit = isEdit;
  this.previewUrl = null;

  if (isEdit && product) {
    this.selectedProductId = product.productId;
    this.productForm.patchValue(product);
    this.previewUrl = product.imageUrl ? 'https://localhost:7189' + product.imageUrl : null;
  } else {
    this.productForm.reset();
    this.selectedProductId = null;
  }

  const modalEl = document.getElementById('productModal');
  if (modalEl) {
    this.modalRef = new bootstrap.Modal(modalEl);
    this.modalRef.show();
  }
}

closeModal() {
  if (this.modalRef) {
    this.modalRef.hide();
  }
}
}