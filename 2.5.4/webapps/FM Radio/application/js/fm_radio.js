/* exported FMRadio */
'use strict';

(function(exports) {

  // FMRadio Constructor
  var FMRadio = function() {
    this.KEYNAME_FIRST_INIT = 'is_first_init';

    this.airplaneModeEnabled = false;
    this.deviceWithVolumeHardwareKey = false;
    this.deviceSupportRecorder = false;

    this.previousFMRadioState = false;
    this.previousSpeakerForcedState = false;

    this.enabling = false;
  };

  FMRadio.prototype.init = function() {
    // Archive and determine whether hardware volume key exist
    this.archiveHardwareVolumeKey();

    // Archive and determine whether platform support record
    this.archiveSupportRecorder();

    // Initialize parameter airplaneModeEnabled
    this.airplaneModeEnabled = (AirplaneModeHelper.getStatus() === 'enabled');
    // Add airplane mode state changed listener,
    // re-archive parameter airplaneModeEnabled
    // after airplane mode state changed immediately
    AirplaneModeHelper.addEventListener('statechange', this.onAirplaneModeStateChanged.bind(this));

    // Initialize SpeakerState
    SpeakerState.init();
    // Initialize HeadphoneState
    HeadphoneState.init();
    // Initialize FMSoftkeyHelper
    FMSoftkeyHelper.init();

    // Initialize HistoryFrequency
    HistoryFrequency.init(this.onHistorylistInitialized.bind(this));


    // Redirect FM radio callbacks
    mozFMRadio.onenabled = this.onFMRadioEnabled.bind(this);
    mozFMRadio.ondisabled = this.onFMRadioDisabled.bind(this);
    mozFMRadio.onfrequencychange =
      StationsList.handleFrequencyChanged.bind(StationsList);

    // Add focus changed listener
    // FM radio should play the focused frequency
    window.addEventListener('index-changed', this.onIndexChanged.bind(this));
  };

  FMRadio.prototype.archiveHardwareVolumeKey = function() {
    if (navigator.hasFeature) {
      navigator.hasFeature('device.capability.volume-key').then((hasVolumeKey) => {
        // Archive and determine whether hardware volume key exist,
        // parameter deviceWithVolumeHardwareKey will be used to update 'volume' softkey
        this.deviceWithVolumeHardwareKey = hasVolumeKey;
      });
    }
  };

  FMRadio.prototype.archiveSupportRecorder = function() {
    if (navigator.hasFeature) {
      navigator.hasFeature('device.capability.fm.recorder').then((hasRecord) => {
        // Archive and determine whether platform support record,
        // parameter deviceSupportRecorder will be used to update 'record'
        // softkey
        this.deviceSupportRecorder = hasRecord;
      });
    }
  };

  FMRadio.prototype.onAirplaneModeStateChanged = function() {
    this.airplaneModeEnabled = (AirplaneModeHelper.getStatus() === 'enabled');
    StatusManager.update(StatusManager.STATUS_FAVORITE_SHOWING);
    WarningUI.update();

    if (this.airplaneModeEnabled) {
      this.previousSpeakerForcedState = SpeakerState.state;
      // If airplane mode is enabled, just update warning UI is already OK
      return;
    }

    if (!HeadphoneState.deviceWithValidAntenna) {
      // If current device has no valid antenna,
      // just update warning UI is already OK
      return;
    }

    // Make sure show favorite list UI and frequency dialer UI
    // after airplane mode change to disabled
    FrequencyDialer.updateFrequency();
    FrequencyList.updateFavoriteListUI();

    if (typeof FocusManager !== 'undefined') {
      FocusManager.dismissFocus();
    }
  };

  FMRadio.prototype.onHistorylistInitialized = function() {
    // Initialize FrequencyManager
    FrequencyManager.init(() => {
      // Only if current device has valid antenna,
      // should continue update UI, or just update warning UI is already OK
      if (HeadphoneState.deviceWithValidAntenna) {
        // Update frequency dialer UI
        FrequencyDialer.updateFrequency(HistoryFrequency.getFrequency());
        // Update favorite list UI
        FrequencyList.updateFavoriteListUI();
      }
      this.saveCache();
    });
    WarningUI.update();

    // PERFORMANCE EVENT (5): moz-app-loaded
    // Designates that the app is *completely* loaded and all relevant
    // 'below-the-fold' content exists in the DOM, is marked visible,
    // has its events bound and is ready for user interaction. All
    // required startup background processing should be complete.
    window.performance.mark('fullyLoaded');
    window.dispatchEvent(new CustomEvent('moz-app-loaded'));
  };

  FMRadio.prototype.onFMRadioEnabled = function() {
    // Update UI immediately
    this.updateTurningOnUI(false);
    this.updateDimLightState(false);
    this.enabling = false;

    if (!HeadphoneState.deviceWithValidAntenna) {
      // If FMRadio is enabled, but no valid antenna,
      // disable FMRadio again in case that
      // headphone might be unplugged during FMRadio enabling
      this.disableFMRadio();
      return;
    }

    // Update status to update softkeys
    if (StatusManager.status === StatusManager.STATUS_STATIONS_SHOWING) {
      StatusManager.update();
    } else if (StatusManager.status !== StatusManager.STATUS_DIALOG_FIRST_INIT) {
      StatusManager.update(StatusManager.STATUS_FAVORITE_SHOWING);
    }

    if (typeof FocusManager === 'undefined') {
      // FocusManager must be called firstly here, so lazy load it
      LazyLoader.load('js/focus_manager.js', () => {
        FocusManager.update(true);
        this.showFMRadioFirstInitDialog();
      });
    } else {
      FocusManager.update(true);
      this.showFMRadioFirstInitDialog();
    }
  };

  FMRadio.prototype.onFMRadioDisabled = function() {
    this.updateDimLightState(true);

    // Change speaker state false, make sure speaker state in FMRadio
    // will not impact on the other apps, see bug 14274
    //
    // @fixed move this from disableFMRadio to onFMRadioDisabled to avoid
    // that audio leaks to headphone if forcespeaker is enabled
    SpeakerState.state = false;

    // Hide dialog when fm disabled..
    this.hideFMRadioFirstInitDialog();

    // Update status to update softkeys
    StatusManager.update();
    // when FMRadio is disabled, must remove the eventListener.
    window.removeEventListener('turnOffOnRecording', this.turnOffRadio);
  };

  FMRadio.prototype.onIndexChanged = function(event) {
    var focusedItem = event.detail.focusedItem;

    if (!focusedItem || !focusedItem.classList.contains('focus')) {
      // Invalid focused item
      return;
    }

    if (focusedItem.id === 'frequency') {
      // Just update frequency dialer UI is OK
      FrequencyDialer.updateFrequency();
      return;
    }

    var frequency = FrequencyList.getFrequencyByElement(focusedItem);
    var currentFrequency = FrequencyDialer.getFrequency();

    if (mozFMRadio.enabled && (frequency !== currentFrequency)) {
      // Play the frequency focused currently
      mozFMRadio.setFrequency(frequency);
    }
  };

  FMRadio.prototype.enableFMRadio = function(frequency) {
    if (frequency < mozFMRadio.frequencyLowerBound
      || frequency > mozFMRadio.frequencyUpperBound) {
      frequency = mozFMRadio.frequencyLowerBound;
    }

    if (HeadphoneState.deviceHeadphoneState) {
      // After headphone plugged, no matter device with internal antenna or not
      // set speaker state as previous state
      if (SpeakerState.state !== this.previousSpeakerForcedState) {
        SpeakerState.state = this.previousSpeakerForcedState;
      }
    }
    if (!this.enabling) {
      var request = mozFMRadio.enable(frequency);
      // Request might fail, see bug862672
      request.onerror = () => {
        this.updateTurningOnUI(false);
        this.updateDimLightState(true);
      };
      this.enabling = true;
      this.updateTurningOnUI(true);
    }
  };

  FMRadio.prototype.disableFMRadio = function() {
    if (RecorderControl.state === RecorderControl.RECORDER_STATUS_RECORDING || RecordsStore.isSaving) {
      // when recording or saving records, don't turn off FMRadio.
      window.addEventListener('turnOffOnRecording', this.turnOffRadio);
      if (RecorderControl.state === RecorderControl.RECORDER_STATUS_RECORDING) {
        RecorderControl.stop();
      }
      return;
    }
    this.saveCache();
    this.turnOffRadio();
  };

  FMRadio.prototype.turnOffRadio = function() {
    // Remember previous states
    this.previousSpeakerForcedState = SpeakerState.state;
    mozFMRadio.disable();
  };

  FMRadio.prototype.updateTurningOnUI = function(show) {
    if (show) {
      FMElementTurningStatus.classList.remove('hidden');
    } else {
      FMElementTurningStatus.classList.add('hidden');
    }
  };

  FMRadio.prototype.updateDimLightState = function(state) {
    FMElementFMContainer.classList.toggle('dim', state);
  };

  FMRadio.prototype.saveCache = function() {
    if (navigator.mozAudioChannelManager.headphones ||
        mozFMRadio.antennaAvailable) {
      if (StatusManager.status === StatusManager.STATUS_FAVORITE_SHOWING) {
        FMCache.clear('fm-container');
        let cacheHtml = document.getElementById('fm-container');
        let codeNode = FMCache.cloneAsInertNodeAvoidingCustomElementHorrors(cacheHtml);
        if (!codeNode.classList.contains('dim')) {
          codeNode.classList.add('dim');
        }
        FMCache.saveFromNode('fm-container', codeNode);
      }
    }
  };

  FMRadio.prototype.showFMRadioFirstInitDialog = function() {
    var isFirstInit = window.localStorage.getItem(this.KEYNAME_FIRST_INIT);
    if (!isFirstInit) {
      // Update status to update softkeys
      StatusManager.update(StatusManager.STATUS_DIALOG_FIRST_INIT);
      // Show dialog and set dialog message
      FMSoftkeyHelper.showDialog('scan-stations-msg');
      try {
        window.localStorage.setItem(this.KEYNAME_FIRST_INIT, true);
      } catch (e) {
        console.error('Failed set first init status :'+ e);
      }
    }
  };

  FMRadio.prototype.hideFMRadioFirstInitDialog = function () {
    // Hide dialog
    FMSoftkeyHelper.hideDialog('scan-stations-msg');
    // Update status to update softkeys
    StatusManager.update();
  };

  FMRadio.prototype.showMessage = function(l10nId, option = {}) {
    if (!l10nId) {
      return;
    }

    const options = Object.assign({
      messageL10nId: l10nId,
    }, option) ;

    if (typeof Toaster === 'undefined') {
      LazyLoader.load('shared/js/toaster.js', () => {
        Toaster.showToast(options);
      });
    } else {
      Toaster.showToast(options);
    }
  };

  exports.FMRadio = new FMRadio();
})(window);
