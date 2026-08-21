package com.printbridge.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

public class UsbReceiver extends BroadcastReceiver {
    private static final String TAG = "PrintBridge.UsbReceiver";
    private static final String ACTION_USB_PERMISSION = "com.printbridge.usb.ACTION_USB_PERMISSION";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
            UsbDevice device = (UsbDevice) intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            if (device != null) {
                Log.d(TAG, "USB Device Attached: " + device.getDeviceName());
                handleUsbDeviceAttached(context, device);
            }
        } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
            UsbDevice device = (UsbDevice) intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            if (device != null) {
                Log.d(TAG, "USB Device Detached: " + device.getDeviceName());
                handleUsbDeviceDetached(context, device);
            }
        } else if (ACTION_USB_PERMISSION.equals(action)) {
            UsbDevice device = (UsbDevice) intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            boolean permissionGranted = intent.getBooleanExtra(
                    UsbManager.EXTRA_PERMISSION_GRANTED, false);
            
            if (permissionGranted) {
                Log.d(TAG, "USB Permission Granted for: " + device.getDeviceName());
                handleUsbPermissionGranted(context, device);
            } else {
                Log.w(TAG, "USB Permission Denied for: " + device.getDeviceName());
                handleUsbPermissionDenied(context, device);
            }
        }
    }

    private void handleUsbDeviceAttached(Context context, UsbDevice device) {
        // Notify app that USB printer is available
        Intent broadcastIntent = new Intent("com.printbridge.USB_PRINTER_AVAILABLE");
        broadcastIntent.putExtra("device", device);
        context.sendBroadcast(broadcastIntent);
    }

    private void handleUsbDeviceDetached(Context context, UsbDevice device) {
        // Notify app that USB printer is disconnected
        Intent broadcastIntent = new Intent("com.printbridge.USB_PRINTER_DISCONNECTED");
        broadcastIntent.putExtra("device", device);
        context.sendBroadcast(broadcastIntent);
    }

    private void handleUsbPermissionGranted(Context context, UsbDevice device) {
        Intent broadcastIntent = new Intent("com.printbridge.USB_PERMISSION_GRANTED");
        broadcastIntent.putExtra("device", device);
        context.sendBroadcast(broadcastIntent);
    }

    private void handleUsbPermissionDenied(Context context, UsbDevice device) {
        Intent broadcastIntent = new Intent("com.printbridge.USB_PERMISSION_DENIED");
        broadcastIntent.putExtra("device", device);
        context.sendBroadcast(broadcastIntent);
    }
}
