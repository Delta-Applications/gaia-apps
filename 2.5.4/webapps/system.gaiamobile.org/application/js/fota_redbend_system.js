'use strict';

var redbendFotaUIEvent = {
  userCheckingFlag: false,
  installDoneConfirm: false,
  isDownloading:false,
  isSessionError: false,
  lastInstallEvent:null,
  lastEngineEvent: null,
  isCritical:false,
  isSilent:false,
  pre_version:null,
  cur_version:null,
  _fotaFlag: 'deviceinfo.product_fota',
  _insRebootFlag: false,
  _screenEnabled: false,
  notification: null,
  isFotaAppLunching: false,
  telephony: window.navigator.mozTelephony,

  debug: function(info) {
    console.log(`fota:system: fota_redbend_system.js: ${info}`);
  },

  checkBattery: function() {
    if (window.navigator.battery.level < 0.3) {
      this._lunchFotaApp('/warning');
      return false;
    }
    return true;
  },

  init: function() {
    this.debug('init');
    navigator.OmaService.command('engine:start', 'system').then((ret) => {
      this.debug('init engine:start');
    });
    navigator.OmaService.command('get:prop', 'ro.fota.sw_ver').then((ver) => {
      let jver = JSON.parse(ver);
      this.cur_version = jver.data;
      this.debug(`get:prop:cur_version = ${this.cur_version}`);
    });
    // Handle event from settings SoftWare Button clicked.
    window.addEventListener('fota_userClicked', (evt)=> {
      this.debug('evt = ' + JSON.stringify(evt.detail));
      this.isSessionError = false;
      this._handleUserUpdateButtonClicked();
    });
    // Handle event from Oma Service.
    window.addEventListener('fota_uiEvent', (evt)=> {
      this._handleEngineEvent(evt);
    });
    // For silent install
    navigator.mozPower.addWakeLockListener((topic, state)=>{
      if (topic === 'screen' || topic === 'DOM_Fullscreen') {
        this._screenEnabled = (state === 'locked-foreground');
      }
      if (!this._screenEnabled) {
        if (this._insRebootFlag) {
          this._handleSilentInstallRebootConfirm();
          return;
        }
        if (this.lastInstallEvent
          && 'B2D_SCOMO_INS_CONFIRM_UI' === this.lastInstallEvent.type) {
          if (this.isCritical) {
            this._handleSilentInstallRebootConfirm();
          }
        }
      }
    });
    // Show install confirm dialog after device boot up 30s.
    window.setTimeout(()=>{
      if (!this.userCheckingFlag) {
        navigator.OmaService.command('query', 'state')
          .then((s_state) => {
            let state = JSON.parse(s_state);
            if (state) {
              if (state.data == 'B2D_SCOMO_INS_CONFIRM_UI'){
                this._handleScomoInsConfirmUI(null);
              }
            }
          });
      }
    }, 30000);
  },

  _handleSilentInstallRebootConfirm: function() {
    if (!this.checkBattery()) {
      return;
    }
    navigator.OmaService.command('query', 'busy')
      .then((busy) => {
        let isbusy = JSON.parse(busy);
        if (!isbusy.data) {
          Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
          this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
          this._onSessionEnd();
        }
      });
  },

  _handleEngineEvent: function(evt) {
    if (evt != null && evt.detail) {
      let uiEventmsg = evt.detail;
      if (uiEventmsg.detail) {
        let sinfo = JSON.stringify(uiEventmsg.detail);
        if (uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT != null) {
          if (uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT == 0) {
            this.isSilent = false;
          } else {
            this.isSilent = true;
          }
        }
      }
      // Any other event reset trigger flag.
      if ('B2D_USER_SESSION_TRIGGERED' !== uiEventmsg.type) {
        this.userCheckingFlag = false;
      }
      this.lastEngineEvent = uiEventmsg;

      switch(uiEventmsg.type) {
        case 'B2D_SCOMO_REBOOT_CONFIRM_REQUEST':
          if (this.isSilent) {
            this._insRebootFlag = true;
            if (!this._screenEnabled) {
              this._handleSilentInstallRebootConfirm();
            }
          } else {
            this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
          }
          break;
        case 'B2D_USER_SESSION_TRIGGERED':
          break;
        // Lunch App To Show Update Info.
        case 'B2D_SCOMO_DL_CONFIRM_UI':
          this._handleScomoDlConfirmUI(uiEventmsg);
          break;

        case 'B2D_SCOMO_DL_PROGRESS':
          this._handleScomoDlProgress(uiEventmsg);
          break;
        // Show install(download completed) dialog.
        case 'B2D_SCOMO_INS_CONFIRM_UI':
          this.lastInstallEvent = uiEventmsg;
          this._handleScomoInsConfirmUI(uiEventmsg);
          break;
        // Lunch App To Show Battery Warning.
        case 'B2D_SCOMO_INS_CHARGE_BATTERY_UI':
          if (!this.isSilent) {
            this._handleScomoInsChargeBatteryUI(uiEventmsg);
          }
          break;
        // Show done dialog.
        case 'B2D_SCOMO_INSTALL_DONE':
          if (!this.isSilent) {
            this._handleScomoInstallDone(uiEventmsg);
          }
          break;

        case 'B2D_SCOMO_NOTIFY_DL_UI':
          if (this.isSilent) {
            this._sendCommandToEngine('D2B_SCOMO_NOTIFY_DL');
            break;
          }
          let title = navigator.mozL10n.get('fota-title-software-update');
          let message = navigator.mozL10n.get('fota-message-software-update-available');
          Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
          this._showNotice(title, message, '/releasenotes', uiEventmsg);
          break;

        case 'B2D_SCOMO_DL_SUSPEND_UI':
          break;

        case 'B2D_DM_ABORTED_UI':
        case 'B2D_SCOMO_FLOW_END_UI':
          this._onSessionEnd();
          this.isSessionError = false;
          break;

        case 'B2D_DM_ERROR_UI':
          this.isSessionError = true;
        case 'B2D_DL_INST_ERROR_UI':
          if (!this.isSilent) {
            this._handleDmErrorUI(uiEventmsg);
          }
          break;

        default:
          break;
      } // End of switch
    }
  },

  _sendCommandToEngine: function(stype) {
    let msg = {
      senderType: stype,
      commType: ''
    };
    window.navigator.OmaService.setOptToDM(msg);
  },

  _showCheckAlertDialog: function(text, onOkCb) {
    let _ = navigator.mozL10n.get;
    Service.request('DialogService:show',
      {
        id: 'redbend-fota-sys-dialog',
        header: _('fota-title-software-update'),
        content: _(text),
        translated: true,
        ok: 'back',
        type: 'alert',
        onOk: onOkCb
      }
    );
  },

  _showCriticalInstallDialog: function(onOkCb) {
    let _ = navigator.mozL10n.get;
    Service.request(
      'DialogService:show',
      {
        id: 'redbend-fota-sys-dialog',
        header: _('rbfota-ins-confirm-title'),
        content: _('rbfota-ins-confirm-content'),
        translated: true,
        ok: 'install',
        type: 'alert',
        onOk: onOkCb
      }
    );
  },

  _handleUserUpdateButtonClicked: function() {
    // Clear alert notification when button clicked.
    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }
    // If silent install need reboot(silent auto reboot after screen off)
    if (this.isSilent && this._insRebootFlag) {
      this._showCriticalInstallDialog(() => {
        this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
      });
      return;
    }
    // If a pkg had downloaded and need install
    if (this.lastInstallEvent) {
      this._handleScomoInsConfirmUI(this.lastInstallEvent);
      return;
    }
    // If there is a download confirm session
    if (this.lastEngineEvent) {
      if ('B2D_SCOMO_DL_CONFIRM_UI' === this.lastEngineEvent.type) {
        // download confirm | download canceling
        // check if silent or critical
        this.userCheckingFlag = false;
        if(this.lastEngineEvent.detail) {
          if (this.lastEngineEvent.detail.DMA_VAR_SCOMO_ISSILENT == 1
            || this.lastEngineEvent.detail.DMA_VAR_SCOMO_CRITICAL == 1) {
            this._lunchFotaApp('/download');
            return;
          }
        }

        this._lunchFotaApp('/releasenotes', this.lastEngineEvent);
        return;
      }
      if ('B2D_SCOMO_NOTIFY_DL_UI' == this.lastEngineEvent.type) {
        this._sendCommandToEngine('D2B_SCOMO_NOTIFY_DL');
        this.userCheckingFlag = false;
        return;
      }
    }
    // If user triggered but vdm has not response yet
    if (this.userCheckingFlag) {
      this._showCheckAlertDialog('fota-other-going');
      return;
    }
    this.userCheckingFlag = true;
    // Hide dialog if a call in.
    this.telephony.oncallschanged = ()=> {
      if (this.telephony.calls.length
          || this.telephony.conferenceGroup.calls.length) {
        // has calls
        Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
        this.telephony.oncallschanged = null;
        this.userCheckingFlag = false;
      }
    }
    // Display checking dialog
    this._showCheckAlertDialog('rbfota-user-trigger-content', () => {
      this.telephony.oncallschanged = null;
    });

    // Check engine state (paused/pausing/canceling/downloading/normal(idle))
    navigator.OmaService.command('query', 'state')
      .then((s_state) => {
        this.userCheckingFlag = false;
        let state = JSON.parse(s_state);
        if (state) {
          if (state.data == 'engine-not-ready') {
            this._showCheckAlertDialog('rbfota-dm-error-initialize-in-progress');
          } else if (state.data == 'normal') {
            // If engine is idle
            this._sendCommandToEngine('D2B_SESS_INITIATOR_USER_SCOMO');
          } else if (state.data == 'canceling'){
            // If user canceled a session(download | downloading | install)
            // and vdm session has not done yet.
            this._showCheckAlertDialog('rbfota-dm-error-dm-session-in-progress');
          } else if (state.data == 'B2D_SCOMO_INS_CONFIRM_UI'){
            this._handleScomoInsConfirmUI(null);
          } else {
            // paused | pasuing | downloading session
            this._lunchFotaApp('/download');
          }
        }

      }).catch(() => {

        this.userCheckingFlag = false;
      });
  },

  _isAppRunning: function(manifestURL) {
    let mozapp = document.activeElement.getAttribute('mozapp');
    if (document.activeElement.getAttribute('mozapp') == manifestURL) {
      return true;
    }
    if (Service.currentApp.name == 'fota') {
      return true;
    }
    return false;
  },

  _lunchFotaApp: function(view, data, onOk, onErr) {
    if (this._isInCalling()) {
      return;
    }
    if (this.isFotaAppLunching) {
      return;
    }
    this.isFotaAppLunching = true;
    Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
    let ddata = null;
    let ttype = null;
    if (data) {
      if (data.detail) {
        ddata = data.detail;
        ttype = data.type;
      } else {
        ddata = data;
        ttype = data;
      }
    }
    let activity = new MozActivity({
      name: 'launch-redbend-fota',
      data: {
        page: view,
        data: ddata,
        type: ttype
      }
    });
    activity.onerror = ()=> {
      this.isFotaAppLunching = false;
      if (onErr) {
        onErr();
      }
    };
    activity.onsuccess = ()=> {
      this.isFotaAppLunching = false;
      if (onOk) {
        onOk();
      }
    };
  },

  _isInCalling : function ft_auto_retry() {
    var channel = Service.query('currentChannel');
    var isCalling = (channel === 'telephony' || channel === 'ringer');
    if (isCalling) {
      return true;
    }
    return false;
  },

  _onSessionEnd: function() {
    if (!this.installDoneConfirm) {
      if (!this.isSessionError) {
        Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
      }
    }
    this.installDoneConfirm = false;
    this.isDownloading = false;
    this.isCritical = false;
    this.isSilent = false;
    this.userCheckingFlag = false;
    this.lastInstallEvent = null;
    this.lastEngineEvent = null;
  },

  _handleScomoDlConfirmUI: function(uiEventmsg) {

    Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
    if (this.isSilent) {
      this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
      return;
    }
    if (uiEventmsg.detail && uiEventmsg.detail.DMA_VAR_SCOMO_CRITICAL
        && uiEventmsg.detail.DMA_VAR_SCOMO_CRITICAL == 1) {
      // should not run here, critical do not have dl confirm event.
      return;
    }

    this._lunchFotaApp('/releasenotes', uiEventmsg);
  },

  _handleScomoDlProgress: function(uiEventmsg) {
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;
    if (uiEventmsg.detail && uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT
        && uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT != '0') {
      Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
      return;
    }
    let dlViewFlag = this.isCritical;
    if (uiEventmsg.detail && uiEventmsg.detail.DMA_VAR_SCOMO_CRITICAL
        && uiEventmsg.detail.DMA_VAR_SCOMO_CRITICAL == '1') {
      this.isCritical = true;
    }
    if (dlViewFlag != this.isCritical) {
      this._lunchFotaApp('/download', 'B2D_SCOMO_DL_PROGRESS');
    }
    return;
  },

  _handleScomoInsConfirmUI: function(uiEventmsg) {

    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }
    this.isDownloading = false;
    this.userCheckingFlag = false;

    if(uiEventmsg && uiEventmsg.detail
        && (uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT == 1)) {
      this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
      this.lastInstallEvent = null;
      return;
    }

    this.telephony.oncallschanged = ()=> {
      if (this.telephony.calls.length
          || this.telephony.conferenceGroup.calls.length) {
        // has calls
        Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
        this.telephony.oncallschanged = null;
      }
    }

    if (this._isInCalling()) {
      Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
      return;
    }

    if (this._isAppRunning('app://fota.gaiamobile.org/manifest.webapp')) {
      window.close();
    }

    if(uiEventmsg && uiEventmsg.detail
        && (uiEventmsg.detail.DMA_VAR_SCOMO_CRITICAL == 1)
        ) {
      this._showCriticalInstallDialog(()=>{
        this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
        this.telephony.oncallschanged = null;
      });
      return;
    }

    let _ = navigator.mozL10n.get;
    Service.request('DialogService:show', {
      id: 'redbend-fota-sys-dialog',
      header: _('rbfota-ins-confirm-title'),
      content: _('rbfota-ins-confirm-content'),
      translated: true,
      type: 'confirm',
      ok: 'install',
      cancel: 'fota-cancel',
        onOk: ()=> {
          if (this.checkBattery()) {
            this._sendCommandToEngine('D2B_SCOMO_ACCEPT');
          }
          this.telephony.oncallschanged = null;
        },
        onCancel: ()=> {
          this.userCheckingFlag = true;
          this._sendCommandToEngine('D2B_SCOMO_CANCEL');
          this.telephony.oncallschanged = null;
        }
    });
  },

  _handleScomoInsChargeBatteryUI: function(uiEventmsg) {
    this._lunchFotaApp('/warning', uiEventmsg);
  },

  _handleScomoInstallDone: function(uiEventmsg) {
    if (uiEventmsg && uiEventmsg.detail
        && uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT
        && uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT != '0') {
      return;
    }
    let err_code = uiEventmsg.detail.DMA_VAR_REPORT_RESULT;
    let _ = navigator.mozL10n.get;
    let msgOK = _('fota-upgrade-success', {target:this.cur_version});

    let error_table = {
      '200': msgOK,
      '1200': msgOK,
      '1452': 'rbfota-dm-error-ins-scomo-partial-success',
      '1480': 'rbfota-dm-error-ins-scomo-scout-failed'
    };
    let err_content = null;
    if (uiEventmsg.detail) {
      err_content = error_table[err_code];
    }
    if (!err_content) {
      err_content = 'rbfota-dm-error-ins-failed';
    }
    this.installDoneConfirm = true;
    let tID = window.setTimeout(() => {
      if (this.installDoneConfirm) {
        this.installDoneConfirm = false;
      }
    }, 5000);
    Service.request(
      'DialogService:show',
      {
        id: 'redbend-fota-sys-dialog',
        header: _('fota-title-attention'),
        content: _(err_content),
        translated: true,
        ok: 'back',
        type: 'alert',
        onOk: () => {
          this.installDoneConfirm = false;
          window.clearTimeout(tID);
        },
        translated: (200 === err_code || 1200 === err_code)
      }
    );
  },

  _showNotice: function fota_show_notice(title, message, param, args) {
    let local_title = title;
    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }
    this.notification = new Notification(local_title, {
      body: message,
      icon: 'style/icons/Default.png',
      tag: 'fota-notice',
      mozbehavior: {
        showOnlyOnce: true
      }
    });

    this.notification.addEventListener('click', (evt) => {
      evt.target.close();
      if (args.type == 'B2D_SCOMO_NOTIFY_DL_UI') {
        this._sendCommandToEngine('D2B_SCOMO_NOTIFY_DL');
      } else {
        this._lunchFotaApp(param, args);
      }
   });
  },

  _handleDmErrorUI: function(uiEventmsg) {
    this._handleDmaVarError(uiEventmsg);
    if (this._isAppRunning('app://fota.gaiamobile.org/manifest.webapp')) {
      window.close();
    }
  },

  _handleDmaVarError: function(uiEventmsg) {
    Service.request('DialogService:hide', 'redbend-fota-sys-dialog');
    if (this._isInCalling()) {
      return;
    }
    var error_table = {
      '20481': 'rbfota-dm-error-invalid-ord-num-for-inst-type',
      '24576': 'rbfota-dm-error-internal',
      '24577': 'rbfota-dm-error-internal',
      '24578': 'rbfota-dm-error-dmtree-error',
      '24579': 'rbfota-dm-error-dmtree-error',
      '24580': 'rbfota-dm-error-dmtree-error',
      '24581': 'rbfota-dm-error-dmtree-error',
      '24582': 'rbfota-dm-error-dmtree-error',
      '24583': 'rbfota-dm-error-dmtree-error',
      '24584': 'rbfota-dm-error-dmtree-error',
      '24585': 'rbfota-dm-error-dmtree-error',
      '24586': 'rbfota-dm-error-internal',
      '24587': 'rbfota-dm-error-dmtree-error',
      '24588': 'rbfota-dm-error-dmtree-error',
      '24589': 'rbfota-dm-error-dmtree-error',
      '24590': 'rbfota-dm-error-dmtree-error',
      '24591': 'rbfota-dm-error-storage-read',
      '24592': 'rbfota-dm-error-storage-write',
      '24593': 'rbfota-dm-error-authentication',
      '24594': 'rbfota-dm-error-dmtree-error',
      '24595': 'rbfota-dm-error-dmtree-error',
      '24596': 'rbfota-dm-error-dmtree-error',
      '24597': 'rbfota-dm-error-dmtree-error',
      '24598': 'rbfota-dm-error-storage-open',
      '24599': 'rbfota-dm-error-storage-commit',
      '24600': 'rbfota-dm-error-storage-no-space',
      '24601': 'rbfota-dm-error-dmtree-error',
      '24833': 'rbfota-dm-error-protocol-error',
      '24834': 'rbfota-dm-error-protocol-error',
      '24835': 'rbfota-dm-error-protocol-error',
      '24837': 'rbfota-dm-error-protocol-error',
      '24838': 'rbfota-dm-error-protocol-error',
      '24839': 'rbfota-dm-error-protocol-error',
      '24840': 'rbfota-dm-error-protocol-error',
      '24841': 'rbfota-dm-error-protocol-error',
      '24843': 'rbfota-dm-error-protocol-error',
      '24845': 'rbfota-dm-error-protocol-error',
      '24846': 'rbfota-dm-error-protocol-error',
      '24847': 'rbfota-dm-error-bad-protocol',
      '25088': 'rbfota-dm-error-notif-bad-length',
      '25089': 'rbfota-dm-error-notif-bad-digest',
      '25090': 'rbfota-dm-error-boot-error',
      '25091': 'rbfota-dm-error-boot-error',
      '25092': 'rbfota-dm-error-boot-error',
      '25093': 'rbfota-dm-error-boot-error',
      '25094': 'rbfota-dm-error-boot-error',
      '25095': 'rbfota-dm-error-boot-error',
      '25096': 'rbfota-dm-error-boot-error',
      '25097': 'rbfota-dm-error-boot-error',
      '25104': 'rbfota-dm-error-boot-error',
      '25105': 'rbfota-dm-error-notif-unsupported-version',
      '25106': 'rbfota-dm-error-boot-disabled',
      '25108': 'rbfota-dm-error-bad-protocol',
      '25109': 'rbfota-dm-error-bad-protocol',
      '25344': 'rbfota-dm-error-bad-protocol',
      '25345': 'rbfota-dm-error-bad-protocol',
      '25346': 'rbfota-dm-error-comm-fatal',
      '25347': 'rbfota-dm-error-comm-fatal',
      '25348': 'rbfota-dm-error-comm-fatal',
      '25349': 'rbfota-dm-error-comm-fatal',
      '25350': 'rbfota-dm-error-comm-http-error',
      '25351': 'rbfota-dm-error-comm-http-error',
      '25352': 'rbfota-dm-error-comm-http-error',
      '25353': 'rbfota-dm-error-comm-http-error',
      '25354': 'rbfota-dm-error-comm-http-error',

      '25407': 'rbfota-dm-error-comm-non-fatal',
      '25408': 'rbfota-dm-error-comm-http-error',
      '25409': 'rbfota-dm-error-comm-http-forbidden',
      '25472': 'rbfota-dm-error-dl-network',
      '25473': 'rbfota-dm-error-dl-network',
      '25474': 'rbfota-dm-error-dl-network',
      '25475': 'rbfota-dm-error-dm-network',
      '25476': 'rbfota-dm-error-dm-no-pkg',
      '25477': 'rbfota-dm-error-dm-session-in-progress',
      '25478': 'rbfota-dm-error-dl-network',
      '25479': 'rbfota-dm-error-wifi-not-available',
      '25480': 'rbfota-dm-error-dm-session-in-progress',
      '25481': 'rbfota-dm-error-user-interaction-timeout',
      '25482': 'rbfota-dm-error-installation-cond-error',
      '25483': 'rbfota-dm-error-installation-cond-error',
      '25496': 'rbfota-dm-error-installation-cond-error',
      '25484': 'rbfota-dm-error-purge-invalid-dp',
      '25485': 'rbfota-dm-error-external-dl-timeout',
      '25486': 'rbfota-dm-error-conditions-before-dm',
      '25487': 'rbfota-dm-error-initialize-in-progress',
      '25488': 'rbfota-dm-error-dl-window',
      '25489': 'rbfota-dm-error-dl-cancel-by-user',
      '25490': 'rbfota-dm-error-dl-resstarted-by-user',
      '25491': 'rbfota-dm-error-dl-canceled-by-server',
      '25492': 'rbfota-dm-error-dl-canceled-external-to',
      '25493': 'rbfota-dm-error-dl-canceled-going-external',
      '25494': 'rbfota-dm-error-dl-canceled-max-retry-reached',
      '25495': 'rbfota-dm-error-register-ext-cb-failed',
      '25498': 'rbfota-dm-error-dl-canceled-due-to-policy',
      '25499': 'rbfota-dm-error-cond-xml-empty',
      '25500': 'rbfota-dm-error-cond-xml-large',
      '25501': 'rbfota-dm-error-cond-xml-syntax',

      '25604': 'rbfota-dm-error-dl-cancel',
      '25609': 'rbfota-dm-error-bad-dd-invalid-size',
      '25610': 'rbfota-dm-error-install-setup-failed',
      '25611': 'rbfota-dm-error-dil-resource-timeout',
      '25613': 'rbfota-dm-error-system-resource-failure',

      '25601': 'rbfota-dm-error-internal',
      '25602': 'rbfota-dm-error-mo-storage',
      '25603': 'rbfota-dm-error-dl-switch-to-usb',
      // '25604': 'rbfota-dm-error-cancel',
      '25605': 'rbfota-dm-error-update-init',
      '25606': 'rbfota-dm-error-bad-url',
      '25607': 'rbfota-dm-error-bad-dd',
      '25608': 'rbfota-dm-error-comm-obj-changed',
      '25856': 'rbfota-dm-error-out-of-sync',
      '36867': 'rbfota-dm-error-dm-account-does-not-exist'
      // '0': 'no-error'
    };

    if(uiEventmsg.detail && uiEventmsg.detail.DMA_VAR_SCOMO_ISSILENT == 1) {
      return;
    }

    let _ = navigator.mozL10n.get;
    if (uiEventmsg.detail) {
      if (error_table[uiEventmsg.detail.DMA_VAR_ERROR]) {
        Service.request(
          'DialogService:show',
          {
            id: 'redbend-fota-sys-dialog',
            header: _('fota-title-attention'),
            content: _(error_table[uiEventmsg.detail.DMA_VAR_ERROR]),
            translated: true,
            ok: 'back',
            onOk:() => {
              this.debug(`_handleDmaVarError()::onOk`);
            },
            type: 'alert'
          }
        );
      }
      return;
    }

    Service.request(
      'DialogService:show',
      {
        id: 'redbend-fota-sys-dialog',
        header: _('fota-title-attention'),
        content: _('rbfota-dm-error-ui-content'),
        translated: true,
        ok: 'back',
        onOk:() => {
          this.debug(`_handleDmaVarError()::onOk`);
        },
        type: 'alert'
      }
    );
  }
};
