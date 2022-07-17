'use strict';var NavigationMap={currentActivatedLength:0,dialogId:null,focusedElement:null,focusedMenuElement:null,focusedDialogElement:null,focusedControls:[],navType:null,dialogIndex:0,init:function(){ViewManager.init();this.start();},start:function(){var self=this;var observer=new MutationObserver(this.mutationsHandler.bind(this));observer.observe(document.body,{childList:false,attributes:true,subtree:true,attributeOldValue:true,attributeFilter:['class']});window.addEventListener('keydown',this.keydownHandler);document.addEventListener('focusChanged',(event)=>{self.focusChanged.call(self,event.detail.focusedElement);});window.addEventListener('windowLoaded',()=>{self.reset(2);});if('undefined'!=typeof inputHandler){inputHandler.init();}},mutationsHandler:function(mutations){var self=this;mutations.forEach((mutation)=>{self.navType=null;var target=mutation.target;var classes=target.classList;if('dialog'===target.getAttribute('role')&&'menu'!==target.dataset.subtype){if(mutation.oldValue&&mutation.oldValue.indexOf('hidden')>-1){self.navType=0;self.dialogId=target.id;}else{self.navType=2;}
NavigationMap.reset(self.navType);}else if(self.popupMenu(target)){}else if(target.tagName==='SECTION'&&target.parentNode.id!='fxa-toaster'){self.navType=2;if(target.id==='fxa-sign-in'||target.id==='fxa-sign-out'||target.id==='fxa-check-password')
NavigationMap.reset(self.navType);}});},reset:function(navType){var self=NavigationMap;if(self.currentActivatedLength||(fxaSelector.inProgress&&navType!=0)){return;}
switch(navType){case null:self.focusedMenuElement=NavigationHelper.resetMenu();break;case 0:self.focusedDialogElement=NavigationHelper.reset(VerticalNavigator,self.dialogControls,self.getDialogFocusIndex.bind(self),'dialog');ViewManager.setSkMenu4Dialog(self.dialogId);break;case 2:self.focusedElement=NavigationHelper.reset(ViewManager.navigator,ViewManager.controls,ViewManager.focus,ViewManager.curViewId,ViewManager.menuVisible());ViewManager.setSkMenu();if(self.focusedElement){self.focusChanged(self.focusedElement);}
break;}},updateSoftkeyClick4ForgotPWD:function(element){var centerKey=element.checked?'deselect':'select';ViewManager.updateSkText(centerKey,2);},handleClick:function(event){if(event.target.click){event.target.click();if(event.target.type==='checkbox'){event.preventDefault();this.updateSoftkeyClick4ForgotPWD(event.target);return;}
var input=event.target.querySelector('input')||(event.target.tagName.toLowerCase()==='input'&&event.target);if(input){if(input.type==='checkbox'){input.click();this.updateSoftkeyClick4ForgotPWD(input);}if(input.type==='radio'){input.click();}else{input.focus();}}
var select=event.target.querySelector('select');if(select&&event.target.tagName==='LI'&&event.target.classList.contains('focus')){if((FxaModuleOverlay.fxaOverlay&&FxaModuleOverlay.fxaOverlay.classList.contains('show'))||FxaModuleNavigation.updatingStep){return;}
var currentElement=event.target;var index=Array.from(currentElement.parentNode.querySelectorAll(ViewManager.selector)).indexOf(currentElement);ViewManager.focus=function(){return index;};fxaSelector.create(select);ViewManager.constSoftkeyItems[ViewManager.curViewId].forEach((obj,idx)=>{if(obj.priority===3){ViewManager.setMethod(ViewManager.curViewId,idx,null);return;}});}}else{var children=event.target.children;for(var i=0;i<children.length;i++){if(children[i].click)
children[i].click();}}},focusChanged:function(element){if((FxaModuleOverlay.fxaOverlay&&FxaModuleOverlay.fxaOverlay.classList.contains('show'))||FxaModuleNavigation.updatingStep){return;}
var input=element.querySelector('input');var select=element.querySelector('select');if(input&&['text','password','email','tel','number','checkbox'].indexOf(input.type)>-1){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
if(input&&input.type.toLowerCase()==='checkbox'){ViewManager.constSoftkeyItems[ViewManager.curViewId].forEach(obj=>{if(obj.priority==1&&obj.l10nId==='fxa-forgot-password-sk'){ViewManager.updateSkText('',1);ViewManager.setMethod(ViewManager.curViewId,0,null);return;}})
ViewManager.disable(false,2);var l10nKey=input.checked?'deselect':'select';ViewManager.updateSkText(l10nKey,2);}else if(select){ViewManager.disable(false,2);ViewManager.updateSkText('select',2);ViewManager.resetMethod();}else if(element.classList.contains('focus')&&element.getAttribute('role')=='option'){}else{ViewManager.resetMethod();ViewManager.setSkMenu();}
if(element.getAttribute('scroll-into-view')==='top'){element.scrollIntoView(true);}else if(element.getAttribute('scroll-into-view')==='bottom'){element.scrollIntoView(false);}},getDefaultFocusIndex:function(){var focusId=0;if(ViewManager.curViewId){focusId=NavigationMap.focusedControls[ViewManager.curViewId];if(isNaN(focusId))focusId=0;if(isNaN(focusId)||focusId<0||focusId>=NavigationHelper.controls.length){focusId=0;}}
return focusId;},getDialogFocusIndex:function(){return this.dialogIndex;},setDialogFocusIndex:function(index){if(index>=0){this.dialogIndex=index;}},deleteFocus:function(viewId){if(undefined===viewId)viewId=ViewManager.curViewId;delete NavigationMap.focusedControls[viewId];},dialogControls:function(){var dialogForm=$(NavigationMap.dialogId);return dialogForm?dialogForm.querySelectorAll('ol > li'):null;},popupMenu:function(target){var classes=target.classList;return classes&&classes.contains('group-menu')&&classes.contains('visible');},keydownHandler:function(e){switch(e.key){case'BrowserBack':if(fxaSelector.enabled){fxaSelector.cancel();return;}else if(!NavigationMap.currentActivatedLength){ViewManager.backKeyHandler();}
break;case'Backspace':e.preventDefault();e.stopPropagation();if(window.parent.FxAccountsUI.isClosing){return;}
if(fxaSelector.enabled){fxaSelector.cancel();}else{ViewManager.backKeyHandler();}
break;case'Accept':case'Enter':if(fxaSelector.enabled){fxaSelector.done();}
break;case'SoftLeft':if(fxaSelector.enabled){fxaSelector.cancel();}
break;}}};