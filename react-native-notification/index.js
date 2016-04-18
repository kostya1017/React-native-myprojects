'use strict';

var React = require('react-native');
var { DeviceEventEmitter } = React;

var ReactNativeNotificationModule = require('react-native').NativeModules.ReactNativeNotificationModule;

// Warp the native module so we can do some pre/post processing to have a cleaner API.
var Notification = {
  scheduleLocalNotification: function(attributes = {}) {
    return new Promise(function(resolve, reject) {
      ReactNativeNotificationModule.getApplicationName(function(e) {}, function(applicationName) {
        // Set defaults
        if (!attributes.subject) attributes.subject = applicationName;
        attributes = encodeNativeNotification(attributes);

        ReactNativeNotificationModule.createNotification(attributes.id, attributes, reject, function(notification) {
          resolve(decodeNativeNotification(notification));
        });
      });
    });
  },

  cancelAllLocalNotifications: function() {
    return new Promise(function(resolve, reject) {
      ReactNativeNotificationModule.cancelAllLocalNotifications(reject, resolve);
    });
  },

  addListener: function(listener) {
      DeviceEventEmitter.addListener('jsMoudleReactNativeNotificationClick', listener);

      if (this.module.initialSysNotificationPayload) {
        var event = {
          action: this.module.initialSysNotificationAction,
          payload: JSON.parse(this.module.initialSysNotificationPayload)
        }

        listener(event);
      }
  },
  
  module: ReactNativeNotificationModule
}

module.exports = Notification;

DeviceEventEmitter.addListener('ReactNativeNotificationEventFromNative', function(e) {
  var event = {
    action: e.action,
    payload: JSON.parse(e.payload)
  }

  DeviceEventEmitter.emit('jsMoudleReactNativeNotificationClick', event);
});