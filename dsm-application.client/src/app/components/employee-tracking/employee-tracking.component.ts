import { Component, OnInit,OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
// import { MapInfoWindow } from '@angular/google-maps';
// import { ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators'; // 👈 add at top of file



@Component({
  selector: 'app-employee-tracking',
  templateUrl: './employee-tracking.component.html',
  styleUrls: ['./employee-tracking.component.css']
})



// export class EmployeeTrackingComponent implements OnInit {
export class EmployeeTrackingComponent implements OnInit, OnDestroy {

  center: google.maps.LatLngLiteral = { lat: 14.4644, lng: 75.9210 };
  zoom = 13;
 
  //markers: any[] = [];
  markers: {
  position: google.maps.LatLngLiteral;
  label: string;
  employeeId: string;
}[] = [];
  polylines: { [empId: string]: google.maps.LatLngLiteral[] } = {};
  employeeStatus: { [empId: string]: string } = {}; // ✅ ADD

  private liveTimer: any = null;   // ✅ ADD

// // ✅ ADD THIS LINE HERE
  liveDistances: { [empId: string]: number } = {};
  // private liveInterval: any;

  polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#007bff',
    strokeOpacity: 1.0,
    strokeWeight: 3
  };
 
//   employeeMap: {
//   [empId: string]: { name: string; phone: string }
// } = {};
 
// selectedEmployee: any = null;
 
// @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;


//   ngOnInit() {
//     this.resumeActiveTrips();
// }


ngOnInit() {

  //this.loadLiveData();
  this.startLiveSync();
// Load old routes on startup
//this.loadExistingRoutes();

  // setInterval(() => {
  //   this.loadLiveData();
  // }, 5000); // every 5 sec

}


// resumeActiveTrips() {
//   this.http
//     .get<any[]>("http://192.168.1.21:5164/api/Delivery/realtime-active")
//     .subscribe(activeList => {

//       if (!activeList || activeList.length === 0) {
//         console.log("ℹ No active trips to resume");
//         return;
//       }

//       console.log("🔄 Resuming active trips");

//       activeList.forEach(emp => {

//         // ✅ SIMPLE MARKER (EmployeeId only)
//         this.markers.push({
//           position: { lat: emp.lat, lng: emp.lng },
//           label: emp.employeeId,
//           employeeId: emp.employeeId
//         });

//         // Restore route
//         this.loadRoute(emp.employeeId);
//       });

//       // Restart live polling
//       this.startPolling();
//     });
// }


  // constructor(private http: HttpClient) {}
  constructor(
  private http: HttpClient,
  private cdr: ChangeDetectorRef
) {}
 
  // 🔥 START polling (called AFTER any trip is started)
//   startPolling() {
//   if (this.liveInterval) return;

//   this.liveInterval = setInterval(() => {
//     this.loadLive();
//   }, 5000);

//   console.log("🟢 Live polling started");
// }



  // 🔴 STOP polling (optional – if no active trips left)
  // stopPolling() {
  //   clearInterval(this.liveInterval);
  //   this.liveInterval = null;

  //   this.markers = [];
  //   this.polylines = {};

  //   console.log("🔴 Tracking stopped");
  // }

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


// loadLive() {
//   this.http.get<any[]>(
//     "http://192.168.1.21:5164/api/Delivery/realtime-active"
//   ).subscribe(list => {

//     // 🔥 Remove markers that stopped tracking
//     const activeIds = list.map(e => e.employeeId);
//     this.markers = this.markers.filter(m =>
//       activeIds.includes(m.employeeId)
//     );

//     list.forEach(e => {

//       const idx = this.markers.findIndex(
//         m => m.employeeId === e.employeeId
//       );

//       if (idx === -1) {
//         // ➕ Add marker ONLY when trip is active
//         this.markers.push({
//           position: { lat: e.lat, lng: e.lng },
//           label: e.employeeId,
//           employeeId: e.employeeId
//         });
//       } else {
//         // 🔄 Update position
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

// loadLiveData() {

//   // this.http.get<any[]>(
//   //   'http://192.168.1.15:5164/api/Delivery/realtime-active'
//   // )
//   this.http.get<any[]>(
//   // `${environment.apiUrl}/Delivery/realtime-active`
//   `${environment.apiUrl}/live-location/active`
// ).subscribe(data => {

//     console.log("📍 Live Data:", data);

//     this.updateMap(data);

//   }, err => {
//     console.error("❌ API Error", err);
//   });

// }




loadLiveData() {

  // this.http.get<any[]>(
  //   `${environment.apiUrl}/live-location/active`
  // )
  // .pipe(
  //   filter(res => Array.isArray(res))
  // )
  const distributorId = localStorage.getItem('distributorId');

this.http.get<any[]>(
  `${environment.apiUrl}/livelocation/active/${distributorId}`
)
  .subscribe({
    next: (data) => {

      console.log("📍 Live Data:", data);

      this.updateMap(data);

    },
    error: (err) => {
      console.error("❌ API Error", err);
    }
  });

}

  loadRoute(employeeId: string) {
  this.http
    .get<any[]>(
      // `${environment.apiUrl}/Delivery/session-route/${employeeId}`
      `${environment.apiUrl}/livelocation/route/${employeeId}`
      // `http://192.168.1.21:5164/api/Delivery/session-route/${employeeId}`
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

// ==============================
// 🔥 CALLED BY DASHBOARD ONLY
// ==============================
updateMap(liveEmployees: any[]) {


  // Remove employees who stopped tracking
const activeIds = liveEmployees.map(e => e.employeeId);

this.markers = this.markers.filter(m =>
  activeIds.includes(m.employeeId)
);

Object.keys(this.polylines).forEach(id => {
  if (!activeIds.includes(id)) {
    delete this.polylines[id];
  }
});
  
  // Clear everything first
  // this.markers = [];
  // this.employeeStatus = {};
  //this.polylines = {};

  if (!liveEmployees || liveEmployees.length === 0) {
    return;
  }

  liveEmployees.forEach(emp => {
    // ⚠️ match backend casing
    // const lat = emp.lat ?? emp.Lat;
    // const lng = emp.lng ?? emp.Lng;

    const lat = emp.lat ?? emp.Lat;
    const lng = emp.lng ?? emp.Lng ?? emp.long;

    // if (!lat || !lng) return;
    if (lat == null || lng == null) return;
// =============== MARKER ==============
    // this.markers.push({
    //   position: { lat, lng },
    //   label: emp.employeeId,
    //   employeeId: emp.employeeId
    // });

    const idx = this.markers.findIndex(
  m => m.employeeId === emp.employeeId
);

  if (idx === -1) {

  // New employee → add marker
  this.markers.push({
    position: { lat, lng },
    label: emp.employeeId,
    employeeId: emp.employeeId
  });

  // 🔥 Load full route once
  this.loadRoute(emp.employeeId);

} else {

  // Existing → move marker
  this.markers[idx].position = { lat, lng };

}
// Auto-center on first marker
// 🔥 Always center on latest employee position
// Auto-center only first time
if (this.markers.length === 1) {
  this.center = { lat, lng };
  this.zoom = 15;
}
    // ================= POLYLINE =================

// if (!this.polylines[emp.employeeId]) {
//   this.polylines[emp.employeeId] = [];
// }

// const path = this.polylines[emp.employeeId];

// if (path.length === 0) {

//   path.push({ lat, lng });

// } else {

//   const last = path[path.length - 1];

//   if (last.lat !== lat || last.lng !== lng) {
//     path.push({ lat, lng });
//   }

// }

if (!this.polylines[emp.employeeId]) {
  this.polylines[emp.employeeId] = [];
}

const path = this.polylines[emp.employeeId];

const last = path[path.length - 1];

if (!last || last.lat !== lat || last.lng !== lng) {
  path.push({ lat, lng });
}

// =============== STATUS ==============

if (emp.time) {

  const last = new Date(emp.time).getTime();
  const diff = Date.now() - last;

  let status = "🔴 Offline";

  if (diff < 2 * 60 * 1000) {
    status = "🟢 Online";
  }
  else if (diff < 10 * 60 * 1000) {
    status = "🟡 Idle";
  }

  this.employeeStatus[emp.employeeId] = status;
}

    // optional route restore
    // this.loadRoute(emp.employeeId);
  });

  // Force UI refresh
this.cdr.detectChanges();
// Force map refresh
this.center = { ...this.center };
}

// addTestMarker(){

//   this.updateMap([
//     {
//       employeeId: 'EMP01',
//       lat: 14.4644,
//       lng: 75.9210,
//       time: new Date()
//     }
//   ]);

// }
  
startLiveSync() {

  if (this.liveTimer) return; // already running

  this.loadLiveData(); // first call

  this.liveTimer = setInterval(() => {
    this.loadLiveData();
  }, 5000);

  console.log("🟢 Live sync started");
}

stopLiveSync() {

  if (this.liveTimer) {
    clearInterval(this.liveTimer);
    this.liveTimer = null;
  }

  console.log("🔴 Live sync stopped");
}

ngOnDestroy() {

  this.stopLiveSync();

}

loadExistingRoutes() {

  // this.http.get<any[]>(
    // `${environment.apiUrl}/Delivery/realtime-active`
  //   `${environment.apiUrl}/live-location/active`
  // )
  
  const distributorId = localStorage.getItem('distributorId');

    // this.http.get<any[]>(
    //   `${environment.apiUrl}/live-location/active/${distributorId}`
    // )
    this.http.get<any[]>(
      `${environment.apiUrl}/livelocation/active/${distributorId}`
    ).subscribe(list => {

    list.forEach(emp => {

      if (emp.employeeId) {
        this.loadRoute(emp.employeeId);
      }

    });

  });

}
trackByEmp(index: number, item: any) {
  return item.employeeId;
}
}
 
 
 