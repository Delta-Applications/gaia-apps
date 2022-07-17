/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/**
 * Check fxa_manager.js for a further explanation about Firefox Accounts and
 * its architecture in Firefox OS.
 */

/* exported FxAccountsClient */

'use strict';

var FxAccountsClient = function FxAccountsClient() {

  var eventCount = 0;

  var callbacks = {};

  var sendMessage = function sendMessage(message, successCb, errorCb) {
    if (!eventCount) {
      window.addEventListener('mozFxAccountsChromeEvent', onChromeEvent);
    }

    var id = getUUID();
    callbacks[id] = {
      successCb: successCb,
      errorCb: errorCb
    };

    var details = {
      id: id,
      data: message
    };

    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozFxAccountsContentEvent', true, true, details);
    window.dispatchEvent(event);

    eventCount++;
  };

  var checkAccountDeleted = function _checkAccountDeleted(resp) {
    // ACCOUNT_NOT_FOUND error when in a singed in state
    // means that the account has been deleted on Web portal
    if (resp && resp.error && resp.error.error &&
        (resp.error.error === 'ACCOUNT_NOT_FOUND' ||
        resp.error.error == 'JWT_BLACKLISTED')) {
      resp.error.error = 'ACCOUNT_DELETED';
      Service.request('SystemToaster:show',
                {textL10n: 'account-deleted'});
      logout();
    }
  }

  var onChromeEvent = function onChromeEvent(event) {
    var message = event.detail;

    if (!message.id) {
      console.warn('Got mozFxAccountsChromeEvent with no id');
      return;
    }

    checkAccountDeleted(message);

    var callback = callbacks[message.id];
    if (callback && typeof message.data !== 'undefined' && callback.successCb) {
      callback.successCb(message.data);
      delete callbacks[message.id];
    } else if (callback && message.error && callback.errorCb) {
      callback.errorCb(message.error);
      delete callbacks[message.id];
    }

    eventCount--;
    if (!eventCount) {
      window.removeEventListener('mozFxAccountsChromeEvent', onChromeEvent);
    }
  };

  var getUUID = function getUUID() {
    var s4 = function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
    };

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  };


  // === API ===

  var getAccounts = function getAccounts(successCb, errorCb, forceFetch = false) {
    sendMessage({
      method: 'getAccounts',
      refresh: forceFetch,
    }, successCb, errorCb);
  };

  var logout = function logout(successCb, errorCb) {
    sendMessage({
      method: 'logout'
    }, successCb, errorCb);
  };

  var requestEmailVerification = function requestEmailVerification(email, uid,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'requestEmailVerification',
      email: email,
      uid: uid,
    }, successCb, errorCb);
  };

  var verifyPassword = function verifyPassword(password,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'verifyPassword',
      password: password
    }, successCb, errorCb);
  };

  var checkPhoneExistence = function checkPhoneExistence(phone,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'checkPhoneExistence',
      phone: phone
    }, successCb, errorCb);
  };

  var checkEmailExistence = function checkEmailExistence(email,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'checkEmailExistence',
      email: email
    }, successCb, errorCb);
  };

  var resolvePhoneVerification = function resolvePhoneVerification(phone,
                                                       uid,
                                                       verificationId,
                                                       code,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'resolvePhoneVerification',
      phone: phone,
      uid: uid,
      verificationId: verificationId,
      code: code,
    }, successCb, errorCb);
  };

  var requestPhoneVerification = function requestPhoneVerification(phone,
                                                       uid,
                                                       successCb, errorCb) {
    sendMessage({
      method: 'requestPhoneVerification',
      phone: phone,
      uid: uid,
    }, successCb, errorCb);
  };

  var signIn = function signIn(accountId, password, successCb, errorCb) {
    sendMessage({
      method: 'signIn',
      accountId: accountId,
      password: password
    }, successCb, errorCb);
  };

  // altPhone, altEmail, yob, birthday, gender is set in info
  var signUp = function signUp(phone, email, password, info, successCb, errorCb) {
    sendMessage({
      method: 'signUp',
      phone: phone,
      email: email,
      password: password,
      info: info
    }, successCb, errorCb);
  };

  // altPhone, altEmail, yob, birthday, gender is set in info
  var updateAccount = function updateAccount(phone, email, password, info, successCb, errorCb) {
    sendMessage({
      method: 'updateAccount',
      phone: phone,
      email: email,
      password: password,
      info: info
    }, successCb, errorCb);
  };

  var changePassword = function changePassword(oldPassword, newPassword,
                                               successCb, errorCb) {
    sendMessage({
      method: 'changePassword',
      oldPassword: oldPassword,
      newPassword: newPassword
    }, successCb, errorCb);
  };

  var verificationStatus = function verificationStatus(email, successCb,
                                                       errorCb) {
    sendMessage({
      method: 'verificationStatus',
      email: email
    }, successCb, errorCb);
  };

  var deleteAccount = function deleteAccount(successCb,
                                                       errorCb) {
    sendMessage({
      method: 'deleteAccount',
    }, successCb, errorCb);
  };

  return {
    'getAccounts': getAccounts,
    'logout': logout,
    'requestEmailVerification': requestEmailVerification,
    'requestPhoneVerification': requestPhoneVerification,
    'resolvePhoneVerification': resolvePhoneVerification,
    'checkPhoneExistence': checkPhoneExistence,
    'checkEmailExistence': checkEmailExistence,
    'verifyPassword': verifyPassword,
    'signIn': signIn,
    'signUp': signUp,
    'changePassword': changePassword,
    'verificationStatus': verificationStatus,
    'deleteAccount': deleteAccount,
    'updateAccount': updateAccount
  };

}();
