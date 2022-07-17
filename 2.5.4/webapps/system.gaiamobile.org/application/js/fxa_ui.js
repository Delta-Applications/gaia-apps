/* global FxAccountsDialog, FtuLauncher */

'use strict';

var FxAccountsUI = {
  dialog: null,
  panel: null,
  iframe: null,
  onerrorCb: null,
  onsuccessCb: null,
  isClosing: false,

  init: function init() {
    var dialogOptions = {
      onHide: this.reset.bind(this)
    };
    if (!this.dialog) {
      this.dialog = new FxAccountsDialog(dialogOptions);
    }
    this.panel = this.dialog.getView();
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'fxa-iframe';
  },

  // Sign in/up flow.
  login: function fxa_ui_login(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('login');
  },

  editPersonalInfo: function fxa_ui_editPersonalInfo(accountInfo,
                                               onsuccess,
                                               onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    var aAccountInfo = [];
    Object.keys(accountInfo).forEach(key => {
      aAccountInfo.push(key + '=' + accountInfo[key]);
    })
    var arr = aAccountInfo.concat(['editInfo=true']);
    this.loadFlow('editPersonalInfo', arr);
  },

  // Check Password flow.
  checkPassword: function fxa_ui_checkPassword(accountInfo,
                                               type,
                                               onsuccess,
                                               onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    var aAccountInfo = [];
    Object.keys(accountInfo).forEach(key => {
      aAccountInfo.push(key + '=' + accountInfo[key]);
    })
    var arr = aAccountInfo.concat(['type=' + type]);
    this.loadFlow('checkPassword', arr);
  },

  // Change Password flow.
  changePassword: function fxa_ui_changePassword(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('changePassword');
  },

  // Sign out flow.
  signOut: function fxa_ui_signOut(accountInfo, onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    var aAccountInfo = [];
    Object.keys(accountInfo).forEach(key => {
      aAccountInfo.push(key + '=' + accountInfo[key]);
    })
    this.loadFlow('signOut', aAccountInfo);
  },

  // verifyAltPhone flow.
  verifyAltPhone: function(altPhone, uid, verificationId, onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    if (!uid || !altPhone || !verificationId) {
      var data = {'reason': 'Missing parameter!'};
      onerror && onerror(data);

      return;
    }
    var arr = [];
    arr.push(['uid=' + uid]);
    arr.push(['altPhone=' + altPhone]);
    arr.push(['verificationId=' + verificationId]);
    this.loadFlow('verifyAltPhone', arr);
  },

  // phoneNumberLogin flow.
  phoneNumberLogin: function(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('phoneNumberLogin');
  },

  // createAccount flow.
  createAccount: function fxa_ui_createAccount(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('createAccount');
  },

  // Logout flow.
  logout: function fxa_ui_logout(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('logout');
  },

  // Delete flow.
  delete: function fxa_ui_delete(onsuccess, onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('delete');
  },

  // Refresh authentication flow.
  refreshAuthentication: function fxa_ui_refreshAuth(email,
                                                     onsuccess,
                                                     onerror) {
    this.onsuccessCb = onsuccess;
    this.onerrorCb = onerror;
    this.loadFlow('refresh_auth', ['email=' + email]);
  },

  // Provide method while platform receive OTP.
  fillInOTP: function (otp) {
    if (this.iframe && this.iframe.contentWindow &&
      this.iframe.contentWindow.FxaModuleEnterOTP) {
      this.iframe.contentWindow.FxaModuleEnterOTP.onOTPReceived(otp);
    }
  },

  // Show sms during the OTP only. Could be irrelevant SMS, but it's in Spec
  showOTPSms: function (msg) {
    if (this.iframe && this.iframe.contentWindow &&
      this.iframe.contentWindow.FxaModuleEnterOTP) {
      this.iframe.contentWindow.FxaModuleEnterOTP.onOTPSmsReceived(msg);
    }
  },

  // Method which close the dialog.
  close: function fxa_ui_close() {
    var onTransitionEnd = function onClosedAnimation() {
      this.panel.removeEventListener('animationend', onTransitionEnd, false);
      this.panel.classList.remove('closing');
      this.sendCloseMsg();
      this.dialog.hide();
    }.bind(this);

    this.panel.addEventListener(
      'animationend',
      onTransitionEnd
    );

    this.isClosing = true;
    this.panel.classList.add('closing');
  },

  // send iac message to specified running apps when close
  sendCloseMsg: function fxa_ui_sendCloseMsg() {
    var fxaApps = ['app://ftu.gaiamobile.org','app://settings.gaiamobile.org'];
    fxaApps.forEach(function(origin) {
      if (window.appWindowManager.getApp(origin)) { // if app is running
        navigator.mozApps.getSelf().onsuccess = function() {
          var app = this.result;
          app.connect('system-dialog-close_' + origin).then(function(ports) {
            ports.forEach(function(port) {
              port.postMessage({});
            });
          }, function _onConnectReject(data) {
            console.warn('Connection reject' + data);
          });
        };
      }
    });
  },

  // Method for reseting the panel.
  reset: function fxa_ui_reset(reason) {
    this.panel.innerHTML = '';
    this.dialog.browser.element = null;
    this.iframe = null;
    if (reason == 'home' || reason == 'holdhome') {
      this.onerrorCb && this.onerrorCb('DIALOG_CLOSED_BY_USER');
    }
    this.onerrorCb = null;
    this.onsuccessCb = null;
    this.isClosing = false;
  },

  // Method for loading the iframe with the flow required.
  loadFlow: function fxa_ui_loadFlow(flow, params) {
    var url = '../fxa/fxa_module.html#' + flow;
    if (FtuLauncher.isFtuRunning()) {
      params = params || [];
      params.push('isftu=true');
    }
    if (params && Array.isArray(params)) {
      url += '?' + params.join('&');
    }
    if (!this.iframe) {
      this.iframe = document.createElement('iframe');
      this.iframe.id = 'fxa-iframe';
    }
    this.iframe.setAttribute('src', url);
    this.panel.appendChild(this.iframe);
    this.dialog.browser = { element: this.iframe };
    this.dialog.show();
  },

  // Method for sending the result of the FxAccounts flow to the caller app.
  done: function fxa_ui_done(data) {
    // Proccess data retrieved.
    this.onsuccessCb && this.onsuccessCb(data);
    this.close();
  },

  error: function fxa_ui_error(error) {
    this.onerrorCb && this.onerrorCb(error);
    this.close();
  },

  showUrl: function fxa_ui_showLegal(url) {
    let activity = new MozActivity({
      name: 'view',
      data: {
        type: 'url',
        url: url,
        isPrivate: false
      }
    });
    activity.onsuccess = function() {
    };

    activity.onerror = function() {
    };
  }
};

// this injects code into HTML and we need it to be localized
navigator.mozL10n.once(FxAccountsUI.init.bind(FxAccountsUI));
