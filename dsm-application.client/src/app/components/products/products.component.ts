import { Component, ElementRef, ViewChild } from '@angular/core';
import { Category, ProductService } from '../../services/product.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Product } from '../../models/products.model';

import { ToastrService } from 'ngx-toastr';
import { InventoryService } from '../../services/inventory.service';
// import { environment } from '../../../environments/environment.prod';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';



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
  // ===== Sorting =====
  sortBy: string = 'name';

  // ===== Pagination =====
  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  // ===== Modal =====
  showModal = false;

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
  imageIndexMap: Record<string, number> = {};
  imageIntervals: Record<string, any> = {};
  // ==============================================
  // FILTERS
  // ==============================================
  searchTerm = '';
  //categoryFilter = '';
  color = '';
  stockFilter = '';
  minPriceFilter?: number;
  maxPriceFilter?: number;

  modalRef: any;
  measures: string[] = [];
  inventoryStockMap: Record<string, number> = {};
  formSubmitted = false;
  existingImageUrls: string[] = [];
  // ===== ADD STOCK MODAL =====
  showStockModal = false;
  stockQty = 0;
  selectedStockProductId: string | null = null;
  showCategorySheet = false;
  categoryFilter: string = '';
  showStockSheet = false;
  showSortSheet = false;


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

      mainCategory: ['', Validators.required],
      category: ['', Validators.required], // subcategory

      description: ['', Validators.required],
      measure: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      costPrice: [null, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
      gst: [{ value: 0, disabled: true }],
      stock: [0, [Validators.required, Validators.min(0)]],

      brand: ['', Validators.required],
      imageUrls: [''],
    });
  }

  private patchEditForm(p: any) {
    this.productForm.patchValue({
      productName: p.productName,
      productCode: p.productCode,
      color: p.color,

      mainCategory: p.mainCategory,
      category: p.category,

      price: p.price,
      costPrice: p.costPrice,
      discount: p.discount,

      brand: p.brand,
      measure: p.measure,
      description: p.description,

      stock: 0
    });

    // ✅ IMAGES
    this.previewUrls = [];
    this.existingImageUrls = [];
    if (p.imageUrls?.length) {
      p.imageUrls.forEach((img: string) => {
        const fullUrl = this.getFullImageUrl(img);
        this.previewUrls.push(fullUrl);
        this.existingImageUrls.push(img); // keep original filename
      });
    }

    // ✅ GST MUST BE SET MANUALLY ON EDIT
    const selectedSub = this.subCategories.find(
      sc => sc.categoryId === p.category
    );

    if (selectedSub?.hsnCode) {
      this.productService
        .getGstByHsn(selectedSub.hsnCode)
        .subscribe(gst => {
          this.productForm.patchValue({ gst });
        });
    }
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
    const subCategoryId = select.value;

    const selectedSub = this.subCategories.find(sc => sc.categoryId === subCategoryId);
    if (!selectedSub) return;

    // 1️⃣ set subcategory
    this.productForm.patchValue({
      category: subCategoryId
    });

    // 2️⃣ fetch GST using HSN
    this.productService.getGstByHsn(selectedSub.hsnCode)
      .subscribe(gst => {
        this.productForm.patchValue({ gst });
      });
  }
get paginatedProducts(): Product[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filteredProducts.slice(start, start + this.pageSize);
}
  loadProducts(_: string) {
    this.productService.getMyProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
this.updatePagination();
        // 🔥 init slider
        products.forEach(p => {
          this.imageIndexMap[p.productId!] = 0;
          this.startAutoSlide(p);
        });
      },
      error: (err) => console.error(err)

    });
  }
  startAutoSlide(product: any) {
    if (!product.imageUrls || product.imageUrls.length <= 1) return;

    this.imageIntervals[product.productId] = setInterval(() => {
      const current = this.imageIndexMap[product.productId] || 0;
      this.imageIndexMap[product.productId] =
        (current + 1) % product.imageUrls.length;
    }, 3000); // ⏱ 3 sec
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
  // submitForm() {
  //   this.formSubmitted = true;
  //   if (this.productForm.invalid) {
  //     this.toastr.error('Please fill all required fields');
  //     return;
  //   }

  //   const product = this.productForm.value;
  //   const formData = new FormData();

  //   Object.keys(product).forEach(key => {
  //     const value = product[key as keyof Product];
  //     if (value !== null && value !== undefined) {
  //       formData.append(key, value.toString());
  //     }
  //   });
  //   const distributorId = localStorage.getItem('DistributorId');
  //   if (distributorId) formData.append('DistributorId', distributorId);

  //   if (this.selectedFiles.length > 0) {
  //     for (let file of this.selectedFiles) {
  //       formData.append("Images", file);  // MUST MATCH C# DTO PROPERTY NAME
  //     }
  //   }


  //   if (this.isEdit && this.selectedProductId) {
  //     this.productService.update(this.selectedProductId, formData).subscribe({
  //       next: () => {
  //         if (distributorId) this.loadProducts(distributorId);
  //         this.closeModal();
  //         this.resetForm();
  //       },
  //       error: (err) => console.error('Error updating product:', err)
  //     });
  //   } else {
  //     this.productService.create(formData).subscribe({
  //       next: () => {
  //         if (distributorId) this.loadProducts(distributorId);
  //         this.closeModal();
  //         this.resetForm();
  //       },
  //       error: (err) => console.error('Error creating product:', err)
  //     });
  //   }
  // }


  // submitForm() {
  //   this.formSubmitted = true;
  //   this.productForm.markAllAsTouched();

  //   if (this.productForm.invalid) {
  //     this.toastr.error('Please fill all required fields');
  //     return;
  //   }

  //   const formData = new FormData();

  //   // ✅ Use getRawValue to include disabled GST
  //   const product = this.productForm.getRawValue();

  //   Object.keys(product).forEach(key => {
  //     const value = product[key];
  //     if (value !== null && value !== undefined) {
  //       formData.append(key, value.toString());
  //     }
  //   });

  //   const distributorId = localStorage.getItem('DistributorId');
  //   if (distributorId) {
  //     formData.append('DistributorId', distributorId);
  //   }

  //   for (let file of this.selectedFiles) {
  //     formData.append('Images', file);
  //   }

  //   this.productService.create(formData).subscribe({
  //     next: (createdProduct: any) => {

  //       // 🔥 create inventory row with 0 stock
  //       this.inventoryService.stockIn({
  //         productId: createdProduct.productId,
  //         distributorId: this.distributorId!,
  //         quantity: 0,
  //         reason: 'Auto inventory init'
  //       }).subscribe(() => {
  //         this.loadProducts(this.distributorId!);
  //       });

  //       this.toastr.success('Product saved successfully');
  //       this.closeModal();
  //       this.resetForm();
  //     },
  //     error: () => this.toastr.error('Failed to save product')
  //   });
  // }

  submitForm() {
    this.formSubmitted = true;
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const data = this.productForm.getRawValue();
    const distributorId = this.distributorId!;
    const formData = new FormData();

    // ---------- COMMON FIELDS ----------
    formData.append('productName', data.productName);
    formData.append('productCode', data.productCode);
    formData.append('color', data.color);
    formData.append('description', data.description);
    formData.append('measure', data.measure);
    formData.append('price', data.price.toString());
    formData.append('costPrice', data.costPrice.toString());
    formData.append('discount', data.discount.toString());
    formData.append('brand', data.brand);

    // ✅ REQUIRED BY BACKEND
    formData.append('CategoryId', data.category);
    formData.append('Category', data.category);
    formData.append('DistributorId', distributorId);

    // ---------- NEW IMAGES ----------
    for (let file of this.selectedFiles) {
      formData.append('Images', file);
    }

    // ---------- KEEP OLD IMAGES ----------
    for (let img of this.existingImageUrls) {
      formData.append('ExistingImages', img);
    }

    // =====================================
    // 🔥 EDIT MODE (STOP HERE)
    // =====================================
    if (this.isEdit && this.selectedProductId) {
      this.productService.update(this.selectedProductId, formData).subscribe({
        next: () => {
          this.toastr.success('Product updated successfully');
          this.loadProducts(distributorId);
          this.closeModal();
          this.resetForm();
        },
        error: () => this.toastr.error('Update failed')
      });
      return; // 🚨 THIS LINE IS MANDATORY
    }

    // =====================================
    // 🔥 CREATE MODE
    // =====================================
    const initialStock = Number(data.stock || 0);

    this.productService.create(formData).subscribe({
      next: (created) => {
        if (initialStock > 0) {
          this.inventoryService.stockIn({
            productId: created.productId,
            distributorId,
            quantity: initialStock,
            reason: 'Initial stock'
          }).subscribe({
            next: () => {
              this.loadProducts(distributorId); // ✅ NOW correct
            }
          });
        } else {
          // No stock → just reload
          this.loadProducts(distributorId);
        }
this.currentPage = 1;        // ← ADD THIS
this.updatePagination();  
        this.toastr.success('Product created successfully');
        this.closeModal();
        this.resetForm();
      },
      error: () => this.toastr.error('Failed to save product')
    });
  }


  editProduct(product: Product) {
    this.formSubmitted = false;
    this.isEdit = true;
    this.selectedProductId = product.productId!;
    this.selectedProduct = product;
    this.showModal = true;

    // 🔥 RESET FIRST
    this.productForm.reset({
      discount: 0,
      stock: 0,
      gst: 0
    });

    // 🔥 FETCH FULL PRODUCT (NOT inventory data)
    this.productService.getById(product.productId!).subscribe(full => {

      // 🔥 Fetch ALL main categories first
      this.productService.getMainCategories().subscribe(mains => {
        this.mainCategories = mains;

        // 🔥 Find parent mainCategory using subcategory
        const parentMain = mains.find((mc: any) =>
          mc.subCategories?.some((sc: any) => sc.categoryId === full.category)
        );

        if (!parentMain) {
          this.patchEditForm(full);
          return;
        }

        // 🔥 Load subcategories of that main category
        this.productService.getSubCategories(parentMain.categoryId)
          .subscribe(subs => {
            this.subCategories = subs;

            // 🔥 Patch with derived mainCategory
            this.patchEditForm({
              ...full,
              mainCategory: parentMain.categoryId
            });
          });
      });
    });


    const modalEl = document.getElementById('productModal');
    this.modalRef = new bootstrap.Modal(modalEl!);
    this.modalRef.show();
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
          this.updatePagination(); 
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
  if (!category) {
    this.filteredProducts = [...this.products];
  } else {
    this.filteredProducts = this.products.filter(
      p => p.category === category
    );
  }

  this.updatePagination();   // ← ADD THIS
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
        (term.includes("in stock") && p.currentStock > 0) ||
        (term.includes("out of stock") && p.currentStock === 0) ||
        (!term.includes("stock") && true);

      return (
        (nameMatch || categoryMatch || colorMatch || brandMatch) &&
        priceMatch &&
        stockMatch
        
      );
    });
    this.updatePagination();
  }



  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch =
        p.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;

      let matchesStock = true;
      if (this.stockFilter === 'inStock') matchesStock = p.currentStock > 10;

      else if (this.stockFilter === 'lowStock') matchesStock = p.currentStock > 0 && p.currentStock <= 10;
      else if (this.stockFilter === 'outOfStock') matchesStock = p.currentStock === 0;

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
    this.updatePagination();
  }


  getStockStatus(stock: number) {
    if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
    if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'out-of-stock', text: 'Out of Stock' };
  }




  // ==============================================
  // MODAL HANDLING
  // ==============================================
  openModal() {
    this.formSubmitted = false;
    this.isEdit = false;
    this.selectedProductId = null;
    this.selectedProduct = null;

    this.selectedFiles = [];
    this.existingImageUrls = [];
    this.previewUrls = [];

    this.productForm.reset({
      discount: 0,
      stock: 0,
      gst: 0
    });

    // ✅ THIS IS THE KEY
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
  getFullImageUrl(img: string) {
    if (!img) return 'assets/no-image.png';

    // 🔥 ALWAYS go through backend image API
    return `${environment.apiUrl}/images/${img}`;
  }

  // increaseStock(productId: string) {
  //   this.selectedProductId = productId;
  //   this.stockQty = 0;
  //   this.showStockModal = true;
  // }


  confirmAddStock() {
    if (!this.selectedStockProductId) {
      this.toastr.error('Product not selected');
      return;
    }

    if (this.stockQty <= 0) {
      this.toastr.error('Enter valid quantity');
      return;
    }

    this.inventoryService.stockIn({
      productId: this.selectedStockProductId,   // ✅ REQUIRED
      distributorId: this.distributorId!,
      quantity: this.stockQty,
      reason: 'Manual add'
    }).subscribe({
      next: () => {
        this.toastr.success('Stock added successfully');
        this.loadProducts(this.distributorId!);
        this.closeStockModal();
      },
      error: () => this.toastr.error('Failed to add stock')
    });
  }

  openStockModal(productId: string) {
    this.selectedStockProductId = productId; // ✅ KEY LINE
    this.stockQty = 0;
    this.showStockModal = true;
    document.body.classList.add('modal-open');
  }

  closeStockModal() {
    this.showStockModal = false;
    this.selectedStockProductId = null;
    document.body.classList.remove('modal-open');
  }


  // loadInventoryStock(distributorId: string) {
  //   this.inventoryService.getStock(distributorId).subscribe({
  //     next: (stock) => {
  //       this.inventoryStockMap = {};
  //       stock.forEach((s: any) => {
  //         this.inventoryStockMap[s.productId] = s.currentStock;
  //       });

  //       this.mergeInventoryStock();
  //     },
  //     error: (err) => console.error('Error loading inventory stock', err)
  //   });
  // }

  // mergeInventoryStock() {
  //   this.products = this.products.map(p => ({
  //     ...p,
  //     stock: this.inventoryStockMap[p.productId!] ?? p.stock
  //   }));

  //   this.filteredProducts = this.filteredProducts.map(p => ({
  //     ...p,
  //     stock: this.inventoryStockMap[p.productId!] ?? p.stock
  //   }));
  // }

  toggleTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme');

    body.setAttribute(
      'data-theme',
      current === 'dark' ? 'light' : 'dark'
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredProducts = [...this.products];
      this.updatePagination();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.categoryFilter ||
      this.stockFilter ||
      this.color ||
      this.minPriceFilter ||
      this.maxPriceFilter
    );
  }

  clearCategoryFilter() {
    this.categoryFilter = '';
    this.filteredProducts = [...this.products];
  }

  clearStockFilter() {
    this.stockFilter = '';
    this.filteredProducts = [...this.products];
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.stockFilter = '';
    this.color = '';
    this.minPriceFilter = undefined;
    this.maxPriceFilter = undefined;
    this.filteredProducts = [...this.products];
    this.updatePagination();
  }

  getStockFilterLabel(filter: string) {
    if (filter === 'inStock') return 'In Stock';
    if (filter === 'lowStock') return 'Low Stock';
    if (filter === 'outOfStock') return 'Out of Stock';
    return 'All';
  }

  applySort() {
    if (this.sortBy === 'name') {
      this.filteredProducts.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );
    }

    if (this.sortBy === 'priceLow') {
      this.filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (this.sortBy === 'priceHigh') {
      this.filteredProducts.sort((a, b) => b.price - a.price);
    }

    if (this.sortBy === 'stock') {
      this.filteredProducts.sort(
        (a, b) => (b.currentStock || 0) - (a.currentStock || 0)
      );
    }
    this.updatePagination();
  }
  getInStockCount() {
    return this.products.filter(p => p.currentStock > 10).length;
  }

  getLowStockCount() {
    return this.products.filter(p => p.currentStock > 0 && p.currentStock <= 10).length;
  }

  getTotalStockValue() {
    return this.products.reduce(
      (sum, p) => sum + (p.currentStock || 0) * p.price,
      0
    );
  }
  getStockPercentage(current: number, max = 100): number {
    if (!current || current <= 0) return 0;
    return Math.min(100, (current / max) * 100);
  }
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
  removePreview(img: string) {
    this.previewUrls = this.previewUrls.filter(i => i !== img);
  }

  removeExistingImage(img: string) {
    this.existingImageUrls = this.existingImageUrls.filter(i => i !== img);
  }


  openCategorySheet() {
    this.showCategorySheet = true;
    document.body.classList.add('modal-open');
  }

  closeCategorySheet() {
    this.showCategorySheet = false;
    document.body.classList.remove('modal-open');
  }

selectCategory(category: string) {
  this.categoryFilter = category;
  this.onCategoryChange(category);
  this.closeCategorySheet();
}

openStockSheet() {
  this.showStockSheet = true;
  document.body.classList.add('modal-open');
}

closeStockSheet() {
  this.showStockSheet = false;
  document.body.classList.remove('modal-open');
}

selectStock(value: string) {
  this.stockFilter = value;
  this.filterProducts();
  this.closeStockSheet();
}

openSortSheet() {
  this.showSortSheet = true;
  document.body.classList.add('modal-open');
}

closeSortSheet() {
  this.showSortSheet = false;
  document.body.classList.remove('modal-open');
}

selectSort(value: string) {
  this.sortBy = value;
  this.applySort();
  this.closeSortSheet();
}

getSortLabel(value: string): string {
  switch (value) {
    case 'priceLow': return 'Price: Low to High';
    case 'priceHigh': return 'Price: High to Low';
    case 'stock': return 'Stock: High to Low';
    case 'newest': return 'Newest First';
    default: return 'Name (A–Z)';
  }
}


}


