'use strict';
/* global SettingsHelper, BaseModule */

(function() {
  /**
   * TelephonySettings sets voice privacy and roaming modes based on
   * the users saved settings.
   * @requires SettingsHelper
   * @class TelephonySettings
   */
  function TelephonySettings(core) {
    this.started = false;
    this.connections = Array.slice(core.mobileConnections || []);
  }

  TelephonySettings.SERVICES = [
    'setPreferredNetworkType'
  ];
  TelephonySettings.SETTINGS = [
    'tty.mode.enabled',
    'accessibility.hac_mode',
    'ril.ims.enabled',
    'ril.radio.preferredNetworkType',
    'ril.defaultServiceId.preferredNetworkType',
    'ril.data.defaultServiceId',
    'ril.data.defaultServiceId.iccId',
    'ril.ims.preferredProfile',
    'ril.dsds.ims.enabled',
    'ril.dsds.ims.preferredProfile',
    'ril.rtt.enabled'
  ];

  TelephonySettings.STATES = [
    'hacMode'
  ];

  BaseModule.create(TelephonySettings, {
    name: 'TelephonySettings',
    EVENT_PREFIX: '',
    hacMode: false,
    prefNetworkType: {},
    defaultPrefNetworkType: null,
    defaultServiceId: 0,
    prefSimIccId: null,
    taskScheduler: null,
    /**
     * Initialzes all settings.
     * @memberof TelephonySettings.prototype
     */
    _start: function() {
      this.taskScheduler = this._taskScheduler();
      this.initVoicePrivacy();
      this.initRoaming();
      if (!SIMSlotManager.isMultiSIM() ||
        !Service.query('supportSwitchPrimarysim')) {
        this.initPreferredNetworkType();
      }
    },

    _taskScheduler: function() {
      return {
        _isLocked: false,
        _tasks: [],
        _lock: function() {
          this._isLocked = true;
        },
        _unlock: function() {
          this._isLocked = false;
          this._executeNextTask();
        },
        _executeNextTask: function() {
          if (this._isLocked) {
            return;
          }
          var nextTask = this._tasks.shift();
          if (nextTask) {
            this._lock();
            nextTask.func(nextTask.cardIndex, nextTask.value).then(() => {
              this._unlock();
            }, () => {
              this._unlock();
            });
          }
        },
        enqueue: function(cardIndex, value, func) {
          this._tasks.push({
            cardIndex: cardIndex,
            value: value,
            func: func
          });
          this._executeNextTask();
        }
      };
    },

    '_observe_tty.mode.enabled': function(value) {
      navigator.mozTelephony.ttyMode = value;
    },

    '_observe_accessibility.hac_mode': function(value) {
      this.hacMode = value;
      this.publish('hacchange');
      navigator.mozTelephony.hacMode = value;
    },

    '_observe_ril.radio.preferredNetworkType': function(value) {
      if (!value) {
        this._getDefaultPreferredNetworkTypes().then(defaultValues => {
          this.prefNetworkType = defaultValues;
          this.savePreferredNetworkType();
        });
      } else {
        this.prefNetworkType = value;
        this.savePreferredNetworkType();
      }
    },

    '_observe_ril.defaultServiceId.preferredNetworkType': function(value) {
      this.defaultPrefNetworkType = value;
    },

    '_observe_ril.data.defaultServiceId': function(value) {
      this.defaultServiceId = value;
      this.initDataRoaming();
    },

    '_observe_ril.data.defaultServiceId.iccId': function(value) {
      this.prefSimIccId = value;
      this.savePreferredNetworkType();
    },

    '_observe_ril.ims.enabled': function(value) {
      if (Service.query('supportDualLte')) {
        return;
      }
      var simSlots = SIMSlotManager.getSlots();
      for (var index = 0; index < simSlots.length; index++) {
        if (this.connections[index].imsHandler) {
          this.taskScheduler.enqueue(index, value, (cardIndex, value) => {
            var imsHandler = this.connections[cardIndex].imsHandler;
            console.log('_observe_ril.ims.enabled  cardIndex=' + cardIndex + ' value=' + value);
            return imsHandler.setEnabled(value);
          });
        }
      }
    },

    '_observe_ril.ims.preferredProfile': function(value) {
      if (Service.query('supportDualLte')) {
        return;
      }
      var simSlots = SIMSlotManager.getSlots();
      for (var index = 0; index < simSlots.length; index++) {
        if (this.connections[index].imsHandler) {
          this.taskScheduler.enqueue(index, value, (cardIndex, value) => {
            var imsHandler = this.connections[cardIndex].imsHandler;
            console.log('_observe_ril.ims.preferredProfile  cardIndex=' + cardIndex + ' value=' + value);
            return imsHandler.setPreferredProfile(value);
          });
        }
      }
    },

    '_observe_ril.dsds.ims.enabled': function(values) {
      if (!Service.query('supportDualLte')) {
        return;
      }
      let simSlots = SIMSlotManager.getSlots();
      for (let index = 0; index < simSlots.length; index++) {
        if (this.connections[index].imsHandler) {
          let value = values[index];
          this.taskScheduler.enqueue(index, value, (cardIndex, value) => {
            let imsHandler = this.connections[cardIndex].imsHandler;
            return imsHandler.setEnabled(value);
          });
        }
      }
    },

    '_observe_ril.dsds.ims.preferredProfile': function(values) {
      if (!Service.query('supportDualLte')) {
        return;
      }
      let simSlots = SIMSlotManager.getSlots();
      for (let index = 0; index < simSlots.length; index++) {
        if (this.connections[index].imsHandler) {
          let value = values[index];
          this.taskScheduler.enqueue(index, value, (cardIndex, value) => {
            let imsHandler = this.connections[cardIndex].imsHandler;
            return imsHandler.setPreferredProfile(value);
          });
        }
      }
    },

    '_observe_ril.rtt.enabled': function(value) {
      if (!Service.query('hasRtt')) {
        return;
      }
      var simSlots = SIMSlotManager.getSlots();
      for (var index = 0; index < simSlots.length; index++) {
        if (this.connections[index].imsHandler) {
          this.taskScheduler.enqueue(index, value, (cardIndex, value) => {
            var imsHandler = this.connections[cardIndex].imsHandler;
            return imsHandler.setRttEnabled(!!value);
          });
        }
      }
    },

    savePreferredNetworkType: function() {
      var cardIndex = this.defaultServiceId;
      if (this.prefSimIccId &&
        this.prefSimIccId === navigator.mozMobileConnections[cardIndex].iccId) {
        var preferredNetworkType =
          SettingsHelper('ril.defaultServiceId.preferredNetworkType');
        preferredNetworkType.set(this.prefNetworkType[cardIndex]);
      }
    },
    /**
     * Initializes voice privacy based on user setting.
     */
    initVoicePrivacy: function() {
      var defaultVoicePrivacySettings =
        this.connections.map(function() { return [true, true]; });
      var voicePrivacyHelper =
        SettingsHelper('ril.voicePrivacy.enabled', defaultVoicePrivacySettings);
      voicePrivacyHelper.get(function got_vp(values) {
        this.connections.forEach(function vp_iterator(conn, index) {
          var setReq = conn.setVoicePrivacyMode(values[index]);
          setReq.onerror = function set_vpm_error() {
            if (setReq.error.name === 'RequestNotSupported' ||
                setReq.error.name === 'GenericFailure') {
              console.log('Request not supported.');
            } else {
              console.error('Error setting voice privacy.');
            }
          };
        });
      }.bind(this));
    },

    /**
     * Initializes data roaming based on customzation.
     */
    initDataRoaming: function() {
        let matchInfo = {
            "clientId": "0"
        };
        matchInfo.clientId = this.defaultServiceId;
        console.log('initDataRoaming defaultServiceId = ' + this.defaultServiceId);
        navigator.customization.getValueForCarrier(matchInfo, 'stz.roaming.domestic.enable').then((result) => {
            var dataRoamingCustomized = (result === 'undefined') ? false : result;
            console.log('initDataRoaming read data roaming customized value: ' + dataRoamingCustomized);
            window.navigator.mozSettings.createLock().set({'data.roaming.domestic.customized' : dataRoamingCustomized});

            var data_roaming_key = dataRoamingCustomized
                ? 'data.roaming.domestic_international.enabled'
                : 'ril.data.roaming_enabled';
            var request = window.navigator.mozSettings.createLock().get(data_roaming_key);
            request.onsuccess = function() {
                var value = request.result[data_roaming_key];
                console.log('initDataRoaming read \'' + data_roaming_key + '\' value: ' + value);
                if (value === undefined) {
                    navigator.customization.getValueForCarrier(matchInfo, data_roaming_key).then((result) => {
                        value = (result === 'undefined') ? 0 : result;
                        console.log('initDataRoaming read customization \'' + data_roaming_key + '\' value: ' + value);
                        var set = {};
                        set[data_roaming_key] = value;
                        window.navigator.mozSettings.createLock().set(set);
                        /* FIH: modify for BTS-2830 begin */
                        if (dataRoamingCustomized) {
                            console.log('initDataRoaming set ril.data.roaming.customized_value: ' + value);
                            window.navigator.mozSettings.createLock().set({'ril.data.roaming.customized_value' : value});
                        }
                        /* FIH: modify for BTS-2830 end */
                    });
                }
            };
        });
    },

    /**
     * Initializes roaming based on user setting.
     */
    initRoaming: function() {
      var defaultRoamingPreferences =
        this.connections.map(function() { return 'any'; });
      var roamingPreferenceHelper =
        SettingsHelper('ril.roaming.preference', defaultRoamingPreferences);
      roamingPreferenceHelper.get(function got_rp(values) {
        this.connections.forEach(function rp_iterator(conn, index) {
          var setReq = conn.setRoamingPreference(values[index]);
          setReq.onerror = function set_vpm_error() {
            if (setReq.error.name === 'RequestNotSupported' ||
                setReq.error.name === 'GenericFailure') {
              console.log('Request not supported.');
            } else {
              console.error('Error roaming preference.');
            }
          };
        });
      }.bind(this));
    },
    // cardsState.state:
    // 1. 'newPrefCard' --> set data to other card
    // 2. 'oldCard' --> reboot device and card not change
    // 3. 'recordPrefCard' -->  insert new card and the card is the last card
    //                          that user set mobile data
    // 4. 'noSimCard' --> no sim card in device
    // 5. 'noMobileData' --> the card not set mobile data.
    // 6. 1 & 4 set with allType
    // 7. 2 set with 'ril.radio.preferredNetworkType'
    // 8. 3 set with 'ril.defaultServiceId.preferredNetworkType'
    // 9. 5 set allType;
    setPreferredNetworkType: function(cardsState) {
      this.connections.forEach((conn, index) => {
        this._getDefaultPreferredNetworkType(index).then((allType) => {
          console.log('getPreferredNetworkType ' + allType + ' ' + cardsState[index].state);
          var state = cardsState[index].state;
          if (state === 'newPrefCard' || state === 'noSimCard') {
            this.prefNetworkType[index] = allType;
          } else if (state === 'recordPrefCard') {
            this.prefNetworkType[index] = this.defaultPrefNetworkType || allType;
          } else if (state === 'noMobileData') {
            this.prefNetworkType[index] = allType;
          }
          this._setDefaultPreferredNetworkType(conn, this.prefNetworkType[index]);
          var preferredNetworkTypeHelper =
            SettingsHelper('ril.radio.preferredNetworkType');
          preferredNetworkTypeHelper.set(this.prefNetworkType);
        });
      });
    },

    /**
     * Initialize preferred network type. If the default value is null, we
     * should use the option that makes the device able to connect all supported
     * netwrok types.
     */
    initPreferredNetworkType: function() {
      var preferredNetworkTypeHelper =
        SettingsHelper('ril.radio.preferredNetworkType');
      preferredNetworkTypeHelper.get((values) => {
        this._getDefaultPreferredNetworkTypes().then(defaultValues => {
          if (!values) {
            values = defaultValues;
            preferredNetworkTypeHelper.set(values);
          } else if (typeof values == 'string') {
            // do the migration
            let tempDefault = defaultValues;
            tempDefault[0] = values;
            values = tempDefault;
            preferredNetworkTypeHelper.set(values);
          }
          this.connections.forEach((conn, index) => {
            this._setDefaultPreferredNetworkType(conn, values[index]);
          });
        });
      });
    },

    _isSubSidyLock: function(index) {
      const SUBSIDY_LOCK_SIM_NETWORK = 1;
      if (navigator.subsidyLockManager) {
        return new Promise((resolve) => {
          navigator.subsidyLockManager[index].getSubsidyLockStatus()
            .then((value) => {
            if (value && value.includes(SUBSIDY_LOCK_SIM_NETWORK)) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });
      } else {
        return Promise.resolve(false);
      }
    },

    _setDefaultPreferredNetworkType: function(conn, preferredNetworkType) {
      var doSet = function() {
        var setReq = conn.setPreferredNetworkType(preferredNetworkType);
        setReq.onerror = function set_vpm_error() {
          console.error('Error setting preferred network type: ' +
            preferredNetworkType);
        };
      };
      if (conn.radioState === 'enabled') {
        doSet();
      } else {
        conn.addEventListener('radiostatechange', function onchange() {
          if (conn.radioState === 'enabled') {
            conn.removeEventListener('radiostatechange', onchange);
            doSet();
          }
        });
      }
    },

    /**
     * Returns an array specifying the default preferred network types of all
     * mobile connections.
     */
    _getDefaultPreferredNetworkTypes: function() {
      return new Promise((resolve) => {
        let promises = [];
        this.connections.forEach((conn, index) => {
          promises.push(this._getDefaultPreferredNetworkType(index));
        });
        Promise.all(promises).then(values => {
          resolve(values);
        });
      });
    },

    /**
     * Returns the default preferred network types based on the hardware
     * supported network types.
     */
    _getDefaultPreferredNetworkType: function(index) {
      const conn = navigator.mozMobileConnections[index];
      return new Promise((resolve) => {
        Promise.all([conn.getSupportedNetworkTypes(), this._isSubSidyLock(index)])
          .then((values) => {
          let allTypes = ['lte', 'wcdma', 'tdscdma', 'gsm', 'cdma', 'evdo'];
          if (values[1]) {
            if (values[0].indexOf('lte') > -1) {
              allTypes = ['wcdma', 'tdscdma', 'gsm', 'cdma', 'evdo'];
            } else {
              allTypes = ['gsm', 'cdma', 'evdo'];
            }
          }
          let types = allTypes.filter((type) => {
            return (values[0] && values[0].indexOf(type) !== -1);
          }).join('/');
          resolve(types);
        });
      });
    }
  });

}());
