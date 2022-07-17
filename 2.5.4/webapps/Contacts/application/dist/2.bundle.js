webpackJsonp([2],{137:function(e,exports,t){"use strict";function a(e){return e&&e.__esModule?e:{default:e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),s=t(3),c=a(s),u=t(10),l=a(u),f=t(4),d=a(f),m=t(5),h=a(m),g=t(21),p=a(g),v=t(11),y=a(v),b=t(340),w=a(b),k=function(e){function t(e){n(this,t);var a=r(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return a.name="MigrateView",a.DEBUG=!1,a.state={progress:0,total:0,type:e.isMove?"move":"copy"},a}return o(t,e),i(t,[{key:"componentDidMount",value:function(){var e={left:"cancel",center:""};window.miv=this,this.migrate(),this.element=l.default.findDOMNode(this),this._softKey=p.default.create(this.element,e)}},{key:"componentWillUnmount",value:function(){this._softKey.destroy()}},{key:"migrate",value:function(){var e=this;this.debug("to migrate ids:",this.props.ids);var t=this.props.ids.map(function(e){return y.default.contactMap.get(e)});this.migrator=new w.default(this.props.target,t,this.props.isMove),this.migrator.on("migrated",function(){e.setState({progress:e.migrator.migrated,total:e.migrator.total})}),this.migrator.on("finished",function(){if(e.element.contains(document.activeElement)){if(e.migrator.error){var t=navigator.mozL10n.get,a=e.migrator.error.message+"\n"+t("contact-"+e.state.type+"-to-"+e.migrator.targetCode,{migrated:e.migrator.migrated});return void d.default.request("showDialog",{header:t(e.state.type+"-contact-failed"),type:"alert",content:a,translated:!0,onOk:function(){d.default.request("back")},onBack:function(){d.default.request("back")}})}e.state.total<=2?setTimeout(function(){d.default.request("back")},500):d.default.request("back")}}),this.setState({total:t.length}),setTimeout(function(){e.migrator.migrate()},500)}},{key:"onKeyDown",value:function(e){switch(e.key){case"SoftLeft":case"Backspace":case"EndCall":e.preventDefault(),e.stopPropagation(),this.migrator&&this.migrator.cancel(),d.default.request("back")}}},{key:"render",value:function(){var e=this,t=null,a=null,n=null,r=this.state.progress/this.state.total*100,o={width:r+"%"},i={width:"calc(100% - "+r+"% - 0.3rem)"};return t=c.default.createElement("div",{className:"progress"},c.default.createElement("div",{className:"progress-active",style:o}),c.default.createElement("div",{className:"progress-inactive",style:i})),a=c.default.createElement("div",{className:"secondary"},this.state.progress,"/",this.state.total),n=c.default.createElement("div",{className:"primary","data-l10n-id":this.state.type+"-contacts-progressing"}),c.default.createElement("div",{className:"migrate-view",tabIndex:"-1",onKeyDown:function(t){return e.onKeyDown(t)}},c.default.createElement("div",{className:"header h1",ref:"header","data-l10n-id":this.state.type+"-contacts"}),c.default.createElement("div",{className:"body"},c.default.createElement("div",{className:"list-item"},c.default.createElement("div",{className:"content"},n,a,t))))}}]),t}(h.default);exports.default=k},340:function(e,exports,t){"use strict";function a(e){return e&&e.__esModule?e:{default:e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),s=t(8),c=a(s),u=t(4),l=a(u),f=t(11),d=a(f),m=function(e){function t(e,a,o){n(this,t);var i=r(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return i.name="ContactMigrator",i.DEBUG=!1,i.migrated=0,i.failed=0,i.total=0,i.type="",i.aborted=!1,i.target=f.TAG_INDEX[e],i.contacts=a,i.total=a.length,i.isMove=o,i.isMultiSIM=!!navigator.mozIccManager&&navigator.mozIccManager.iccIds.length>1,i.targetCode=!i.isMultiSIM&&e.startsWith("sim")?"sim":i.target.toLowerCase(),d.default.setEventEmittingState(!1),i}return o(t,e),i(t,[{key:"migrate",value:function(){var e=this;return this.debug("start migrate()"),new Promise(function(){return e.wakeLock=navigator.requestWakeLock("cpu"),e._migrate()})}},{key:"_migrate",value:function(){this.save(this.contacts[this.migrated])}},{key:"continue",value:function(){this.migrated===this.total||this.aborted?this.done():this._migrate()}},{key:"cancel",value:function(){this.migrating=!1,d.default.setEventEmittingState(!0),this.aborted=!0,this.emit("aborted")}},{key:"showToast",value:function(){var e=navigator.mozL10n.get;l.default.request("ToastManager:show",{text:e("contact-"+(this.isMove?"move":"copy")+"-to-"+this.targetCode,{migrated:this.migrated-this.failed})})}},{key:"done",value:function(){d.default.setEventEmittingState(!0),this.finished=!0,this.emit("finished",this),this.wakeLock&&this.wakeLock.unlock(),this.showToast(),l.default.request("List:reload")}},{key:"save",value:function(e){var t=this,a=new window.mozContact(e);if("DEVICE"===this.target){if(a.category=["DEVICE","KAICONTACT"],a.name){var n=a.name[0].split(" ");a.givenName=[n.shift()],a.familyName=[n.join(" ")]}}else{a.category=["SIM",this.target,"KAICONTACT"],["photo","givenName","familyName","email","org","adr","bday","note","ringtone","group"].forEach(function(e){a[e]=null});if(!(a.name&&a.name[0]&&a.name[0].length||a.tel&&a.tel[0]&&a.tel[0].value.length))return this.emit("migrated"),this.migrated++,this.failed++,this.continue()}this.debug("ready to save: target, name:",this.target,a.name),d.default.createOrUpdate(a,!1,"migrate").then(function(a){if(a.error){var n=navigator.mozL10n.get;switch(a.error){case"NoFreeRecordFound":a.message=n("contact-"+(t.isMove?"move":"copy")+"-error-sim-full");break;case"contacts-limit-exceeded":a.message=n("contact-"+(t.isMove?"move":"copy")+"-error-limit-exceeded");break;default:a.message=n("contact-"+(t.isMove?"move":"copy")+"-error-unknown")}t.error=a,t.done()}else t.migrated++,t.emit("migrated"),t.isMove?d.default.remove(e).then(function(){t.continue()}).catch(function(){t.debug("error when removing the original contact"),t.continue()}):t.continue()})}}]),t}(c.default);exports.default=m}});
//# sourceMappingURL=2.bundle.js.map