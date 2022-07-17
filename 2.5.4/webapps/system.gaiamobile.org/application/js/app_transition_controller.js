'use strict';(function(exports){var TransitionEvents=['open','close','complete','timeout','immediate-open','immediate-close'];var TransitionStateTable={'closed':['opening',null,null,null,'opened',null],'opened':[null,'closing',null,null,null,'closed'],'opening':[null,'closing','opened','opened','opened','closed'],'closing':['opened',null,'closed','closed','opened','closed']};var appTransitionSetting='app-transition.enabled';var transitionEnabled=SettingsListener.getSettingsLock().get(appTransitionSetting);SettingsListener.observe(appTransitionSetting,true,function(value){transitionEnabled=value;});var AppTransitionController=function AppTransitionController(app){if(!app||!app.element){return;}
this.app=app;this.app.debug('default animation:',this.app.openAnimation,this.app.closeAnimation);if(this.app.openAnimation){this.openAnimation=this.app.openAnimation;}
if(this.app.closeAnimation){this.closeAnimation=this.app.closeAnimation;}
if(this.app.CLASS_NAME=='AppWindow'){this.OPENING_TRANSITION_TIMEOUT=2500;}
this.app.element.addEventListener('_opening',this);this.app.element.addEventListener('_closing',this);this.app.element.addEventListener('_opened',this);this.app.element.addEventListener('_closed',this);this.app.element.addEventListener('_opentransitionstart',this);this.app.element.addEventListener('_closetransitionstart',this);this.app.element.addEventListener('_loaded',this);this.app.element.addEventListener('_openingtimeout',this);this.app.element.addEventListener('_closingtimeout',this);this.app.element.addEventListener('animationend',this);};AppTransitionController.prototype.destroy=function(){if(!this.app||!this.app.element){return;}
this.app.element.removeEventListener('_opening',this);this.app.element.removeEventListener('_closing',this);this.app.element.removeEventListener('_opened',this);this.app.element.removeEventListener('_closed',this);this.app.element.removeEventListener('_opentransitionstart',this);this.app.element.removeEventListener('_closetransitionstart',this);this.app.element.removeEventListener('_loaded',this);this.app.element.removeEventListener('_openingtimeout',this);this.app.element.removeEventListener('_closingtimeout',this);this.app.element.removeEventListener('animationend',this);this.app=null;};AppTransitionController.prototype._transitionState='closed';AppTransitionController.prototype._waitingForLoad=false;AppTransitionController.prototype.openAnimation='enlarge';AppTransitionController.prototype.closeAnimation='reduce';AppTransitionController.prototype.OPENING_TRANSITION_TIMEOUT=500;AppTransitionController.prototype.CLOSING_TRANSITION_TIMEOUT=500;AppTransitionController.prototype.SLOW_TRANSITION_TIMEOUT=3500;AppTransitionController.prototype.changeTransitionState=function atc_changeTransitionState(evt){var currentState=this._transitionState;var evtIndex=TransitionEvents.indexOf(evt);var state=TransitionStateTable[currentState][evtIndex];if(evt==='open'&&currentState==='opened'){this.focusApp();}
if(!state){return;}
if(state==='opened'){const appElement=this.app.element;const classList=appElement&&appElement.classList;const isNormalApp=classList&&!classList.contains('secureAppWindow')&&!classList.contains('attentionWindow')&&!classList.contains('paymentWindow')&&!classList.contains('inputWindow');const activeApp=window.appWindowManager.getActiveApp();if(Service.query('getTopMostUI').name==='AppWindowManager'&&isNormalApp&&!(activeApp&&activeApp.element&&activeApp.element.contains(appElement))){state='closed';this.app.debug('Closed error opened app');if(this.app.isBrowser()){this.app.debug('killed error opened browser');this.app.kill();return;}}}
this.app.debug(currentState,state,'::',evt);this.switchTransitionState(state);this.resetTransition();this['_do_'+state]();this.app.publish(state);if(!this.app){return;}
if(state=='opening'){this.app.publish('willopen');}else if(state=='closing'){this.app.publish('willclose');}else if(state=='opened'){this.app.publish('open');}else if(state=='closed'){this.app.publish('close');}};AppTransitionController.prototype._do_closing=function atc_do_closing(){this.app.debug('timer to ensure closed does occur.');this._closingTimeout=window.setTimeout(()=>{if(!this.app){return;}
this.app.broadcast('closingtimeout');},AppWindowManager.slowTransition?this.SLOW_TRANSITION_TIMEOUT:this.CLOSING_TRANSITION_TIMEOUT);if(!this.app||!this.app.element){return;}
this.app.element.classList.add('transition-closing');this.app.element.classList.add(this.getAnimationName('close'));};AppTransitionController.prototype._do_closed=function atc_do_closed(){};AppTransitionController.prototype.getAnimationName=function(type){if(transitionEnabled){return this.currentAnimation||this[type+'Animation']||type;}else{return'immediate';}};AppTransitionController.prototype._do_opening=function atc_do_opening(){this.app.debug('timer to ensure opened does occur.');this._openingTimeout=window.setTimeout(function(){this.app&&this.app.broadcast('openingtimeout');}.bind(this),AppWindowManager.slowTransition?this.SLOW_TRANSITION_TIMEOUT:this.OPENING_TRANSITION_TIMEOUT);this._waitingForLoad=false;this.app.element.classList.add('transition-opening');this.app.element.classList.add(this.getAnimationName('open'));this.app.debug(this.app.element.classList);};AppTransitionController.prototype._do_opened=function atc_do_opened(){};AppTransitionController.prototype.switchTransitionState=function atc_switchTransitionState(state){this._transitionState=state;if(!this.app){return;}
this.app._changeState('transition',this._transitionState);};AppTransitionController.prototype.handle_closing=function atc_handle_closing(){if(!this.app||!this.app.element){return;}
this.switchTransitionState('closing');};AppTransitionController.prototype.handle_closed=function atc_handle_closed(){if(!this.app||!this.app.element){return;}
this.resetTransition();if(!this.app.isAttentionWindow&&!this.app.isCallscreenWindow&&!this.app.isInputMethod){this.app.setVisible(false);}
this.app.setNFCFocus(false);this.app.element.classList.remove('active');};AppTransitionController.prototype.handle_opening=function atc_handle_opening(){if(!this.app||!this.app.element){return;}
if(this.app.loaded){var self=this;this.app.element.addEventListener('_opened',function onopen(){self.app.element.removeEventListener('_opened',onopen);self.app.publish('loadtime',{time:parseInt(Date.now()-self.app.launchTime),type:'w',src:self.app.config.url});});}
this.app.reviveBrowser();this.app.launchTime=Date.now();this.app.fadeIn();this.app.requestForeground();if(this.app.isHomescreen||this.app.isCallscreenWindow){this.app.setOrientation();}};AppTransitionController.prototype.handle_opened=function atc_handle_opened(){if(!this.app||!this.app.element){return;}
this.app.reviveBrowser();this.resetTransition();this.app.element.removeAttribute('aria-hidden');this.app.show();this.app.element.classList.add('active');this.app.requestForeground();if(!this.app.isCallscreenWindow){this.app.setOrientation();}
this.focusApp();};AppTransitionController.prototype.focusApp=function(){if(!this.app){return;}
if(this._shouldFocusApp()){this.app.debug('focusing this app.');this.app.focus();this.app.setNFCFocus(true);}};AppTransitionController.prototype._shouldFocusApp=function(){var bottomWindow=this.app.getBottomMostWindow();return(this.app.CLASS_NAME!=='SearchWindow'&&this._transitionState=='opened'&&Service.query('getTopMostWindow')===this.app.getTopMostWindow()&&Service.query('getTopMostUI').name===bottomWindow.HIERARCHY_MANAGER);};AppTransitionController.prototype.requireOpen=function(animation){this.currentAnimation=animation||this.openAnimation;this.app.debug('open with '+this.currentAnimation);if(this.currentAnimation=='immediate'){this.changeTransitionState('immediate-open');}else{this.changeTransitionState('open');}};AppTransitionController.prototype.requireClose=function(animation){this.currentAnimation=animation||this.closeAnimation;this.app.debug('close with '+this.currentAnimation);if(this.currentAnimation=='immediate'){this.changeTransitionState('immediate-close');}else{this.changeTransitionState('close');}};AppTransitionController.prototype.resetTransition=function atc_resetTransition(){if(this._openingTimeout){window.clearTimeout(this._openingTimeout);this._openingTimeout=null;}
if(this._closingTimeout){window.clearTimeout(this._closingTimeout);this._closingTimeout=null;}
this.clearTransitionClasses();};AppTransitionController.prototype.clearTransitionClasses=function atc_removeTransitionClasses(){if(!this.app||!this.app.element){return;}
var classes=['enlarge','reduce','no-animation','invoking','invoked','zoom-in','zoom-out','fade-in','fade-out','transition-opening','transition-closing','immediate','fadeout','slideleft','slideright','in-from-left','out-to-right','will-become-active','will-become-inactive','slide-to-top','slide-from-top','slide-to-bottom','slide-from-bottom'];classes.forEach(function iterator(cls){this.app.element.classList.remove(cls);},this);};AppTransitionController.prototype.handleEvent=function atc_handleEvent(evt){switch(evt.type){case'_opening':this.handle_opening();break;case'_opened':this.handle_opened();break;case'_closed':this.handle_closed();break;case'_closing':this.handle_closing();break;case'_closingtimeout':case'_openingtimeout':this.changeTransitionState('timeout',evt.type);break;case'_loaded':if(this._waitingForLoad){this._waitingForLoad=false;this.changeTransitionState('complete');}
break;case'animationend':if(evt.target!==this.app.element){return;}
evt.stopPropagation();this.app.element.classList.remove('transition-opening');if(Service.isBusyLoading()){this._waitingForLoad=true;if(this.app.isHomescreen&&this._transitionState=='opening'){this.app.focus();}
return;}
this.app.debug(evt.animationName+' has been ENDED!');this.changeTransitionState('complete',evt.type);break;}};exports.AppTransitionController=AppTransitionController;}(window));