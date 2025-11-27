import { Component, ElementRef, ViewChild } from '@angular/core';
import { Category, ProductService } from '../../services/product.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Product } from '../../models/products.model';
import { environment } from '../../../environments/environment.prod';
// import { environment } from '../../../environments/environment';
 
 
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})

export class ProductsComponent {
       apiBaseUrl = environment.apiUrl.replace('/api', ''); // for image path

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ==============================================
  // DATA
  // ==============================================
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  distributorId: string | null = null;


  // ==============================================
  // FORM & STATE
  // ==============================================
  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;

  selectedFile?: File;
  previewUrl: string | ArrayBuffer | null = null;

  // ==============================================
  // FILTERS
  // ==============================================
  searchTerm = '';
  categoryFilter = '';
  color = '';
  stockFilter = '';
  minPriceFilter?: number;
  maxPriceFilter?: number;

  modalRef: any;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    // Build product form
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      productCode: ['', Validators.required],
      color:['', Validators.required],
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

  // ==============================================
  // INIT
  // ==============================================
 ngOnInit(): void {
  const distributorId = localStorage.getItem('DistributorId');
  if (distributorId) {
    this.distributorId = distributorId; // save globally
    this.loadProducts(distributorId);
    this.loadCategories(distributorId);
  }
}

  loadProducts(distributorId: string) {
    this.productService.getProductsByDistributor(distributorId).subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = [...data];
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  loadCategories(distributorId: string) {
    this.productService.getCategoriesByDistributor(distributorId).subscribe({
      next: (data) => this.categories = data as any[],
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  // ==============================================
  // CRUD
  // ==============================================
submitForm() {
  if (!this.distributorId) {
    console.error('DistributorId not set!');
    return;
  }

  const formData = new FormData();

  // Explicitly append all fields with exact backend DTO names
  formData.append('ProductName', this.productForm.value.productName);
  formData.append('ProductCode', this.productForm.value.productCode);
  formData.append('Category', this.productForm.value.category);
  formData.append('Unit', this.productForm.value.unit);
  formData.append('Price', this.productForm.value.price ?? 0);
  formData.append('CostPrice', this.productForm.value.costPrice ?? 0);
  formData.append('Discount', this.productForm.value.discount ?? 0);
  formData.append('GST', this.productForm.value.gst ?? 0);
  formData.append('Stock', this.productForm.value.stock ?? 0);
  formData.append('ReorderLevel', this.productForm.value.reorderLevel ?? 0);
  formData.append('Brand', this.productForm.value.brand ?? '');
  formData.append('Color', this.productForm.value.color ?? '');
  formData.append('Description', this.productForm.value.description ?? '');
  formData.append('DistributorId', this.distributorId);

  // Append image if selected
  if (this.selectedFile) {
    formData.append('Image', this.selectedFile);
  }

  // UPDATE PRODUCT
  if (this.isEdit && this.selectedProductId) {
    this.productService.update(this.selectedProductId, formData).subscribe({
      next: () => {
        this.loadProducts(this.distributorId!);
        const modalEl = document.getElementById('productModal');
        if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        this.resetForm();
      },
      error: err => console.error('Update failed:', err)
    });
  } 
  // CREATE NEW PRODUCT
  else {
    this.productService.create(formData).subscribe({
      next: () => {
        this.loadProducts(this.distributorId!);
        const modalEl = document.getElementById('productModal');
        if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        this.resetForm();
      },
      error: err => console.error('Create failed:', err)
    });
  }
  
}


  editProduct(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product.productId || null;
    this.productForm.patchValue(product);
    this.previewUrl = product.imageUrl ? this.apiBaseUrl + product.imageUrl : null;
    this.openModal(true, product);
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.productId !== id);
          this.filteredProducts = this.filteredProducts.filter(p => p.productId !== id);
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  resetForm() {
    this.productForm.reset();
    this.selectedFile = undefined;
    this.previewUrl = null;
    this.selectedProductId = null;
    this.isEdit = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  // ==============================================
  // IMAGE HANDLING
  // ==============================================
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
  }

  // ==============================================
  // FILTERS & SEARCH
  // ==============================================
  searchByName() {
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId || !this.searchTerm.trim()) return;

    this.productService.searchByName(distributorId, this.searchTerm).subscribe({
      next: data => this.filteredProducts = data,
      error: err => console.error('Error searching by name:', err)
    });
  }

  onCategoryChange(category: string) {
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.categoryFilter = category;

  // 🔥 If "All Categories" selected → show all products
  if (!category || category.trim() === '') {
    this.filteredProducts = [...this.products];
    return;
  }

  // Otherwise, filter by category
  this.productService.searchByCategory(distributorId, category).subscribe({
    next: data => this.filteredProducts = data,
    error: err => console.error('Error filtering by categories:', err)
  });
}

  onColorChange(color: string) {
    
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.color = color;
    this.productService.searchByColor(distributorId, color).subscribe({
      next: data => this.filteredProducts = data,
      error: err => console.error('Error filtering by color:', err)
    });
  }

  applyPriceFilter() {
    const distributorId = localStorage.getItem('DistributorId');
    if (!distributorId) return;

    this.productService.searchByPrice(distributorId, this.minPriceFilter, this.maxPriceFilter)
      .subscribe({
        next: data => this.filteredProducts = data,
        error: err => console.error('Error filtering by price:', err)
      });
  }


  onSmartSearch() {
  const term = this.searchTerm.toLowerCase().trim();
  if (!term) {
    this.filteredProducts = [...this.products];
    return;
  }

  // Parse common keywords for price ranges
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  // Match "under 500", "below 200", "less than 100"
  const underMatch = term.match(/(under|below|less than)\s*(\d+)/);
  if (underMatch) maxPrice = Number(underMatch[2]);

  // Match "above 100", "over 200", "greater than 300"
  const aboveMatch = term.match(/(above|over|greater than)\s*(\d+)/);
  if (aboveMatch) minPrice = Number(aboveMatch[2]);

  // Match "between 100 and 300"
  const betweenMatch = term.match(/between\s*(\d+)\s*(and|-)\s*(\d+)/);
  if (betweenMatch) {
    minPrice = Number(betweenMatch[1]);
    maxPrice = Number(betweenMatch[3]);
  }

  // Remove numeric/price words for better text matching
  const cleanedTerm = term
    .replace(/(under|below|less than|above|over|greater than|between|and|under|over)\s*\d+/g, "")
    .replace(/\d+/g, "")
    .trim();

  this.filteredProducts = this.products.filter(p => {
    const nameMatch = p.productName?.toLowerCase().includes(cleanedTerm);
    const categoryMatch = p.category?.toLowerCase().includes(cleanedTerm);
    const colorMatch = p.color?.toLowerCase().includes(cleanedTerm);
    const brandMatch = p.brand?.toLowerCase().includes(cleanedTerm);

    // Price filtering
    let priceMatch = true;
    if (minPrice !== null && p.price < minPrice) priceMatch = false;
    if (maxPrice !== null && p.price > maxPrice) priceMatch = false;

    // Stock keyword detection
    const stockMatch =
      (term.includes("in stock") && p.stock > 0) ||
      (term.includes("out of stock") && p.stock === 0) ||
      (!term.includes("stock") && true);

    return (
      (nameMatch || categoryMatch || colorMatch || brandMatch) &&
      priceMatch &&
      stockMatch
    );
  });
}



  filterProducts() {
  this.filteredProducts = this.products.filter(p => {
    const matchesSearch =
      p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(this.searchTerm.toLowerCase());

    const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;

    let matchesStock = true;
    if (this.stockFilter === 'inStock') matchesStock = p.stock > 10;
    else if (this.stockFilter === 'lowStock') matchesStock = p.stock > 0 && p.stock <= 10;
    else if (this.stockFilter === 'outOfStock') matchesStock = p.stock === 0;

    const matchesColor =
      !this.color || p.color.toLowerCase().includes(this.color.toLowerCase());

    const matchesMinPrice = this.minPriceFilter == null || p.price >= this.minPriceFilter;
    const matchesMaxPrice = this.maxPriceFilter == null || p.price <= this.maxPriceFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStock &&
      matchesColor &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });
}


  getStockStatus(stock: number) {
    if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
    if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'out-of-stock', text: 'Out of Stock' };
  }

  // ==============================================
  // MODAL HANDLING
  // ==============================================
 openModal(isEdit: boolean, product?: Product) {
  this.isEdit = isEdit;

  const modalEl = document.getElementById('productModal');
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  if (isEdit && product) {
    this.selectedProductId = product.productId ?? null;

    this.productForm.patchValue({
      productName: product.productName,
      productCode: product.productCode,
      color: product.color,
      category: product.category,
      unit: product.unit,
      price: product.price,
      costPrice: product.costPrice,
      discount: product.discount,
      gst: product.gst,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      brand: product.brand,
      description: product.description
    });

    this.previewUrl = product.imageUrl
      ? this.apiBaseUrl + product.imageUrl
      : null;

  } else {
    this.resetForm();
    this.previewUrl = null;
    this.selectedProductId = null;
  }

  // ALWAYS show modal
  modal.show();
}


   

  closeModal() {
    if (this.modalRef) this.modalRef.hide();
  }
}