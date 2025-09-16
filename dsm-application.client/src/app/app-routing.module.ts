import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

import { AuthGuard } from './guards/auth.guard';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';

import { ProductsComponent } from './components/products/products.component';
import { CustomerRegisterComponent } from './components/customer-register/customer-register.component';
import { CustomerLoginComponent } from './components/customer-login/customer-login.component';
import { CreateCustomerDistributorComponent } from './components/create-customer-distributor/create-customer-distributor.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';



const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
    { path: 'product', component: ProductsComponent, canActivate: [AuthGuard] },
     { path: 'customer/register', component: CustomerRegisterComponent },
  { path: 'customer/login', component: CustomerLoginComponent },
  { path: 'distributor/create-customer', component: CreateCustomerDistributorComponent },
   {path: 'customer-dashboard', component: CustomerDashboardComponent },
    
 

  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
