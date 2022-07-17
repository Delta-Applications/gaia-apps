/* exported FrequencyDialer */
'use strict';

(function(exports) {

  // FrequencyDialer Constructor
  var FrequencyDialer = function() {
    this.currentFreqency = 0.0;
  };

  // Update current frequency dialer UI with current frequency
  FrequencyDialer.prototype.update = function() {
    // Update both frequency and favorite indicate icon if needed
    var favorite = FrequencyManager.checkFrequencyIsFavorite(this.currentFreqency);
    var span = favorite
      ? '<span id="favorite-star-icon" class="favorite-icon"></span>'
      : '<span id="favorite-star-icon" class="favorite-icon hidden"></span>';
    /*[LIO-1508]: FMRadio tuning step is required from 0.1 to 0.05*/
    //FMElementFrequencyDialer.innerHTML = this.currentFreqency.toFixed(1) + span;
    FMElementFrequencyDialer.innerHTML = this.currentFreqency.toFixed(StatusManager.getdecimals()) + span;
    /*[LIO-1508]: modify end */

    // No need update focus while FM Radio disabled
    if (!mozFMRadio.enabled) {
      return;
    }

    // No need update focus while favorite list UI is not shown
    if (StatusManager.status !== StatusManager.STATUS_FAVORITE_SHOWING) {
      return;
    }

    // No need update focus if FocusManager has not loaded yet
    if (typeof FocusManager === 'undefined') {
      return;
    }

    // No need update focus while current frequency dialer UI is focused
    var focusedItem = FocusManager.getCurrentFocusElement();
    if (focusedItem.id === 'frequency') {
      return;
    }

    // No need update focus while current frequency playing is focused
    var focusedFreqency = FrequencyList.getFrequencyByElement(focusedItem);
    if (focusedFreqency === this.currentFreqency) {
      return;
    }

    // Update focus
    FocusManager.update();
  };

  // Update current frequency dialer UI with specified frequency
  FrequencyDialer.prototype.updateFrequency = function(frequency) {
    if (frequency) {
      this.currentFreqency = frequency;
    }

    this.update();
  };

  FrequencyDialer.prototype.getFrequency = function() {
    return this.currentFreqency;
  };

  exports.FrequencyDialer = new FrequencyDialer();
})(window);
