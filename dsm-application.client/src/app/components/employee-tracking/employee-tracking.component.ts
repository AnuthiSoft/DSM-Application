import { Component } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-employee-tracking',
  templateUrl: './employee-tracking.component.html',
  styleUrls: ['./employee-tracking.component.css']
})
export class EmployeeTrackingComponent {

  // ❌ NO google.maps TYPES ANYWHERE
  center = { lat: 14.4644, lng: 75.9210 };

  polylines: { [empId: string]: any[] } = {};

  polylineOptions: any = {
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 3
  };

}
