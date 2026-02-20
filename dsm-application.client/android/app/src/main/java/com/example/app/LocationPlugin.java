package com.example.app;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LocationService")
public class LocationPlugin extends Plugin {

    @PluginMethod
    public void startTracking(PluginCall call) {
        Log.e("GEOFENCE_DEBUG", "📡 startTracking() called");

        Intent intent = new Intent(getContext(), LocationService.class);
        getContext().startForegroundService(intent);

        call.resolve();
    }

    // @PluginMethod
    // public void setupGeofence(PluginCall call) {

    //     Log.e("GEOFENCE_DEBUG", "🔥 setupGeofence() CALLED from JS");

    //     Double lat = call.getDouble("lat");
    //     Double lng = call.getDouble("lng");
    //     Float radius = call.getFloat("radius", 200f);

    //     if (lat == null || lng == null) {
    //         Log.e("GEOFENCE_DEBUG", "❌ Lat/Lng missing from JS");
    //         call.reject("Latitude or Longitude missing");
    //         return;
    //     }

    //     Log.e(
    //         "GEOFENCE_DEBUG",
    //         "📍 JS sent → lat=" + lat + ", lng=" + lng + ", radius=" + radius
    //     );

    //     GeofenceHelper helper = new GeofenceHelper(getContext());
    //     helper.setupGeofence(getContext(), lat, lng, radius);

    //     call.resolve();
    // }
}
