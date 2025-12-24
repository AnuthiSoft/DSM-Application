import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { ProductsComponent } from './components/products/products.component';
import { CustomerRegisterComponent } from './components/customer-register/customer-register.component';
import { CustomerLoginComponent } from './components/customer-login/customer-login.component';
import { CreateCustomerDistributorComponent } from './components/create-customer-distributor/create-customer-distributor.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DistributorDashboardComponent } from './components/distributor-dashboard/distributor-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { DistributorLoginComponent } from './components/distributor-login/distributor-login.component';
import { DistributorSignupComponent } from './components/distributor-signup/distributor-signup.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { SetPasswordComponent } from './components/set-password/set-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProductsByDistComponent } from './components/products-by-dist/products-by-dist.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';
import { EmployeeOrdersComponent } from './components/employee-orders/employee-orders.component';
import { CustDashboardComponent } from './components/cust-dashboard/cust-dashboard.component';
import { DistributorConnectionRequestsComponent } from './components/distributor-connection-requests/distributor-connection-requests.component';
import { TestComponent } from './components/test/test.component';
import { EmployeeLoginComponent } from './components/employee-login/employee-login.component';
import { EmployeeSignupComponent } from './components/employee-signup/employee-signup.component';
import { AddToCartComponent } from './components/add-to-cart/add-to-cart.component';
import { EmployeeProfileComponent } from './components/employee-profile/employee-profile.component'; import { FraudReportComponent } from './components/fraud-report/fraud-report.component';

import { ReviewSubmitComponent } from './components/review-submit/review-submit.component';
import { AdminReviewListComponent } from './components/admin-review-list/admin-review-list.component';

import { FraudHistoryComponent } from './components/fraud-history/fraud-history.component';
import { AdminFraudListComponent } from './components/admin-fraud-list/admin-fraud-list.component';
import { AdminReviewHistoryComponent } from './components/admin-review-history/admin-review-history.component';

// import { DashboardComponent } from './components/dashboard/dashboard.component';

// import { InvoiceCreateComponent } from './components/invoice-create/invoice-create.component';
// import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { CashCollectionComponent } from './components/cash-collection/cash-collection.component';
import { CashSummaryComponent } from './components/cash-summary/cash-summary.component';
import { CollectorReportsComponent } from './components/collector-reports/collector-reports.component';
import { PaymentSummaryComponent } from './components/payment-summary/payment-summary.component';
import { CustomerPaymentStatusComponent } from './components/customer-payment-status/customer-payment-status.component';
import { PaymentReportComponent } from './components/payment-report/payment-report.component';
import { PendingPaymentsComponent } from './components/pending-payments/pending-payments.component';
import { PendingHandoversComponent } from './components/pending-handovers/pending-handovers.component';

import { CustomersListComponent } from './components/customers-list/customers-list.component';
import { DistributorOrdersComponent } from './components/distributor-orders/distributor-orders.component';










const routes: Routes = [
  { path: 'product', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'customer/register', component: CustomerRegisterComponent },
  { path: 'customer/login', component: CustomerLoginComponent },
  { path: 'distributor/create-customer', component: CreateCustomerDistributorComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { role: 'Admin' } },
  { path: 'distributor-dashboard', component: DistributorDashboardComponent, canActivate: [AuthGuard], data: { role: 'Distributor' } },
  { path: 'employee-dashboard', component: EmployeeDashboardComponent, canActivate: [AuthGuard], data: { role: 'Employee' } },
  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  { path: 'main-page', component: MainPageComponent },
  { path: 'distributor-login', component: DistributorLoginComponent },
  { path: 'distributor-signup', component: DistributorSignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  // { path: 'employees', component: EmployeesComponent },
  { path: 'set-password', component: SetPasswordComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'products/:distributorId', component: ProductsByDistComponent },
  { path: 'orders', component: OrderHistoryComponent },
  { path: 'customerOrder', component: CustomerOrdersComponent },
  { path: 'employee-orders', component: EmployeeOrdersComponent },
  { path: 'cust-dash', component: CustDashboardComponent },
  { path: 'connectionrequests', component: DistributorConnectionRequestsComponent },
  { path: 'test', component: TestComponent },
  { path: 'employee-login', component: EmployeeLoginComponent },
  { path: 'employee-signup', component: EmployeeSignupComponent },

  // { path: 'tasks', component: DashboardComponent },
  { path: 'admin-fruad-list', component: AdminFraudListComponent },

  {
    path: 'report-fraud/:targetType/:targetId',
    component: FraudReportComponent
  },
  { path: 'review/:targetType/:targetId', component: ReviewSubmitComponent },
  { path: 'admin/reviews', component: AdminReviewListComponent },
  {
    path: 'admin/fraud-history',
    component: FraudHistoryComponent
  },
  { path: 'admin/review-history', component: AdminReviewHistoryComponent },

  { path: 'add-to-cart', component: AddToCartComponent },
  { path: 'employee-profile', component: EmployeeProfileComponent },
  { path: 'cash-collection', component: CashCollectionComponent },
  { path: 'cash-summary', component: CashSummaryComponent },
  { path: 'collector-reports', component: CollectorReportsComponent },
  { path: 'payment-summary', component: PaymentSummaryComponent },
  { path: 'customer-payment-status', component: CustomerPaymentStatusComponent },


  { path: 'payment-report', component: PaymentReportComponent },
  { path: 'pending-payments', component: PendingPaymentsComponent },
  { path: 'pending-handovers', component: PendingHandoversComponent },



  // { path: 'invoice-create', component: InvoiceCreateComponent },
  // { path: 'invoice-detail/:id', component: InvoiceDetailComponent },
  { path: 'customers', component: CustomersListComponent },
  
  { path: 'distributor-orders', component: DistributorOrdersComponent },
  

  { path: '', redirectTo: 'main-page', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
