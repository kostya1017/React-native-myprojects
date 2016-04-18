package com.reactnative.notification;

import android.os.Bundle;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.app.Activity;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.reactnative.notification.gcm.RegistrationIntentService;

import java.util.ArrayList;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import android.os.Handler;
import android.util.Log;

/**
 * The main React native module.
 *
 * Provides JS accessible API, bridge Java and JavaScript.
 */
public class ReactNativeNotificationModule extends ReactContextBaseJavaModule {
    public Activity mActivity = null;
    public Context mContext = null;
    public NotificationManager mNotificationManager = null;
    private static final int PLAY_SERVICES_RESOLUTION_REQUEST = 9000;

    @Override
    public String getName() {
        return "ReactNativeNotificationModule";
    }

    /**
     * Constructor.
     */
    public ReactNativeNotificationModule(ReactApplicationContext reactContext, Activity activity) {
        super(reactContext);

        this.mContext = reactContext;
        this.mActivity = activity;
        this.mNotificationManager = (NotificationManager) new NotificationManager(reactContext);


    }

    /**
     * React method to create or update a notification.
     */
    @ReactMethod
    public void registerDevice() {
        listenNotificationEvent();
        listenGCMIDEvent();
        listenGCMMessageEvent();
    }

    @ReactMethod
    public void createNotification(
        Integer notificationID,
        ReadableMap notificationAttributes,
        Callback errorCallback,
        Callback successCallback
    ) {
        try {
            NotificationAttributes a = getNotificationAttributesFromReadableMap(notificationAttributes);
            Notification n = mNotificationManager.createOrUpdate(notificationID, a);

            successCallback.invoke(n.getAttributes().asReadableMap());

        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
            Log.e("ReactSystemNotification", "ReactNativeNotificationModule: rCreate Error: " + Log.getStackTraceString(e));
        }
    }



    /**
     * React method to clear all notifications of this app.
     */
    @ReactMethod
    public void cancelAllLocalNotifications(
        Callback errorCallback,
        Callback successCallback
    ) {
        try {
            mNotificationManager.clearAll();
            successCallback.invoke();

        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
            Log.e("ReactSystemNotification", "ReactNativeNotificationModule: rClearAll Error: " + Log.getStackTraceString(e));
        }
    }

    @ReactMethod
    public void getApplicationName(
        Callback errorCallback,
        Callback successCallback
    ) {
        try {
            int stringId = getReactApplicationContext().getApplicationInfo().labelRes;
            successCallback.invoke(getReactApplicationContext().getString(stringId));

        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
            Log.e("ReactSystemNotification", "ReactNativeNotificationModule: rGetApplicationName Error: " + Log.getStackTraceString(e));
        }
    }

    /**
     * Emit JavaScript events.
     */
    private void sendEvent(
        String eventName,
        Object params
    ) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);

    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();

        if (mActivity == null) return constants;
        Intent intent = mActivity.getIntent();
        Bundle extras = intent.getExtras();

        if (extras != null) {
            Integer initialSysNotificationID = extras.getInt("initialSysNotificationId");
            if (initialSysNotificationID != null) {
                constants.put("initialSysNotificationID", initialSysNotificationID);
                constants.put("initialSysNotificationAction", extras.getString("initialSysNotificationAction"));
                constants.put("initialSysNotificationPayload", extras.getString("initialSysNotificationPayload"));
            }
        }

        return constants;
    }

    private NotificationAttributes getNotificationAttributesFromReadableMap(
        ReadableMap readableMap
    ) {
        NotificationAttributes notificationAttributes = new NotificationAttributes();

        notificationAttributes.loadFromReadableMap(readableMap);

        return notificationAttributes;
    }


    /**
     * Check the device to make sure it has the Google Play Services APK. If
     * it doesn't, display a dialog that allows users to download the APK from
     * the Google Play Store or enable it in the device's system settings.
     */
    private boolean checkPlayServices() {
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(mActivity);
        if (resultCode != ConnectionResult.SUCCESS) {
            if (apiAvailability.isUserResolvableError(resultCode)) {
                apiAvailability.getErrorDialog(mActivity, resultCode, PLAY_SERVICES_RESOLUTION_REQUEST)
                        .show();
            } else {
                Log.i("Error", "This device is not supported.");
            }
            return false;
        }
        return true;
    }

    private void startServiceGCMIDReceive() {
        if (checkPlayServices()) {
            // Start IntentService to register this application with GCM.
            Intent intent = new Intent(mActivity, RegistrationIntentService.class);
            mActivity.startService(intent);
        }
    }
    private void listenNotificationEvent() {

        IntentFilter intentFilter = new IntentFilter("NotificationEvent");

        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                Bundle extras = intent.getExtras();

                WritableMap params = Arguments.createMap();
                params.putInt("notificationID", extras.getInt(NotificationEventReceiver.NOTIFICATION_ID));
                params.putString("action", extras.getString(NotificationEventReceiver.ACTION));
                params.putString("payload", extras.getString(NotificationEventReceiver.PAYLOAD));

                sendEvent("ReactNativeNotificationEventFromNative", params);
            }
        }, intentFilter);
    }

    private void listenGCMIDEvent() {
        startServiceGCMIDReceive();
        IntentFilter intentFilter = new IntentFilter("GCMIDEvent");

        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                try {
                    Bundle extras = intent.getExtras();

                    final WritableMap params = Arguments.createMap();
                    params.putString("id", extras.getString("id"));

                    if (getReactApplicationContext().hasActiveCatalystInstance()) {
                        sendEvent("GCMNotificationID", params);
                    } else {
                        new Timer().schedule(new TimerTask() {
                            @Override
                            public void run() {
                                sendEvent("GCMNotificationID", params);
                            }
                        }, 1000);
                    }

                } catch (Exception e) {

                }
            }
        }, intentFilter);

    }

    private void listenGCMMessageEvent() {
        IntentFilter intentFilter = new IntentFilter("GCMMessageEvent");

        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                Bundle extras = intent.getExtras();

                WritableMap params = Arguments.createMap();
                params.putString("message", extras.getString("message"));

                sendEvent("GCMMessageEvent", params);
            }
        }, intentFilter);
    }
}
