import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
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
import { DistributorLoginComponent } from './components/distributor-login/distributor-login.component';
import { DistributorSignupComponent } from './components/distributor-signup/distributor-signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { SetPasswordComponent } from './components/set-password/set-password.component';




@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent,
    CustomerRegisterComponent,
    CustomerLoginComponent,
    CreateCustomerDistributorComponent,
    CustomerDashboardComponent,
    AdminDashboardComponent,
    DistributorDashboardComponent,
    EmployeeDashboardComponent,
    MainPageComponent,
    DistributorLoginComponent,
    DistributorSignupComponent,
    ForgotPasswordComponent,
    EmployeesComponent,
    SetPasswordComponent,

  ],
  imports: [
    BrowserModule, HttpClientModule,
    AppRoutingModule,FormsModule, ReactiveFormsModule 
  ],
  providers: [{
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
