webpackJsonp([7],{291:function(e,exports,t){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),s=t(3),u=r(s),c=t(10),l=r(c),f=t(4),d=r(f),h=t(5),p=r(h),v=t(21),y=r(v),m=t(348),b=r(m),g=navigator.mozL10n.get,_=function(e){function t(e){n(this,t);var r=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.name="ImportSdcardView",r.onFocus=function(){d.default.request("ensureDialog")},r.state={saved:"",progress:0,total:0,error:!1},r}return o(t,e),i(t,[{key:"componentDidMount",value:function(){var e={};this.element=l.default.findDOMNode(this),window.isv=this,this._softKey=y.default.create(this.element,e),this.import()}},{key:"updateSoftKeys",value:function(){var e={};this.state.error?(e.left="cacel",e.right="retry"):e.left="cancel",this._softKey.update(e)}},{key:"componentWillUnmount",value:function(){this._softKey.destroy()}},{key:"import",value:function(){var e=this;b.default.import().then(function(t){e.importer=t,e.updateSoftKeys(),e.setState({total:t.total}),t.on("imported",function(r){e.setState({saved:r,progress:t.imported,total:t.total})}),t.on("finished",function(){b.default.hasFilter?(d.default.request("showDialog",{header:g("import-limit-header"),content:g("inner-import-limit-content"),type:"alert",translated:!0,onOk:function(){d.default.request("back")}}),b.default.hasFilter=!1):d.default.request("back")})},function(t){e.setState({error:t||!0})})}},{key:"onKeyDown",value:function(e){switch(e.key){case"SoftLeft":case"EndCall":case"Backspace":e&&e.preventDefault(),this.importer&&this.importer.cancel(),this.state.error&&d.default.request("back");break;case"SoftRight":this.state.error&&(this.setState({error:!1}),this.import())}}},{key:"render",value:function(){var e=this,t=null,r=null,n=null;if(this.state.error)"novCardFiles"===this.state.error&&d.default.request("showDialog",{header:"import-contacts",type:"alert",content:"novCardFiles",onOk:function(){return d.default.request("back")},onBack:function(){return d.default.request("back")}}),n=u.default.createElement("div",{className:"primary",key:"import-sd-error","data-l10n-id":"memoryCardContacts-error"});else if(this.state.total){var a=this.state.progress/this.state.total*100,o={width:a+"%"},i={width:"calc(100% - "+a+"% - 0.3rem)"};t=u.default.createElement("div",{className:"progress"},u.default.createElement("div",{className:"progress-active",style:o}),u.default.createElement("div",{className:"progress-inactive",style:i})),r=u.default.createElement("div",{className:"secondary"},this.state.progress,"/",this.state.total),n=u.default.createElement("div",{className:"primary","data-l10n-id":"importing-contacts-from-sd"})}else n=u.default.createElement("div",{className:"primary",key:"import-sd-reading","data-l10n-id":"reading-contacts-from-sd"});return u.default.createElement("div",{className:"import-sdcard-view",tabIndex:"-1",onKeyDown:function(t){return e.onKeyDown(t)},onFocus:this.onFocus},u.default.createElement("div",{className:"header h1",ref:"header","data-l10n-id":"importing"}),u.default.createElement("div",{className:"body"},u.default.createElement("div",{className:"list-item","data-multi-line":"true"},u.default.createElement("div",{className:"content"},n,r,t))))}}]),t}(p.default);exports.default=_},303:function(e,exports,t){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function n(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var o=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),i=t(8),s=function(e){return e&&e.__esModule?e:{default:e}}(i),u=function(e){function t(){var e,a,o,i;r(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return a=o=n(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),o.NOT_INITIALIZED=0,o.NOT_AVAILABLE=1,o.AVAILABLE=2,o.SHARED=3,i=a,n(o,i)}return a(t,e),o(t,[{key:"start",value:function(){var e=this;this.status=this.NOT_INITIALIZED,this.deviceStorages=[],navigator.getDeviceStorages("sdcard").some(function(e){return!("sdcard"==e.storageName||!e.canBeMounted||(this.deviceStorage=e,this.deviceStorages=[e],0))}.bind(this)),this.deviceStorage&&(this.deviceStorage.addEventListener("change",this),this.status===this.NOT_INITIALIZED&&(this.deviceStorage.available().onsuccess=function(t){e.updateStorageState(t.target.result)}))}},{key:"isAvailable",value:function(){return this.deviceStorage&&this.status!==this.NOT_AVAILABLE}},{key:"_handle_change",value:function(e){}},{key:"_toStatus",value:function(e){switch(e){case"available":this.status=this.AVAILABLE;break;case"shared":this.status=this.SHARED;break;case"unavailable":this.status=this.NOT_AVAILABLE}}},{key:"updateStorageState",value:function(e){this._toStatus(e),this.emit("statechanged",e)}},{key:"checkStorageCard",value:function(){return this.status===this.AVAILABLE}},{key:"getStatus",value:function(e){var t=this;if(!this.deviceStorage)return this._toStatus("unavailable"),void e(this.status);var r=this.deviceStorage.available();r.onsuccess=function(){t._toStatus(r.result),e(t.status)},r.onerror=function(){e(t.status)}}},{key:"retrieveFiles",value:function(e,t){var r=this;return new Promise(function(n,a){function o(){a(this.error.name)}function i(r){var a=r.target.result;a?-1===e.indexOf(a.type)&&a.name.search(-1===new RegExp(".("+t.join("|")+")$"))?f.continue():(s.push(a),f.continue()):++l<c?(f=u[l].enumerate(),f.onsuccess=i,f.onerror=o):n(s)}var s=[],u=r.deviceStorages,c=u.length,l=0,f=u[l].enumerate();f.onsuccess=i,f.onerror=o})}},{key:"getTextFromFiles",value:function(e,t,r){var n=this;if(t=t||"",!e||!e.length)return r&&r(null,t);var a=new FileReader;a.onload=function(){t+=a.result+"\n",n.getTextFromFiles(e,t,r)};var o=this;try{a.readAsText(e.shift())}catch(n){window.console.error("Problem reading file: ",n.stack),o.getTextFromFiles(e,t,r)}}}]),t}(s.default),c=new u;c.start(),exports.default=c},348:function(e,exports,t){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),s=t(8),u=r(s),c=t(303),l=r(c),f=t(134),d=r(f),h=function(e){function t(){var e,r,o,i;n(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return r=o=a(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),o.hasFilter=!1,i=r,a(o,i)}return o(t,e),i(t,[{key:"import",value:function(){var e=this;return new Promise(function(t,r){l.default.retrieveFiles(["text/vcard","text/x-vcard","text/directory;profile=vCard","text/directory"],["vcf","vcard"]).then(function(n){if(n.length){var a=n.filter(function(e){return e.size<f.MAX_BLOB_SIZE});e.hasFilter=a.length<n.length,l.default.getTextFromFiles(e.hasFilter?a:n,"",e.onFiles.bind(e))}else r("novCardFiles");e.resolve=t,e.reject=r}).catch(function(e){r(e)})})}},{key:"onFiles",value:function(e,t){if(e)return void this.reject(e);var r=new d.default(t);if(!t||!r)return void this.reject("No contacts were found.");r.import(),this.resolve(r)}}]),t}(u.default),p=new h;exports.default=p}});
//# sourceMappingURL=7.bundle.js.map