
(function(exports){'use strict';const _=navigator.mozL10n.get;let hideTips=window.localStorage.getItem('browser-hide-tips');if(hideTips!=='true'){hideTips='false';}
var BrowserWindowNavigator=function BrowserWindowNavigator(appChrome){this.appChrome=appChrome;this.app=appChrome.app;this.app.browser.element.addEventListener('focus',this);this.app.browser.element.addEventListener('blur',this);this.app.browser.element.addEventListener('mozbrowserlocationchange',this);window.addEventListener('mozfullscreenchange',this);window.addEventListener('fullscreenchange',this);this.app.element.addEventListener('_opened',this);this.app.element.addEventListener('_closing',this);this.app.element.addEventListener('_loading',this);this.app.element.addEventListener('_loaded',this);this.app.element.addEventListener('_value-selector-hidden',this);this.app.element.addEventListener('_scrollerModeChanged',this);};BrowserWindowNavigator.prototype={backEnabled:false,forwardEnabled:false,_DEBUG:false,saveFocus:function bwm_saveFocus(){if(this.isFocusInScope()){this._lastFocus=document.activeElement;}},restoreFocus:function bwm_restoreFocus(){if(this._lastFocus){this._lastFocus.focus();this._lastFocus=undefined;}},_focusOnApp:function bwm_focusOnApp(){this.app.publish('focus');},handleEvent:function bwm_handleEvent(evt){switch(evt.type){case'mozfullscreenchange':case'fullscreenchange':this.handleFullScreenChange(evt);break;case'_value-selector-hidden':this.setSoftkey(document.mozFullScreen);break;case'_opened':this.restoreFocus();break;case'_closing':this.saveFocus();break;case'_scrollerModeChanged':this.setSoftkey(document.mozFullScreen);break;case'focus':case'blur':this.handleFocusOrBlur(evt);break;case'mozbrowserlocationchange':this.updateGoBackForwardOptions();break;}},handleFocusOrBlur:function bwm_handleFocusOrBlur(evt){var targetOnApp=evt.target===this.app.browser.element;if(!targetOnApp){return;}
if(evt.type==='focus'&&this.app.isBrowser()){this.setSoftkey(document.mozFullScreen);}else{if(this.app&&this.app.browserWindowButtons){this.app.browserWindowButtons.hide();}}},browserSearch:function bwm_browserSearch(){window.dispatchEvent(new CustomEvent('global-search-request'));if(this.app&&this.app.browserNavigationWidgets){this.app.browserNavigationWidgets.setNavigationMode('spatial');}
if(this.app){this.app.publish('focusonurlbar');}},handleKey:function bwm_handleKey(key){var handled=false;switch(key){case'hash':if(this.app&&this.app.isBrowser()){const topMostUI=Service.query('getTopMostUI');if(topMostUI&&topMostUI.name==='AppWindowManager'){handled=true;Service.request('BrowserMenuManager:show','tips');}}
break;case'softleft':if(this.app&&this.app.isBrowser()){handled=true;if(this.isFocusOnApp()&&!document.mozFullScreen){this.goToBrowserTop();}else{document.mozCancelFullScreen();}}
break;case'softright':if(this.app&&this.app.isBrowser()){if(this.isFocusInScope()){if(!document.mozFullScreen){this.showOptionMenu();handled=true;}else{if(!Service.query('hasVolumeKey')){this.requestVolume('show');handled=true;}}}}
break;case'1':case'i':case'w':if(this.app&&this.app.isBrowser()){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.zoom('out');handled=true;}
break;case'3':case'o':case'r':if(this.app&&this.app.isBrowser()){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.zoom('in');handled=true;}
break;case'5':if(this.app&&this.app.isBrowser()){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.setNavigationMode('toggle');handled=true;}
break;case'2':case'e':if(this.app&&this.app.isBrowser()){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.scroll('top');handled=true;}
break;case'0':if(this.app&&this.app.isBrowser()){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.scroll('down');handled=true;}
break;case'arrowup':if(this.app&&this.app.isBrowser()){this.requestVolume('up');handled=true;}
break;case'arrowdown':if(this.app&&this.app.isBrowser()){this.requestVolume('down');handled=true;}
break;case'enter':if(this.app&&this.app.isBrowser()&&getBrowserProperty(this.app.browser.element,'touchPanningSimulationEnabled')){this.app.browserNavigationWidgets&&this.app.browserNavigationWidgets.setNavigationMode('spatial');handled=true;}
break;case'home':if(document.mozFullScreen){document.mozCancelFullScreen();handled=true;break;}
this.app.canGoBack((result)=>{if(this.app.isCursorEnabled()&&!this.app.isBrowser()){if(result){this.app.back();}else if(Service.query('isLowMemoryDevice')){this.app.kill();}else{appWindowManager.display(null,null,null,'home');}
return;}
if(result&&this.app.isBrowser()){this.app.back();this.hasLeaveAppToast=false;}else{let toastl10n='pressBackAgainToMinimizeBrowser';if(Service.query('isLowMemoryDevice')){toastl10n='pressBackAgainToQuitBrowser';}
if(!this.hasLeaveAppToast){Service.request('SystemToaster:show',{textL10n:toastl10n});this.hasLeaveAppToast=true;}else{if(Service.query('isFtuRunning')){let origin=FtuLauncher.getFtuOrigin();appWindowManager.display(appWindowManager.getApp(origin));}else if(Service.query('isLowMemoryDevice')){this.app.kill();}else if(!this.app.origin.includes('app://')){this.app.kill();}else{appWindowManager.display(null,null,null,'home');let host=this.app.url.replace(/^(http|ftp|https):\/\/([^/]+).*/,'$2');asyncStorage.getItem('cached-camera-permission-sites',(sites)=>{if(sites&&sites.includes(host)){this.app.kill();}});}}}});break;}
return handled;},goToBrowserTop:function(){this.app.browserWindowButtons.hide();var activityReq=new MozActivity({name:'browser-top',data:{}});activityReq.onerror=(e)=>{var msg='[BrowserWindowNavigator] open "browser-top" activity '+'error:'+activityReq.error.name;this.debug(msg);};activityReq.onsuccess=(e)=>{var msg='[BrowserWindowNavigator] open "browser-top" activity '+'onsuccess';this.debug(msg);};},requestVolume:function(option){switch(option){case'show':if(navigator.volumeManager){navigator.volumeManager.requestShow();}
break;case'up':if(Service.query('SoundManager.isActivated')&&!Service.query('hasVolumeKey')){if(navigator.volumeManager){navigator.volumeManager.requestUp();}}
break;case'down':if(Service.query('SoundManager.isActivated')&&!Service.query('hasVolumeKey')){if(navigator.volumeManager){navigator.volumeManager.requestDown();}}
break;default:return;}},getPinToMenu:function(){return[{label:_('pinToTopSites'),callback:this.pinToTopSites.bind(this),value:0},{label:_('pinToAppsMenu'),callback:this.pinToAppsMenu.bind(this),value:1}];},buildOptionMenu:function(){let self=this;var menu=[{'data-icon':'search',subtitle:'searchURL',callback:()=>{if(this.app&&this.app.isBrowser()){if(Service.query('getTopMostWindow')===this.app&&!document.mozFullScreen){window.dispatchEvent(new CustomEvent('global-search-request'));if(this.app&&this.app.browserNavigationWidgets){this.app.browserNavigationWidgets.setNavigationMode('spatial');}
if(this.app){this.app.publish('focusonurlbar');}}else{document.mozCancelFullScreen();}}},subcallback:()=>{if(Service.query('GoogleVoiceAssistant.hasVoiceAssistant')){Service.request('launchGVA');return true;}
return false;}},{'data-icon':'arrow-left',subtitle:'goBack',disable:this.backEnabled?false:true,callback:this.app.back.bind(this.app)},{'data-icon':'arrow-right',subtitle:'goForward',disable:this.forwardEnabled?false:true,callback:this.app.forward.bind(this.app)},{'data-icon':this.app.loading?'browser-offline':'browser-refresh',subtitle:this.app.loading?'stopLoading':'refresh',callback:this.refresh.bind(this)},{'data-icon':'minimize',subtitle:'minimizeBrowser',callback:function(){appWindowManager.display(null,null,null,'home');let host=self.app.url.replace(/^(http|ftp|https):\/\/([^/]+).*/,'$2');asyncStorage.getItem('cached-camera-permission-sites',(sites)=>{if(sites&&sites.includes(host)){self.app.kill();}});}},{'data-icon':'share',subtitle:'share',disable:(this.app&&!this.app.loading)?false:true,callback:this.shareURL.bind(this)},{'data-icon':'pin',subtitle:'pinTo',disable:(this.app&&!this.app.loading)?false:true,callback:()=>{Service.request('showOptionMenu',{header:'pinTo',options:this.getPinToMenu(),},Service.query('getTopMostWindow'));}},{'data-icon':'settings',subtitle:'settings',callback:()=>{this.app.browserWindowButtons.hide();let activity=new window.MozActivity({name:'configure',data:{target:'device',section:'search'}});activity.onerror=function(){console.warn('Configure activity error:',activity.error.name);};}},{id:'quit',callback:()=>{this.app.kill();}},{id:hideTips==='true'?'showShortcutTips':'hideShortcutTips',callback:()=>{if(hideTips!=='true'){hideTips='true';}else{hideTips='false';}
this.app.browserWindowButtons.showTips(hideTips!=='true');try{localStorage.setItem('browser-hide-tips',hideTips);}catch(e){console.error('Failed to save browser-hide-tips: '+e);}}}];if(!Service.query('hasVolumeKey')){menu.splice(9,0,{id:'volume',callback:this.requestVolume.bind(this,'show')});}
if(this.app&&this.app.contextmenu){if(this.app.contextmenu.hasAction('save-image')){menu.splice(menu.length-1,0,{id:'downloadImage',callback:()=>{try{this.app.contextmenu.getActionCallback('save-image').call(this.app.contextmenu);}catch(e){Service.request('SystemToaster:show',{textL10n:'downloadImageFailed'});}}});}}
return menu;},showOptionMenu:function(){Service.request('BrowserMenuManager:show','options',this.buildOptionMenu());},updateGoBackForwardOptions:function(){this.app.canGoForward((result)=>{if(!this.appChrome.hasNavigation()){this.forwardEnabled=false;}else{this.forwardEnabled=(result)?true:false;}});this.app.canGoBack((result)=>{if(!this.appChrome.hasNavigation()){this.backEnabled=false;}else{this.backEnabled=(result)?true:false;}});},handleFullScreenChange:function(){if(this.isFocusOnApp()){this.setSoftkey(document.mozFullScreen);}},setSoftkey:function(isFullScreen){if(!this.app||!this.app.isBrowser()||!this.app.browserWindowButtons){return;}
const requestTipsShow=this.app.browserWindowButtons.requestTipsShow;this.app.browserWindowButtons.show({showTips:requestTipsShow&&hideTips!=='true'});},isFocusOnApp:function bwm_isFocusOnApp(){if(this.app&&this.app.browser&&this.app.browser.element){return document.activeElement===this.app.browser.element;}else{return false;}},isFocusInScope:function bwm_isFocusInScope(){return(this.isFocusOnApp()||(this.app&&this.app._modalDialog&&!this.app._modalDialog.element.hidden));},refresh:function(){this.app.loading?this.app.stop():this.app.reload();},pinToTopSites:function(){places.getPlace(this.app.config.url).then((place)=>{this.app.browserWindowButtons.hide();new MozActivity({name:'browser-pinto-top',data:{url:place.url}});});},pinToAppsMenu:function(){this.appChrome.addBookmark().then(()=>{Service.request('SystemToaster:show',{textL10n:'pinSiteToAppsMenuCompletely'});},(reason)=>{Service.request('DialogService:show',{header:_('confirmation'),content:_('siteWasPinnedToAppsMenuBefore'),type:'alert',ok:'ok',translated:true});});},shareURL:function(){new MozActivity({name:'share',data:{type:'url',url:this.app.config.url}});},destroy:function(){this.app.element.removeEventListener('_opened',this);this.app.element.removeEventListener('_closing',this);this.app.element.removeEventListener('_loading',this);this.app.element.removeEventListener('_loaded',this);this.app.element.removeEventListener('_value-selector-hidden',this);this.app.element.removeEventListener('_scrollerModeChanged',this);this.app.browser.element.removeEventListener('focus',this);this.app.browser.element.removeEventListener('blur',this);this.app.browser.element.removeEventListener('mozbrowserlocationchange',this);window.removeEventListener('mozfullscreenchange',this);window.removeEventListener('fullscreenchange',this);if(this.browserWindowButtons){this.browserWindowButtons.destroy();this.browserWindowButtons=null;}
this.app=null;this.appChrome=null;this._lastFocus=null;},debug:function(msg){if(this._DEBUG){console.log('[BrowserWindowNavigator]: '+msg);}}};exports.BrowserWindowNavigator=BrowserWindowNavigator;}(window));