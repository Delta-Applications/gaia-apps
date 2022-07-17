/* exported FocusManager */
'use strict';

(function(exports) {

  // StatusManager Constuctor
  function StatusManager() {

  /*[LIO-1508]:FMRadio, tuning step is required from 0.1 to 0.05*/
  this.STEP_CHANGE_WITH_MCC = false;
  this.DEFAULT_SEEK_STEP = 0.05; //the default step
  this.DEFAULT_DECIMALS_COUNT = 2;

  this.CUSTOM_SEEK_STEP  = 0.1; //
  this.CUSTOM_DECIMALS_COUNT = 1;

  this.USE_CUSTOM_STEP_MCC = ['520', '460'];//which countries will use 0.1 step.
  /*[LIO-1508]: add end */

  // Indicate initialized status
  this.status = 1;

  // Update only no valid antenna or airplane is enabled
  this.STATUS_WARNING_SHOWING   = 0;
  // Update only show favorite list UI, even no favorite frequency
  this.STATUS_FAVORITE_SHOWING  = 1;
  // Update only show renaming frequency UI
  this.STATUS_FAVORITE_RENAMING = 2;
  // Update only show stations list UI
  this.STATUS_STATIONS_SCANING  = 3;
  // Update only show stations scanning UI
  this.STATUS_STATIONS_SHOWING  = 4;
  // Update only show FTU dialog
  this.STATUS_DIALOG_FIRST_INIT = 5;

  };

  // Update current status
  StatusManager.prototype.update = function(status) {
    // Update current status if status valid
    if(status === 1 && this.status !== 1
      && typeof FocusManager !== 'undefined') {
      FocusManager.arrow = null;
    }
    switch (status) {
      case this.STATUS_WARNING_SHOWING:
      case this.STATUS_FAVORITE_SHOWING:
      case this.STATUS_FAVORITE_RENAMING:
      case this.STATUS_STATIONS_SCANING:
      case this.STATUS_STATIONS_SHOWING:
      case this.STATUS_DIALOG_FIRST_INIT:
        this.status = status;
        break;
      default:
        break;
    }

    // Update softkeys according to current state
    FMSoftkeyHelper.updateSoftkeys();
    //Update the header title
    FMSoftkeyHelper.updateHeaderTitle();
  };

  /*[LIO-1508]:FMRadio, tuning step is required from 0.1 to 0.05*/
  StatusManager.prototype.getdecimals = function() {
    //dump("fmradio, getdecimals:"+this.use_decimals);
    if(this.use_decimals){
      return this.use_decimals;
    }
    this.getnetworkmcc();
    return this.use_decimals? this.use_decimals : this.DEFAULT_DECIMALS_COUNT;
  };

  StatusManager.prototype.getstep = function() {
    //dump("fmradio, getstep:"+this.use_step);
    if(this.use_step){
      return this.use_step;
    }
    this.getnetworkmcc();
    return this.use_step? this.use_step : this.DEFAULT_SEEK_STEP;
  };

  StatusManager.prototype.getnetworkmcc = function() {
    if(!this.STEP_CHANGE_WITH_MCC){
      this.use_step = this.DEFAULT_SEEK_STEP;
      this.use_decimals = this.DEFAULT_DECIMALS_COUNT;
      return;
    }

   //need two permission: mobileconnection and engmode-extension, otherwise, conns will be null
    const conns = navigator.mozMobileConnections;
    if (!conns) {
      dump("fmradio, getnetworkmcc, conn is null");
      this.use_step = this.DEFAULT_SEEK_STEP;
      this.use_decimals = this.DEFAULT_DECIMALS_COUNT;
      return;
    }

    var networkready = false;
    var customized = false;
    Array.from(conns).some((conn, index) => {
      if (conn && conn.voice && conn.voice.network){
        let mcc = conn.voice.network.mcc;
        dump("fmradio, getnetworkmcc, mcc:"+mcc);
        if(mcc){
          networkready = true;
        }
        if(this.USE_CUSTOM_STEP_MCC.includes(mcc)){
          customized = true;
          return true;
        }
      }
    });
    dump("getnetworkmcc, final customized:"+customized+", networkready:"+networkready);
    if(networkready){
      this.use_decimals = customized? this.CUSTOM_DECIMALS_COUNT : this.DEFAULT_DECIMALS_COUNT;
      this.use_step = customized? this.CUSTOM_SEEK_STEP : this.DEFAULT_SEEK_STEP;
    }
  };
  /*[LIO-1508]: add end */

  exports.StatusManager = new StatusManager();
})(window);
