!function(t){function e(){window.addEventListener("moztimechange",this),window.addEventListener("timeformatchange",this)}e.HOME_CLOCK_FACE="home.clock.face",e.HOME_CLOCK_DISPLAY_DATE="home.clock.displayDate",e.HOME_CLOCK_VISIBLE="home.clock.visible",e.DIGITAL="digital",e.ANALOG="analog",e.BOLD_DIGITAL="bold-digital",e.oldValue={clockType:"digital",displayDate:!0,visible:!0},e.prototype={_clockType:null,_isDisplayDate:null,_visible:null,get clockType(){return this._clockType},set clockType(t){this._clockType=t===e.ANALOG?e.ANALOG:t===e.BOLD_DIGITAL?e.BOLD_DIGITAL:e.DIGITAL,this.render()},get isDisplayDate(){return this._isDisplayDate},set isDisplayDate(t){this._isDisplayDate=t,this.render()},get visible(){return this._visible},set visible(t){this._visible=t},showClockPanel:function(t){var e=this;this.getAllSettings(function(n){n&&e.render(),"undefined"!=typeof t&&t(n)})},render:function(){var t=new CustomEvent("clockchange",{detail:{clockPanel:document.querySelector("#clock-panel"),clockType:this._clockType,isDisplayDate:this._isDisplayDate,visible:this._visible},bubbles:!0,cancelable:!1});window.dispatchEvent(t)},getAllSettings:function(t){var e=!1,n=this;this.getClockParams(function(){"undefined"!=n._clockType&&null!=n._clockType?(e=!0,t(e)):t(e)})},getClockParams:function(t){function n(t){console.log("Clock panel - error : "+t)}function i(t){var e=o.get(t);return new Promise(function(n,i){e.onsuccess=function(){var i=e.result[t];n(i)},e.onerror=function(){var t=e.error;i(t)}})}var r=this,o=navigator.mozSettings.createLock(),a=[];a.push(i(e.HOME_CLOCK_FACE).then(function(t){r._clockType=t===e.ANALOG?e.ANALOG:t===e.DIGITAL?e.DIGITAL:e.BOLD_DIGITAL,e.oldValue.clockType=r._clockType},n)),a.push(i(e.HOME_CLOCK_DISPLAY_DATE).then(function(t){r._isDisplayDate=void 0!=t?t:!1,e.oldValue.displayDate=r._isDisplayDate},n)),a.push(i(e.HOME_CLOCK_VISIBLE).then(function(t){r._visible=void 0!=t?t:!1,e.oldValue.visible=r._visible},n)),Promise.all(a).then(function(){"undefined"!=typeof t&&t()})},saveDisplayDate:function(){var t=navigator.mozSettings.createLock(),n=this.isDisplayDate,i={};i[e.HOME_CLOCK_DISPLAY_DATE]=n,t.set(i)},saveClockFace:function(){var t=navigator.mozSettings.createLock(),n=this.clockType,i={};i[e.HOME_CLOCK_FACE]=n,t.set(i)},drawVisible:function(){if(this._visible){var t=new CustomEvent("clockpanelvisiblechange",{detail:{clockPanel:document.querySelector("#clock-panel")}});window.dispatchEvent(t)}},addObserver:function(){var t=this,n=function(n){console.log(n);var i=n.settingName,r=n.settingValue;if(i===e.HOME_CLOCK_FACE&&r!==e.oldValue.clockType||i===e.HOME_CLOCK_DISPLAY_DATE&&r!==e.oldValue.displayDate||i===e.HOME_CLOCK_VISIBLE&&r!==e.oldValue.visible){var o={messageL10nId:"clocks-updated",latency:2e3};Toaster.showToast(o)}t.showClockPanel()};window.navigator.mozSettings.addObserver(e.HOME_CLOCK_FACE,n),window.navigator.mozSettings.addObserver(e.HOME_CLOCK_DISPLAY_DATE,n),window.navigator.mozSettings.addObserver(e.HOME_CLOCK_VISIBLE,n)},setDefaultValues:function(){var t=navigator.mozSettings.createLock(),n={};n[e.HOME_CLOCK_FACE]=e.DIGITAL;var i=t.set(n);t=navigator.mozSettings.createLock();var n={};n[e.HOME_CLOCK_VISIBLE]=!0,i=t.set(n),t=navigator.mozSettings.createLock();var n={};n[e.HOME_CLOCK_DISPLAY_DATE]=!0,i=t.set(n)},handleEvent:function(t){("moztimechange"==t.type||"timeformatchange"==t.type)&&this.showClockPanel()}},t.ClockPanel=e}(window);