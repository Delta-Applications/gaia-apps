'use strict';
/* global PowerSave, ScreenManager, SettingsListener, Service, soundManager */

(function(exports) {

  function BatteryOverlay() {
    this.powerSave = new PowerSave();
    this.powerSave.start();
  }

  BatteryOverlay.prototype = {
    TOASTER_TIMEOUT: 5000,

    AUTO_SHUTDOWN_LEVEL: 0.00,
    EMPTY_BATTERY_LEVEL: 0.15,
    TIMEOUT: 500,
    SOUNDFILE: 'resources/sounds/Connect_Power_MA.ogg',
    _battery: window.navigator.battery,
    _powersupply: window.navigator.powersupply,
    _notification: null,
    _batteryFullNotification: null,

    checkBatteryDrainage: function bm_checkBatteryDrainage() {
      var battery = this._battery;
      if (!battery) {
        return;
      }
      if (battery.level <= this.AUTO_SHUTDOWN_LEVEL && !battery.charging) {
        // Fire a event to inform sleepMenu perform shutdown.
        window.dispatchEvent(new CustomEvent('batteryshutdown'));
      }
    },

    start: function bm_init() {
      var battery = this._battery;
      var powersupply = this._powersupply;
      if (battery) {
        // When the device is booted, check if the battery is drained. If so,
        // batteryshutdown would be triggered to inform sleepMenu shutdown.
        window.addEventListener('logohidden',
          this.checkBatteryDrainage.bind(this));

        battery.addEventListener('levelchange', this);
        battery.addEventListener('chargingchange', this);
      }

      if (powersupply) {
        powersupply.addEventListener('powersupplystatuschanged', this);
      }
      window.addEventListener('screenchange', this);
      SettingsListener.observe('audio.volume.notification', 1, (value) => {
        this.silent = value === 0;
      }, { forceClose: true });

      this._screenOn = true;
      this._wasEmptyBatteryNotificationDisplayed = false;

      this.displayIfNecessary();
      this.audio = new Audio();
    },

    handleEvent: function bm_handleEvent(evt) {
      var battery = this._battery;

      switch (evt.type) {
        case 'screenchange':
          this._screenOn = evt.detail.screenEnabled;
          this.displayIfNecessary();
          break;

        case 'levelchange':
          if (!battery) {
            return;
          }

          this.checkBatteryDrainage();
          this.displayIfNecessary();

          this.powerSave.onBatteryChange();

          if (this.shouldNotifyBatteryFull()) {
            this._batteryFullNotification = this.showBatteryFullNotification();
          }
          break;
        case 'chargingchange':
          this.powerSave.onBatteryChange();

          // We turn the screen on if needed in order to let
          // the user knows the device is charging

          if (battery && battery.charging) {
            this._wasEmptyBatteryNotificationDisplayed = false;

            if (this.audio && !this.audio.paused) {
              this.audio.pause();
            }
            if (!this.silent) {
              this.audio.src = this.SOUNDFILE;
              this.audio.mozAudioChannelType = 'notification';
              this.audio.play();
              window.setTimeout(() => {
                this.audio.pause();
                this.audio.removeAttribute('src');
                this.audio.load();
              }, this.TIMEOUT);
            }
            if (soundManager.vibrationEnabled) {
              navigator.vibrate(50);
            }
          } else {
            this.checkBatteryDrainage();
            this.displayIfNecessary();
          }
          break;
        case 'powersupplystatuschanged':
          if (!this._screenOn) {
            ScreenManager.turnScreenOn('powersupplystatuschanged');
          }

          this.removeBatteryFullNotification();
          break;
      }
    },

    _shouldWeDisplay: function bm_shouldWeDisplay() {
      var battery = this._battery;
      if (!battery) {
        return false;
      }

      return (!this._wasEmptyBatteryNotificationDisplayed &&
        !battery.charging &&
        battery.level < this.EMPTY_BATTERY_LEVEL &&
        this._screenOn);
    },

    displayIfNecessary: function bm_display() {
      if (!this._shouldWeDisplay()) {
        return;
      }

      Service.request('SystemToaster:show', {
        text: navigator.mozL10n.get('battery-almost-empty-plug-in-your-charger')
      });
    },

    /**
     * Check if the battery is fully charged or not.
     */
    shouldNotifyBatteryFull: function() {
      var battery = this._battery;
      if (!battery) {
        return false;
      }

      var powersupply = this._powersupply;
      if (!powersupply) {
        return false;
      }

      return (battery.level === 1 &&
              powersupply.powerSupplyOnline &&
              this._batteryFullNotification === null);
    },

    /**
     * Display the fully charged notification.
     */
    showBatteryFullNotification: function() {
      var title = navigator.mozL10n.get('battery-full-title') || '';
      var body = navigator.mozL10n.get('battery-full-body') || '';
      var notification = new window.Notification(title, {
        body: body,
        tag: 'batteryFull',
        data: {
          icon: 'full-battery'
        },
        mozbehavior: {
          showOnlyOnce: true
        }
      });

      notification.onclick = function() {
        notification.close();
      };

      return notification;
    },

    /**
     * Remove the battery full notification if it is exists.
     */
    removeBatteryFullNotification: function() {
      if (this._batteryFullNotification !== null) {
        this._batteryFullNotification.close();
        this._batteryFullNotification = null;
      }
    }
  };

  exports.BatteryOverlay = BatteryOverlay;

}(window));
