package com.example.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;



public class LiveLocationApi {

    public static void send(Context context, double lat, double lng) {
        new Thread(() -> {
            try {
                // ✅ REAL BACKEND URL
                 //URL url = new URL("https://dms-abaydbbff8hmagec.southindia-01.azurewebsites.net/api/live-location");
                URL url = new URL("http://192.168.1.15:5164/api/live-location");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");

                // ✅ AUTH TOKEN
                String token = context
                    .getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                    .getString("token", "");

                //conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);

                
                SharedPreferences prefs =
                context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

            String empId = prefs.getString("EmployeeId", "NULL");
            String distId = prefs.getString("DistributorId", "NULL");

            Log.d("DMS_GPS", "Sending Location → EmpId=" + empId + ", DistId=" + distId);


                JSONObject body = new JSONObject();
                body.put("employeeId",
                    context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                        .getString("EmployeeId", "")
                );
                body.put("distributorId",
                    context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                        .getString("DistributorId", "")
                );
                body.put("lat", lat);
                body.put("lng", lng);

                OutputStream os = conn.getOutputStream();
                // os.write(body.toString().getBytes());
                os.write(body.toString().getBytes("UTF-8"));
                os.close();

                // int code = conn.getResponseCode();
                // Log.d("DMS_GPS", "Location sent. HTTP = " + code);

                int code = conn.getResponseCode();
                Log.d("DMS_GPS", "Location sent. HTTP = " + code);

                if (code == 200) {
                    InputStream is = conn.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                    StringBuilder sb = new StringBuilder();
                    String line;

                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }

                    reader.close();
                    Log.d("DMS_GPS", "Server response: " + sb.toString());
                }


                conn.disconnect();

            } catch (Exception e) {
                // ✅ THIS IS ALREADY PERFECT
                Log.e("DMS_GPS", "Failed to send location", e);
            }
        }).start();
    }
}
