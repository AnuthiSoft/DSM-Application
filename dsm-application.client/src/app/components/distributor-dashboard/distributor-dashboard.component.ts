import { Component } from '@angular/core';

@Component({
  selector: 'app-distributor-dashboard',
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.css'
})
export class DistributorDashboardComponent {
  activeTab: string = 'product'; // default tab

}
