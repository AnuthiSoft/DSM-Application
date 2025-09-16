import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
  constructor(public auth: AuthService, private router: Router) {}
  ngOnInit(): void {
  
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  title = 'distributormanagementsystem.client';

   
}
