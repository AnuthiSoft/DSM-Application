package com.example.app;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;


import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.*;

public class LocationService extends Service {

    private FusedLocationProviderClient fusedClient;
    private LocationCallback locationCallback;

    @Override
    public void onCreate() {
        super.onCreate();

        // Log.e("DMS_GPS", "🔥 LocationService onCreate() called");

        fusedClient = LocationServices.getFusedLocationProviderClient(this);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;

                Location location = result.getLastLocation();
                if (location == null) return;

                double lat = location.getLatitude();
                double lng = location.getLongitude();

                Log.d("DMS_GPS", lat + "," + lng);

                // 🔥 DIRECT BACKEND CALL (Option-1)
                LiveLocationApi.send(
                    getApplicationContext(),
                    lat,
                    lng
                );
            }
        };

        startForeground(1, createNotification());
        startLocationUpdates();
}

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(1, createNotification());
        startLocationUpdates();
        return START_STICKY;
    }

    private void startLocationUpdates() {

        if (
                checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)
                        != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            android.util.Log.e("DMS_GPS", "Location permission not granted");
            return;
        }

        LocationRequest request = LocationRequest.create();
        request.setInterval(120000); // 2 minutes
        request.setFastestInterval(60000);
        request.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        fusedClient.requestLocationUpdates(
                request,
                locationCallback,
                Looper.getMainLooper()
        );
    }


    private Notification createNotification() {
        String channelId = "dms_location_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "DMS Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager =
                getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }

        return new NotificationCompat.Builder(this, channelId)
            .setContentTitle("DMS Tracking Active")
            .setContentText("Location tracking is running")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
        if (fusedClient != null && locationCallback != null) {
            fusedClient.removeLocationUpdates(locationCallback);
        }
    }

}
