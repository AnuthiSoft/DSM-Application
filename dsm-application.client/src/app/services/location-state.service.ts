import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getDistanceInMeters } from '../utils/geo.util';
import { GODOWN } from '../constants/godown';

@Injectable({ providedIn: 'root' })
export class LocationStateService {

  private insideGodown$ = new BehaviorSubject<boolean>(false);

  updateLocation(lat: number, lng: number) {
    const distance = getDistanceInMeters(
      lat,
      lng,
      GODOWN.lat,
      GODOWN.lng
    );

    const inside = distance <= GODOWN.radius;

    console.log(
      inside ? '✅ INSIDE GODOWN' : '❌ OUTSIDE GODOWN',
      'Distance:', Math.round(distance), 'm'
    );

    this.insideGodown$.next(inside);
  }

  isInsideGodown() {
    return this.insideGodown$.asObservable();
  }
}
