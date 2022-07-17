/* exported HeadphoneState */
'use strict';

(function(exports) {


  var HeadphoneState = function() {
    // Indicate current audio channel manager interface
    this.audioChannelManager = null;
    // Indicate whether current device has valid antenna
    this.deviceWithValidAntenna = false;
    // Indicate whether current device has plugged in headphone or not
    this.deviceHeadphoneState = false;
    // Indicate whether current device has internal antenna or not
    this.deviceWithInternalAntenna = false;
  };

  HeadphoneState.prototype.init = function() {
    this.audioChannelManager = navigator.mozAudioChannelManager;
    if (!this.audioChannelManager) {
      return;
    }

    this.deviceWithInternalAntenna = mozFMRadio.antennaAvailable;
    this.updateHeadphoneAndAntennaState();

    this.audioChannelManager.onheadphoneschange = this.onHeadphoneStateChanged.bind(this);
  };

  HeadphoneState.prototype.updateHeadphoneAndAntennaState = function() {
    this.deviceHeadphoneState = this.audioChannelManager.headphones;
    this.deviceWithValidAntenna = this.deviceHeadphoneState || this.deviceWithInternalAntenna;
     if (this.deviceHeadphoneState) {
       let fmContainer = document.getElementById('fm-container');
       fmContainer.classList.remove('hidden');
     }
  };

  HeadphoneState.prototype.onHeadphoneStateChanged = function() {
    this.updateHeadphoneAndAntennaState();

    if (this.deviceHeadphoneState) {
      if (this.deviceWithInternalAntenna) {
        if (!mozFMRadio.enabled && !document.hidden) {
          FMRadio.enableFMRadio(FrequencyDialer.getFrequency());
        }
      }
      // Headphone has plugged
      if (this.deviceWithInternalAntenna) {
        // No matter FMRadio is enabled or not before headphone insert,
        // just changed SpeakerState to false for device with internal antenna
        SpeakerState.state = false;
      } else {
        // Just update UI if device with no internal antenna
        FrequencyDialer.updateFrequency(HistoryFrequency.getFrequency());
        FrequencyList.updateFavoriteListUI();
        StatusManager.update(StatusManager.STATUS_FAVORITE_SHOWING);
      }
    } else {
      // Headphone has unplugged
      if (!this.deviceWithInternalAntenna) {
        // Device with no internal antenna
        // make sure FMRadio show favorite list UI while headphone plugged out
        if (StatusManager.status === StatusManager.STATUS_STATIONS_SHOWING) {
          StationsList.switchToFavoriteListUI();
        } else if (StatusManager.status === StatusManager.STATUS_STATIONS_SCANING) {
          // Abort scanning stations first while scanning stations currently
          StationsList.abortScanStations(true);
        } else if (StatusManager.status === StatusManager.STATUS_FAVORITE_RENAMING) {
          FavoriteEditor.undoRename();
          FavoriteEditor.switchToFrequencyListUI();
        }
      } else if (StatusManager.status === StatusManager.STATUS_STATIONS_SCANING) {
        return;
      }

      // Disable FMRadio no matter device with internal antenna or not
      if (mozFMRadio.enabled) {
        FMRadio.disableFMRadio();
      }
    }

    if (FMSoftkeyHelper.isSoftkeyMenuPanelVisible()) {
      FMSoftkeyHelper.hideSoftkeyMenuPanel();
    }
    WarningUI.update();
  };

  exports.HeadphoneState = new HeadphoneState();
})(window);
