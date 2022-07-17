/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/* global FxaModuleStates, FxaModuleUI, FxaModule, FxaModuleNavigation,
   FxModuleServerRequest, FxaModuleOverlay, FxaModuleManager, BrowserFrame */
/* exported FxaModuleLogin */

'use strict';

/**
 * This module checks the validity of an email address, and if valid,
 * determines which screen to go next.
 */
var FxaModuleCheckPassword = (function () {
  function _showLoading() {
    FxaModuleOverlay.show('fxa-connecting');
    $('fxa-check-password').dataset.subid = 'loading';
    ViewManager.setSkMenu();
  }

  function _hideLoading() {
    $('fxa-check-password').dataset.subid = '';
    ViewManager.setSkMenu();
    FxaModuleOverlay.hide();
  }

  function _checkPassword(model, password, nextPageCallback) {
    var error = _validePassword(password);
    if (error) {
      model.showErrorResponse({ error: error });
      return;
    }

    _showLoading();

    FxModuleServerRequest.verifyPassword(
      password,
      function onServerResponse(response) {
        NavigationMap.currentActivatedLength = 0;
        _hideLoading();
        _rightPasswordRetryRest();
        FxaModuleManager.setParam('title', model.options.type);

        // Remove push subscription if this is factory reset with
        // Antitheft enabled
        if (model.options.type === 'ResetFactory' &&
          window.parent.FMDManager.antitheft_enabled) {
          // We just need to remove push subscription, no matter the result.
          Promise.all([window.parent.FMDManager.reportFactoryReset(),
          window.parent.FMDManager.removeSubscription()])
          .then(() => {
            FxaModuleManager.setParam('result', 'success');
            window.parent.FxAccountsUI.done(FxaModuleManager.paramsRetrieved);
          }, () => {
            FxaModuleManager.setParam('result', 'success');
            window.parent.FxAccountsUI.done(FxaModuleManager.paramsRetrieved);
          });
          return;
        }

        if (model.options.type === 'DisableAntitheft') {
          FxaModuleManager.setParam('result', 'success');
          window.parent.FxAccountsUI.done(FxaModuleManager.paramsRetrieved);
          return;
        }
        if (model.options.type === 'info') {
          FxaModuleManager.setParam('editInfo', true);
        }
        if (model.options.type === 'altPhone') {
          FxaModuleManager.setParam('requestAltPhoneOtp', true);
        }

        FxaModuleManager.setParam('password', model.fxaPwInput.value);

        if(goNextPage(model.options.type)) {
          nextPageCallback(_type2Page[model.options.type]);
          return;
        }
      }.bind(model),
      function onError(response) {
        NavigationMap.currentActivatedLength = 0;
        _hideLoading();
        model.showErrorResponse(response);
        if ('INVALID_PASSWORD' == (response && response.error)) {
          _wrongPaswordRetry();
        }
      }.bind(model)
    );
  };

  var _ResourceId = function (type) {
    var ret = 'fxa-need-password';
    switch (type) {
      case 'DisableAntitheft':
        ret = 'fxa-disable-antitheft-checkpassword-message';
        break;
      case 'ResetFactory':
        ret = 'fxa-reset-factory-checkpassword-message-1';
        break;
      case 'deleteAccount':
        ret = 'fxa-checkpassword-delete-account';
        break;
    }

    return ret;
  }

  var _titleId = function (type) {
    var ret = '';
    switch (type) {
      case 'email':
      case 'phone':
      case 'info':
      case 'deleteAccount':
      case 'altPhone':
        ret = 'fxa-enter-password';
        break;
    }

    return ret;
  }

  var _type2Page = {
    'email': FxaModuleStates.EDIT_ACCOUNT_EMAIL,
    'phone': FxaModuleStates.EDIT_ACCOUNT_PN,
    'info': FxaModuleStates.ENTER_PERSONAL_INFO,
    'deleteAccount': FxaModuleStates.DELETE_ACCOUNT,
    'altPhone': FxaModuleStates.EDIT_ACCOUNT_ALT_PN
  }

  function goNextPage(type) {
    return ['email', 'phone', 'info', 'deleteAccount', 'altPhone'].indexOf(type) > -1;
  }

  var Module = Object.create(FxaModule);
  Module.init = function init(options) {
    // Cache static HTML elements
    this.importElements(
      'fxa-email-input',
      'fxa-email-input-account',
      'fxa-pw-input',
      'fxa-show-pw',
      'fxa-intro'
    );

    this.options = options || {};
    var _sourceId = _ResourceId(this.options.type);
    this.accountId = this.options.phone || this.options.email || this.options.data;

    if(goNextPage(this.options.type)) {
      this.fxaEmailInputAccount.style.display = 'none';
      this.fxaEmailInput.style.display = 'none';
    } else {
      this.fxaEmailInput.innerHTML = this.accountId;
    }

    if (_sourceId) {
      this.fxaIntro.setAttribute('data-l10n-id', _sourceId);
      this.fxaIntro.classList.add(_sourceId);
    }

    if (_titleId(this.options.type)) {
      ViewManager.updateTitle(_titleId(this.options.type));
    }

    if (this.initialized) {
      return;
    }

    this.fxaShowPw.addEventListener(
      'click',
      onShowPwClick.bind(this)
    );

    var placeholder = navigator.mozL10n.get('fxa-password');
    this.fxaPwInput.setAttribute('placeholder', placeholder);

    function onShowPwClick() {
      if (this.fxaShowPw.checked) {
        this.fxaPwInput.type = 'text';
      } else {
        this.fxaPwInput.type = 'password';
      }
    }

    this.initialized = true;
  };

  Module.onNext = function onNext(gotoNextStepCallback) {
    var self = this;
    window.parent.asyncStorage.getItem('checkpassword.enabletime', function(value) {
      if (value) {
        var currentTime = (new Date()).getTime();
        if (currentTime < value) {
          retryFailsHint(value);
          return;
        }
      }

      var password = self.fxaPwInput.value;
      _checkPassword(self, password, gotoNextStepCallback);
    });
  };

  Module.onBack = function onBack(gotoBackStepCallback) {
    var contact = this.options.email || this.options.phone;
    _showLoading();
    FxModuleServerRequest.resetPasswordInit(contact,
      (methods) => {
        if (methods && Array.isArray(methods)) {
          FxaModuleManager.setParam('resetMethods', methods);
          gotoBackStepCallback(FxaModuleStates.FORGOT_PASSWORD);
        } else {
          _hideLoading();
          this.showErrorResponse({ error: 'NO_RETRIEVALE_METHOD' });
        }
      }, (e) => {
        _hideLoading();
        this.showErrorResponse(e);
      }
    );
  };

  Module.onDone = function onDone() {
    _hideLoading();
  };
  return Module;
} ());
