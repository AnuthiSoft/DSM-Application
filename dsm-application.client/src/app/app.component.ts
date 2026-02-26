import { Component, OnInit } from '@angular/core';
import { ThemeService } from './shared/theme.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LiveLocationService } from './services/live-location.service';
import { LocationStateService } from './services/location-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  title = 'distributormanagementsystem.client';

  private lastInside = true;

  constructor(
    private themeService: ThemeService,
    private locationState: LocationStateService,
    private liveLocation: LiveLocationService,
     private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
     const token = this.auth.getToken();
if (token) {

      const role = this.auth.getRole();

      if (role === 'Admin') {
        this.router.navigate(['/admin-dashboard']);
      }
      else if (role === 'Distributor') {
        this.router.navigate(['/distributor-dashboard']);
      }
      else if (role === 'Employee') {
        this.router.navigate(['/employee-dashboard']);
      }
      else if (role === 'Customer') {
        this.router.navigate(['/customer-dashboard']);
      }

    }

    // 🔥 Listen to inside / outside state
    this.locationState.isInsideGodown().subscribe(isInside => {
      this.lastInside = isInside;
    });

    // 🔥 Android → Angular GPS bridge
    (window as any).onNativeLocation = (lat: number, lng: number) => {
      this.handleGps(lat, lng);
    };
  }



  private handleGps(lat: number, lng: number) {

    // 1️⃣ Update inside / outside state
    this.locationState.updateLocation(lat, lng);

    // 2️⃣ Send ONLY when outside godown
    if (!this.lastInside) {
      this.liveLocation.send(
        localStorage.getItem('EmployeeId')!,
        localStorage.getItem('DistributorId')!,
        lat,
        lng,
        false
      ).subscribe();
    }
  }
}
