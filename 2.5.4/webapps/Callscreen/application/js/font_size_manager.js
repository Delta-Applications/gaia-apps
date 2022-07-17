'use strict';var FontSizeManager=(function fontSizeManager(){var DIAL_PAD=0,SINGLE_CALL=1,CALL_WAITING=2,STATUS_BAR=3,SECOND_INCOMING_CALL=4;var _sizes={};_sizes[DIAL_PAD]={min:2.2,max:3.0};_sizes[SINGLE_CALL]={min:3.0,max:3.0,line:3.0};_sizes[CALL_WAITING]={min:2.3,max:2.5,line:1.3};_sizes[STATUS_BAR]={min:1.7,max:1.7};_sizes[SECOND_INCOMING_CALL]={min:2.3,max:2.5,line:3.7};var _defaultFontSize;function _getRootFontSize(){if(window.getComputedStyle(document.body,null)){_defaultFontSize=_defaultFontSize||parseInt(window.getComputedStyle(document.body,null).getPropertyValue('font-size'));}
return _defaultFontSize;}
function _getMinFontSize(scenario){return Math.round(_sizes[scenario].min*_getRootFontSize());}
function _getMaxFontSize(scenario){return Math.round(_sizes[scenario].max*_getRootFontSize());}
function _getAllowedFontSizes(scenario){var minFontSize=_getMinFontSize(scenario);var maxFontSize=_getMaxFontSize(scenario);var allowedSizes=[];for(var size=minFontSize;size<=maxFontSize;size+=2){allowedSizes.push(size);}
if(allowedSizes.indexOf(maxFontSize)===-1){allowedSizes.push(maxFontSize);}
return allowedSizes;}
function adaptToSpace(scenario,view,forceMaxFontSize,ellipsisSide,noEllipsis){var computedStyle=window.getComputedStyle(view);if((!view.value&&!view.textContent)||!computedStyle){return;}
var viewWidth=view.getBoundingClientRect().width;var viewFont=computedStyle.fontFamily;var allowedSizes;if(forceMaxFontSize){allowedSizes=[_getMaxFontSize(scenario)];}else{allowedSizes=_getAllowedFontSizes(scenario);}
var infos=FontSizeUtils.getMaxFontSizeInfo(view.value||view.textContent,allowedSizes,viewFont,viewWidth);var newFontSize=infos.fontSize;if(view.style.fontSize!==newFontSize){view.style.fontSize=newFontSize+'px';}
if(infos&&infos.overflow&&!noEllipsis){var overflowCount=FontSizeUtils.getOverflowCount(view.value||view.textContent,newFontSize,viewFont,viewWidth);overflowCount+=2;_useEllipsis(view,overflowCount,ellipsisSide);view.dataset.ellipsedCharacters=overflowCount;}else{view.dataset.ellipsedCharacters=0;}}
function _useEllipsis(view,overflowCount,ellipsisSide){var side=ellipsisSide||'begin';var localizedSide=(side==='begin'?'left':'right');var value=view.value||view.textContent;if(localizedSide=='left'){value='\u2026'+value.substr(-value.length+overflowCount);}else if(localizedSide=='right'){value=value.substr(0,value.length-overflowCount)+'\u2026';}
if(view.value){view.value=value;}else{var el=view.querySelector('bdi')||view;el.textContent=value;}}
function ensureFixedBaseline(scenario,view){var initialLineHeight=_sizes[scenario].line;if(!initialLineHeight){return;}
var maxFontSize=_getMaxFontSize(scenario);if(!window.getComputedStyle(view)){return;}
var fontSize=parseInt(window.getComputedStyle(view).fontSize,10);view.style.lineHeight=initialLineHeight*_getRootFontSize()+
(maxFontSize-fontSize)/2+'px';}
function resetFixedBaseline(view){view.style.removeProperty('line-height');}
return{DIAL_PAD:DIAL_PAD,SINGLE_CALL:SINGLE_CALL,CALL_WAITING:CALL_WAITING,STATUS_BAR:STATUS_BAR,SECOND_INCOMING_CALL:SECOND_INCOMING_CALL,adaptToSpace:adaptToSpace,ensureFixedBaseline:ensureFixedBaseline,resetFixedBaseline:resetFixedBaseline};})();