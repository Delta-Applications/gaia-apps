/* global DUMP */
/* global SettingsHelper */
/* global Notification */
/* global MozActivity */
/* global Service */
/* global IAC_API_WAKEUP_REASON_ENABLED_CHANGED */
/* global IAC_API_WAKEUP_REASON_LOGIN */
/* global IAC_API_WAKEUP_REASON_LOGOUT */
/* global IAC_API_WAKEUP_REASON_STALE_REGISTRATION */
/* global IAC_API_WAKEUP_REASON_LOCKSCREEN_CLOSED */
/* global IAC_API_WAKEUP_REASON_PROCESS_COMMAND */
/* global AntitheftAlarmManager */

'use strict';

const FMD_MAX_REGISTRATION_RETRIES = 5;
const FMD_ENABLE_FAILURE_NOTIFICATION_TAG = 'antitheft.enable-failed';

// Open settings at the findmydevice section
var FMDOpenSettings = function() {
  var activity = new MozActivity({
    name: 'anti-theft',
    data: {

    }
  });
  activity.onerror = function(e) {
    DUMP('There was a problem opening antitheft: ' + e);
  };
};

function FMDNotifications() {}

FMDNotifications.prototype = {

  handleSystemMessageNotification: function(message) {
    console.log("call antitheft :" + message);
    FMDOpenSettings();
    this.closeSystemMessageNotification(message);
  },

  closeSystemMessageNotification: function(msg) {
    Notification.get({
      tag: msg.tag
    }).then(notifs => {
      notifs.forEach(notif => {
        if (notif.tag) {
          // Close notification with the matching tag
          if (notif.tag === msg.tag) {
            notif.close && notif.close();
          }
        } else {
          // If we have notification without a tag, check on the body
          if (notif.body === msg.body) {
            notif.close && notif.close();
          }
        }
      });
    });
  },
};

var FMDNotificationsHandler = new FMDNotifications();

var FMDManager = {
  isAntitheftLoggedIn: false,
  antitheft_registeredHelper: SettingsHelper('antitheft.registered'),
  antitheft_registered: false,
  antitheft_enabledHelper: SettingsHelper('antitheft.enabled'),
  antitheft_enabled: false,
  push_url: 'https://api.kaiostech.com/v3.0',
  app_id: 'kNpFU6NavpPh4e5qnlFz',
  api_push: '/pushsubs/apps/',
  publicKey: base64UrlToUint8Array(
    'BJpjnIyVeRwf4tiHA5GeM-j1IqR7NN8kbqdQPaRD6QWezxvXJwicLRIYNU48JDJt8aH_28RvjUTtXRRqfL0GSZM'),
  REPORT_TIMEOUT: 30000,
  antitheft_userdisabled: false,
  antitheft_userdisabledHelper: SettingsHelper('antitheft.userdisabled'),

  setKidMacKey: function fmd_setKidMacKey(e) {
    try {
      if(typeof e === 'object') {
        this.token_info = {};
        this.token_info.kid = e.kid;
        this.token_info.mac_key = e.mac_key;
      } else if(typeof e === 'string') {
        this.token_info = JSON.parse(e);
      } else {
        this.token_info = null;
      }
    } catch (e) {
      console.error('antitheft set Kid catch');
    }
  },

  handlEnabled: function fdm_handleEnabled(event) {
    if (event.settingValue && this.isAntitheftLoggedIn && !this.antitheft_registered) {
      console.log('antitheft antitheft.enabled then subscribe Push');
      this.subscribePush();
    } else if (!event.settingValue && this.isAntitheftLoggedIn && this.antitheft_registered) {
      this.antitheft_userdisabledHelper.set(true);
      this.antitheft_userdisabled = true;
      this.unsubscribe();
    }
    this.antitheft_enabled = event.settingValue == true ? true : false;
  },

  initSettings: function fdm_initSettings() {
    var allPromise = [];
    allPromise.push(
      new Promise((resolve, reject) => {
        this.antitheft_registeredHelper.get((isRegistered) => {
          this.antitheft_registered = !!isRegistered;
          resolve();
        });
      })
    );
    allPromise.push(
      new Promise((resolve, reject) => {
        this.antitheft_enabledHelper.get((enabled) => {
          this.antitheft_enabled = !!enabled;
          resolve();
        });
      })
    );
    allPromise.push(
      new Promise((resolve, reject) => {
        this.antitheft_userdisabledHelper.get((enabled) => {
          this.antitheft_userdisabled = !!enabled;
          resolve();
        });
      })
    );
    allPromise.push(
      new Promise((resolve, reject) => {
        SettingsHelper('antitheft.apiServerUrl').get((value) => {
          this.push_url = value;
          resolve();
        });
      })
    );

    return Promise.all(allPromise).then(() => {
      return Promise.resolve();
    });
  },

  onDatachange: function fmd_onDatachange(e) {
    if (e.target.data.connected) {
      if (!this.antitheft_userdisabled &&
        !this.antitheft_enabled && this.isAntitheftLoggedIn) {
        console.log('antitheft data connected then subscribe Push');
        this.subscribePush();
      }
    }
  },

  init: function fmd_init() {
    this.initSettings().then(() => {
      // make sure antitheft is registered when network is online
      // Try to register antitheft when not disabled by user
      for (var i = 0; i < navigator.mozMobileConnections.length; i++) {
        navigator.mozMobileConnections[i].addEventListener('datachange', this.onDatachange.bind(this));
      }

      if (navigator.mozWifiManager) {
        navigator.mozWifiManager.addEventListener('wifihasinternet', () => {
          console.log('antitheft wifihasinternet');
          var wifiManager = navigator.mozWifiManager;
          if (wifiManager.connection.status === 'connected' &&
            !this.antitheft_enabled && !this.antitheft_userdisabled &&
            this.isAntitheftLoggedIn) {
            console.log('antitheft wifihasinternet then subscribe Push');
            this.subscribePush();
          }
        });
      }
    });

    window.navigator.mozId.watch({
      wantIssuer: 'kaios-accounts',
      onready: (e) => {},
      onlogin: (e) => {
        this.setKidMacKey(e);
        this.isAntitheftLoggedIn = true;
        AntitheftAlarmManager.appendAlarms();
      },
      onlogout: (e) => {
        this.setKidMacKey();
        AntitheftAlarmManager.checkAndDeleteAlarm(true);
      },
      onerror: (e) => {}
    });

    Service.request('handleSystemMessageNotification',
      'antitheft', FMDNotificationsHandler);

    navigator.mozSettings.addObserver('antitheft.enabled', (event) => {
      // When disable antitheft, we need user password verification.
      // This will cause the settings changed eanbled -> disabled -> eanbled,
      // Until user pass the verification, the final value will set to disabled.
      // Adding time out here to avoid these changes.
      clearTimeout(this.timeoutEnabled);
      this.timeoutEnabled = setTimeout(() => {
        this.handlEnabled(event);
      }, 1000);
    });

    navigator.mozSettings.addObserver('geolocation.enabled', (event) => {
      // invalidate registration so we can report to the server
      // whether tracking is enabled or not, which depends on
      // geolocation
      wakeUpAntitheft(IAC_API_WAKEUP_REASON_STALE_REGISTRATION);
    });

    navigator.mozSettings.addObserver('lockscreen.remote-lock', (event) => {
      // We can not listen to lockscreen-request-unlock, since it can be
      // triggered right after the remote lock screen showing up. This will
      // cause the wrong lock status to server.
      console.log('lockscreen.remote-lock value is ' + event.settingValue[0] + ' ' + event.settingValue[1]);
      if (event.settingValue[0] === '' && event.settingValue[1] === '') {
        // clear the lockscreen lock message
        SettingsHelper('lockscreen.lock-message').set('');
        console.log('Reporting lockscreen unlocked status');
        wakeUpAntitheft(IAC_API_WAKEUP_REASON_LOCKSCREEN_CLOSED);
      }
    });

    window.addEventListener('mozFxAccountsUnsolChromeEvent', (event) => {
      if (!event || !event.detail) {
        return;
      }

      var eventName = event.detail.eventName;
      console.log('antitheft received ' + eventName + ' FxA event in the System app');
      if (eventName === 'onlogin' || eventName === 'onverified') {
        wakeUpAntitheft(IAC_API_WAKEUP_REASON_LOGIN);
        this.isAntitheftLoggedIn = true;
      } else if (eventName === 'onlogout') {
        wakeUpAntitheft(IAC_API_WAKEUP_REASON_LOGOUT);
        this.isAntitheftLoggedIn = false;
        this.unsubscribe();
      }
    });

    navigator.serviceWorker.addEventListener('message', this.swMessageHandler.bind(this));
  },

  swMessageHandler: function fmd_swMessageHandler(event) {
    var message = event.data;
    var reason = message.reason;
    switch (reason) {
      case 'executecommand':
        console.log('antitheft ' + message.command);
        var command;
        try {
          command = JSON.parse(message.command.replace(/[\b\f\n\r\t]/g, ''));
        } catch (e) {
          command = {};
        }
        //Remove push subscription before sending wipe command, no matther the result.
        if(command && command.e) {
          this.removeSubscription().then(() => {
            wakeUpAntitheft(IAC_API_WAKEUP_REASON_PROCESS_COMMAND, command);
          }, () => {
            wakeUpAntitheft(IAC_API_WAKEUP_REASON_PROCESS_COMMAND, command);
          });
        } else {
          wakeUpAntitheft(IAC_API_WAKEUP_REASON_PROCESS_COMMAND, command);
        }
        break;
      case 'pushsubscriptionchange':
        if (this.antitheft_enabled && this.isAntitheftLoggedIn) {
          console.log('pushsubscriptionchange getAndSendSubscription');
          this.getAndSendSubscription();
        }
        break;
      default:
        console.log('antitheft Unknown message from sw ' + JSON.stringify(message));
    }
  },

  resetAntitheftStatus: function fmd_resetAntitheftStatus() {
    this.antitheft_registeredHelper.set(false);
    this.antitheft_registered = false;
    this.antitheft_enabledHelper.set(false);
    this.antitheft_enabled = false;
  },

  enableAntitheftStatus: function fmd_resetAntitheftStatus() {
    this.antitheft_registeredHelper.set(true);
    this.antitheft_registered = true;
    this.antitheft_enabledHelper.set(true);
    this.antitheft_enabled = true;
    this.antitheft_userdisabledHelper.set(false);
    this.antitheft_userdisabled = false;
  },

  getAndSendSubscription: function fmd_getAndSendSubscription() {
    if ('serviceWorker' in navigator) {
      this.subscribe().then((subscription) => {
        if (subscription) {
          console.log('antitheft in getAndSendSubscription', JSON.stringify(subscription));
          this.sendSubscription(subscription).then((result) => {
            console.log('antitheft subscription sent to server, result is ' + JSON.stringify(result));
            // Set enabled status
            this.enableAntitheftStatus();
          }, (error) => {
            this.resetAntitheftStatus();
            console.error('antitheft Sending subscription Error is ' + error);
          });
        } else {
          this.resetAntitheftStatus();
          console.error('antitheft Need to subscribe');
        }
      }).catch((e) => {
        this.resetAntitheftStatus();
        console.error('antitheft get subscription fail');
      });
    }
  },

  subscribePush: function fmd_subscribePush() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').then((registration) => {
        console.log('antitheft service worker registered');
        this.getAndSendSubscription();
      });
    } else {
      console.log('antitheft Service workers aren\'t supported');
    }
  },

  subscribe: function fmd_subscribe() {
    return navigator.serviceWorker.ready
      .then((registration) => {
        return registration.pushManager.subscribe({
          applicationServerKey: this.publicKey,
        });
      });
  },

  unsubscribe: function fmd_unsubscribe() {
    this.resetAntitheftStatus();
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.pushManager.getSubscription();
      }).then((subscription) => {
        return subscription && subscription.unsubscribe()
          .then(() => {
            console.log('antitheft Unsubscribed', subscription.endpoint);
          });
      });
    this.removeSubscription().then(r => {
      console.log('antitheft Push subscription removed');
    });
  },

  reportFactoryReset: function () {
    return new Promise((resolve, reject) => {
      var state = {"wiped_out": 3, "accessibilty": 2};
      var opts = {
        url: this.push_url + '/accounts/me/devices/this/status',
        method: 'PUT',
        params: state,
      };

      var requester = new Requester(this.REPORT_TIMEOUT);
      requester.setHawkCredentials(this.token_info.kid, this.token_info.mac_key);
      requester.send(opts).then((result) => {
        resolve(result);
      }, (error) => {
        // handle error here
        reject(error);
      });
    });
  },

  removeSubscription: function fmd_removeSubscription() {
    return new Promise((resolve, reject) => {
      var opts = {
        url: this.push_url + this.api_push + this.app_id,
        method: 'DELETE'
      };
      console.log('antitheft deleting push from server');
      var requester = new Requester(this.REPORT_TIMEOUT);
      requester.setHawkCredentials(this.token_info.kid, this.token_info.mac_key);
      requester.send(opts).then((result) => {
        resolve(result);
      }, (error) => {
        // handle error here
        console.log('antitheft deleting error ' + JSON.stringify(error));
        reject(error);
      });
    });
  },

  sendSubscription: function fmd_sendSubscription(subscription) {
    return new Promise((resolve, reject) => {
      var format_sub = {};
      format_sub.push_type = 5000;
      format_sub.push_subsc = window.btoa(JSON.stringify(subscription));

      console.log('antitheft btoa subscription is ' + JSON.stringify(format_sub));
      var opts = {
        url: this.push_url + this.api_push + this.app_id,
        method: 'POST',
        params: format_sub
      };
      var requester = new Requester(this.REPORT_TIMEOUT);
      requester.setHawkCredentials(this.token_info.kid, this.token_info.mac_key);
      requester.send(opts).then((result) => {
        resolve(result);
      }, (error) => {
        // handle error here
        console.log('antitheft makeRequest error ' + JSON.stringify(error));
        reject(error);
      });
    });
  }
};

function uint8ArrayToBase64Url(uint8Array, start, end) {
  start = start || 0;
  end = end || uint8Array.byteLength;

  const base64 = self.btoa(
    String.fromCharCode.apply(null, uint8Array.subarray(start, end)));
  return base64
    .replace(/\=/g, '') // eslint-disable-line no-useless-escape
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Converts the URL-safe base64 encoded |base64UrlData| to an Uint8Array buffer.
function base64UrlToUint8Array(base64UrlData) {
  const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
  const base64 = (base64UrlData + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = self.atob(base64);
  const buffer = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

if (typeof window !== 'undefined' && window) {
  window.uint8ArrayToBase64Url = uint8ArrayToBase64Url;
  window.base64UrlToUint8Array = base64UrlToUint8Array;
}

FMDManager.init();
