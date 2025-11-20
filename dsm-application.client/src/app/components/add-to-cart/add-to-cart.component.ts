import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Product } from '../../models/products.model';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.css']
})
export class AddToCartComponent implements OnInit,OnChanges {

   apiBaseUrl = environment.apiUrl.replace('/api', ''); // ✅ remove '/api' for file access
   @Input() distributorId?: string;  // ✅ accept from parent
    @Input() customerId!: string;
    @Input() products: Product[] = [];
    // distributorId!: string;
    // products: Product[] = [];
    loading = true;
    productForm: FormGroup;
    isEdit = false;
    selectedProductId: string | null = null;
  
   
   
      cart: { product: Product; quantity: number }[] = [];
    // customerId = localStorage.getItem('customerId') || '';
      showPopup = false;
    selectedQuantity = 1;
     color = '';
     searchTerm: string = '';
    minPriceFilter?: number;
    maxPriceFilter?: number;
    categoryFilter: string = '';
    stockFilter: string = '';
    categories: string[] = [];
  
    filterProducts: Product[] = [];
  
    
   
    @Output() addToCartClicked = new EventEmitter<Product>();
  
  @Input() selectedProduct: Product | null = null;



   
  
  
     constructor(
       private route: ActivatedRoute,
        private productService: ProductService,
        private fb: FormBuilder,
        private orderService: OrderService
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



      ngOnInit(): void {

  // ✅ Load existing cart from localStorage
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    this.cart = JSON.parse(savedCart);
  }

  // existing code
  if (this.products && this.products.length > 0) {
    this.loading = false;
    this.filterProducts = this.products;
    this.extractCategories();
  } else {
    this.distributorId = this.route.snapshot.paramMap.get('distributorId')!;
    this.loadProducts();
  }
}

  ngOnChanges() {
    if (this.selectedProduct) {
      this.selectedQuantity = 1;
      this.showPopup = true;        // auto open popup
    }
  }

  increaseQty() {
    if (!this.selectedProduct) return;
    if (this.selectedQuantity < this.selectedProduct.stock)
      this.selectedQuantity++;
  }

  decreaseQty() {
    if (this.selectedQuantity > 1) this.selectedQuantity--;
  }

 confirmAddToCart() {
  if (!this.selectedProduct) return;

  const product = this.selectedProduct; // ✅ now TS knows it's not null

  const existing = this.cart.find(
    c => c.product.productId === product.productId
  );

  if (existing) {
    existing.quantity += this.selectedQuantity;
  } else {
    this.cart.push({
      product,
      quantity: this.selectedQuantity
    });
  }

  localStorage.setItem('cart', JSON.stringify(this.cart));

  this.showPopup = false;
  this.selectedProduct = null;
}
  removeFromCart(id: string | undefined) {
  if (!id) return;

  // remove from cart array
  this.cart = this.cart.filter(x => x.product.productId !== id);

  // ❗ update localStorage also
  localStorage.setItem('cart', JSON.stringify(this.cart));
}


  getTotal() {
    return this.cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

   placeOrder() {
  if (!this.customerId) return alert('Please login as customer first');
  if (this.cart.length === 0) return alert('Cart is empty');

  const distributorId = this.cart[0]?.product?.distributorId;
  if (!distributorId) return alert('Distributor not found for selected product');

  const payload = {
    customerId: this.customerId,
    distributorId: distributorId,
    products: this.cart.map(c => ({
      productId: c.product.productId,
      productName: c.product.productName,
      price: c.product.price,
      quantity: c.quantity
    }))
  };
  

  this.orderService.placeOrder(payload).subscribe({
    next: (res) => {

      alert(res.message || 'Order placed');

      // 🔥 CLEAR CART COMPLETELY
      this.cart = [];
      localStorage.removeItem('cart');

      // 🔥 RESET POPUP STATE IF OPEN
      
      this.selectedProduct = null;
      this.showPopup = false;

    },
    error: (err) => {
      console.error('Order failed', err);
      alert(err?.error || 'Order failed');
    }
  });
}

   
    // call this when you want to fetch products 
      loadProducts(): void {
      if (!this.distributorId) return;
      this.loading = true;
  
      this.productService.getProductsByDistributor(this.distributorId).subscribe({
        next: (data: Product[]) => {
          this.products = data;
          this.filterProducts = data;
          this.extractCategories();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load products', err);
          this.loading = false;
        }
      });
    }
  
  
     openAddToCart(product: Product) {
      this.addToCartClicked.emit(product); this.selectedProduct = product;
       this.selectedQuantity = 1; this.confirmAddToCart();this.showPopup = true;
    }
  
  
  
  
  
    
  
    extractCategories() {
    this.categories = Array.from(
      new Set(
        this.products
          .map(p => p.category)
          .filter((c): c is string => !!c) // ✅ ensures only strings remain
      )
    );
  }
  
  
  
   
    
  
    // 🧩 Apply filters
   
  
    
  
  // ❌ Cancel popup
   closePopup() {
    this.showPopup = false;
    this.selectedProduct = null;
  }
 
  
   
   
   
  
   
   
   
  }