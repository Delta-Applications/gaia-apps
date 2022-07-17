/* global Service, appWindowManager, DUMP, SettingsListener */
'use strict';

(function(exports) {
  const servicesInfo = [{
    origin: 'app://jioservice.jio.com', // JBS always is the first one
    isJBS: true,
    serviceFrame: null,
    app: null,
    rebootReason: null,
    isLoaded: false
  }, {
    manifestURL:
      'https://api.kai.jiophone.net/v2.0/apps/manifest/ewzspkSrdEYxr6DhBI9B',
    isAOV: true,
    serviceFrame: null,
    app: null,
    isLoaded: null
  }];

  function BackgroundService() {}

  BackgroundService.prototype = {

    /**
     * A reference to the services container.
     * @memberof BackgroundService.prototype
     */
    bgServiceContainer: document.getElementById('background-service'),
    servicesInfo: servicesInfo,
    /**
     * Starts listening to events to show/hide the service.
     * @memberof BackgroundService.prototype
     */
    start: function() {
      this.debug('start');
      window.addEventListener('logohidden', function onLogohidden() {
        window.removeEventListener('logohidden', onLogohidden);
        this.launchApp();
      }.bind(this));
      window.addEventListener('lockmode-change', this);
      window.addEventListener('iac-jiocomms', this);
      window.addEventListener('mozChromeEvent', this);
      window.addEventListener('applicationupdate', this);
      window.addEventListener('applicationuninstall', this);
      window.addEventListener('appcrashed', this);
      SettingsListener.observe('settings.aov.enabled', false, (value) => {
        this.aovEnabled = !!value;
        if (this.aovEnabled) {
          this.launchApp();
        }
      }, { forceClose: true });
    },

    debug: function() {
      DUMP('[BackgroundService]' +
        Array.slice(arguments).concat());
    },
    /**
     * General event handler interface.
     * @memberof BackgroundService.prototype
     */
    handleEvent: function(e) {
      switch(e.type) {
        case 'mozbrowsererror':
        case 'mozbrowserclose':
          this.onError(e.target);
          break;
        case 'mozbrowserloadend':
          this.sendRebootReasonEvent(e.target, true);
          break;
        case 'lockmode-change':
          this.sendLockmodeEvent(e.detail.mode);
          break;
        case 'appcrashed':
          this.sendCrashEvent(e.detail.name);
          break;
        case 'iac-jiocomms':
          this.sendTopMostWindowEvent(e.detail.reason);
          break;
        case 'mozChromeEvent':
          this.saveRebootReasonEvent(e);
          this.sendRebootReasonEvent(e.target);
          break;
        case 'applicationuninstall':
        case 'applicationupdate':
          this.relaunchService(e.detail.application.origin);
          break;
      }
    },

    relaunchService: function(origin) {
      const serviceInfo = servicesInfo.find((serviceInfo) => {
        return serviceInfo.app.origin === origin;
      });
      if (serviceInfo) {
        appWindowManager.kill(origin);
        this.closeService(serviceInfo);
        serviceInfo.app = null;
        this.launchApp();
      }
    },

    getApp: function(index) {
      return new Promise((resolve, reject) => {
        const request = navigator.mozApps.mgmt.getAll();
        request.onsuccess = (event) => {
          const serviceInfo = servicesInfo[index];
          const apps = event.target.result;
          apps.forEach((app) => {
            if ((serviceInfo.origin && app.origin === serviceInfo.origin) ||
              (serviceInfo.manifestURL &&
              app.manifestURL === serviceInfo.manifestURL)) {
              serviceInfo.app = app;
              resolve();
            }
          });
        };

        request.onerror = (event) => {
          reject('Error on getting app!' + event);
        };
      });

    },

    launchApp: function() {
      this.debug('launchApp');
      this.servicesInfo.forEach((serviceInfo, index) => {
        if (serviceInfo.app) {
          this.ensureService(index);
        } else {
          this.getApp(index).then(() => {
            this.ensureService(index);
          });
        }
      });
    },

    /**
     * Ensures the service is loaded.
     * @memberof BackgroundService.prototype
     */
    ensureService: function(index) {
      const serviceInfo = servicesInfo[index];
      const { app } = serviceInfo;
      var origin = app.manifest.origin || app.origin;
      var launchPath = app.manifest.launch_path;
      var manifestURL = app.manifestURL;
      this.debug('ensureService ' +
        serviceInfo.serviceFrame + origin);
      if (serviceInfo.isAOV && !this.aovEnabled) {
        return;
      }
      // Check service iframe is there
      if (serviceInfo.serviceFrame) {
        return;
      }
      // Create the service iframe
      if (!serviceInfo.serviceFrame) {
        serviceInfo.serviceFrame = document.createElement('iframe');
        serviceInfo.serviceFrame.addEventListener('mozbrowsererror', this);
        serviceInfo.serviceFrame.addEventListener('mozbrowserclose', this);
        serviceInfo.serviceFrame.addEventListener('mozbrowserloadend', this);
      }

      serviceInfo.serviceFrame.dataset.frameType = 'widget';
      serviceInfo.serviceFrame.dataset.frameOrigin = origin;

      serviceInfo.serviceFrame.setAttribute('mozbrowser', true);
      serviceInfo.serviceFrame.setAttribute('remote', 'true');
      serviceInfo.serviceFrame.setAttribute('mozapp', manifestURL);

      serviceInfo.serviceFrame.src = origin + launchPath;
      this.bgServiceContainer.appendChild(serviceInfo.serviceFrame);
    },

    closeService: function(serviceInfo) {
      // remove the service iframe
      this.removeEventListener(serviceInfo);
      this.bgServiceContainer.removeChild(serviceInfo.serviceFrame);
      serviceInfo.serviceFrame = null;
    },

    removeEventListener: function(serviceInfo) {
      if (serviceInfo.serviceFrame) {
        serviceInfo.serviceFrame.removeEventListener('mozbrowsererror', this);
        serviceInfo.serviceFrame.removeEventListener('mozbrowserclose', this);
        serviceInfo.serviceFrame.removeEventListener('mozbrowserloadend', this);
      }
    },
    /**
     * Called when the service fires an error event.
     * @memberof BackgroundService.prototype
     */
    onError: function(target) {
      const serviceInfo =
        servicesInfo.find(serviceInfo => serviceInfo.serviceFrame === target);
      this.debug('onError ' + serviceInfo.app.origin);
      if (serviceInfo) {
        this.closeService(serviceInfo);
        // Relaunch if serviceApp is killed by some reason, eg. LMK.
        this.launchApp();
      }
    },

    /**
     * Send lockmode information to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    sendLockmodeEvent: function(mode) {
      // Ignore passmode mode, it's not related to lock/unlock events.
      if (mode === 'passcode') {
        this.lastLockmode = mode;
        return;
      }
      // Ignore the same lockmode if device is already locked/unlocked.
      if (this.lastLockmode === mode) {
        return;
      }

      var isScreenLocked = mode === 'pocket';
      this.lastLockmode = mode;

      var detail = { 'name': 'screenlock-change', 'data': isScreenLocked };
      this.sendPrivateEvent(detail);
    },

    /**
     * Send topMostWindow information to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    sendTopMostWindowEvent: function(reason) {
      if (reason === 'requestTopMostWindow') {
        var url = Service.query('getTopMostWindow').manifestURL;
        var detail = { 'name': 'topMostWindow', 'data': url };
        this.sendPrivateEvent(detail);
      }
    },

    /**
     * Save reboot reason to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    saveRebootReasonEvent: function(event) {
      if (event.detail.type === 'rebootreason') {
        const serviceInfo = servicesInfo.find((serviceInfo) => {
          return serviceInfo.serviceFrame === event.target;
        });
        if (serviceInfo && serviceInfo.isJBS) {
          serviceInfo.rebootReason = event.detail.value;
        }
      }
    },

    /**
     * Send reboot reason to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    sendRebootReasonEvent: function(target, setLoaded) {
      const serviceInfo =
        servicesInfo.find(serviceInfo => serviceInfo.serviceFrame === target);
      if (serviceInfo) {
        if (setLoaded) {
          serviceInfo.isLoaded = true;
        }
        if (serviceInfo.isLoaded && serviceInfo.rebootReason &&
          serviceInfo.isJBS) {
          const detail = {
            'name': 'rebootReason',
            'data': serviceInfo.rebootReason
          };
          this.sendPrivateEvent(detail);
          serviceInfo.rebootReason = null;
        }
      }
    },

    /**
     * Send crash app name to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    sendCrashEvent: function(name) {
      this.sendPrivateEvent({'name': 'appcrashed', 'data': name});
    },

    /**
     * Send private event to background service with IAC.
     * @memberof BackgroundService.prototype
     */
    sendPrivateEvent: function(detail) {
      this.debug('sendPrivateEvent ' + detail.name);
      navigator.mozApps.getSelf().onsuccess = (evt) => {
        var app = evt.target.result;
        var channel = 'jiocomms';
        // Only send iac if background service has manifestURL ready.
        if (servicesInfo[0].app && servicesInfo[0].app.manifestURL) {
          const option = { manifestURLs: servicesInfo[0].app.manifestURL };
          app.connect(channel, option).then((ports) => {
            ports.forEach(function(port) {
              port.postMessage(detail);
            });
          }, (reason) => {
            console.warn('IAC error:', reason);
          });
        }
      };
    }
  };

  exports.BackgroundService = BackgroundService;

}(window));
