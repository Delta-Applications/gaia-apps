webpackJsonp([11],{283:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),i=t(3),c=n(i),l=t(10),u=n(l),f=t(4),d=n(f),p=t(5),h=n(p),v=t(21),y=n(v),m=t(342),_=n(m),b=function(e){function t(e){r(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.name="DeleteContactsView",n._remover=new _.default(n.props.ids),n.state={progress:0,total:n.props.ids.length},n}return o(t,e),s(t,[{key:"componentDidMount",value:function(){var e=this;this.element=u.default.findDOMNode(this),this._softKey=y.default.create(this.element,{left:"cancel",center:"",right:""}),this._remover.on("finished",function(e){d.default.request("ToastManager:show",{text:navigator.mozL10n.get("contact-deleted",{n:e})}),d.default.request("back")}),this._remover.on("processed",function(t){e.setState({progress:t},function(){e._isClearing&&e._softKey.update({left:""})})}),this._remover.start()}},{key:"componentWillUnmount",value:function(){this._softKey.destroy()}},{key:"onKeyDown",value:function(e){switch(e.key){case"SoftLeft":e.preventDefault(),e.stopPropagation(),this._isClearing||(this._remover&&this._remover.cancel(),d.default.request("back"));break;case"EndCall":case"Backspace":e.preventDefault(),e.stopPropagation()}}},{key:"onKeyUp",value:function(e){"EndCall"!==e.key&&"Backspace"!==e.key||(e.preventDefault(),e.stopPropagation())}},{key:"render",value:function(){var e=this,t=null,n=null;if(this.state.total)if(this._isClearing)t=c.default.createElement("div",{className:"progress","data-infinite":"true"},c.default.createElement("div",{className:"progress-active"}));else{var r=this.state.progress/this.state.total*100,a={width:r+"%"},o={width:"calc(100% - "+r+"% - 0.3rem)"};t=c.default.createElement("div",{className:"progress"},c.default.createElement("div",{className:"progress-active",style:a}),c.default.createElement("div",{className:"progress-inactive",style:o})),n=c.default.createElement("div",{className:"secondary"},this.state.progress,"/",this.state.total)}return c.default.createElement("div",{className:"delete-contact-view",tabIndex:"-1",onKeyDown:function(t){return e.onKeyDown(t)},onKeyUp:function(t){return e.onKeyUp(t)}},c.default.createElement("div",{className:"header h1",ref:"header","data-l10n-id":"DeletingContacts"}),c.default.createElement("div",{className:"body"},c.default.createElement("div",{className:"list-item"},c.default.createElement("div",{className:"content"},c.default.createElement("div",{className:"primary","data-l10n-id":"DeletingContactsProgressing"}),n,t))))}},{key:"_isClearing",get:function(){return this.state.progress<0}}]),t}(h.default);exports.default=b},342:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),i=t(8),c=n(i),l=t(11),u=n(l),f=function(e){function t(e){r(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n._ids=[].concat(e),n._processed=0,n._failed=0,n}return o(t,e),s(t,[{key:"cancel",value:function(){this._aborted=!0}},{key:"start",value:function(){var e=this;u.default.getCount().then(function(t){e._ids.length===t?(e.emit("processed",-1),u.default.clearContacts().then(function(){e.emit("finished",e._ids.length)})):(u.default.setEventEmittingState(!1),e._process(e._ids))})}},{key:"_process",value:function(e){var t=this,n=e.shift();if(!n||this._aborted)return this.emit("finished",this._processed),void u.default.setEventEmittingState(!0);u.default.remove({id:n}).then(function(n){n.error?(t._failed++,t._process(e)):(t._processed++,t.emit("processed",t._processed),t._process(e))})}}]),t}(c.default);exports.default=f}});
//# sourceMappingURL=11.bundle.js.map