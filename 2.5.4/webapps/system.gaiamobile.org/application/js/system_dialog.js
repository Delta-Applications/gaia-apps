'use strict';(function(exports){var SystemDialog=function SystemDialog(options){this.options=options||{};this.render();this.publish('created');};SystemDialog.prototype=Object.create(window.BaseUI.prototype);SystemDialog.prototype.CLASS_NAME='SystemDialog';SystemDialog.prototype.containerElement=document.getElementById('dialog-overlay');SystemDialog.prototype.EVENT_PREFIX='system-dialog-';SystemDialog.prototype.customID=function sd_customID(){return'';};SystemDialog.prototype.SUB_COMPONENTS={'valueSelector':window.ValueSelector};SystemDialog.prototype.installSubComponents=function sd_installSubComponents(){this.debug('installing sub components...');for(var componentName in this.SUB_COMPONENTS){if(this.SUB_COMPONENTS[componentName]){this[componentName]=new this.SUB_COMPONENTS[componentName](this);}}};SystemDialog.prototype.uninstallSubComponents=function sd_uninstallSubComponents(){for(var componentName in this.SUB_COMPONENTS){if(this[componentName]){this[componentName].destroy();this[componentName]=null;}}};SystemDialog.prototype._setVisibleForScreenReader=function sd__setVisibleForScreenReader(visible){if(this.browser&&this.browser.element){this.debug('aria-hidden on browser element:'+!visible);this.browser.element.setAttribute('aria-hidden',!visible);}};SystemDialog.prototype.focus=function sd_focus(){if(this.browser&&this.browser.element){this.browser.element.focus();}};SystemDialog.prototype.view=function sd_view(){return'';};SystemDialog.prototype.render=function sd_render(){this.generateID();this.containerElement.insertAdjacentHTML('beforeend',this.view());this._fetchElements();this.element=document.getElementById(this.instanceID);this.installSubComponents();this._registerEvents();};SystemDialog.prototype.destroy=function sd_destroy(){this.publish('willdestroy');this._unregisterEvents();this.uninstallSubComponents();if(this.element){this.element.parentNode.removeChild(this.element);this.element=null;}
this.publish('destroyed');};SystemDialog.prototype.resize=function sd_resize(){this.updateHeight();};SystemDialog.prototype.updateHeight=function sd_updateHeight(){var height=window.layoutManager.height-StatusBar.height;this.containerElement.style.height=height+'px';this.debug('updateHeight: new height = '+height);};SystemDialog.prototype.show=function sd_show(){this.publish('opening');this.element.hidden=false;this.element.classList.add(this.customID);this.onShow();this.updateHeight();this.publish('show');};SystemDialog.prototype.hide=function sd_hide(reason,isManagerRequest){this.publish('closing');this.element.hidden=true;this.element.classList.remove(this.customID);this.onHide(reason);if(!isManagerRequest){this.publish('hide');}};SystemDialog.prototype.Hidden=function sd_Hidden(){return this.element.hidden;},SystemDialog.prototype.onShow=function sd_onShow(reason){if(typeof(this.options.onShow)=='function'){this.options.onShow(reason);}};SystemDialog.prototype.onHide=function sd_onHide(reason){if(typeof(this.options.onHide)=='function'){this.options.onHide(reason);}};SystemDialog.prototype.generateID=function sd_generateID(){if(!this.instanceID){this.instanceID=this.customID;}};exports.SystemDialog=SystemDialog;}(window));