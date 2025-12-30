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
  formSubmitted = false;


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

  loadProducts(distributorId: string) {
    this.inventoryService.getStock(distributorId).subscribe({
      next: (data: any[]) => {
        const map = new Map<string, any>();

        data.forEach(p => {
          map.set(p.productId, p); // 🔥 overwrite duplicates
        });

        this.products = Array.from(map.values());
        this.filteredProducts = [...this.products];
      },
      error: err => console.error(err)
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
    if (this.isEdit && !this.selectedProductId) {
      this.toastr.error('Invalid product update');
      return;
    }

    this.formSubmitted = true;
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const productData = this.productForm.getRawValue();
    const initialStock = Number(productData.stock || 0);

    const formData = new FormData();

    Object.keys(productData).forEach(key => {
      if (key !== 'stock' && productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key].toString());
      }
    });

    const distributorId = this.distributorId!;
    formData.append('DistributorId', distributorId);

    for (let file of this.selectedFiles) {
      formData.append('Images', file);
    }

    if (this.isEdit && this.selectedProductId) {
      // ✅ UPDATE
      this.productService.update(this.selectedProductId, formData).subscribe({
        next: () => {
          this.toastr.success('Product updated successfully');
          // this.loadProducts(distributorId);
          this.productService.getById(this.selectedProductId!)
            .subscribe(updated => {
              const index = this.products.findIndex(p => p.productId === updated.productId);
              if (index > -1) {
                this.products[index] = {
                  ...updated,
                  currentStock: this.products[index].currentStock
                };
                this.filteredProducts = [...this.products];
              }
            });

          this.closeModal();
          this.resetForm();
        },
        error: () => this.toastr.error('Failed to update product')
      });
    } else {
      // ✅ CREATE
      this.productService.create(formData).subscribe({
        next: (createdProduct: any) => {

          // 🔥 Initial stock goes to inventory ONLY on create
          if (initialStock > 0) {
            this.inventoryService.stockIn({
              productId: createdProduct.productId,
              distributorId,
              quantity: initialStock,
              reason: 'Initial stock on product creation'
            }).subscribe(() => {
              this.loadProducts(distributorId);
            });
          } else {
            this.loadProducts(distributorId);
          }

          this.toastr.success('Product saved successfully');
          this.closeModal();
          this.resetForm();
        },
        error: () => this.toastr.error('Failed to save product')
      });
    }
  }

  editProduct(product: Product) {
    this.formSubmitted = false;
    this.isEdit = true;
    this.selectedProductId = product.productId!;
    this.selectedProduct = product;

    this.productForm.reset(); // reset first
    this.productForm.patchValue({
      ...product,
      stock: 0 // ❗ NEVER allow stock edit during update
    });

    this.previewUrls = [];
    this.previewUrl = product.imageUrls?.length
      ? this.getFullImageUrl(product.imageUrls[0])
      : null;

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
        (term.includes("in stock") && p.currentStock > 0) ||
        (term.includes("out of stock") && p.currentStock === 0) ||
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

    this.productForm.reset({
      discount: 0,
      stock: 0,
      gst: 0
    });

    this.previewUrls = [];
    this.previewUrl = null;

    const modalEl = document.getElementById('productModal');
    this.modalRef = new bootstrap.Modal(modalEl!);
    this.modalRef.show();
  }


  closeModal() {
    if (this.modalRef) this.modalRef.hide();
  }

  getFullImageUrl(img: string) {
    if (!img) return 'assets/no-image.png';

    // 🔥 ALWAYS go through backend image API
    return `${environment.apiUrl}/images/${img}`;
  }
  increaseStock(productId: string) {
    const qty = prompt('Enter quantity to add:');
    if (!qty) return;

    const quantity = Number(qty);
    if (quantity <= 0) {
      this.toastr.error('Invalid quantity');
      return;
    }

    //   this.productService.increaseStock(productId, quantity).subscribe({
    //     next: () => {
    //       this.toastr.success('Stock increased');

    //       const distributorId = localStorage.getItem('DistributorId');
    //       if (distributorId) {
    //         // this.loadInventoryStock(distributorId); // ✅ ONLY inventory
    //       }
    //     },
    //     error: () => this.toastr.error('Failed to increase stock')
    //   });
    // }


    this.inventoryService.stockIn({
      productId,
      distributorId: this.distributorId!,
      quantity,
      reason: 'Manual add'
    }).subscribe(() => {
      this.toastr.success('Stock increased');
      this.loadProducts(this.distributorId!); // 🔥 reload from inventory
    });

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

