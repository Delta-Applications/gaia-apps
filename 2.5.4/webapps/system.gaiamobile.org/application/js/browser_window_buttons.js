
(function(exports){'use strict';let _id=0;let BrowserWindowButtons=function(app){this.app=app;this.requestTipsShow=true;this.instanceID=_id++;this.hideTipsHandler=null;this.hideButtonsHandler=null;this.containerElement=app.element;this.render();};BrowserWindowButtons.prototype=Object.create(exports.BaseUI.prototype);BrowserWindowButtons.prototype.CLASS_NAME='BrowserWindowButtons';BrowserWindowButtons.prototype.DEBUG=false;BrowserWindowButtons.prototype.view=function(){let className=this.CLASS_NAME+this.instanceID;return`<div class='browser-window-buttons hidden' id='${className}'>
              <div class='button bounceInRight tips' data-l10n-id='tips'>
              </div>
              <div class='button home'>
                <div class='icon' data-icon='browser-home'></div>
              </div>
              <div class='button menu'>
                <div class='icon' data-icon='menu'></div>
              </div>
              <div class='button back'>
                <div class='icon' data-icon='cancel'></div>
              </div>
              <div class='button sound'>
                <div class='icon' data-icon='sound-max'></div>
              </div>
            </div>`;};BrowserWindowButtons.prototype.render=function(){this.publish('willrender');this.app.element.insertAdjacentHTML('beforeend',this.view());this._fetchElements();this._registerEvents();this.publish('rendered');};BrowserWindowButtons.prototype.show=function({showTips,mode}){const dom=this.app.browser.element;if(document.activeElement!==dom&&!dom.contains(document.activeElement)){return;}
const softkeyPanel=document.getElementById('softkeyPanel');if(softkeyPanel){softkeyPanel.classList.add('hidden');}
this.showTips(showTips);this.element.classList.remove('hidden')
if(this.hideButtonsHandler){window.clearTimeout(this.hideButtonsHandler);this.hideButtonsHandler=null;}
if(document.mozFullScreen||mode==='popup-window'){this.element.classList.add('fullscreen');if(document.mozFullScreen){const AUTO_HIDDEN_INTERVAL=5000;this.hideButtonsHandler=window.setTimeout(()=>{this.element.classList.add('hidden')
this.hideButtonsHandler=null;},AUTO_HIDDEN_INTERVAL);}}else{this.element.classList.remove('fullscreen');}};BrowserWindowButtons.prototype.hide=function(){this.element.classList.add('hidden')};BrowserWindowButtons.prototype.showTips=function(showFlag){const AUTO_HIDDEN_INTERVAL=10000;this.requestTipsShow=showFlag;if(showFlag){this.tipsButton.classList.remove('hidden');if(this.hideTipsHandler){window.clearTimeout(this.hideTipsHandler);this.hideTipsHandler=null;}
this.hideTipsHandler=window.setTimeout(()=>{this.showTips(false);this.hideTipsHandler=null;},AUTO_HIDDEN_INTERVAL);}else{this.tipsButton.classList.add('hidden');}};BrowserWindowButtons.prototype._fetchElements=function(){this.element=this.containerElement.querySelector('.browser-window-buttons');this.tipsButton=this.element.querySelector('.tips');if(Service.query('hasVolumeKey')){const soundButton=this.element.querySelector('.sound');soundButton.classList.add('hidden');}};exports.BrowserWindowButtons=BrowserWindowButtons;}(window));