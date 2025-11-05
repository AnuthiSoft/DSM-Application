import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { DistributorLoginComponent } from './components/distributor-login/distributor-login.component';
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
    ProfileComponent,
    ThemeToggleComponent,
    ProductsByDistComponent,
      OrderHistoryComponent,
      DistributorOrdersComponent,
      CustomerOrdersComponent,
      EmployeeOrdersComponent,
      CustDashboardComponent,
      DistributorConnectionRequestsComponent,
      TestComponent,
      EmployeeLoginComponent,
      EmployeeSignupComponent
   


  ],
  imports: [
    BrowserModule, HttpClientModule,
    AppRoutingModule, FormsModule, ReactiveFormsModule,  BrowserAnimationsModule, ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
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
