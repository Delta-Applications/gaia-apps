define("modules/dialog_manager",["require","modules/panel_cache"],function(t){var e=t("modules/panel_cache"),n=function(){this.OVERLAY_SELECTOR=".settings-dialog-overlay",this._overlayDOM=document.querySelector(this.OVERLAY_SELECTOR)};n.prototype={_loadPanel:function(t){var e=new Promise(function(e){var n=document.getElementById(t);if(n.dataset.rendered)return e(),void 0;if(n.dataset.rendered=!0,n.dataset.requireSubPanels){for(var i='section[id^="'+n.id+'-"]',o=document.querySelectorAll(i),r=0,a=o.length;a>r;r++)LazyLoader.load([o[r]]);LazyLoader.load([n],e)}else LazyLoader.load([n],e)});return e},_initializedL10n:function(){var t=new Promise(function(t){navigator.mozL10n.once(t)});return t},_getPanel:function(t){var n=new Promise(function(n){e.get(t,function(t){n(t)})});return n},_showOverlay:function(t){this._overlayDOM.hidden=!t},_transit:function(t,e){var n=new Promise(function(n){var i=e.panel;i.addEventListener("transitionend",function o(e){"close"!==t&&"open"!==t||"visibility"!==e.propertyName||("close"===t&&(i.hidden=!0),i.removeEventListener("transitionend",o),n())}),"open"===t&&(i.hidden=!1),setTimeout(function(){"open"===t?(i.classList.add("current"),window.dispatchEvent(new CustomEvent("dialog-panel-transit"))):i.classList.remove("current")},150)});return n},_open:function(t,e){var n,i=this;return Promise.resolve().then(function(){return i._loadPanel(t.panel.id)}).then(function(){return i._initializedL10n()}).then(function(){return i._getPanel(t.panel.id)}).then(function(i){return n=i,n.beforeShow(t.panel,e)}).then(function(){return t.init(),t.initUI(),t.bindEvents(),"zoom-in-80"===t.TRANSITION_CLASS&&i._showOverlay(!0),i._transit("open",t,e)}).then(function(){return n.show(t.panel,e)})},_close:function(t,e){var n,i,o=this;return Promise.resolve().then(function(){return o._getPanel(t.panel.id)}).then(function(t){n=t;var i;return i=n.onSubmit&&"submit"===e._type?n.onSubmit():n.onCancel&&"cacnel"===e._type?n.onCancel():Promise.resolve()}).then(function(t){return i=t,n.beforeHide()}).then(function(){return o._transit("close",t,e)}).then(function(){var e;return"prompt-dialog"===t.DIALOG_CLASS?e=t.getResult():i&&(e=i),t.cleanup(),"zoom-in-80"===t.TRANSITION_CLASS&&o._showOverlay(!1),e})},_navigate:function(t,e,n){return t="open"===t?"_open":"_close",this[t](e,n)},open:function(t,e){return this._navigate("open",t,e)},close:function(t,e,n){return n._type=e,this._navigate("close",t,n)}};var i=new n;return i}),define("modules/dialog/base_dialog",["require"],function(){var t=function(t,e){this.panel=t,this._options=e||{}};return t.prototype.DIALOG_CLASS="dialog",t.prototype.TRANSITION_CLASS="fade",t.prototype.SUBMIT_BUTTON_SELECTOR='[type="submit"]',t.prototype.CANCEL_BUTTON_SELECTOR='[type="reset"]',t.prototype.MESSAGE_SELECTOR=".settings-dialog-message",t.prototype.TITLE_SELECTOR=".settings-dialog-title",t.prototype.init=function(){this.TRANSITION_CLASS=this._options.transition||this.TRANSITION_CLASS,this.panel.classList.add(this.DIALOG_CLASS),this.panel.classList.add(this.TRANSITION_CLASS)},t.prototype.initUI=function(){var t=this._options.message,e=this._options.title,n=this._options.submitButton,i=this._options.cancelButton;this._updateMessage(t),this._updateTitle(e),this._updateSubmitButton(n),this._updateCancelButton(i)},t.prototype.bindEvents=function(){var t=this;this.getSubmitButton().onclick=function(){t._options.onWrapSubmit()},this.getCancelButton().onclick=function(){t._options.onWrapCancel()}},t.prototype._updateMessage=function(t){var e=this.panel.querySelector(this.MESSAGE_SELECTOR);e&&t&&(t=this._getWrapL10nObject(t),navigator.mozL10n.setAttributes(e,t.id,t.args))},t.prototype._updateTitle=function(t){var e=this.panel.querySelector(this.TITLE_SELECTOR);e&&t&&(t=this._getWrapL10nObject(t),navigator.mozL10n.setAttributes(e,t.id,t.args))},t.prototype._updateSubmitButton=function(t){var e=this.getSubmitButton();e&&t&&(t=this._getWrapL10nObject(t),navigator.mozL10n.setAttributes(e,t.id,t.args),e.className=t.style||"recommend")},t.prototype._updateCancelButton=function(t){var e=this.getCancelButton();e&&t&&(t=this._getWrapL10nObject(t),navigator.mozL10n.setAttributes(e,t.id,t.args),e.className=t.style||"")},t.prototype._getWrapL10nObject=function(t){if("string"==typeof t)return{id:t,args:null};if("object"==typeof t){if("undefined"==typeof t.id)throw new Error("You forgot to put l10nId - "+JSON.stringify(t));return{id:t.id,args:t.args||null,style:t.style}}throw new Error("You are using the wrong L10nObject, please check its format again")},t.prototype.getDOM=function(){return this.panel},t.prototype.getSubmitButton=function(){return this.panel.querySelector(this.SUBMIT_BUTTON_SELECTOR)},t.prototype.getCancelButton=function(){return this.panel.querySelector(this.CANCEL_BUTTON_SELECTOR)},t.prototype.cleanup=function(){"panel-dialog"!==this.DIALOG_CLASS&&(this._updateTitle("settings-"+this.DIALOG_CLASS+"-header"),this._updateSubmitButton("ok"),this._updateCancelButton("cancel")),this.panel.classList.remove(this.DIALOG_CLASS),this.panel.classList.remove(this.TRANSITION_CLASS)},t}),define("modules/dialog/panel_dialog",["require","modules/dialog/base_dialog"],function(t){var e=t("modules/dialog/base_dialog"),n=function(t,n){e.call(this,t,n)};return n.prototype=Object.create(e.prototype),n.prototype.constructor=n,n.prototype.DIALOG_CLASS="panel-dialog",n.prototype.TRANSITION_CLASS="fade",function(t,e){return new n(t,e)}}),define("modules/dialog/alert_dialog",["require","modules/dialog/base_dialog"],function(t){var e=t("modules/dialog/base_dialog"),n=function(t,n){e.call(this,t,n)};return n.prototype=Object.create(e.prototype),n.prototype.constructor=n,n.prototype.DIALOG_CLASS="alert-dialog",n.prototype.TRANSITION_CLASS="fade",n.prototype.bindEvents=function(){var t=this;this.getSubmitButton().onclick=function(){t._options.onWrapSubmit()}},function(t,e){return new n(t,e)}}),define("modules/dialog/confirm_dialog",["require","modules/dialog/base_dialog"],function(t){var e=t("modules/dialog/base_dialog"),n=function(t,n){e.call(this,t,n)};return n.prototype=Object.create(e.prototype),n.prototype.constructor=n,n.prototype.DIALOG_CLASS="confirm-dialog",n.prototype.TRANSITION_CLASS="fade",n.prototype.bindEvents=function(){var t=this;this.getSubmitButton().onclick=function(){t._options.onWrapSubmit()},this.getCancelButton().onclick=function(){t._options.onWrapCancel()}},function(t,e){return new n(t,e)}}),define("modules/dialog/prompt_dialog",["require","modules/dialog/base_dialog"],function(t){var e=t("modules/dialog/base_dialog"),n=function(t,n){e.call(this,t,n)};return n.prototype=Object.create(e.prototype),n.prototype.constructor=n,n.prototype.DIALOG_CLASS="prompt-dialog",n.prototype.TRANSITION_CLASS="fade",n.prototype.INPUT_SELECTOR=".settings-dialog-input",n.prototype.bindEvents=function(){var t=this;this.getSubmitButton().onclick=function(){t._options.onWrapSubmit()},this.getCancelButton().onclick=function(){t._options.onWrapCancel()}},n.prototype.initUI=function(){e.prototype.initUI.call(this),this.getInput().value=this._options.defaultValue||""},n.prototype.getInput=function(){return this.panel.querySelector(this.INPUT_SELECTOR)},n.prototype.getResult=function(){return this.getInput().value},function(t,e){return new n(t,e)}}),define("modules/dialog_service",["require","settings","modules/defer","modules/dialog_manager","modules/dialog/panel_dialog","modules/dialog/alert_dialog","modules/dialog/confirm_dialog","modules/dialog/prompt_dialog"],function(t){var e=t("settings"),n=t("modules/defer"),i=t("modules/dialog_manager"),o=t("modules/dialog/panel_dialog"),r=t("modules/dialog/alert_dialog"),a=t("modules/dialog/confirm_dialog"),s=t("modules/dialog/prompt_dialog"),c=function(){this._navigating=!1,this._pendingRequests=[],this._settingsAlertDialogId="settings-alert-dialog",this._settingsBaseDialogId="settings-base-dialog",this._settingsConfirmDialogId="settings-confirm-dialog",this._settingsPromptDialogId="settings-prompt-dialog"};c.prototype={alert:function(t,e){var n=e||{};return this.show(this._settingsAlertDialogId,{type:"alert",message:t,title:n.title,submitButton:n.submitButton})},confirm:function(t,e){var n=e||{};return this.show(this._settingsConfirmDialogId,{type:"confirm",message:t,title:n.title,submitButton:n.submitButton,cancelButton:n.cancelButton})},prompt:function(t,e){var n=e||{};return this.show(this._settingsPromptDialogId,{type:"prompt",message:t,title:n.title,defaultValue:n.defaultValue,submitButton:n.submitButton,cancelButton:n.cancelButton})},show:function(t,c,u){var l,d,f=this,p=document.getElementById(t),h=e.currentPanel,g=c||{};if(l=u?u:n(),this._navigating)this._pendingRequests.push({defer:l,panelId:t,userOptions:c});else if("#"+t===h)l.reject("You are showing the same panel #"+t);else{switch(g.onWrapSubmit=function(){i.close(d,"submit",g).then(function(t){l.resolve({type:"submit",value:t}),f._navigating=!1,f._execPendingRequest()})},g.onWrapCancel=function(){i.close(d,"cancel",g).then(function(t){l.resolve({type:"cancel",value:t}),f._navigating=!1,f._execPendingRequest()})},g.type){case"alert":d=r(p,g);break;case"confirm":d=a(p,g);break;case"prompt":d=s(p,g);break;default:d=o(p,g)}this._navigating=!0,i.open(d,g)}return l.promise},_execPendingRequest:function(){var t=this._pendingRequests.pop();t&&this.show(t.panelId,t.userOptions,t.defer)}};var u=new c;return u});