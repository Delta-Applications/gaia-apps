/* exported SimSettingsHelper */
/* global SIMSlotManager, SettingsListener */
'use strict';

(function(exports) {
  // we have to make sure we are in DSDS
  if (!SIMSlotManager.isMultiSIM()) {
    return;
  }

  var SimSettingsHelper = {
    AUTOREBOOT_TIME_INTERVAL: 3000,
    ALWAYS_ASK_OPTION_VALUE: -1,
    initFromDB: false,
    iccIds: [null, null],
    lastcardsState: ['', ''],
    notification: null,
    timer: null,
    hotPlugHandler: null,
    skipIccCmd: true,
    pendingForceSet: false,
    carrierSimMatchInfo: [],
    resetDataFlag: false,
    carrierSimMatchResult: [],
    start: function ssh_init() {
      this.loadCarrierSimMatchInfo();
      this.loadResetDataFlag();
      if (SIMSlotManager.ready) {
        this.initSimSettings();
      } else {
        window.addEventListener('simslotready', this.initSimSettings.bind(this));
        if (SIMSlotManager.noSIMCardOnDevice()) {
          this.skipIccCmd = false;
        }
      }
      window.addEventListener('logohidden', () => {
        this.observerSimCardHotPlug();
      });
      this.observeUserSimSettings();
      Service.register('updateDefaultServiceSettings', this);
    },

    matchSimInfo: function ssh_matchSimInfo(iccCard, matchInfo) {
      return new Promise(resolve => {
        if (iccCard && iccCard.iccInfo &&
          iccCard.iccInfo.mcc === matchInfo.mcc &&
          iccCard.iccInfo.mnc === matchInfo.mnc) {
          if (matchInfo.mvno_type) {
            let request = iccCard.matchMvno(matchInfo.mvno_type,
              matchInfo.mvno_match_data);
            request.onsuccess = () => {
              resolve(request.result);
            };
            request.onerror = () => {
              resolve(false);
            };
          } else {
            resolve(true);
          }
        } else {
          resolve(false);
        }
      });
    },

    isCarrierSimCard: function ssh_isCarrierSimCard(index) {
      return new Promise(resolve => {
        const iccManager = window.navigator.mozIccManager;
        const iccCard =
          iccManager.getIccById(navigator.mozMobileConnections[index].iccId);
        const carrierInfo = this.carrierSimMatchInfo;
        if (carrierInfo && iccCard) {
          let matchPromises = [];
          Array.prototype.forEach.call(carrierInfo, (matchInfo) => {
            matchPromises.push(this.matchSimInfo(iccCard, matchInfo));
          });
          Promise.all(matchPromises).then(retvals => {
            if (retvals.find(retval => retval)) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      });
    },

    loadCarrierSimMatchInfo: function ssh_loadCarrierSimMatchInfo() {
      // [{
      // 'mcc':
      // 'mnc':
      // 'mvno_type':
      // 'mvno_match_data':
      // }, {...]]
      let key = 'carrier.sim.match.info';
      let lock = navigator.mozSettings.createLock();
      lock.get(key).then((value) => {
        this.carrierSimMatchInfo = value[key];
      });
      lock.forceClose();
    },

    loadResetDataFlag: function ssh_loadCarrierSimMatchInfo() {
      let key = 'change-sim.rematch.outgoingData';
      let lock = navigator.mozSettings.createLock();
      lock.get(key).then((value) => {
        this.resetDataFlag = value[key];
      });
      lock.forceClose();
    },

    updateDefaultServiceSettings:
      function ssh_updateDefaultServiceSettings(forceSet) {
      let cardsState = [null, null];

      SIMSlotManager.getSlots().forEach((slot, index) => {
        if (!slot.simCard) {
          cardsState[index] = null;
        } else {
          let cardState = slot.getCardState();
          cardsState[index] = cardState === 'ready' ? 'ready' : 'locked';
        }
      });

      if (cardsState[0] === this.lastcardsState[0] &&
        cardsState[1] === this.lastcardsState[1]) {
        return;
      }

      if (forceSet || this.pendingForceSet ||
        (cardsState[0] !== 'locked' && cardsState[1] !== 'locked')) {
        if (!this.initFromDB) {
          this.pendingForceSet = true;
          return;
        }
        this.pendingForceSet = false;
        this.lastcardsState = cardsState;
        if (cardsState[0] !== 'locked' && cardsState[1] !== 'locked') {
          Promise.all([this.isCarrierSimCard(0), this.isCarrierSimCard(1)])
            .then(retvals => {
            navigator.mozSettings.createLock().set({
              'carrier.sim.match.result': retvals
            });
            this.carrierSimMatchResult = retvals;
            this.simslotUpdatedHandler();
          });
        } else {
          this.simslotUpdatedHandler();
        }
      }
    },

    initSimSettings: function ssh_recordCurrentIccIds(evt) {
      var conns = window.navigator.mozMobileConnections;
      for (var i = 0; i < conns.length; i++) {
        this.iccIds[i] = conns[i].iccId;
      };
      this.updateDefaultServiceSettings();
      this.skipIccCmd = false;
    },

    _hotPlugHandler: function(evt) {
      if (!Service.query('supportSimHotswap')) {
        return;
      }
      if (!this.skipIccCmd) {
        let contentId = 'sim-hot-plug';
        if (evt.type === 'iccundetected' && SIMSlotManager.noSIMCardOnDevice()) {
          contentId = 'sim-hot-plug-empty';
        }
        this.skipIccCmd = true;
        Service.request('DialogService:show', {
          header: 'sim-confirmation-title',
          content: contentId,
          ok: 'ok',
          type: 'alert',
          onOk: () => {
            clearTimeout(this.timer);
            Service.request('startPowerOff', true, 'sim-hot-plug');
          }
        });
        this.timer = window.setTimeout(() => {
          Service.request('startPowerOff', true, 'sim-hot-plug-timeout');
        }, this.AUTOREBOOT_TIME_INTERVAL)
      }
    },

    observerSimCardHotPlug: function() {
      let iccManager = navigator.mozIccManager;
      this.hotPlugHandler = this._hotPlugHandler.bind(this);
      iccManager.addEventListener('iccdetected', this.hotPlugHandler);
      iccManager.addEventListener('iccundetected', this.hotPlugHandler);
    },

    overrideUserSimSettings: function() {
      this.setServiceOnCard('outgoingCall');
      this.setServiceOnCard('outgoingMessages');
      this.setServiceOnCard('outgoingData');
    },

    simslotUpdatedHandler: function() {
      this.overrideUserSimSettings();
      if (!this['ril.notFirst.sim.settings']) {
        SettingsListener.getSettingsLock().set({
          'ril.notFirst.sim.settings': true
        });
      }
      Service.request('simConfigRun').catch((e) => {
        console.error('simConfigRun Customization failed! ' + e);
      });
    },

    showSimCardConfirmation: function(cardIndex) {
      if (this.notification) {
        this.notification.close();
        this.notification = null;
      }
      if (SIMSlotManager.noSIMCardOnDevice() ||
        !this['ril.notFirst.sim.settings']) {
        return null;
      }
      var _ = navigator.mozL10n.get;
      var title = _('sim-confirmation-notice-title') || '';
      var body = _('sim-confirmation-notice') || '';

      var notification = new window.Notification(title, {
        body: body,
        tag: 'simCard',
        data: {
          icon: 'sim-card'
        },
        mozbehavior: {
          showOnlyOnce: true
        }
      });

      notification.onclick = function(cardIndex) {
        var _ = navigator.mozL10n.get;
        var header = _('sim-confirmation-title');
        var content = _('sim-confirmation-content', {
          'n': cardIndex + 1
        });
        if (this.notification) {
          this.notification.close();
          this.notification = null;
        }

        Service.request('DialogService:show', {
          header: header,
          content: content,
          translated: true,
          type: 'alert',
          onOk: () => {}
        });
      }.bind(this, cardIndex);
      return notification;
    },

    observeUserSimSettings: function ssh_observeUserSimSettings() {
      var mozKeys = [];
      var Settings = navigator.mozSettings;
      var servicePromises = [];
      mozKeys.push('ril.telephony.defaultServiceId');
      mozKeys.push('ril.voicemail.defaultServiceId');
      mozKeys.push('ril.telephony.defaultServiceId.iccId');
      mozKeys.push('ril.voicemail.defaultServiceId.iccId');

      mozKeys.push('ril.sms.defaultServiceId');
      mozKeys.push('ril.sms.defaultServiceId.iccId');

      mozKeys.push('ril.mms.defaultServiceId');
      mozKeys.push('ril.data.defaultServiceId');
      mozKeys.push('ril.mms.defaultServiceId.iccId');
      mozKeys.push('ril.data.defaultServiceId.iccId');
      mozKeys.push('ril.notFirst.sim.settings');
      mozKeys.push('ril.sim.iccIds');

      mozKeys.forEach((eachKey) => {
        var promise = new Promise((resolve) => {
          var lock = navigator.mozSettings.createLock();
          var request = lock.get(eachKey);
          request.onsuccess = () => {
            this[eachKey] = request.result[eachKey];
            resolve();
          };
          request.onerror = () => {
            resolve();
          }
          Settings.addObserver(eachKey, function onChange(event) {
            var value = event.settingValue;
            // 1. 'newPrefCard' --> set data to other card
            // 2. 'oldCard' --> reboot device and card not change
            // 3. 'recordPrefCard' -->  insert new card and the card is the last
            //                          card that user set mobile data
            // 4. 'noSimCard' --> no sim card in device
            // 5. 'noMobileData' --> the card not set mobile data.
            console.log('SimSettingsHelper ' + eachKey + ' : ' + value);
            if (eachKey === 'ril.data.defaultServiceId' &&
              Service.query('supportSwitchPrimarysim')) {
              var cardsState = [{
                state: 'newPrefCard'
              }, {
                state: 'newPrefCard'
              }];
              var anotherCardIndex = value^1;
              if (this['ril.sim.iccIds'][anotherCardIndex] ===
                this.iccIds[anotherCardIndex] && this[eachKey] === value) {
                cardsState[anotherCardIndex].state = 'oldCard';
              } else {
                cardsState[anotherCardIndex].state = 'noMobileData';
              }
              // No simCard in device
              if (!this.iccIds[value]) {
                cardsState[value].state = 'noSimCard';
              } else if (this.iccIds[value] ===
                this['ril.data.defaultServiceId.iccId']) {
                cardsState[value].state = 'recordPrefCard';
              } else if (this['ril.sim.iccIds'][value] === this.iccIds[value] &&
                this[eachKey] === value) {
                cardsState[value].state = 'oldCard';
              }
              Service.request('setPreferredNetworkType', cardsState);
            }

            /* << [BTS-1625]: BDC kanxj 201900524 add to change the default value of message when sim changed */
            if (eachKey === 'ril.sms.defaultServiceId') {
              let CardIndex = value;
              if (CardIndex != this.ALWAYS_ASK_OPTION_VALUE) {
                this.updateMessagesSettings(CardIndex);
              }
            }
            /* >> [BTS-1625] */

            this[eachKey] = value;
            // For support SIM1* SIM2* mode, record
            // ril.data.defaultServiceId.iccID in settings app
            if (eachKey === 'ril.data.defaultServiceId.iccId') {
              if (this.notification) {
                this.notification.close();
                this.notification = null;
              }
            } else if (eachKey.indexOf('iccId') < 0 && value >= 0 &&
              (eachKey !== 'ril.data.defaultServiceId' ||
              !this['ril.notFirst.sim.settings'] || this.resetDataFlag) &&
              this.lastcardsState[0] !== 'locked' &&
              this.lastcardsState[1] !== 'locked') {
              var setObj = {};
              setObj[eachKey + '.iccId'] = this.iccIds[value];
              SettingsListener.getSettingsLock().set(setObj);
            }
          }.bind(this));
        });
        servicePromises.push(promise);
      });
      Promise.all(servicePromises).then(() => {
        this.initFromDB = true;
        if (SIMSlotManager.ready || SIMSlotManager.noSIMCardOnDevice()) {
          this.updateDefaultServiceSettings();
        }
      });
    },

    /* << [BTS-1625]: BDC kanxj 201900524 add to change the default value of message when sim changed */
    updateMessagesSettings: function ssh_updateMessagesSettings(simIndex) {
      let matchInfo = {
        "clientId": "0",
      };
      matchInfo.clientId = simIndex;

      let mP1 = navigator.customization.getValueForCarrier(matchInfo, "ril.mms.requestStatusReport.enabled");
      let mP2 = navigator.customization.getValueForCarrier(matchInfo, "messaging.mms.max.size");
      let mP3 = navigator.customization.getValueForCarrier(matchInfo, "ril.mms.service_mode");
      let mP4 = navigator.customization.getValueForCarrier(matchInfo, "ril.sms.requestStatusReport.enabled");
      let mP5 = navigator.customization.getValueForCarrier(matchInfo, "ril.sms.encoding_mode");
      let mP6 = navigator.customization.getValueForCarrier(matchInfo, "def.enable.cellbroadcast");
      let mP7 = navigator.customization.getValueForCarrier(matchInfo, "voice-input.enabled");

      Promise.all([mP1, mP2, mP3, mP4, mP5, mP6, mP7]).then(function(values) {
        let mmsStatusReport = JSON.stringify(values[0]) === 'true' ? true : false;
        let temp = JSON.stringify(values[1]);
        let mmsMaxSize = 1;
        if (temp === '0') {
          mmsMaxSize = 0;
        } else if (temp === '2'){
          mmsMaxSize = 2;
        } else if (temp === '3') {
          mmsMaxSize = 3;
        }
        let mmsServiceMode = JSON.stringify(values[2]) === '1' ? 1 : 0;
        let smsStatusReport = JSON.stringify(values[3]) === 'true' ? true : false;
        let smsEncodingMode = JSON.stringify(values[4]) === '1' ? 1 : 0;
        let cbEnable = JSON.stringify(values[5]) === 'true' ? true : false;
        let voiceInput = JSON.stringify(values[6]) === 'true' ? true : false;

        console.log('updateMessagesSettings updateUI : mmsStatusReport: ' + mmsStatusReport + " mmsMaxSize: " + mmsMaxSize
                 + " mmsServiceMode = " + mmsServiceMode + " simIndex = " + simIndex);
        SettingsListener.getSettingsLock().set({
                'ril.mms.requestStatusReport.enabled': mmsStatusReport });
        SettingsListener.getSettingsLock().set({
                'messaging.mms.max.size': mmsMaxSize });
        SettingsListener.getSettingsLock().set({
                'ril.mms.service_mode': mmsServiceMode });

        console.log('updateMessagesSettings updateUI : smsStatusReport: ' + smsStatusReport + " smsEncodingMode: " + smsEncodingMode
                  + " cbEnable = " + cbEnable + " voiceInput = " + voiceInput);
        SettingsListener.getSettingsLock().set({
                'ril.sms.requestStatusReport.enabled': smsStatusReport });
        SettingsListener.getSettingsLock().set({
                'ril.sms.encoding_mode': smsEncodingMode });
        SettingsListener.getSettingsLock().set({
                'def.enable.cellbroadcast': cbEnable });
        SettingsListener.getSettingsLock().set({
                'voice-input.enabled': voiceInput });
      });
    },
    /* >> [BTS-1625] */

    setServiceOnCard: function ssh_setServiceOnCard(serviceName) {
      var mozKeys = [];
      var notFirstSet = this['ril.notFirst.sim.settings'];
      var cardIndex = this.ALWAYS_ASK_OPTION_VALUE;
      switch (serviceName) {
        case 'outgoingCall':
          mozKeys.push('ril.telephony.defaultServiceId');
          mozKeys.push('ril.voicemail.defaultServiceId');
          break;

        case 'outgoingMessages':
          mozKeys.push('ril.sms.defaultServiceId');
          mozKeys.push('ril.mms.defaultServiceId');
          break;

        case 'outgoingData':
          mozKeys.push('ril.data.defaultServiceId');
          if (this.resetDataFlag &&
            (this['ril.sim.iccIds'][0] !== this.iccIds[0] ||
            this['ril.sim.iccIds'][1] !== this.iccIds[1])) {
            notFirstSet = false;
          }
          break;
      }
      // First time run and first set.
      if (!notFirstSet) {
        if (SIMSlotManager.noSIMCardOnDevice()) {
          cardIndex = this.ALWAYS_ASK_OPTION_VALUE;
        } else {
          cardIndex = SIMSlotManager.isSIMCardAbsent(0) ? 1 : 0;
          if (serviceName === 'outgoingData' &&
            this.carrierSimMatchResult[0] === false &&
            this.carrierSimMatchResult[1] === true) {
            cardIndex = 1;
          }
        }
      }

      if (this.lastcardsState[0] === 'locked' &&
        this.lastcardsState[1] === 'ready') {
        cardIndex = 1;
      } else if (this.lastcardsState[1] === 'locked' &&
        this.lastcardsState[0] === 'ready') {
        cardIndex = 0;
      }

      mozKeys.forEach((eachKey) => {
        if (cardIndex === this.ALWAYS_ASK_OPTION_VALUE && notFirstSet) {
          // Not first set, need compare remembered iccid
          // if not matched, then set to -1. (always ask)
          var iccId = this[eachKey + '.iccId'];
          if (iccId) {
            if (iccId === this.iccIds[0] &&
              this.lastcardsState[0] === 'ready') {
              cardIndex = 0;
            } else if (iccId === this.iccIds[1] &&
              this.lastcardsState[1] === 'ready') {
              cardIndex = 1;
            }
          }
        }
        if (eachKey === 'ril.data.defaultServiceId') {
          if (cardIndex === this.ALWAYS_ASK_OPTION_VALUE) {
            // 1. No simcard
            // 2. slot1 empty & slot2 new simcard
            // 3. slot1 new simcard & slot2 empty
            // 4. slot1 & slot2 both new simcards (slot1 is ready)
            // 5. slot1 & slot2 both new simcards (slot1  locked, slot2 ready)
            // 1, 3, 4 cardIndex set to 0, 2 & 5 set to 1
            var slots = SIMSlotManager.getSlots();
            if (slots[0].isAbsent() && !slots[1].isAbsent()) {
              cardIndex = 1;
            } else {
              cardIndex = 0;
            }
          }

          //[BTS-2851] BDC zhangwp 20191011 remove the conflict logic, follow fih logic. begin
/*
          if (this.lastcardsState[0] !== 'locked' &&
            this.lastcardsState[1] !== 'locked' &&
            (!this['ril.sim.iccIds'] ||
            this['ril.sim.iccIds'][cardIndex] !== this.iccIds[cardIndex] ||
            this['ril.data.defaultServiceId'] !== cardIndex)) {
            this.notification = this.showSimCardConfirmation(cardIndex);
          }
*/
          //[BTS-2851] BDC zhangwp 20191011 remove the conflict logic, follow fih logic. end

          var iccIdsSetObj = {};
          iccIdsSetObj['ril.sim.iccIds'] = this.iccIds;
          SettingsListener.getSettingsLock().set(iccIdsSetObj);
        }
        var setObj = {};
        setObj[eachKey] = cardIndex;
        //BDC zhangwp 20190514 removed, do it in bootstrap. begin
/*
        SettingsListener.getSettingsLock().set(setObj);
*/
        //BDC zhangwp 20190514 removed, do it in bootstrap. end
      });
    }
  };
  exports.SimSettingsHelper = SimSettingsHelper;
})(window);
