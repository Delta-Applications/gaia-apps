define(["require","panels/volume/slider_handler"],function(e){var t=e("panels/volume/slider_handler"),n=function(){this._elements=null};return n.prototype={init:function(e){this._elements=e;var n=t();n.init(this._elements.media,"content");var i=t();i.init(this._elements.notification,"notification");var o=t();o.init(this._elements.alarm,"alarm"),this.notification=i},updateLabel:function(){this.notification._updateLabel()}},function(){return new n}});