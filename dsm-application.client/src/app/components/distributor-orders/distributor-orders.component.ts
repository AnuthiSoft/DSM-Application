import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DistributorOrder, Employee } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { EmployeeService } from '../../services/employee.service';
import { DistributorService } from '../../services/distributor.service';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../services/product.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-distributor-orders',
  templateUrl: './distributor-orders.component.html',
  styleUrl: './distributor-orders.component.css'
})
export class DistributorOrdersComponent implements OnInit, OnChanges {

  distributorId = localStorage.getItem('distributorId') || '';
  empId = localStorage.getItem('employeeId') || '';
  apiBaseUrl = environment.apiUrl.replace('/api', '');
  customerSearch: string = '';
  allOrders: DistributorOrder[] = [];  // keep original list
  orders: DistributorOrder[] = [];
  employees: Employee[] = [];
  loading = false;
  filteredEmployees: Employee[] = [];   // ✅ for search/filter results
  statusFilter = 'All';
  statuses = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Rejected'];
  nextAction: string = "";
  showAssignModal = false;
  assignMode: 'temp' | 'perm' = 'temp';
  activeEmployeeId: string = '';
  activeEmployeeName = '';
  tempEmployeeId = '';
  showTempDropdown = false; showProductPopup = false;
  selectedOrder: any = null;
  availableEmployees: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  paginatedOrders: DistributorOrder[] = [];
  selectedEmployeeId: string = '';

  @Input() presetStatus: string | null = null;


  confirmingOrder = false;
  // For assignment modal
  // selectedOrder: DistributorOrder | null = null;
  employeeId = '';
  // selectedOrder: any;
  showStatusSheet = false;

  employeeAvailability: {
    [customerId: string]: {
      permanentEmployeeId: string | null,
      permanentEmployeeAvailable: boolean,
      permanentReason: string | null,

      temporaryEmployeeId: string | null,
      temporaryEmployeeAvailable: boolean,
      temporaryReason: string | null,

      isTemporaryActiveToday: boolean
    }
  } = {}
  constructor(
    private orderService: OrderService,
    private employeeService: EmployeeService,
    private distService: DistributorService, private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
    this.loadEmployees();
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['presetStatus'] && this.presetStatus) {
      this.statusFilter = this.presetStatus;
      this.loadOrders();
    }
  }


  loadOrders(): void {
    if (!this.distributorId) return;

    this.loading = true;

    const status = !this.statusFilter || this.statusFilter === 'All'
      ? undefined
      : this.statusFilter;

    this.orderService.getOrdersByDistributor(this.distributorId, status).subscribe({
      next: (data) => {
        // Store ORIGINAL list
        this.allOrders = data.map((o: any) => ({
          ...o,
          creditUsed: o.creditUsed ?? 0,
          payableAmount: o.payableAmount ?? o.totalAmount ?? 0
        }));

        // Apply search + status filters
        this.applyFilters();

        this.loading = false;

        // Load employee availability for each customer
        this.orders.forEach(o => {
          this.loadAvailabilityForCustomer(o.customerId);
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert('Failed to load orders');
      }
    });
  }


  applyFilters() {
    let list = [...this.allOrders];

    // 🔍 Customer search
    if (this.customerSearch.trim()) {
      const term = this.customerSearch.toLowerCase();
      list = list.filter(o =>
        o.customerName?.toLowerCase().includes(term)
      );
    }

    // 🟦 Status filter
    if (this.statusFilter && this.statusFilter !== 'All') {
      list = list.filter(o => o.status === this.statusFilter);
    }

    this.totalPages = Math.ceil(list.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedOrders = list.slice(start, end);
    this.orders = list; // keep full for count
  }

  loadAvailabilityForCustomer(customerId: string) {
    this.distService.getCustomerEmployeeStatus(this.distributorId, customerId)
      .subscribe(status => {
        this.employeeAvailability[customerId] = status;
      });
  }
  loadEmployees() {
    if (!this.distributorId) {
      console.error('DistributorId not found in localStorage!');
      return;
    }

    this.orderService.getOrderEmployees(this.distributorId).subscribe({
      next: (res) => {
        console.log('✅ Employees loaded:', res);
        // filter only active employees
        this.employees = res
          .map((e: any) => ({
            ...e,
            employeeId: e.employeeId || e.id || e._id
          }))
          .filter(e =>
            e.isActive === true &&
            e.designation === 'Delivery Boy' &&     // 👈 Only Delivery Boys
            e.distributorId === this.distributorId  // 👈 Must belong to this distributor
          );
        this.filteredEmployees = this.employees;
      },
      error: (err) => console.error('❌ Failed to load employees:', err)
    });
  }
  // confirmOrder(order: DistributorOrder) {
  //   if (!confirm(`Confirm order ${order.id}?`)) return;
  //   this.updateStatus(order, 'Confirmed');
  // }


  confirmOrder(order: DistributorOrder) {
    this.confirmingOrder = true;
    this.updateStatus(order, 'Confirmed');
    setTimeout(() => {
      this.confirmingOrder = false;
    }, 500);
    this.toastr.success(`Order ${order.id} confirmed successfully!`);
  }
  // rejectOrder(order: DistributorOrder) {
  //   if (!confirm(`Reject order ${order.id}?`)) return;
  //   this.updateStatus(order, 'Rejected');
  // }

  rejectOrder(order: DistributorOrder) {
    this.updateStatus(order, 'Rejected');
    this.toastr.error(`Order ${order.id} has been rejected`);
  }


  confirmOrderWithCheck(order: DistributorOrder) {

    const availability = this.employeeAvailability[order.customerId];

    // 🔥 CASE 1: Permanent employee available → auto ship
    if (availability?.permanentEmployeeAvailable && availability.permanentEmployeeId) {

      const emp = this.employees.find(
        e => e.employeeId === availability.permanentEmployeeId
      );

      // Assign order
      this.orderService.assignOrder(order.id, {
        employeeId: availability.permanentEmployeeId,
        employeeName: emp?.name || '',
        note: 'Auto assigned to permanent employee'
      }).subscribe(() => {

        // Move directly to SHIPPED
        this.orderService.updateStatus(order.id, 'Shipped').subscribe(() => {
          this.toastr.success(
            `Order ${order.id} shipped. Delivery in progress 🚚`
          );
          this.loadOrders();
        });

      });

      return;
    }

    // 🔥 CASE 2: Permanent employee NOT available → normal confirm
    this.orderService.updateStatus(order.id, 'Confirmed').subscribe(() => {
      this.toastr.info(
        `Order ${order.id} confirmed. Please assign employee.`
      );
      this.loadOrders();
    });
  }

  getTempEmployees(order: DistributorOrder): Employee[] {
    const availability = this.employeeAvailability[order.customerId];

    if (!availability?.permanentEmployeeId) {
      return this.employees;
    }

    // 🔥 Remove permanent employee from list
    return this.employees.filter(
      e => e.employeeId !== availability.permanentEmployeeId
    );
  }



  openProductDetails(order: any, action: string) {

    // 🔥 CLOSE assign modal if it is open
    this.showAssignModal = false;
    document.body.style.overflow = 'hidden';
    // small delay so DOM updates cleanly
    setTimeout(() => {
      this.selectedOrder = order;
      // ADD ↓↓↓
      this.selectedOrder.creditUsed = order.creditUsed ?? 0;

      this.selectedOrder.payableAmount =
        order.payableAmount ??
        order.remainingAmount ??
        order.totalAmount ?? 0;
      // ADD ↑↑↑

      this.nextAction = action;

      order.products = order.products || [];

      order.products.forEach((item: any) => {
        this.productService.getById(item.productId).subscribe((p: any) => {
          item.brand = p.brand;
          item.category = p.category;
          item.imageUrl = p.imageUrls?.length
            ? `${environment.apiUrl}/images/${p.imageUrls[0]}`
            : 'assets/no-image.png';

        });
      });

      this.showProductPopup = true;
    }, 100);
  }

  continueAction() {
    this.showProductPopup = false;

    if (this.nextAction === 'confirm') {
      this.confirmOrder(this.selectedOrder);
    }


    this.nextAction = "";  // clear action
  }

  // openAssignModal(orderId: string) {
  //   const modal = document.getElementById('assignModal');
  //   if (modal) {
  //     modal.style.display = 'block';
  //     this.selectedOrder = orderId;
  //   } else {
  //     console.warn('assignModal not found in DOM');
  //   }
  // }
  // ✅ Fixed: accepts full order object
  openAssignModal(order: DistributorOrder) {
    this.selectedOrder = order;
    this.showAssignModal = true;

    // reset state ✅ (from THEIRS)
    this.availableEmployees = [];
    this.selectedEmployeeId = '';
    this.showTempDropdown = false;

    // LOAD employees for dropdown
    this.filteredEmployees = this.employees;

    // 🔥 Load availability from backend
    this.distService.getCustomerEmployeeStatus(
      this.distributorId,
      order.customerId
    ).subscribe(status => {

      // Save availability in object for UI
      this.employeeAvailability[order.customerId] = status;

      // 2️⃣ Show active employee (ONLY if assigned)
      if (status.temporaryEmployeeId) {
        const tempEmp = this.employees.find(
          e => e.employeeId === status.temporaryEmployeeId
        );
        this.activeEmployeeName = tempEmp?.name || 'Temporary employee assigned';

        // ✅ ADD THIS
        this.selectedEmployeeId = status.temporaryEmployeeId;
      }
      else if (status.permanentEmployeeId) {
        const permEmp = this.employees.find(
          e => e.employeeId === status.permanentEmployeeId
        );
        this.activeEmployeeName = permEmp?.name || 'Permanent employee assigned';

        // ✅ ADD THIS
        this.selectedEmployeeId = status.permanentEmployeeId;
      }


      // 3️⃣ Load AVAILABLE employees for today
      this.employeeService
        .getAvailableEmployeesToday(this.distributorId)
        .subscribe(list => {

          this.availableEmployees = list;

          // ✅ ADD THIS BLOCK
          if (
            this.selectedEmployeeId &&
            !this.availableEmployees.some(e => e.employeeId === this.selectedEmployeeId)
          ) {
            const assignedEmp = this.employees.find(
              e => e.employeeId === this.selectedEmployeeId
            );
            if (assignedEmp) {
              this.availableEmployees.unshift(assignedEmp);
            }
          }

          this.cd.detectChanges();
        });

      // 4️⃣ Show temp dropdown ONLY when permanent exists but NOT available
      this.showTempDropdown =
        !!status.permanentEmployeeId &&
        status.permanentEmployeeAvailable === false;

      this.cd.detectChanges();
    });
  }


  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedOrder = null;
    this.tempEmployeeId = '';
  }


  //   assignAndShip() {
  //     if (!this.selectedOrder || !this.employeeId) {
  //       alert('Please select an employee to assign the order.');
  //       return;
  //     }

  //    this.orderService.assignOrder(this.selectedOrder.id, {
  //   employeeId: this.employeeId,
  //   employeeName: this.filteredEmployees.find(e => e.employeeId === this.employeeId)?.name,
  //    note: 'Assigned by distributor' // ✅ Added note
  // }).subscribe({
  //   next: () => {
  //     alert('Order assigned and shipped successfully!');
  //     this.closeAssignModal();
  //     this.loadOrders();
  //   },
  //   error: (err) => {
  //     console.error('Error assigning order:', err);
  //     alert('Failed to assign order.');
  //   }
  // });
  //   }

  assignAndShip() {


    if (!this.selectedOrder) return;

    const customerId = this.selectedOrder.customerId;
    const availability = this.employeeAvailability[customerId];

    // ⭐ CASE 1: Permanent Employee Available → AUTO ASSIGN + AUTO SHIP
    if (availability?.permanentEmployeeAvailable && availability.permanentEmployeeId) {

      const empId = availability.permanentEmployeeId;
      const emp = this.employees.find(e => e.employeeId === empId);

      this.orderService.assignOrder(this.selectedOrder.id, {
        employeeId: empId,
        employeeName: emp?.name || '',
        note: "Auto assignment to permanent employee"
      }).subscribe(() => {

        // ⭐ SHIP AUTOMATICALLY
        this.orderService.updateStatus(this.selectedOrder.id, "Shipped").subscribe(() => {

          alert("Order auto-assigned to permanent employee & shipped.");
          this.closeAssignModal();
          this.loadOrders();

        });

      });

      return;
    }

    // ⭐ CASE 2: Permanent NOT available → TEMP chosen
    if (this.tempEmployeeId) {

      this.distService.assignTempToday(
        this.distributorId,
        customerId,
        this.tempEmployeeId
      ).subscribe(() => {

        // Assign to selected temp employee
        this.finalOrderAssign(this.tempEmployeeId);

      });

      return;
    }


    // ⭐ CASE 3: Manual assignment from Available Employees dropdown
    if (this.selectedEmployeeId) {
      this.finalOrderAssign(this.selectedEmployeeId);
      return;
    }



    alert("Temporary employee not selected");
  }

  finalOrderAssign(employeeId: string) {

    const emp = this.employees.find(e => e.employeeId === employeeId);

    this.orderService.assignOrder(this.selectedOrder.id, {
      employeeId: employeeId,
      employeeName: emp?.name || '',
      note: "Assigned manually"
    }).subscribe(() => {

      this.orderService.updateStatus(this.selectedOrder.id, "Shipped").subscribe(() => {
        alert("Order assigned & shipped successfully");
        this.closeAssignModal();
        this.loadOrders();
      });

    });
  }



  // markDelivered(order: DistributorOrder) {
  //   if (!confirm(`Mark order ${order.id} as Delivered?`)) return;
  //   this.updateStatus(order, 'Delivered');
  // }

  markDelivered(order: DistributorOrder) {
    this.updateStatus(order, 'Delivered');
    this.toastr.success(`Order ${order.id} marked as Delivered`);
  }

  // updateStatus(order: DistributorOrder, status: string) {
  //   this.orderService.updateStatus(order.id, status).subscribe({
  //     next: (res: any) => {
  //       alert(res?.message || 'Status updated');
  //       this.loadOrders();
  //     },
  //     error: (err) => {
  //       console.error('Failed update', err);
  //       alert(err?.error || 'Failed to update status');
  //     }
  //   });
  // }

  // updateStatus(order: DistributorOrder, status: string) {
  //   this.orderService.updateStatus(order.id, status).subscribe({
  //     next: (res: any) => {
  //       this.toastr.success(res?.message || `Status updated to ${status}`);
  //       this.loadOrders();
  //     },
  //     error: (err) => {
  //       console.error('Failed update', err);
  //       this.toastr.error(err?.error || 'Failed to update status');
  //     }
  //   });
  // }

  updateStatus(order: DistributorOrder, status: string) {
    this.orderService.updateStatus(order.id, status).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || `Status updated to ${status}`);
        this.loadOrders();

        // 🔥 IMPORTANT: trigger product stock refresh
        if (status === 'Delivered') {
          localStorage.setItem('REFRESH_PRODUCTS', 'true');
        }
      },
      error: (err) => {
        console.error('Failed update', err);
        this.toastr.error(err?.error || 'Failed to update status');
      }
    });
  }


  assignTempToCustomer() {
    if (!this.selectedOrder || !this.employeeId) {
      alert('Please select an employee.');
      return;
    }

    const distributorId = this.distributorId;
    const customerId = this.selectedOrder.customerId;

    this.distService.assignTempToday(distributorId, customerId, this.employeeId)
      .subscribe({
        next: () => {
          alert('Temporary employee assigned for today.');
          this.closeAssignModal();
          this.loadOrders();
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.message || 'Failed to assign temporary employee');
        }
      });
  }

  savePermanentEmployee() {
    if (!this.selectedOrder || !this.selectedEmployeeId) {
      alert("Select an employee");
      return;
    }

    this.distService.assignPermanentEmployee(
      this.distributorId,
      this.selectedOrder.customerId,
      this.selectedEmployeeId
    ).subscribe({
      next: () => {
        alert("Permanent employee assigned successfully!");
        this.loadOrders();
      },
      error: (err) => {
        console.error(err);
        alert("Failed to assign permanent employee");
      }
    });
  }



  // ✅ Added function to fix your template error
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge bg-warning text-dark';
      case 'Confirmed':
        return 'badge bg-primary';
      case 'Shipped':
        return 'badge bg-info text-dark';
      case 'Delivered':
        return 'badge bg-success';
      case 'Rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  closeProductPopup() {
    this.showProductPopup = false;
    this.nextAction = "";   // 🔥 prevents unwanted opening
    document.body.style.overflow = '';
  }

  // 🧮 Subtotal (before discount)
  getOrderSubtotal(order: any): number {
    if (!order?.products?.length) return 0;

    return order.products.reduce((sum: number, p: any) => {
      const price = Number(p.price ?? p.unitPrice ?? 0);
      const qty = Number(p.quantity ?? 1);
      return sum + price * qty;
    }, 0);
  }

  // 💸 Discount
  getOrderDiscount(order: any): number {
    return Number(order.discount ?? order.totalDiscount ?? 0);
  }


  toggleTheme() {
    document.body.classList.toggle('dark');
  }

  viewReceipt(blobName: string) {
    if (!blobName) {
      this.toastr.warning('Receipt not available');
      return;
    }

    // ✅ ALWAYS go through backend (secured)
    const receiptUrl = `${environment.apiUrl}/orders/receipt/${blobName}`;
    window.open(receiptUrl, '_blank');
  }

  openStatusSheet(event: Event) {
    // 📱 Mobile + Tablet only
    if (window.innerWidth <= 1024) {
      event.preventDefault();   // ⛔ block native select
      event.stopPropagation();
      this.showStatusSheet = true;
    }
  }

  closeStatusSheet() {
    this.showStatusSheet = false;
  }

  selectStatus(status: string) {
    this.statusFilter = status || 'All';
    this.showStatusSheet = false;
    this.loadOrders();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];

    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (this.currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (this.currentPage < this.totalPages - 2) {
      pages.push('...');
    }

    pages.push(this.totalPages);

    return pages;
  }
}

