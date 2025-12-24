import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { MapInfoWindow } from '@angular/google-maps';
// import { ViewChild } from '@angular/core';


@Component({
  selector: 'app-employee-tracking',
  templateUrl: './employee-tracking.component.html',
  styleUrls: ['./employee-tracking.component.css']
})



export class EmployeeTrackingComponent implements OnInit {

  center: google.maps.LatLngLiteral = { lat: 14.4644, lng: 75.9210 };
  zoom = 13;

  markers: any[] = [];
  polylines: { [empId: string]: google.maps.LatLngLiteral[] } = {};

// // ✅ ADD THIS LINE HERE
//   liveDistances: { [empId: string]: number } = {};
  private liveInterval: any;

  polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#007bff',
    strokeOpacity: 1.0,
    strokeWeight: 4
  };

//   employeeMap: {
//   [empId: string]: { name: string; phone: string }
// } = {};

// selectedEmployee: any = null;

// @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;


  ngOnInit() {
    this.resumeActiveTrips();
}


resumeActiveTrips() {
  this.http
    .get<any[]>("http://192.168.1.21:5164/api/Delivery/realtime-active")
    .subscribe(activeList => {

      if (!activeList || activeList.length === 0) {
        console.log("ℹ No active trips to resume");
        return;
      }

      console.log("🔄 Resuming active trips");

      activeList.forEach(emp => {

        // ✅ SIMPLE MARKER (EmployeeId only)
        this.markers.push({
          position: { lat: emp.lat, lng: emp.lng },
          label: emp.employeeId,
          employeeId: emp.employeeId
        });

        // Restore route
        this.loadRoute(emp.employeeId);
      });

      // Restart live polling
      this.startPolling();
    });
}


  constructor(private http: HttpClient) {}

  // 🔥 START polling (called AFTER any trip is started)
  startPolling() {
  if (this.liveInterval) return;

  this.liveInterval = setInterval(() => {
    this.loadLive();
  }, 5000);

  console.log("🟢 Live polling started");
}



  // 🔴 STOP polling (optional – if no active trips left)
  stopPolling() {
    clearInterval(this.liveInterval);
    this.liveInterval = null;

    this.markers = [];
    this.polylines = {};

    console.log("🔴 Tracking stopped");
  }

//   loadLive() {
//   this.http
//     .get<any[]>("http://192.168.1.21:5164/api/Delivery/realtime-active")
//     .subscribe(list => {

//       list.forEach(emp => {

//         const idx = this.markers.findIndex(
//           m => m.label === emp.employeeId
//         );

//         if (idx === -1) {
//           this.markers.push({
//             position: { lat: emp.lat, lng: emp.lng },
//             label: emp.employeeId
//           });
//         } else {
//           this.markers[idx].position = {
//             lat: emp.lat,
//             lng: emp.lng
//           };
//         }

//         if (!this.polylines[emp.employeeId]) {
//           this.polylines[emp.employeeId] = [];
//         }

//         this.polylines[emp.employeeId].push({
//           lat: emp.lat,
//           lng: emp.lng
//         });
//       });
//     });
// }


// loadLive() {
//   this.http.get<any[]>(
//     "http://192.168.1.21:5164/api/Delivery/realtime-active"
//   ).subscribe(list => {

//     list.forEach(e => {

//       const idx = this.markers.findIndex(m => m.label === e.employeeId);

//       if (idx === -1) {
//         this.markers.push({
//           position: { lat: e.lat, lng: e.lng },
//           label: e.employeeId
//         });
//       } else {
//         this.markers[idx].position = {
//           lat: e.lat,
//           lng: e.lng
//         };
//       }

//       if (!this.polylines[e.employeeId]) {
//         this.polylines[e.employeeId] = [];
//       }

//       this.polylines[e.employeeId].push({
//         lat: e.lat,
//         lng: e.lng
//       });
//     });
//   });
// }


loadLive() {
  this.http.get<any[]>(
    "http://192.168.1.21:5164/api/Delivery/realtime-active"
  ).subscribe(list => {

    // 🔥 Remove markers that stopped tracking
    const activeIds = list.map(e => e.employeeId);
    this.markers = this.markers.filter(m =>
      activeIds.includes(m.employeeId)
    );

    list.forEach(e => {

      const idx = this.markers.findIndex(
        m => m.employeeId === e.employeeId
      );

      if (idx === -1) {
        // ➕ Add marker ONLY when trip is active
        this.markers.push({
          position: { lat: e.lat, lng: e.lng },
          label: e.employeeId,
          employeeId: e.employeeId
        });
      } else {
        // 🔄 Update position
        this.markers[idx].position = {
          lat: e.lat,
          lng: e.lng
        };
      }

      if (!this.polylines[e.employeeId]) {
        this.polylines[e.employeeId] = [];
      }

      this.polylines[e.employeeId].push({
        lat: e.lat,
        lng: e.lng
      });
    });
  });
}



  loadRoute(employeeId: string) {
  this.http
    .get<any[]>(
      `http://192.168.1.21:5164/api/Delivery/session-route/${employeeId}`
    )
    .subscribe(route => {
      if (!route || route.length === 0) return;

      this.polylines[employeeId] = route.map(p => ({
        lat: p.lat,
        lng: p.lng
      }));
    });
}

removeEmployee(employeeId: string) {
  console.log("🛑 Removing employee from map:", employeeId);

  // 🔴 Remove marker
  this.markers = this.markers.filter(
  m => m.employeeId !== employeeId
);

  // this.markers = this.markers.filter(
  //   m => m.label !== employeeId
  // );

  // 🔴 Remove polyline
  delete this.polylines[employeeId];
}

// loadEmployeeDetails(callback?: () => void) {
//   this.http
//     .get<any[]>("http://localhost:5164/api/Employees/map-info")
//     .subscribe(list => {

//       list.forEach(e => {
//         this.employeeMap[e.employeeId] = {
//           name: e.name,
//           phone: e.phoneNumber
//         };
//       });

//       console.log("✅ Employee map loaded", this.employeeMap);

//       if (callback) callback(); // 🔥 KEY LINE
//     });
// }


// loadEmployeeDetails() {
//   this.http
//     .get<any[]>("http://localhost:5164/api/Employees/map-info")
//     .subscribe(list => {
//       list.forEach(e => {
//         // this.employeeMap[e.employeeId] = {
//           name: e.name,
//           phone: e.phoneNumber
//         };
//       });
//     });
// }


// showInfo(marker: any, markerRef: any) {
//   const emp = this.employeeMap[marker.employeeId];
//   if (!emp) return;

//   this.selectedEmployee = {
//     name: emp.name,
//     phone: emp.phone,
//     employeeId: marker.employeeId
//   };

//   // 🔥 THIS IS THE FIX
//   this.infoWindow.open(markerRef);
// }



// hideInfo() {
//   this.infoWindow.close();
// }


  
}

