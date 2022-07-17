
var ViewHelper={debug:debug.bind(window,'ViewHelper'),curView:null,back:null,controls:null,focus:null,defaultFocusIndex:0,navigator:null,options:null,selector:null,exit:null,dirChange:null,beforeNav:null,afterNav:null,get curViewId(){var viewId=null;if(this.curView){var viewId=this.curView.id;var subId=this.curView.dataset.subid;if(subId&&subId.length>0){viewId+='.'+subId;}}
return viewId;},setDefault:function(){this.curView=null;this.back=SoftkeyHelper.defaultBackHandler;this.controls=this.defaultGetControls.bind(this);this.focus=NavigationMap.getDefaultFocusIndex;this.focusChange=null;this.defaultFocusIndex=0;this.navigator=VerticalNavigator;this.options=null;this.selector='div > ul:not([hidden]) > li:not([hidden]):not(.nofocus):not(.hidden)';this.exit=this.defaultExit.bind(this);this.beforeNav=null;this.afterNav=null;this.dirChange=null;},defaultGetControls:function(){var controls=null;if(this.curView&&this.selector){controls=this.curView.querySelectorAll(this.selector);}
return controls;},defaultExit:function(){this.debug('defaultExit: exit',this.curViewId);},switchView:function(curViewId,viewType){var menu=SoftkeyHelper.menuItems;this.debug('resetView',curViewId);if(this.curView&&this.exit)this.exit();this.setDefault();this.curView=$(curViewId);switch(curViewId){case'enable-bluetooth-view':this.back=function(){Transfer.cancelEnableBluetooth();}
break;case'devices-list-view':this.back=function(){Transfer.cancelEnableBluetooth();}
this.focusChange=this.devicesViewFocusChanged;break;case'search-devices-list-view':this.back=function(){Transfer.backToDeviceView();}
break;case'alert-view':this.back=function(){Transfer.closeAlert();}
break;default:break;}
if(this.beforeNav)this.beforeNav();NavigationMap.reset(viewType);if(this.afterNav)this.afterNav();},devicesViewFocusChanged:function(ele){var menu=SoftkeyHelper.menuItems;var softkeys=(ele.id==='search-for-devices')?menu.ok:menu.send;SoftkeyHelper.softkeyItems[this.curViewId]=softkeys;SoftkeyHelper.setSkMenu();},init:function(){SoftkeyHelper.init();document.body.classList.toggle('large-text',navigator.largeTextEnabled);window.addEventListener('largetextenabledchanged',()=>{document.body.classList.toggle('large-text',navigator.largeTextEnabled);});var observer=new MutationObserver((mutations)=>{mutations.forEach((mutation)=>{var target=mutation.target;var classes=target.classList;if(mutation.type==='attributes'&&mutation.attributeName==='class'){if((target.id==='enable-bluetooth-view'||'FORM'===target.nodeName)&&'dialog'===target.getAttribute('role')&&classes.contains('current')){if(!target.getAttribute('hidden')){console.log('Switch View to dialog '+target.id);ViewHelper.switchView(target.id,NAV_TYPE.dialog);}}else if('SECTION'===target.nodeName&&'region'===target.getAttribute('role')&&classes.contains('current')){if(!target.getAttribute('hidden')){console.log('Switch View to region '+target.id);ViewHelper.switchView(target.id,NAV_TYPE.view);}}}});});observer.observe(document.body,{childList:true,attributes:true,subtree:true});}}