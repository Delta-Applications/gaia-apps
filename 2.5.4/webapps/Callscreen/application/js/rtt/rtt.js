'use strict';const RTT_DISABLED='rtt_disabled';const RTT_ALWAYS_VISIBLE='rtt_always_visible';const RTT_VISIBLE_DURING_CALL='rtt_visible_during_call';let Rtt=(function rtt(){const RTT_ENABLED_SETTINGS='ril.rtt.enabled';const RTT_PREFERRED_SETTINGS='ril.rtt.preferredSettings';const RTT_MODIFY_STATUS_SUCCESS=1;let settingsValue={};let views=new Map();let callId=0;init();function init(){SettingsListener.observe(RTT_ENABLED_SETTINGS,false,(value)=>{settingsValue[RTT_ENABLED_SETTINGS]=value;});SettingsListener.observe(RTT_PREFERRED_SETTINGS,'visible-during-calls',(value)=>{settingsValue[RTT_PREFERRED_SETTINGS]=value;});}
function getSettingsValue(attr){let result=settingsValue[attr];return result;}
function rttSettings(){if(!getSettingsValue(RTT_ENABLED_SETTINGS)){return RTT_DISABLED;}
if(getSettingsValue(RTT_PREFERRED_SETTINGS)==='visible-during-calls'){return RTT_VISIBLE_DURING_CALL;}else{return RTT_ALWAYS_VISIBLE;}}
function enableRttMode(enable){console.log('RTT enableRTTMode');let call=CallsHandler.getConnectedCall();if(!call){return;}
if(enable){CallScreen.showToast('change-to-rtt-call');}
call.sendRttModifyRequest(enable);}
function requestIncomingRtt(){console.log('RTT requestIncomingRtt');let incomingCall=CallsHandler.incomingCall;if(incomingCall&&incomingCall.call){let call=incomingCall.call;call.addEventListener('statechange',function showToast(){if(call.state==='incoming'){return;}
if(call.state==='connected'){if(call.capabilities.supportRtt){CallScreen.showToast('change-to-rtt-call');}else{CallScreen.showToast('ans-rtt-failed');}}
call.removeEventListener('statechange',showToast);});call.answer(1,true);}}
function isRttViewShown(){let view=document.querySelector('.rtt-view.display');return view?true:false;}
function showRttView(){console.log('RTT showRTTView');let call=CallsHandler.getConnectedCall();if(call){let view=views.get(call);if(view){console.log('RTT show');view.show();CallScreen.lockScreenWake();CallsHandler.enableScreenDimFeature(false);}}}
function hideRttView(){let view=document.querySelector('.rtt-view.display');if(view){view.classList.remove('display');document.body.focus();CallScreen.unlockScreenWake();CallsHandler.enableScreenDimFeature(true);}}
function addRttView(call,name,duration){if(!call||views.has(call)){return;}
console.log('RTT addRTTView');let view=new RttView(call,++callId,name,duration);views.set(call,view);}
function removeRttView(call){if(!call){return;}
console.log('RTT removeRTTView');let view=views.get(call);view.remove();views.delete(call);}
function onrttmodifyresponse(call,req){let status=req.status;let isRtt=(call.rttMode==='full');console.log('RTT onrttmodifyresponse status: '+status+',isRtt:'+isRtt);if(RTT_MODIFY_STATUS_SUCCESS===status){if(isRtt){CallScreen.showToast('change-to-voice-call');}}else{if(isRtt){CallScreen.showToast('voice-call-failed');}else{if(call.emergency){let dialogConfig={title:{id:'rtt',args:{}},body:{id:'rtt-emegency-upgrade-rejected'},accept:{name:'ok',l10nId:'ok',priority:2,callback:function(){}}};CallScreen.showConfirmDialog(dialogConfig);}else{CallScreen.showToast('rtt-call-failed');}}}}
function onrttmodifyrequest(call,req){console.log('RTT onrttmodifyrequest');if(call&&req.mode==='full'){call.sendRttModifyResponse(true);CallScreen.showToast('upgrading-rtt');}}
function resetRtt(){callId=0;views.clear();}
return{get settings(){return rttSettings();},enableRttMode:enableRttMode,requestIncomingRtt:requestIncomingRtt,showRttView:showRttView,hideRttView:hideRttView,addRttView:addRttView,removeRttView:removeRttView,isRttViewShown:isRttViewShown,resetRtt:resetRtt,onrttmodifyresponse:onrttmodifyresponse,onrttmodifyrequest:onrttmodifyrequest}})();