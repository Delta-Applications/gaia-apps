(function (exports) {
'use strict';

  let PbmapDialog = {

    USER_CONFIRMATION: 1,
    OBEX_PASSWORD: 2,
    _confirmDialog: null,
    _authDialog: null,

    _dialogIsShowing: false,
    _savedOption: null,
    _callback: null,
    _dialogIsWaiting: false,
    _dialogProfile: null,


    show: function(options, callback) {
      let self = this;
      let screen = document.getElementById('screen');
      let _ = navigator.mozL10n.get;
      let confirmMsg;

      console.log('pbmap dialog show: ' + this._dialogIsShowing + ' ' + options.profile);

      if (self._dialogIsShowing) {
        if (self._dialogProfile !== options.profile) {
          // Bug 31563, the pbap connection dialog is showing,
          // but user didn't reply, the second dialog message has come.
          // the map connectiong dialog also need show,
          // save the port and event, and then wait pbap dialog reply

          self._savedOption = options;
          self._callback = callback;
          self._dialogIsWaiting = true;
          return;
        } else {
          Service.request('DialogService:hide');
        }
      }

      self._dialogIsShowing = true;
      self._dialogProfile = options.profile;

      confirmMsg = options.profile === 'PBAP' ? 'confirmPbapMsg' : 'confirmMapMsg';

      if (options.type === self.USER_CONFIRMATION) {
        console.log('bluetooth show dialog');
        Service.request('DialogService:show', {
          header: _('confirmTitle'),
          content: _(confirmMsg, { deviceId: options.message }),
          ok: 'accept',
          type: 'confirm',
          onBack: () => {
            self.response();
            callback(false);
          },
          onCancel: () => {
            self.response();
            callback(false);
          },
          onOk: () => {
            self.response();
            callback(true);
          },
          translated: true
        });
      } else if (options.type === self.OBEX_PASSWORD) {
        self._dialogIsShowing = false;
        Service.request('DialogService:show', {
          header: 'confirmTitle',
          content: _(confirmMsg, { deviceId: options.message }),
          ok: 'confirm',
          type: 'prompt',
          onCancel: () => {
            callback({
              value: false,
              password: ''
            });
          },
          onBack: () => {
            callback({
              value: false,
              password: ''
            });
          },
          onOk: (value) => {
            callback({
              value: true,
              password: value
            });
          },
          translated: true
        });

        let customInput = window.document.getElementById('custom-input');
        if (customInput) {
          customInput.setAttribute('maxLength', '16');
        }
      }
    },

    response: function () {
      //Service.request('DialogService:hide');
      this._dialogIsShowing = false;

      if (this._dialogIsWaiting) {
        // waiting the last dialog has finished,
        // and then show the waiting dialog(map/pbap).
        this._dialogIsWaiting = false;
        setTimeout(() => {
          this.show(this._savedOption, this._callback);
        }, 100);
      }
    },


  };
  exports.PbmapDialog = PbmapDialog;
})(window);
