!function(e){function t(n){if(i[n])return i[n].exports;var r=i[n]={i:n,l:!1,exports:{}};return e[n].call(r.exports,r,r.exports,t),r.l=!0,r.exports}var n=window.webpackJsonp;window.webpackJsonp=function(t,i,s){for(var a,o,u=0,c=[];u<t.length;u++)o=t[u],r[o]&&c.push(r[o][0]),r[o]=0;for(a in i)Object.prototype.hasOwnProperty.call(i,a)&&(e[a]=i[a]);for(n&&n(t,i,s);c.length;)c.shift()()};var i={},r={1:0};t.e=function(e){function n(){o.onerror=o.onload=null,clearTimeout(u);var t=r[e];0!==t&&(t&&t[1](new Error("Loading chunk "+e+" failed.")),r[e]=void 0)}var i=r[e];if(0===i)return new Promise(function(e){e()});if(i)return i[2];var s=new Promise(function(t,n){i=r[e]=[t,n]});i[2]=s;var a=document.getElementsByTagName("head")[0],o=document.createElement("script");o.type="text/javascript",o.charset="utf-8",o.async=!0,o.timeout=12e4,t.nc&&o.setAttribute("nonce",t.nc),o.src=t.p+""+e+".bundle.js";var u=setTimeout(n,12e4);return o.onerror=o.onload=n,a.appendChild(o),s},t.m=e,t.c=i,t.i=function(e){return e},t.d=function(exports,e,n){t.o(exports,e)||Object.defineProperty(exports,e,{configurable:!1,enumerable:!0,get:n})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="dist/",t.oe=function(e){throw e},t(t.s=2)}([function(e,exports,t){"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var n={_providers:new Map,_services:new Map,_requestsByService:new Map,_requestsByProvider:new Map,request:function(e){var t=e.split(":"),n=Array.prototype.slice.call(arguments,1),i=this;if(this.debug(t),t.length>1){var r=t[0],s=t[1];return this._providers.get(r)?(this.debug("service: "+s+" is online, perform the request with "+n.concat()),Promise.resolve(this._providers.get(r)[s].apply(i._providers.get(r),n))):new Promise(function(t,a){i.debug("service: "+e+" is offline, queue the task."),i._requestsByProvider.has(r)||i._requestsByProvider.set(r,[]),i._requestsByProvider.get(r).push({service:s,resolve:t,args:n})})}if(this._services.has(e)){var a=this._services.get(e);return this.debug("service ["+e+"] provider ["+a.name+"] is online, perform the task."),Promise.resolve(a[e].apply(a,n))}return this.debug("service: "+e+" is offline, queue the task."),new Promise(function(t,r){i.debug("storing the requests..."),i._requestsByService.has(e)||i._requestsByService.set(e,[]),i._requestsByService.get(e).push({service:e,resolve:t,args:n})})},register:function(e,t){var n=this;if(this._providers.has(t.name)||this._providers.set(t.name,t),this.debug((t.name||"(Anonymous)")+" is registering service: ["+e+"]"),this.debug("checking awaiting requests by server.."),this._requestsByProvider.has(t.name)&&(this._requestsByProvider.get(t.name).forEach(function(e){n.debug("resolving..",t,t.name,e.service,e.args);var i="function"==typeof t[e.service]?t[e.service].apply(t,e.args):t[e.service];e.resolve(i)}),this._requestsByProvider.delete(t.name)),this._services.has(e))return void this.debug("the service ["+e+"] has already been registered by other server:",this._services.get(e).name);this._services.set(e,t),this.debug("checking awaiting requests by service.."),this._requestsByService.has(e)&&(this._requestsByService.get(e).forEach(function(e){n.debug("resolving..",t,e.service);var i=t[e.service].apply(t,e.args);e.resolve(i)}),this._requestsByService.delete(e))},unregister:function(e,t){this._providers.delete(t.name);var n=this._services.get(e);n&&t===n&&this._services.delete(e)},_states:new Map,_statesByState:new Map,registerState:function(e,t){this._states.set(t.name,t),t.name,this._statesByState.set(e,t)},unregisterState:function(e,t){this._states.delete(t.name),this._statesByState.get(e)===t&&this._statesByState.delete(e)},query:function(e){this.debug(e);var t,n,i=e.split(".");if(i.length>1?(n=this._states.get(i[0]),t=i[1]):(t=i[0],n=this._statesByState.get(t)),!n)return void this.debug("Provider not ready, return undefined state.");if("function"==typeof n[t]){var r=Array.prototype.slice.call(arguments,1);return n[t].apply(n,r)}return n[t]},_start:(new Date).getTime()/1e3,currentTime:function(){return((new Date).getTime()/1e3-this._start).toFixed(3)},debug:function(){}};exports.default=n},function(e,exports,t){"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var n=t(0),i=function(e){return e&&e.__esModule?e:{default:e}}(n),r={isEmailInstalled:!1,localHour12:!1,transforming:!1,blob:{},closeEnter:!1,isBluetoothSupport:!1,dateFormat:function(e){var t=new Date,n=new Date(e),i="",r=navigator.language,s=window.navigator.mozHour12,a=60*t.getHours()*60*1e3+60*t.getMinutes()*1e3+1e3*t.getSeconds()+t.getMilliseconds(),o={lastYear:{weekday:"short",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"numeric",hour12:s},aWeekAgo:{weekday:"short",month:"long",day:"numeric",hour:"numeric",minute:"numeric",hour12:s},withinAWeek:{weekday:"long",hour:"numeric",minute:"numeric",hour12:s},todayYesterday:{hour:"numeric",minute:"numeric",hour12:s}};if(e.getFullYear()<t.getFullYear()-1)i=n.toLocaleString(r,o.lastYear);else if(e.getFullYear()<t.getFullYear())i=n.toLocaleString(r,o.lastYear);else if(e.getTime()<t.getTime()-5184e5-a)i=n.toLocaleString(r,o.aWeekAgo);else if(e.getTime()<t.getTime()-864e5-a)i=n.toLocaleString(r,o.withinAWeek);else if(e.getTime()<t.getTime()-a){var u=n.toLocaleString(r,o.todayYesterday);i=navigator.mozL10n.get("yesterday")+", "+u}else if(e.getTime()<t.getTime()){var c=n.toLocaleString(r,o.todayYesterday);i=navigator.mozL10n.get("today")+", "+c}else i=n.toLocaleString(r,o.lastYear);return i},getFreeStorageSpace:function(e){var t=navigator.getDeviceStorage("sdcard").freeSpace();t.onerror=function(){e("error")},t.onsuccess=function(t){e(null,t.target.result)}},checkEmailApp:function(e){var t=this;window.navigator.mozApps.mgmt.getAll().onsuccess=function(n){var i=n.target.result;t.isEmailInstalled=i.some(function(e){return"app://email.gaiamobile.org/manifest.webapp"===e.manifestURL}),e&&e()}},shareBySms:function(e){new MozActivity({name:"new",data:{type:"websms/sms",body:e.text,filenames:["note"]}})},shareByMail:function(e){new MozActivity({name:"new",data:{type:"mail",url:"mailto:?subject="+encodeURIComponent(e.title)+"&body="+encodeURIComponent(e.text),filenames:["note"]}})},shareByBluetooth:function(e){var t=new Date,n=t.getFullYear()+""+("0"+(t.getMonth()+1)).slice(-2)+("0"+t.getDate()).slice(-2)+("0"+t.getHours()).slice(-2)+("0"+t.getMinutes()).slice(-2)+("0"+t.getSeconds()).slice(-2)+t.getMilliseconds()+".note";new MozActivity({name:"share-via-bluetooth-only",data:{type:"text/kai_plain",blobs:[new Blob([e.text],{type:"text/kai_plain"})],filenames:[n]}})},openShareMenu:function(e){var t=this;this.checkEmailApp(function(){i.default.request("showOptionMenu",{header:"share",options:t.buildShareMenu(e),hasCancel:!0})})},checkBluetoothCapability:function(){var e=this;navigator.hasFeature&&navigator.hasFeature("device.capability.bt").then(function(t){e.isBluetoothSupport=!!t})},buildShareMenu:function(e){var t=this,n=[];return this.isEmailInstalled&&n.push({id:"share-by-mail",callback:function(){t.shareByMail(e)}}),n.push({id:"share-by-sms",callback:function(){t.shareBySms(e)}}),this.isBluetoothSupport&&n.push({id:"share-by-bluetooth",callback:function(){t.shareByBluetooth(e)}}),n},scrollView:function(e,t){var n=e.scrollTop,i=e.scrollHeight-e.clientHeight,r=0;"ArrowUp"===t&&(r=n-82,e.scrollTop=r>=0?r:0),"ArrowDown"===t&&n<i&&(r=n+82,e.scrollTop=r>=i?i:r)},goToSettings:function(){new MozActivity({name:"configure",data:{target:"device",section:"mediaStorage"}})}};exports.default=r},function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),s=t(0),a=n(s),o=t(1),u=n(o),c=function(){function e(){i(this,e)}return r(e,[{key:"start",value:function(){var e=this;this.content=document.querySelector("#main-list"),this.ssr=document.getElementById("ssr"),window.addEventListener("fullyloaded",this),this.ssr.addEventListener("keydown",this,!0),a.default.register("leaveActivity",this),-1!==document.URL.indexOf("#open")?navigator.mozSetMessageHandler("activity",function(t){e._activity=t,"open"===t.source.name&&(u.default.blob=t.source.data.blob,e.load())}):window.addEventListener("DOMContentLoaded",this)}},{key:"handleEvent",value:function(e){switch(e.type){case"DOMContentLoaded":window.removeEventListener("DOMContentLoaded",this),this.loadItems();break;case"fullyloaded":this.ssr.classList.add("hidden")}}},{key:"leaveActivity",value:function(){this._activity&&(this._activity.postResult({success:!0}),this._activity=null)}},{key:"loadItems",value:function(){var e=this,t=window.localStorage.getItem("cache-notes"),n="";t=JSON.parse(t);var i=document.getElementById("softkeyPanel");t&&t.length>0?t.forEach(function(t){var r='<li tabIndex="-1" >\n                    <p>\n                      <span>'+e.checkSpecialChar(t.title)+"</span>\n                    </p>\n                    <p>\n                      <small>"+e.checkSpecialChar(t.desc)+"</small>\n                    </p>\n                  </li>";n+=r,i.children[0].dataset.l10nId="new",i.children[1].dataset.l10nId="select",i.children[2].dataset.l10nId="options"}):(i.children[0].dataset.l10nId="new",n='<div class="empty-screen" >\n                  <p class="no-note-dialog" data-l10n-id="no-notes" />\n                </div>'),this.content.innerHTML=n,window.performance.mark("visuallyLoaded"),window.isVisuallyLoaded=!0,this.load()}},{key:"checkSpecialChar",value:function(e){return-1!==e.indexOf("<")?e.replace(/</g,"&lt;"):e}},{key:"load",value:function(){window.requestAnimationFrame(function(){window.setTimeout(function(){t.e(0).then(t.bind(null,3))})})}}]),e}();window.addEventListener("largetextenabledchanged",function(){document.body.classList.toggle("large-text",navigator.largeTextEnabled)}),document.body.classList.toggle("large-text",navigator.largeTextEnabled);var l=new c;l.start(),window._app=l}]);
//# sourceMappingURL=bundle.js.map