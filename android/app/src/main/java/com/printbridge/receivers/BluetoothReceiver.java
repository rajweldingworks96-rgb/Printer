package com.printbridge.receivers;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BluetoothReceiver extends BroadcastReceiver {
    private static final String TAG = "PrintBridge.BluetoothReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (BluetoothDevice.ACTION_FOUND.equals(action)) {
            BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            if (device != null) {
                Log.d(TAG, "Bluetooth Device Found: " + device.getName());
                handleBluetoothDeviceFound(context, device);
            }
        } else if (BluetoothAdapter.ACTION_DISCOVERY_STARTED.equals(action)) {
            Log.d(TAG, "Bluetooth Discovery Started");
            Intent broadcastIntent = new Intent("com.printbridge.BLUETOOTH_DISCOVERY_STARTED");
            context.sendBroadcast(broadcastIntent);
        } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
            Log.d(TAG, "Bluetooth Discovery Finished");
            Intent broadcastIntent = new Intent("com.printbridge.BLUETOOTH_DISCOVERY_FINISHED");
            context.sendBroadcast(broadcastIntent);
        }
    }

    private void handleBluetoothDeviceFound(Context context, BluetoothDevice device) {
        // Notify app about found Bluetooth printer
        Intent broadcastIntent = new Intent("com.printbridge.BLUETOOTH_PRINTER_FOUND");
        broadcastIntent.putExtra("device", device);
        broadcastIntent.putExtra("name", device.getName());
        broadcastIntent.putExtra("address", device.getAddress());
        context.sendBroadcast(broadcastIntent);
    }
}
