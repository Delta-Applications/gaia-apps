'use strict';
/* global ModalDialog */
/* global Service */

(function(exports) {

  // Local reference to mozSettings
  var settings;

  /**
   * Internet Sharing module responsible for checking the availability of
   * internet sharing based on the status of airplane mode.
   * @requires ModalDialog
   * @class InternetSharing
   */
  function InternetSharing() {}

  InternetSharing.prototype = {
    autoTurnoffHandle: null,
    autoTurnoffInterval: 0,
    startTimestamp: 0,
    lastConnectedClients: 0,
    tetheringWifiEnabled: false,
    /**
     * Called whenever there is a setting change in wifi tethering.
     * Validates that we can turn internet sharing on, and saves state to
     * @memberof InternetSharing.prototype
     */
    internetSharingSettingsChangeHanlder: function(evt) {
      this.tetheringWifiEnabled = evt.settingValue;
      this.resetAutoTimeoutHandle();
      if (Service.query('AirplaneMode.isActive') && true === evt.settingValue) {
        var title = 'apmActivated';
        var buttonText = 'ok';
        var message ='noHotspotWhenAPMisOnWifiHotspot';

        Service.request('DialogService:show', {
          header: title,
          content: message,
          ok: buttonText,
          type: 'alert'
        });
        settings.createLock().set({
          'tethering.wifi.enabled': false
        });
      }
    },

    clearAutoTimeoutHandle: function() {
      if (this.autoTurnoffHandle) {
        window.clearTimeout(this.autoTurnoffHandle);
        this.autoTurnoffHandle = null;
      }
    },

    wifiTetheringTimeoutChanged: function(value) {
      this.autoTurnoffInterval = value;
      this.resetAutoTimeoutHandle();
    },

    resetAutoTimeoutHandle: function() {
      this.clearAutoTimeoutHandle();
      if (!this.lastConnectedClients && this.tetheringWifiEnabled &&
        this.autoTurnoffInterval) {
        this.autoTurnoffHandle = window.setTimeout(() => {
          let setObj = {};
          setObj['tethering.wifi.enabled'] = false;
          window.navigator.mozSettings.createLock().set(setObj);
        }, this.autoTurnoffInterval * 1000);
      }
    },

    wifiStationchange: function() {
      let connectedClients = Service.query('Wifi.connectedClients');
      if (this.lastConnectedClients !== connectedClients) {
        this.lastConnectedClients = connectedClients;
        this.resetAutoTimeoutHandle();
      }
    },

    turnOffInternetSharing: function(value) {
      var settings = window.navigator.mozSettings;
      var setObj = {};
      if (!value || SIMSlotManager.noSIMCardOnDevice()) {
        setObj['tethering.wifi.enabled'] = false;
        setObj['tethering.usb.enabled'] = false;
        settings.createLock().set(setObj);
      }
    },

    turnOffInternetSharingByWifi: function(value) {
      var settings = window.navigator.mozSettings;
      var setObj = {};
      if (value || SIMSlotManager.noSIMCardOnDevice()) {
        setObj['tethering.wifi.enabled'] = false;
        setObj['tethering.usb.enabled'] = false;
        settings.createLock().set(setObj);
      }
    },

    turnOffUsbTethering: function() {
      let settings = window.navigator.mozSettings;
      let setObj = {}
      setObj['tethering.usb.enabled'] = false;
      settings.createLock().set(setObj);
    },

    /**
     * Starts the InternetSharing class.
     * @memberof InternetSharing.prototype
     */
    start: function() {
      settings = window.navigator.mozSettings;
      // listen changes after value is restored.
      settings.addObserver('tethering.wifi.enabled',
        this.internetSharingSettingsChangeHanlder.bind(this));
      SettingsListener.observe('ril.data.enabled', false,
        this.turnOffInternetSharing);
      SettingsListener.observe('tethering.wifi.timeout', 0,
        this.wifiTetheringTimeoutChanged.bind(this));

      SettingsListener.observe('wifi.enabled', true,
        this.turnOffInternetSharingByWifi);
      window.addEventListener('wifi-stationchange',
        this.wifiStationchange.bind(this));
      if (!window.navigator.powersupply.powerSupplyOnline ||
        window.navigator.powersupply.powerSupplyType !== 'USB') {
        this.turnOffUsbTethering();
      }
      navigator.usb.onusbstatuschange = (evt) => {
        if (!evt.deviceAttached) {
          this.turnOffUsbTethering();
        }
      };
      settings.createLock().set({
        'tethering.wifi.enabled': false
      });
    }
  };

  exports.InternetSharing = InternetSharing;

}(window));
