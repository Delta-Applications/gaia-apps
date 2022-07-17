'use strict';
/*
 * This module is for default tone setting for AMX, we will load it only when
 * the first time after factory reset.
 *
 * Please use the LazyLoader to load this, then simply call the perform() to
 * execute the necessary migrations for the tones. There are two tone types
 * we can upgrade, one is ringtone and the other one is alerttone, just pass
 * them to the perform() and the upgrader will upgrade the tone type you want.
 */

(function(exports) {
  function AmxToneInit() {
  }

  // Helper to get the default tone's info.
  AmxToneInit.prototype.getInfo = function at_getInfo(type) {
    var info;

    switch (type) {
      case 'ringtone':
        info = {
          settingsBase: 'dialer.ringtone',
          baseURL: '/shared/resources/media/ringtones/',
          name: 'Institucional_Rubrica',
          filename: 'Institucional_Rubrica.ogg',
          mimetype: 'audio/ogg'
        };
        return info;
      case 'alerttone':
        info = {
          settingsBase: 'notification.ringtone',
          //baseURL: '/shared/resources/media/notifications/',
          baseURL: '/shared/resources/media/ringtones/',
          name: 'Institucional_Rubrica',
          filename: 'Institucional_Rubrica.ogg',
          mimetype: 'audio/ogg'
        };
        return info;
      default:
        throw new Error('tone type not supported');
    }
  };

  // Set the tone to default if needed.
  AmxToneInit.prototype.setDefault = function at_setDefault(type) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var info = self.getInfo(type);
      var url = info.baseURL + info.filename;
      xhr.open('GET', url);
      dump('AmxToneInit >>> url >>> '+url);
      xhr.overrideMimeType(info.mimetype);
      xhr.responseType = 'blob';
      xhr.send();
      xhr.onload = function() {
        var settings = {};
        var blob = xhr.response;
        var toneKey = info.settingsBase;
        var toneName = info.settingsBase + '.name';
        var toneIdKey = info.settingsBase + '.id';
        var toneDefaultIdKey = info.settingsBase + '.default.id';

        settings[toneKey] = blob;
        settings[toneName] = {l10nID : info.name };
        settings[toneIdKey] = 'builtin:' + type + '/' + info.name;
        settings[toneDefaultIdKey] = 'builtin:' + info.name;

        var request = navigator.mozSettings.createLock().set(settings);
        request.onsuccess = function() {
          resolve();
        };
        request.onerror = function() {
          reject();
        };
      };
      xhr.onerror = function() {
        reject();
      };
    });
  };

  // Check the current tone is the built-in one or some customized one.
  AmxToneInit.prototype.perform = function at_perform(type) {
    dump('AmxToneInit >>> perform type >>>' + type);
    if(type == 'both'){
      this.setDefault('ringtone');
      this.setDefault('alerttone');
    }else{
      this.setDefault(type);
    }
  };

  exports.AmxToneInit = AmxToneInit;

  /*
   * We are lazy loading the AmxToneInit so after this module/js loaded, the
   * AmxToneInit instance will be created and to be used directly.
   */
  exports.AmxToneInit = new AmxToneInit();
})(window);
