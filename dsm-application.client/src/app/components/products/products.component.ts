import { Component, ElementRef, ViewChild } from '@angular/core';
import { Category, ProductService } from '../../services/product.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Product } from '../../models/products.model';
import { environment } from '../../../environments/environment.prod';
// import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../services/inventory.service';




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
  mainCategories: any[] = [];
  subCategories: any[] = [];


  // ==============================================
  // FORM & STATE
  // ==============================================
  productForm: FormGroup;
  isEdit = false;
  selectedProductId: string | null = null;

  selectedFile?: File;
  previewUrl: string | ArrayBuffer | null = null;
  previewUrls: string[] = [];
  selectedProduct: any = null;
  selectedFiles: File[] = [];

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
  measures: string[] = [];
  inventoryStockMap: Record<string, number> = {};


  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private inventoryService: InventoryService,
  ) {
    // Build product form
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      productCode: ['', Validators.required],
      color: ['', Validators.required],

      mainCategory: ['', Validators.required],   // ⭐ NEW FIELD
      category: ['', Validators.required],       // ⭐ SUBCATEGORY

      description: [''],
      measure: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      gst: [0, [Validators.min(0)]],
      stock: [0, [Validators.min(0)]],
      reorderLevel: [0, [Validators.min(0)]],
      brand: [''],
      imageUrls: [''],
    });

  }

  // ==============================================
  // INIT
  // ==============================================
  ngOnInit(): void {
    const distributorId = localStorage.getItem('DistributorId');
    this.distributorId = localStorage.getItem('DistributorId');
    if (distributorId) {
      this.loadProducts(distributorId);
      this.loadCategories(distributorId);
      this.loadMeasures();
      this.loadMainCategories();
      
    }
  }
  loadMainCategories() {
    this.productService.getMainCategories().subscribe(res => this.mainCategories = res);
  }
  onMainCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.productForm.patchValue({ mainCategory: value });
    this.productService.getSubCategories(value).subscribe(res => this.subCategories = res);
  }
  onSubCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.productForm.patchValue({ category: value });

    this.productService.getSubCategoryGst(value).subscribe(gst => {
      this.productForm.patchValue({ gst });
    });
  }
  // loadProducts(distributorId: string) {
  //   this.productService.getProductsByDistributor(distributorId).subscribe({
  //     next: (data) => {
  //       this.products = data;
  //       this.filteredProducts = [...data];
  //     },
  //     error: (err) => console.error('Error loading products:', err)
  //   });
  // }

  loadProducts(distributorId: string) {
  this.productService.getProductsByDistributor(distributorId).subscribe({
    next: (data) => {
      this.products = data;
      this.filteredProducts = [...data];

      // ✅ NOW merge inventory stock
      this.loadInventoryStock(distributorId);
    },
    error: (err) => console.error('Error loading products:', err)
  });
}


  
  loadMeasures() {
    this.productService.getMeasures().subscribe({
      next: (data) => (this.measures = data),
      error: (err) => console.error("Error loading measures:", err),
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

    if (this.productForm.invalid) return;

    const product = this.productForm.value;
    const formData = new FormData();

    Object.keys(product).forEach(key => {
      const value = product[key as keyof Product];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    const distributorId = localStorage.getItem('DistributorId');
    if (distributorId) formData.append('DistributorId', distributorId);

    if (this.selectedFiles.length > 0) {
      for (let file of this.selectedFiles) {
        formData.append("Images", file);  // MUST MATCH C# DTO PROPERTY NAME
      }
    }


    if (this.isEdit && this.selectedProductId) {
      this.productService.update(this.selectedProductId, formData).subscribe({
        next: () => {
          if (distributorId) this.loadProducts(distributorId);
          this.closeModal();
          this.resetForm();
        },
        error: (err) => console.error('Error updating product:', err)
      });
    } else {
      this.productService.create(formData).subscribe({
        next: () => {
          if (distributorId) this.loadProducts(distributorId);
          this.closeModal();
          this.resetForm();
        },
        error: (err) => console.error('Error creating product:', err)
      });
    }
  }

  editProduct(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product.productId || null;
    this.productForm.patchValue(product);

    this.previewUrl = product.imageUrls?.length
      ? this.getFullImageUrl(product.imageUrls[0])
      : null;

    this.openModal(true, product);
  }

  // deleteProduct(id: string) {
  //   if (confirm('Are you sure you want to delete this product?')) {
  //     this.productService.delete(id).subscribe({
  //       next: () => {
  //         this.products = this.products.filter(p => p.productId !== id);
  //         this.filteredProducts = this.filteredProducts.filter(p => p.productId !== id);
  //       },
  //       error: (err) => console.error('Error deleting product:', err)
  //     });
  //   }
  // }

  deleteProduct(id: string) {
    if (!id) return;

    this.toastr.warning(
      'Click OK to confirm deletion',
      'Confirm Delete',
      {
        closeButton: true,
        tapToDismiss: false,
        onActivateTick: true
      }
    ).onHidden.subscribe(() => {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.productId !== id);
          this.filteredProducts = this.filteredProducts.filter(p => p.productId !== id);
          this.toastr.success('Product deleted successfully');
        },
        error: () => this.toastr.error('Delete failed')
      });
    });
  }

  resetForm() {
    this.productForm.reset();
    this.selectedFile = undefined;
    this.previewUrl = null;
    this.selectedProductId = null;
    this.isEdit = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;

    this.selectedFiles = [];   // RESET
    this.previewUrls = [];     // RESET

    if (files && files.length > 0) {
      const ordered: File[] = Array.from(files); // <-- keeps order EXACTLY

      ordered.forEach(file => {
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
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
  openModal(isEdit = false, product?: Product) {
    this.isEdit = isEdit;

    if (isEdit && product) {
      this.selectedProduct = product;

      this.productForm.patchValue(product);
      this.previewUrl = product.imageUrls ? this.apiBaseUrl + product.imageUrls : null;
      this.previewUrls = [];
    } else {
      this.selectedProduct = null;
      this.resetForm();
      if (isEdit && product) {
        this.productForm.patchValue(product);
      }
    }

    const modalEl = document.getElementById('productModal');
    if (modalEl) {
      this.modalRef = new bootstrap.Modal(modalEl);
      this.modalRef.show();
    }
  }

  closeModal() {
    if (this.modalRef) this.modalRef.hide();
  }

  getFullImageUrl(img: string) {
    if (!img) return 'assets/no-image.png';

    // If image is already a full URL, return as is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }

    // Otherwise append API base URL
    return this.apiBaseUrl + img;
  }
  increaseStock(productId: string) {
  const qty = prompt('Enter quantity to add:');
  if (!qty) return;

  const quantity = Number(qty);
  if (quantity <= 0) {
    this.toastr.error('Invalid quantity');
    return;
  }

  this.productService.increaseStock(productId, quantity).subscribe({
    next: () => {
      this.toastr.success('Stock increased');

      const distributorId = localStorage.getItem('DistributorId');
      if (distributorId) {
        this.loadInventoryStock(distributorId); // ✅ ONLY inventory
      }
    },
    error: () => this.toastr.error('Failed to increase stock')
  });
}

loadInventoryStock(distributorId: string) {
  this.inventoryService.getStock(distributorId).subscribe({
    next: (stock) => {
      this.inventoryStockMap = {};
      stock.forEach((s: any) => {
        this.inventoryStockMap[s.productId] = s.currentStock;
      });

      this.mergeInventoryStock();
    },
    error: (err) => console.error('Error loading inventory stock', err)
  });
}

mergeInventoryStock() {
  this.products = this.products.map(p => ({
    ...p,
    stock: this.inventoryStockMap[p.productId!] ?? p.stock
  }));

  this.filteredProducts = this.filteredProducts.map(p => ({
    ...p,
    stock: this.inventoryStockMap[p.productId!] ?? p.stock
  }));
}

toggleTheme() {
  const body = document.body;
  const current = body.getAttribute('data-theme');

  body.setAttribute(
    'data-theme',
    current === 'dark' ? 'light' : 'dark'
  );
}


}

