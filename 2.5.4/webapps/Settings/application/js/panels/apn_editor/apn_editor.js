define(["require","panels/apn_editor/apn_editor_const","panels/apn_editor/apn_editor_session"],function(e){function t(e){this._inputElements={},o.forEach(function(t){this._inputElements[t]=e.querySelector("."+t)},this)}var n=e("panels/apn_editor/apn_editor_const"),i=e("panels/apn_editor/apn_editor_session"),o=n.APN_PROPERTIES,r=n.APN_PROPERTY_DEFAULTS,a=n.VALUE_CONVERTERS;return t.prototype={_convertValue:function(e,t){return t?t(e):e},_fillInputElements:function(e,t){o.forEach(function(n){var i=e[n];if(i){var o=t&&t[n.toLowerCase()]||r[n];i.value=this._convertValue(o,a.TO_STRING[n])}},this)},createApn:function(e,t){return this._fillInputElements(this._inputElements,t.apn),i(e,"new",this._inputElements,t)},editApn:function(e,t){return this._fillInputElements(this._inputElements,t.apn),i(e,"edit",this._inputElements,t)}},function(e){return new t(e)}});