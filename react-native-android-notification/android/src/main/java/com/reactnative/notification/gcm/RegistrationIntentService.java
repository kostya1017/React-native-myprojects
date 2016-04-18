package com.reactnative.notification.gcm;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;

import java.io.IOException;

/**
 * Created by baebae on 2/25/16.
 */
public class RegistrationIntentService extends IntentService {

    // abbreviated tag name
    private static final String TAG = "RegIntentService";
    private static final String PROJECT_NUMBER = "971542200948";
    public RegistrationIntentService() {
        super(TAG);
    }

    @Override
    protected void onHandleIntent(Intent intent) {
        // Make a call to Instance API
        InstanceID instanceID = InstanceID.getInstance(this);
        try {
            // request token that will be used by the server to send push notifications
            String token = instanceID.getToken(PROJECT_NUMBER, GoogleCloudMessaging.INSTANCE_ID_SCOPE);

            Intent broadcastIntent = new Intent("GCMIDEvent");
            broadcastIntent.putExtra("id", token);
            this.sendBroadcast(broadcastIntent);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
