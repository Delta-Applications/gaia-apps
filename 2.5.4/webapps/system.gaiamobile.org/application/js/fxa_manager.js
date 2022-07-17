/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/**
 * Firefox Accounts is a database of users who have opted in to services in
 * the Mozilla cloud. Firefox Accounts holds Mozilla specific information
 * (which of your devices are attached right now?), as well as one (and
 * eventually multiple) verified identities for a user.
 *
 * Firefox Accounts is a web scale service with a REST API, that allows a user
 * agent to authenticate to the service (by verifying the user's identity),
 * and in exchange to get credentials that allow the user agent to assert the
 * identity of the user to other services.
 *
 * FxAccountsManager is mostly a proxy between certified apps that wants to
 * manage Firefox Accounts (FTU and Settings so far) and the platform.
 * It handles the communication via IAC and redirects the requests coming from
 * these apps to the platform in the form of mozContentEvents. It also handles
 * sign-in requests done via the mozId API from RPs and triggers FxAccountsUI
 * to show the appropriate UI in each case.
 *
 *
 * =FTU=                          =Settings=                     =RP=
 *   |                           /                                |
 *   |-IAC                  IAC-/                                 |
 *    \                        /                                  |
 * ========================System=======================          |
 *       \                  /                                     |
 *        \                /       FxAccountsUI                   |
 *       FxAccountsManager ______/       |                        |-mozId API
 *            |                  \       |                        |
 *            |                       FxAccountsClient            |
 *            |                        |                          |
 *            |                        |                          |
 * =============================Gecko======================================
 *            |                        |                          |
 *            |                        |-moz(Chrome/Content)Event |
 *            |                        |                          |
 *       FxAccountsUIGlue    FxAccountsMgmtService                |
 *                 |               ^                              |
 *                 |               |                              |
 *                 |               |                              |
 *                 |__________FxAccountsManager                   |
 *                                 |                              |
 *                                 |                              |
 *                          DOM Identity API impl. _______________|
 */

/* global IACHandler, LazyLoader, FxAccountsClient, FxAccountsUI */

'use strict';

var FxAccountsManager = {
  DEBUG: false,
  _isConfigToPhoneMethod: false, // The default method is email.
  ONEDAY: 24 * 60 * 60 * 1000,

  _debug: function(msg) {
    if (this.DEBUG) {
      console.log(msg);
    }
  },

  init: function fxa_mgmt_init() {
    // Set up the listener for IAC API connection requests.
    window.addEventListener('iac-fxa-mgmt', this.onPortMessage);
    // Listen for unsolicited chrome events coming from the implementation o
    // RP DOM API or the Fx Accounts UI glue.
    window.addEventListener('mozFxAccountsUnsolChromeEvent', this);
    // Listen for platform OTP received event.
    window.addEventListener('otpReceived', this.onOTPReceived.bind(this));
    window.addEventListener('otpSmsReceived', this.onOTPSmsReceived.bind(this));
    // Get the 'account.verification.phone.enabled' settings key.
    this.initDefaultVerificationMethod();
    // When time changed, we need to fresh check password check time
    window.addEventListener('moztimechange', this.onTimeChange.bind(this));

    AlarmMessageHandler.addCallback(this.handleAlarm.bind(this));
    // To init nextAlarmDate Only if we have an alarm.
    this.checkAndNewAlarm();

    this.labelVersion();
  },

  labelVersion: function() {
    var key = 'kaiaccount.version';
    var version = '3.0.0';
    var getRequest = navigator.mozSettings.createLock().get(key);
    getRequest.onsuccess = () => {
      if (getRequest.result[key] !== version) {
        navigator.mozSettings.createLock().set({'kaiaccount.version': version});
      }
    };

    getRequest.onerror = () => {
      this._debug('--> onerror(): get config failed');
    };
  },

  initNewAlarm: function() {
    this.checkAndNewAlarm(this.nextDate(), true);
    this.showNotification();
  },

  // If both alarmDate and forceNew are null,
  // We just want try to init nextAlarmDate
  checkAndNewAlarm: function(alarmDate, forceNew) {
    var self = this;
    var alarmRequest = navigator.mozAlarms.getAll();
    alarmRequest.onsuccess = function() {
      var alarmFound = false;
      this.result.forEach(function (alarm) {
        // Only one alarm allowed.
        if (alarm.data.accountNeedVerify) {
          if (forceNew || alarmFound) {
            self._debug('checkAndNewAlarm remove');
            navigator.mozAlarms.remove(alarm.id);
            self.nextAlarmDate = null;
          } else if (alarm.date.getTime() > Date.now()) {
            alarmFound = true;
            self.nextAlarmDate = alarm.date;
          }
        }
      });
      if (!alarmFound && alarmDate) {
        self.addAlarm(alarmDate);
      }
    }
    alarmRequest.onerror = function() {
      self._debug('newAlarm failed: ' + this.error);
    };
  },

  nextDate: function() {
    var now = new Date();
    var alarmDate = new Date();
    // 9:00:00'00 am
    alarmDate.setHours(9, 0, 0, 0);
    if (now.getTime() > alarmDate.getTime()) {
      // 9am tomorrow
      alarmDate = new Date(alarmDate.getTime() + this.ONEDAY);
    }

    return alarmDate;
  },

  addAlarm: function(alarmDate) {
    var self = this;
    var detail = {};
    detail['accountNeedVerify'] = true;
    if (!alarmDate) {
      alarmDate = this.nextDate();
    }
    var request = navigator.mozAlarms.add(alarmDate, 'ignoreTimezone', detail);
    request.onsuccess = function() {
      self.nextAlarmDate = alarmDate;
    }
    request.onerror = function() {
      self._debug('add alarm failed: ' + this.error);
    }
  },

  disableAlarm: function() {
    var self = this;
    var alarmRequest = navigator.mozAlarms.getAll();
    alarmRequest.onsuccess = function() {
      this.result.forEach(function (alarm) {
        if (alarm.data.accountNeedVerify) {
          navigator.mozAlarms.remove(alarm.id);
          self.nextAlarmDate = null;
        }
      });
    }
    alarmRequest.onerror = function () {
    };

    this.notification && this.notification.close();
  },

  onTimeChange: function() {
    this.refreshAlarm();
    this.refreshCheckPassWordTime();
  },

  refreshAlarm: function() {
    if (!this.nextAlarmDate) {
      this._debug('refreshAlarm nextAlarmDate is null return');
      return;
    }
    if (this.nextAlarmDate.getTime() - Date.now() < this.ONEDAY) {
      return;
    }
    this._debug('refreshAlarm initNewAlarm');
    this.initNewAlarm();
  },

  handleAlarm: function(alarm) {
    if (!alarm.data.accountNeedVerify) {
      return;
    }

    if ((this.lastAlarmDate && this.lastAlarmDate.getTime()) === alarm.date.getTime()) {
      this._debug('duplicate alarm, rejected');
      return;
    }

    this.showNotification();

    this._debug('account alarming');
    this.lastAlarmDate = alarm.date;

    this.addAlarm(this.nextDate());
  },

  showNotification: function() {
    var _ = navigator.mozL10n.get;
    var notifOptions = {
      body: _('kaios-verify-number'),
      icon: 'contacts',
      tag: 'kaios-account',
      mozbehavior: {
        showOnlyOnce: true
      }
    };

    this.notification = new Notification(_('kaios-account'), notifOptions);
    this.notification.addEventListener('click', () => {
      this.notification.close();
      new MozActivity({
        name: 'configure',
        data: {
          target: 'device',
          section: 'fxa',
          caller: 'fxa'
        }
      });
    });
  },

  refreshCheckPassWordTime: function() {
    // Per spec SFP_IxD_Spec_Account & Anti-theft_v2.5
    var _retryInterval = {
      6: 1 * 60 * 1000,
      7: 5 * 60 * 1000,
      8: 15 * 60 * 1000,
      9: 60 * 60 * 1000,
      10 : 4 * 60 * 60 * 1000
    };

    window.asyncStorage.getItem('checkpassword.retrycount', count => {
      this._debug('checkpassword.retrycount is ' + count);
      if (count >= 6) {
        if (count >= 10) {
          count = 10;
        }
        var interval = _retryInterval[count];
        var enableTime = (new Date()).getTime() + interval;
        this._debug('Next password retry should be later than ' + enableTime);
        window.asyncStorage.setItem('checkpassword.enabletime', enableTime);
      }
    })
    this._debug('initRefreshChkPwd when moztimechange');
  },

  initDefaultVerificationMethod: function() {
    var key = 'kaiaccount.openflow.default';
    var getRequest = navigator.mozSettings.createLock().get(key);
    getRequest.onsuccess = () => {
      this._debug('--> onsuccess(): getRequest.result[key] = ' +
        getRequest.result[key]);
      if (getRequest.result[key] === 'phone') {
        this._isConfigToPhoneMethod = true;
      } else if (getRequest.result[key] === 'email') {
        this._isConfigToPhoneMethod = false;
      }
    };

    getRequest.onerror = () => {
      this._debug('--> onerror(): get config failed');
    };
  },

  sendPortMessage: function fxa_mgmt_sendPortMessage(message) {
    var port = IACHandler.getPort('fxa-mgmt');
    if (port) {
      port.postMessage(message);
    }
  },

  onOTPReceived: function (event) {
    this._debug('--> onOTPReceived(): event = ' + event);
    FxAccountsUI.fillInOTP(event.detail);
  },

  onOTPSmsReceived: function (event) {
    this._debug('--> onOTPSmsReceived(): event = ' + event);
    FxAccountsUI.showOTPSms(event.detail);
  },

  onPortMessage: function fxa_mgmt_onPortMessage(event) {
    if (!event || !event.detail) {
      console.error('Wrong event');
      return;
    }

    var self = FxAccountsManager;
    self._debug('--> onPortMessage(): event.detail.name = ' +
      event.detail.name);

    var methodName = event.detail.name;

    self._debug('--> methodName = ' + methodName);

    switch (methodName) {
      case 'getAccounts':
        (function(methodName) {
          var refresh = event.detail.refresh;
          LazyLoader.load('js/fxa_client.js', function() {
            FxAccountsClient[methodName](function(data) {
              if (data && data.pending && data.pending.altPhone) {
                self.checkAndNewAlarm(self.nextDate());
                if (self.signInTriggered) {
                  self.showNotification();
                  self.signInTriggered = false;
                }
              } else {
                self.disableAlarm();
                self.signInTriggered = false;
              }
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function(error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            }, refresh);
          });
        })(methodName);
        break;
      case 'verifyPassword':
        var password = event.detail.password;
        (function(methodName) {
          LazyLoader.load('js/fxa_client.js', function() {
            FxAccountsClient[methodName](password, function(data) {
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function(error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            });
          });
        })(methodName);
        break;
      case 'logout':
        (function(methodName) {
          LazyLoader.load('js/fxa_client.js', function() {
            FxAccountsClient[methodName](function(data) {
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function(error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            });
          });
        })(methodName);
        break;
      case 'requestEmailVerification':
        (function(methodName) {
          var email = event.detail.email;
          var uid = event.detail.uid;
          if (!email || !uid) {
            self.sendPortMessage({ methodName: methodName,
                                   error: 'NO_VALID_EMAIL' });
            return;
          }
          LazyLoader.load('js/fxa_client.js', function() {
            FxAccountsClient[methodName](email, uid, function(data) {
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function(error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            });
          });
        })(methodName);
        break;
      case 'signIn':
        (function (methodName) {
          var email = event.detail.email;
          var password = event.detail.password;
          if (!email) {
            self.sendPortMessage({
              methodName: methodName,
              error: 'NO_VALID_EMAIL'
            });
            return;
          }
          LazyLoader.load('js/fxa_client.js', function () {
            FxAccountsClient[methodName](email, password, function (data) {
              if(data && data.success) {
                self.signInTriggered = true;
              }
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function (error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            });
          });
        })(methodName);
        break;
      case 'openFlow':
        (function(methodName) {
          FxAccountsUI.login(function(data) {
            if(data && data.success) {
              self.signInTriggered = true;
            }
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
     case 'signOut':
        (function(methodName) {
          var accountInfo = event.detail.accountInfo;
          FxAccountsUI.signOut(accountInfo, function(data) {
            if(data && data.success) {
              self.disableAlarm();
            }
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
     case 'editPersonalInfo':
        (function(methodName) {
          var accountInfo = event.detail.accountInfo;
          FxAccountsUI.editPersonalInfo(accountInfo, function(data) {
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
     case 'checkPassword':
        (function(methodName) {
          var accountInfo = event.detail.accountInfo;
          var type = event.detail.type;
          FxAccountsUI.checkPassword(accountInfo, type, function(data) {
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'changePassword':
        (function(methodName) {
          FxAccountsUI.changePassword(function(data) {
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'createAccount':
        (function(methodName) {
          FxAccountsUI.createAccount(function(data) {
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'refreshAuthentication':
        (function(methodName) {
          var email = event.detail.email;
          if (!email) {
            self.sendPortMessage({ methodName: methodName,
                                   error: 'NO_VALID_EMAIL' });
            return;
          }

          FxAccountsUI.refreshAuthentication(email, function(data) {
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'phoneNumberLogin':
        (function(methodName) {
          FxAccountsUI.phoneNumberLogin(function(data) {
            if(data && data.success) {
              self.signInTriggered = true;
            }
            self._debug('--> phoneNumberLogin: data = ' + data);
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'verifyAltPhone':
        (function(methodName) {
          var altPhone = event.detail.altPhone;
          var uid = event.detail.uid;
          var verificationId = event.detail.verificationId;
          FxAccountsUI.verifyAltPhone(altPhone, uid, verificationId, function(data) {
            self._debug('--> verifyAltPhone: data = ' + data);
            if(data && data.success) {
              self.disableAlarm();
            }
            self.sendPortMessage({ methodName: methodName, data: data });
          }, function(error) {
            self.sendPortMessage({ methodName: methodName, error: error });
          });
        })(methodName);
        break;
      case 'requestPhoneVerification':
        (function (methodName) {
          var uid = event.detail.uid;
          var phone = event.detail.phone;
          LazyLoader.load('js/fxa_client.js', function () {
            FxAccountsClient[methodName](phone, uid, function (data) {
              self.sendPortMessage({ methodName: methodName, data: data });
            }, function (error) {
              self.sendPortMessage({ methodName: methodName, error: error });
            });
          });
        })(methodName);
    }
  },

  _sendContentEvent: function fxa_mgmt_sendContentEvent(msg) {
    var event = new CustomEvent('mozFxAccountsRPContentEvent', {detail: msg});
    window.dispatchEvent(event);
  },

  handleEvent: function fxa_mgmt_handleEvent(event) {
    if (!event || !event.detail) {
      console.error('Wrong event');
      return;
    }

    var message = event.detail;
    var email;
    this._debug('--> mozFxAccountsUnsolChromeEvent handleEvent(): ' +
      'event.detail.eventName = ' + event.detail.eventName);
    // XXX: Since platform always fire 'openFlow' event while mozId.request(),
    // we have to change the default flow to be phoneNumberLogin.
    // If there is configure to verify by email, we do nothing here.
    if (message.eventName === 'openFlow' && this._isConfigToPhoneMethod) {
      message.eventName = 'phoneNumberLogin';
      this._debug('mozFxAccountsUnsolChromeEvent handleEvent():' +
                  ' replace method to be "phoneNumberLogin"');
    }

    switch (message.eventName) {
      case 'openFlow':
        FxAccountsUI.login(function(result) {
          // Enable antitheft if success
          if (result && result.success) {
            navigator.mozSettings.createLock().set({ 'antitheft.enabled': true });
          }
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'phoneNumberLogin':
        FxAccountsUI.phoneNumberLogin(function(result) {
          // Enable antitheft if success
          if (result && result.success) {
            navigator.mozSettings.createLock().set({ 'antitheft.enabled': true });
          }
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'signOut':
        var data = message.data;
        FxAccountsUI.signOut(data, function(result) {
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'checkPassword':
        var data = message.data;
        var type = event.detail.type;
        FxAccountsUI.checkPassword(data, type, function(result) {
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'changePassword':
        FxAccountsUI.changePassword(function(result) {
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'createAccount':
        FxAccountsUI.createAccount(function(result) {
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'refreshAuthentication':
        email = message.data.email;
        if (!email) {
          console.error('No account id specified');
          return;
        }
        FxAccountsUI.refreshAuthentication(email, function(result) {
          this._sendContentEvent({
            id: message.id,
            result: result
          });
        }.bind(this), function(error) {
          this._sendContentEvent({
            id: message.id,
            error: error
          });
        }.bind(this));
        break;
      case 'onlogin':
      case 'onverified':
      case 'onlogout':
        FxAccountsManager.sendPortMessage({ eventName: message.eventName });
        break;
    }
  }
};

FxAccountsManager.init();
