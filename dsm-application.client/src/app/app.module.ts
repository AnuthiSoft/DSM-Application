import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './services/auth.interceptor';
import { ProductsComponent } from './components/products/products.component';
import { CustomerRegisterComponent } from './components/customer-register/customer-register.component';
import { CustomerLoginComponent } from './components/customer-login/customer-login.component';
import { CreateCustomerDistributorComponent } from './components/create-customer-distributor/create-customer-distributor.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DistributorDashboardComponent } from './components/distributor-dashboard/distributor-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';
import { MainPageComponent } from './components/main-page/main-page.component';
// import { DistributorLoginComponent } from './components/distributor-login/distributor-login.component';
import { DistributorSignupComponent } from './components/distributor-signup/distributor-signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { SetPasswordComponent } from './components/set-password/set-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';
import { ProductsByDistComponent } from './components/products-by-dist/products-by-dist.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { DistributorOrdersComponent } from './components/distributor-orders/distributor-orders.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';
import { EmployeeOrdersComponent } from './components/employee-orders/employee-orders.component';
import { CustDashboardComponent } from './components/cust-dashboard/cust-dashboard.component';
import { DistributorConnectionRequestsComponent } from './components/distributor-connection-requests/distributor-connection-requests.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestComponent } from './components/test/test.component';
import { EmployeeLoginComponent } from './components/employee-login/employee-login.component';
import { EmployeeSignupComponent } from './components/employee-signup/employee-signup.component';
import { AddToCartComponent } from './components/add-to-cart/add-to-cart.component';
import { EmployeeProfileComponent } from './components/employee-profile/employee-profile.component';
import { FraudReportComponent } from './components/fraud-report/fraud-report.component';
import { AdminFraudListComponent } from './components/admin-fraud-list/admin-fraud-list.component';
 
import { TruncatePipe } from './pipe/truncate.pipe';
import { ReviewSubmitComponent } from './components/review-submit/review-submit.component';
import { AdminReviewListComponent } from './components/admin-review-list/admin-review-list.component';
 
import { FraudHistoryComponent } from './components/fraud-history/fraud-history.component';
import { AdminReviewHistoryComponent } from './components/admin-review-history/admin-review-history.component';
import { CashCollectionComponent } from './components/cash-collection/cash-collection.component';
import { CashSummaryComponent } from './components/cash-summary/cash-summary.component';
import { PaymentSummaryComponent } from './components/payment-summary/payment-summary.component';
import { CollectorReportsComponent } from './components/collector-reports/collector-reports.component';
import { CustomerPaymentStatusComponent } from './components/customer-payment-status/customer-payment-status.component';
import { PaymentReportComponent } from './components/payment-report/payment-report.component';
import { PendingPaymentsComponent } from './components/pending-payments/pending-payments.component';
import { PendingHandoversComponent } from './components/pending-handovers/pending-handovers.component';
 

 
 
 
import { MainInventoryComponent } from './components/main-inventory/main-inventory.component';
import { CustomersListComponent } from './components/customers-list/customers-list.component';
import { EmployeeTrackingComponent } from './components/employee-tracking/employee-tracking.component';
 import { GoogleMapsModule } from '@angular/google-maps';
// import { InventoryBatchesComponent } from './components/inventory-batches/inventory-batches.component';
import { CustomerSearchComponent } from './components/customer-search/customer-search.component';
//import { DistributorViewComponent } from './components/distributor-view/distributor-view.component';
//import { AddPaymentNoteComponent } from './components/add-payment-note/add-payment-note.component';
// import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoiceCreateComponent } from './components/invoice-create/invoice-create.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { EmployeeInvoicesComponent } from './components/employee-invoices/employee-invoices.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { DistributorSettingsComponent } from './components/distributor-settings/distributor-settings.component';
import { PaymentCollectionForCashcollectorComponent } from './components/payment-collection-for-cashcollector/payment-collection-for-cashcollector.component';
import { InventoryBatchesComponent } from './components/inventory-batches/inventory-batches.component';
import { EmployeeReturnOrdersComponent } from './components/employee-return-orders/employee-return-orders.component';
import { DistributorReturnRequestsComponent } from './components/distributor-return-requests/distributor-return-requests.component';
import { ReturnOrdersComponent } from './components/return-orders/return-orders.component';
import { EmployeeAddToCartComponent } from './components/employee-add-to-cart/employee-add-to-cart.component';
import { DistributorLoginComponent } from './components/distributor-login/distributor-login.component';
import { EmployeeProductsComponent } from './components/employee-products/employee-products.component';
// import { PaymentCollectionForCashcollectorComponent } from './payment-collection-for-cashcollector/payment-collection-for-cashcollector.component';
 
 
 
 
 
 
 
@NgModule({
  declarations: [
AppComponent,
ProductsComponent,
CustomerRegisterComponent,
CustomerLoginComponent,
CreateCustomerDistributorComponent,
AdminDashboardComponent,
DistributorDashboardComponent,
EmployeeDashboardComponent,
MainPageComponent,
DistributorLoginComponent,
DistributorSignupComponent,
ForgotPasswordComponent,
EmployeesComponent,
SetPasswordComponent,
ProfileComponent,
ThemeToggleComponent,
ProductsByDistComponent,
 
//AddPaymentNoteComponent,
//DistributorViewComponent,
 

FraudHistoryComponent,
AdminReviewListComponent,
AdminReviewHistoryComponent,
 
 

 
// InventoryBatchesComponent,
 
InvoiceCreateComponent,
InvoiceDetailComponent,
EmployeeInvoicesComponent,
 
 
    // AdminDistributorsComponent
 
    OrderHistoryComponent,
    DistributorOrdersComponent,
    CustomerOrdersComponent,
    EmployeeOrdersComponent,
    CustDashboardComponent,
    DistributorConnectionRequestsComponent,
    TestComponent,
    EmployeeLoginComponent,
    EmployeeSignupComponent,
    AddToCartComponent,
    EmployeeProfileComponent,
CustomerDashboardComponent,
    FraudReportComponent,
 
    AdminFraudListComponent,
 
    TruncatePipe,
    ReviewSubmitComponent,
 
 
    FraudHistoryComponent,
    AdminReviewHistoryComponent,
    CashCollectionComponent,
    CashSummaryComponent,
    PaymentSummaryComponent,
    CollectorReportsComponent,
    CustomerPaymentStatusComponent,
    PaymentReportComponent,
    PendingPaymentsComponent,
    PendingHandoversComponent,
    PaymentsComponent,
    DistributorSettingsComponent,
PaymentCollectionForCashcollectorComponent,
    MainInventoryComponent,
    CustomersListComponent,
    EmployeeTrackingComponent,
    InventoryBatchesComponent,
    CustomerSearchComponent,
    EmployeeReturnOrdersComponent,
    EmployeeProductsComponent,
    EmployeeAddToCartComponent,
    ReturnOrdersComponent,






    // AdminDistributorsComponent
 
    DistributorReturnRequestsComponent,
 
 
 
  ],
  imports: [
    BrowserModule, HttpClientModule,  GoogleMapsModule ,  CommonModule,           // ✅ ADD THIS      // ✅ you already imported but forgot here
    AppRoutingModule, FormsModule, ReactiveFormsModule, BrowserAnimationsModule, ToastrModule.forRoot({
      timeOut: 1000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
 
    }),
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
 
 
 