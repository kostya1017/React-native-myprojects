'use strict';

var React = require('react-native');
var { DeviceEventEmitter } = React;

var ReactNativeNotificationModule = require('react-native').NativeModules.ReactNativeNotificationModule;

// Warp the native module so we can do some pre/post processing to have a cleaner API.
var Notification = {
  registerCallback :null,
  notificationCallback: null,

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

  registerDevice() {
    var component = this;
    DeviceEventEmitter.addListener('GCMNotificationID', function(e) {
      if (component.registerCallback) {
        component.registerCallback(e.id);
      }
      console.info("GCMNotificationID: " + e.id)
    });

    DeviceEventEmitter.addListener('GCMMessageEvent', function(e) {
      if (component.notificationCallback) {
        component.notificationCallback(e.message);
      }
      console.info("GCMMessageEvent: " + e.message)
    });

    ReactNativeNotificationModule.registerDevice();
  },

  addEventListener: function(type, callback) {
    if (type == "register") {
      this.registerCallback = callback;
      this.registerDevice();
    } else if (type == 'notification') {
      this.notificationCallback = callback;
    }
  },
  
  module: ReactNativeNotificationModule
}
function encodeNativeNotification(attributes) {
  if (typeof attributes === 'string') attributes = JSON.parse(attributes);
  // Set defaults
  if (!attributes.smallIcon) attributes.smallIcon = 'ic_launcher';
  if (!attributes.id) attributes.id = parseInt(Math.random() * 100000);
  if (!attributes.action) attributes.action = 'DEFAULT';
  if (!attributes.payload) attributes.payload = {};
  if (attributes.autoClear === undefined) attributes.autoClear = true;
  if (attributes.tickerText === undefined) {
    if (attributes.subject) {
      attributes.tickerText = attributes.subject + ': ' + attributes.message;
    } else {
      attributes.tickerText = attributes.message;
    }
  }

  if (attributes.priority === undefined) attributes.priority = 1;
  if (attributes.sound === undefined) attributes.sound = 'default';
  if (attributes.vibrate === undefined) attributes.vibrate = 'default';
  if (attributes.lights === undefined) attributes.lights = 'default';

  attributes.delayed = (attributes.delay !== undefined);
  attributes.scheduled = (attributes.sendAt !== undefined);

  // Ensure date are Dates
  if (attributes.sendAt && typeof attributes.sendAt !== 'object') attributes.sendAt = new Date(attributes.sendAt);
  if (attributes.endAt && typeof attributes.endAt !== 'object') attributes.endAt = new Date(attributes.endAt);
  if (attributes.when && typeof attributes.when !== 'object') attributes.when = new Date(attributes.when);

  // Unfold sendAt
  if (attributes.sendAt !== undefined) {
    attributes.sendAtYear = attributes.sendAt.getFullYear();
    attributes.sendAtMonth = attributes.sendAt.getMonth() + 1;
    attributes.sendAtDay = attributes.sendAt.getDate();
    attributes.sendAtWeekDay = attributes.sendAt.getDay();
    attributes.sendAtHour = attributes.sendAt.getHours();
    attributes.sendAtMinute = attributes.sendAt.getMinutes();
  }

  // Convert date objects into number
  if (attributes.sendAt) attributes.sendAt = attributes.sendAt.getTime();
  if (attributes.endAt) attributes.endAt = attributes.endAt.getTime();
  if (attributes.when) attributes.when = attributes.when.getTime();

  // Prepare scheduled notifications
  if (attributes.sendAt !== undefined) {

    // Set repeatType for custom repeat time
    if (typeof attributes.repeatEvery === 'number') {
      attributes.repeatType = 'time';
      attributes.repeatTime = attributes.repeatEvery;
    } else if (typeof attributes.repeatEvery === 'string') {
      attributes.repeatType = attributes.repeatEvery;
    }

    // Naitve module only recognizes the endAt attribute, so we need to
    // convert repeatCount to the endAt time base on repeatEvery
    if (attributes.repeatCount) {
      if (typeof attributes.repeatEvery === 'number') {
        attributes.endAt = parseInt(attributes.sendAt + attributes.repeatEvery * attributes.repeatCount + (attributes.repeatEvery / 2));

      } else if (typeof attributes.repeatEvery === 'string') {
        switch (attributes.repeatEvery) {
          case 'minute':
            attributes.endAt = attributes.sendAt + 60000 * attributes.repeatCount + 1000 * 30;
            break;

          case 'hour':
            attributes.endAt = attributes.sendAt + 60000 * 60 * attributes.repeatCount + 60000 * 30;
            break;

          case 'halfDay':
            attributes.endAt = attributes.sendAt + 60000 * 60 * 12 * attributes.repeatCount + 60000 * 60 * 6;
            break;

          case 'day':
            attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * attributes.repeatCount + 60000 * 60 * 12;
            break;

          case 'week':
            attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 7 * attributes.repeatCount + 60000 * 60 * 24 * 3;
            break;

          case 'month':
            attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 30 * attributes.repeatCount + 60000 * 60 * 24 * 15;
            break;

          case 'year':
            attributes.endAt = attributes.sendAt + 60000 * 60 * 24 * 365 * attributes.repeatCount + 60000 * 60 * 24 * 100;
            break;
        }
      }
    }
  }

  // Convert long numbers into string before passing them into native modle,
  // incase of integer overflow
  if (attributes.sendAt) attributes.sendAt = attributes.sendAt.toString();
  if (attributes.endAt) attributes.endAt = attributes.endAt.toString();
  if (attributes.when) attributes.when = attributes.when.toString();
  if (attributes.repeatEvery) attributes.repeatEvery = attributes.repeatEvery.toString();

  // Convert float into integer
  if (attributes.progress) attributes.progress = attributes.progress * 1000;

  // Stringify the payload
  attributes.payload = JSON.stringify(attributes.payload);

  return attributes;
}

// Decode the notification data from the native module to pass into JS
function decodeNativeNotification(attributes) {
  // Convert dates back to date object
  if (attributes.sendAt) attributes.sendAt = new Date(parseInt(attributes.sendAt));
  if (attributes.endAt) attributes.endAt = new Date(parseInt(attributes.endAt));
  if (attributes.when) attributes.when = new Date(parseInt(attributes.when));

  // Parse possible integer
  if (parseInt(attributes.repeatEvery).toString() === attributes.repeatEvery) attributes.repeatEvery = parseInt(attributes.repeatEvery);

  // Convert integer into float
  if (attributes.progress) attributes.progress = attributes.progress / 1000;

  // Parse the payload
  if (attributes.payload) attributes.payload = JSON.parse(attributes.payload);

  return attributes;
}
module.exports = Notification;

DeviceEventEmitter.addListener('ReactNativeNotificationEventFromNative', function(e) {
  var event = {
    action: e.action,
    payload: JSON.parse(e.payload)
  }

  DeviceEventEmitter.emit('jsMoudleReactNativeNotificationClick', event);
});

