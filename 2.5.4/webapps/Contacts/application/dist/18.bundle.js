webpackJsonp([18],{294:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var a=t[n];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(e,a.key,a)}}return function(t,n,a){return n&&e(t.prototype,n),a&&e(t,a),t}}(),u=t(3),c=n(u),l=t(10),s=n(l),f=t(5),d=n(f),p=t(21),m=n(p),h=t(4),y=n(h),v=t(24),b=n(v),E=t(11),w=n(E),_=function(e){function t(e){a(this,t);var n=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.FOCUS_SELECTOR=".list-item.navigable",n}return r(t,e),i(t,[{key:"componentDidMount",value:function(){window.mv=this,this.element=s.default.findDOMNode(this),this.navigator=new b.default(this.FOCUS_SELECTOR,this.element,null,this.index),this.updateSoftKeys()}},{key:"updateSoftKeys",value:function(){var e={left:"cancel",center:"ok"};this._softKey=m.default.create(this.element,e)}},{key:"componentWillUnmount",value:function(){this._softKey.destroy()}},{key:"onKeyDown",value:function(e){var t=void 0;switch(e.key){case"Enter":t=document.activeElement.dataset.value,y.default.request("back",t);break;case"Backspace":case"SoftLeft":e.preventDefault(),e.stopPropagation(),y.default.request("back")}}},{key:"render",value:function(){var e=this,t=[];return["phone-and-sim","phone","sim"].forEach(function(n,a){var o=w.default.source===n;o&&(e.index=a),t.push(c.default.createElement("div",{className:"list-item navigable",tabIndex:"-1","data-value":n,"data-checked":o},c.default.createElement("div",{className:"content"},c.default.createElement("div",{className:"primary","data-l10n-id":n})),c.default.createElement("i",{className:"icon control","data-icon":o?"radio-on":"radio-off","aria-hidden":"true"}),c.default.createElement("input",{type:"radio",checked:o,className:"hidden"})))}),c.default.createElement("div",{id:"sort-view",tabIndex:"-1",onKeyDown:function(t){return e.onKeyDown(t)}},c.default.createElement("div",{className:"header h1","data-l10n-id":"memory"}),c.default.createElement("div",{className:"body"},t))}}]),t}(d.default);exports.default=_}});
//# sourceMappingURL=18.bundle.js.map