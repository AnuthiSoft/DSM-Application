import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{

 role: string | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getRole();
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}
