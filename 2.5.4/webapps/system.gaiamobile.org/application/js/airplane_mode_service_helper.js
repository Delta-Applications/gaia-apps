/* global BaseModule */
'use strict';

(function() {
  var AirplaneModeServiceHelper = function() {};
  var hasWifiMode;
  let supportDualLte = Service.query('supportDualLte');
  /**
   * AirplaneModeServiceHelper should be deprecated in the future.
   * We should let each API handler to observe airplane mode
   * status change to turn on/off each API on their own.
   */
  AirplaneModeServiceHelper.SETTINGS = [
    //[BTS-2985][BTS-2987] BDC yuxin removed.begin
    //'ril.ims.enabled',
    //'ril.ims.suspended',
    //[BTS-2985][BTS-2987] BDC yuxin removed.end
    'ril.dsds.ims.enabled',
    'ril.dsds.ims.suspended',
    'ril.data.enabled',
    'ril.data.suspended',
    'bluetooth.enabled',
    'bluetooth.suspended',
    'wifi.enabled',
    'wifi.suspended',
    'nfc.enabled',
    'nfc.suspended'
  ];
  navigator.hasFeature('device.capability.wifi').then(function(enabled) {
    hasWifiMode = enabled;
  });
  BaseModule.create(AirplaneModeServiceHelper, {
    name: 'AirplaneModeServiceHelper',
    '_observe_ril.data.enabled': function(value) {
      if (value) {
        this._unsuspend('ril.data.suspended');
      }
    },
    //[BTS-2985][BTS-2987] BDC yuxin removed.begin
    //'_observe_ril.ims.enabled': function(value) {
    //  if (value) {
    //    this._unsuspend('ril.ims.suspended');
    //  }
    //},
    //[BTS-2985][BTS-2987] BDC yuxin removed.end
    '_observe_ril.dsds.ims.enabled': function(values) {
      let enabled = this._settings['ril.dsds.ims.enabled'];
      let suspended = this._settings['ril.dsds.ims.suspended'];

      // clear the 'suspended' state
      if (typeof suspended !== 'undefined') {
        let obj = [];
        for (let i = 0; i < values.length; i++) {
          if (values[i]) {
            obj[i] = false;
          } else {
            obj[i] = suspended[i];
          }
        }
        let sset = {};
        sset['ril.dsds.ims.suspended'] = obj;
        this.writeSetting(sset);
      }
    },
    '_observe_bluetooth.enabled': function(value) {
      if (value) {
        this._unsuspend('bluetooth.suspended');
      }
    },
    '_observe_wifi.enabled': function(value) {
      if (value) {
        this._unsuspend('wifi.suspended');
      }
    },
    '_observe_nfc.enabled': function(value) {
      if (value) {
        this._unsuspend('nfc.suspended');
      }
    },
    // turn off the mozSetting corresponding to `key'
    // and remember its initial state by storing it in another setting
    _suspend: function(key) {
      this.debug('suspending: ' + key);
      var enabled = this._settings[key + '.enabled'];
      var suspended = this._settings[key + '.suspended'];

      if ('ril.dsds.ims' === key) {
        // remember the state before switching it to false
        let sset = {};
        sset[key + '.suspended'] = enabled;
        this.writeSetting(sset);
        // switch the state to false
        let eset = {};
        eset[key + '.enabled'] = [false, false];
        this.writeSetting(eset);
      } else {
        if (suspended) {
          this.debug('already suspended.');
          return;
        }

        // remember the state before switching it to false
        var sset = {};
        sset[key + '.suspended'] = enabled;
        this.writeSetting(sset);

        // switch the state to false if necessary
        if (enabled) {
          // make sure both BT API and settings key are handled
          if ('bluetooth' === key) {
            window.dispatchEvent(new CustomEvent('request-disable-bluetooth'));
          } else {
            var eset = {};
            eset[key + '.enabled'] = false;
            this.writeSetting(eset);
          }
        }
      }
    },
    // turn on the mozSetting corresponding to `key'
    // if it has been suspended by the airplane mode
    _restore: function(key) {
      this.debug('restoring: ' + key);
      var suspended = this._settings[key + '.suspended'];

      if ('ril.dsds.ims' === key) {
        let enabled = this._settings[key + '.enabled'];
        // clear the 'suspended' state
        let sset = {};
        sset[key + '.suspended'] = [false, false];
        this.writeSetting(sset);
        if (typeof suspended !== 'undefined') {
          // switch the state to true if it was suspended
          let obj = [];
          let isNeedRestore = false;
          for (let i = 0; i < suspended.length; i++) {
            obj[i] = enabled[i];
            if (suspended[i]) {
              obj[i] = true;
              isNeedRestore = true;
            }
          }
          if (isNeedRestore) {
            // Need reset ims preferredProfile for Unisoc platform volte/vowifi
            let settingsLock = window.navigator.mozSettings.createLock();
            let request = settingsLock.get('ril.dsds.ims.preferredProfile');
            request.onsuccess = (() => {
              let result = request.result['ril.dsds.ims.preferredProfile'];
              settingsLock.set({
                'ril.dsds.ims.preferredProfile': result
              });
            });
            let rset = {};
            rset[key + '.enabled'] = obj;
            this.writeSetting(rset);
          }
        }
      } else {
        // clear the 'suspended' state
        var sset = {};
        sset[key + '.suspended'] = false;
        this.writeSetting(sset);

        // switch the state to true if it was suspended
        if (suspended) {
          // make sure both BT API and settings key are handled
          if ('bluetooth' === key) {
            window.dispatchEvent(new CustomEvent('request-enable-bluetooth'));
          } else {
            if ('ril.ims' === key) {
              let settingsLock = window.navigator.mozSettings.createLock();
              let request = settingsLock.get('ril.ims.preferredProfile');
              request.onsuccess = (() => {
                let result = request.result['ril.ims.preferredProfile'];
                settingsLock.set({
                  'ril.ims.preferredProfile': result
                });
              });
            }
            var rset = {};
            rset[key + '.enabled'] = true;
            this.writeSetting(rset);
          }
        }
      }
    },
    _unsuspend: function(settingSuspendedID) {
      this.debug('unsuspending: ' + settingSuspendedID);
      // clear the 'suspended' state
      var sset = {};
      sset[settingSuspendedID] = false;
      this.writeSetting(sset);
    },
    isEnabled: function(key) {
      return this._settings[key + '.enabled'];
    },
    isSuspended: function(key) {
      return this._settings[key + '.suspended'];
    },
    updateStatus: function(value) {
      this.debug('updating status.');
      // FM Radio will be turned off in Gecko, more detailed about why we do
      // this in Gecko instead, please check bug 997064.
      var bluetooth = window.navigator.mozBluetooth;
      var wifiManager = window.navigator.mozWifiManager;
      var nfc = window.navigator.mozNfc;

      this.publish(value ? 'airplanemode-enabled' : 'airplanemode-disabled');

      if (value) {

        // Turn off mobile data:
        // we toggle the mozSettings value here just for the sake of UI,
        // platform RIL disconnects mobile data when
        // 'ril.radio.disabled' is true.
        this._suspend('ril.data');

        // Turn off VoLTE and VoWiFi:
        if (supportDualLte) {
          this._suspend('ril.dsds.ims');
        } else {
          //[BTS-2985][BTS-2987] BDC yuxin modify.begin
          //original code
          //this._suspend('ril.ims');
          var p1 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.enabled');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.enabled']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          var p2 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.preferredProfile');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.preferredProfile']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          var p3 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.data.defaultServiceId');
            req.onsuccess = function () {
              resolve(req.result['ril.data.defaultServiceId']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          var p4 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.dealling.airplaneMode.temp');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.dealling.airplaneMode.temp']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          Promise.all([p1, p2, p3, p4]).then(function(values) {
            var imsEnabled = values[0];
            var imsProfile = values[1];
            var serviceId = values[2];
            var imsdDealling = values[3];
            console.log('AirplaneModeServiceHelper Turn on airplane imsEnabled='+imsEnabled + " imsProfile="+imsProfile + ' serviceId=' + serviceId + ' imsdDealling='+imsdDealling);
            if (imsdDealling === 'airplane on') {
              return;
            }
            window.navigator.mozSettings.createLock().set({'ril.ims.dealling.airplaneMode.temp' : 'airplane on'});
            window.navigator.mozSettings.createLock().set({'ril.ims.enabled.temp' : imsEnabled});
            window.navigator.mozSettings.createLock().set({'ril.ims.preferredProfile.temp' : imsProfile});
            if (imsEnabled) {
              //[LIO-406] BDC yuxin add for [MR][GAMEA][17_0244] Vowifi must be disabled in Airplane mode.begin
              var bDisabledVowifi = false;
              if (serviceId !== undefined && serviceId >= 0) {
                 var conn = window.navigator.mozMobileConnections[serviceId];
                 if (conn.iccId){
                   var icc = window.navigator.mozIccManager.getIccById(conn.iccId);
                   if (icc && icc.iccInfo && icc.iccInfo.mcc) {
                     var mccmnc = icc.iccInfo.mcc + icc.iccInfo.mnc;
                     if (icc.iccInfo.mcc === '420') {
                       bDisabledVowifi = true;
                     } else if (mccmnc === '42402') {
                       bDisabledVowifi = true;
                     }
                   }
                 }
              }
              console.log('AirplaneModeServiceHelper Turn on airplane bDisabledVowifi='+bDisabledVowifi);
              if (bDisabledVowifi) {
                window.navigator.mozSettings.createLock().set({'ril.ims.enabled' : false});
              //[LIO-406] BDC yuxin add for [MR][GAMEA][17_0244] Vowifi must be disabled in Airplane mode.end
              } else if (imsProfile === 'cellular-preferred' || imsProfile === 'wifi-preferred') {
                window.navigator.mozSettings.createLock().set({'ril.ims.preferredProfile' : 'wifi-only'});
              } else if (imsProfile === 'cellular-only') {
                window.navigator.mozSettings.createLock().set({'ril.ims.enabled' : false});
              }
            }
          });
          //[BTS-2985][BTS-2987] BDC yuxin modify.end
        }

        // Turn off Bluetooth.
        if (bluetooth) {
          this._suspend('bluetooth');
        }

        // Turn off Wifi and Wifi tethering.
        if (wifiManager || !hasWifiMode) {
          this._suspend('wifi');
          this.writeSetting({
            'tethering.wifi.enabled': false
          });
        }

        // Turn off NFC
        if (nfc) {
          this._suspend('nfc');
        }
      } else {
        // Note that we don't restore Wifi tethering when leaving airplane mode
        // because Wifi tethering can't be switched on before data connection is
        // established.

        // Don't attempt to turn on mobile data if it's already on
        if (!this._settings['ril.data.enabled']) {
          this._restore('ril.data');
        }

        if (supportDualLte) {
          this._restore('ril.dsds.ims');
        } else {
          // Don't attempt to turn on ims if it's already on
          //[BTS-2985][BTS-2987] BDC yuxin modify.begin
          //original code
          //if (!this._settings['ril.ims.enabled']) {
          //  this._restore('ril.ims');
          //}

          var p1 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.enabled.temp');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.enabled.temp']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          var p2 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.preferredProfile.temp');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.preferredProfile.temp']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          var p3 = new Promise(function (resolve, reject) {
            var req = window.navigator.mozSettings.createLock().get('ril.ims.dealling.airplaneMode.temp');
            req.onsuccess = function () {
              resolve(req.result['ril.ims.dealling.airplaneMode.temp']);
            };
            req.onerror = function () {
              resolve(false);
            };
          });
          Promise.all([p1, p2, p3]).then(function(values) {
            var imsEnabledTemp = values[0];
            var imsProfileTemp = values[1];
            var imsdDealling = values[2];
            console.log('AirplaneModeServiceHelper Turn off airplane imsEnabledTemp='+imsEnabledTemp + " imsProfileTemp="+imsProfileTemp +' imsdDealling='+imsdDealling);
            if (imsdDealling === 'airplane off') {
              return;
            }
            window.navigator.mozSettings.createLock().set({'ril.ims.dealling.airplaneMode.temp' : 'airplane off'});
            if (imsEnabledTemp !== undefined) {
              window.navigator.mozSettings.createLock().set({'ril.ims.enabled' : imsEnabledTemp});
              window.navigator.mozSettings.createLock().set({'ril.ims.preferredProfile' : imsProfileTemp});
            }
          });
          //[BTS-2985][BTS-2987] BDC yuxin modify.end
        }

        // Don't attempt to turn on Bluetooth if it's already on
        if (bluetooth && !this._settings['bluetooth.enabled']) {
          this._restore('bluetooth');
        }

        // Don't attempt to turn on Wifi if it's already on
        if (!hasWifiMode || (wifiManager && !this._settings['wifi.enabled'])) {
          this._restore('wifi');
        }

        // Don't attempt to turn on NFC if it's already on
        if (nfc && !this._settings['nfc.enabled']) {
          this._restore('nfc');
        }
      }
    }
  });
}());
