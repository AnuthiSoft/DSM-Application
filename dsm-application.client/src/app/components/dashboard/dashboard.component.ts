import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{

 role: string | null = null;
router=inject(Router)
  constructor(private auth: AuthService,private customerService: CustomerService) {}

  ngOnInit(): void {
    // this.role = this.auth.getRole();
    this.role = this.customerService.getRole();
  }

  go(){
    this.router.navigateByUrl("product")
  }
  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}
