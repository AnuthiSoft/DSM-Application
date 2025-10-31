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





const routes: Routes = [
    { path: 'product', component: ProductsComponent, canActivate: [AuthGuard] },
     { path: 'customer/register', component: CustomerRegisterComponent },
  { path: 'customer/login', component: CustomerLoginComponent },
  { path: 'distributor/create-customer', component: CreateCustomerDistributorComponent },
   { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { role: 'Admin' } },
  { path: 'distributor-dashboard', component: DistributorDashboardComponent, canActivate: [AuthGuard], data: { role: 'Distributor' } },
  { path: 'employee-dashboard', component: EmployeeDashboardComponent, canActivate: [AuthGuard], data: { role: 'Employee' } },
   {path: 'customer-dashboard', component: CustomerDashboardComponent },
   {path: 'main-page', component: MainPageComponent},
   {path: 'distributor-login', component: DistributorLoginComponent},
   {path: 'distributor-signup', component: DistributorSignupComponent},
  { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'employees', component: EmployeesComponent },
    { path: 'set-password', component: SetPasswordComponent },
      { path: 'profile', component: ProfileComponent },
       { path: 'products/:distributorId', component:ProductsByDistComponent },
        { path: 'orders', component: OrderHistoryComponent },
        { path: 'customerOrder', component:CustomerOrdersComponent},
        { path: 'employee-orders', component: EmployeeOrdersComponent },
          { path: 'cust-dash', component: CustDashboardComponent },
          { path: 'connectionrequests', component:DistributorConnectionRequestsComponent },
          { path: 'test', component:TestComponent },
   
      

  { path: '', redirectTo: 'main-page', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
