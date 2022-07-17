'use strict';var ConferenceGroupHandler=(function(){var _=navigator.mozL10n.get;var imsCallsItem=new Map();var telephony=window.navigator.mozTelephony;if(telephony.conferenceGroup){telephony.conferenceGroup.oncallschanged=onCallsChanged;telephony.conferenceGroup.onstatechange=onStateChange;telephony.conferenceGroup.onerror=onConferenceError;}
function onCallsChanged(){CallsHandler.isMergeRequsted=false;ConferenceGroupUI.updateGroupInformation();if(ConferenceGroupUI.isImsconferenceGroup()){initCallStateChangHandler();}else{if(telephony.conferenceGroup.calls.length>=2){CallsHandler.checkCalls();}}}
function onStateChange(){CallsHandler.isMergeRequsted=false;var calls=telephony.conferenceGroup.calls;console.log('onStateChange length: '+calls.length+' state: '+
telephony.conferenceGroup.state);switch(telephony.conferenceGroup.state){case'resuming':case'connected':var simNum='';if(calls.length){simNum=CallScreen.getSimNum(calls[0]);}
ConferenceGroupUI.show(simNum);CallRecording.autoCallRec();break;case'held':ConferenceGroupUI.hold();break;case'':ConferenceGroupUI.end();imsCallsItem.clear();CallsHandler.checkCalls();break;}}
function onConferenceError(evt){CallsHandler.isMergeRequsted=false;var errorMsg;if(evt.name=='addError'){errorMsg=('conferenceAddError');}else{errorMsg=('conferenceRemoveError');}
CallScreen.showToast(errorMsg);}
function signalConferenceEnded(){ConferenceGroupUI.markCallsAsEnded();}
function addToGroupDetails(info){return ConferenceGroupUI.addCall(info);}
function addToImsGroupDetails(number,name){return ConferenceGroupUI.addImsCall(number,name);}
function removeFromGroupDetails(node){ConferenceGroupUI.removeCall(node);}
function isGroupDetailsShown(){return ConferenceGroupUI.isGroupDetailsShown();}
function initCallStateChangHandler(){if(telephony.conferenceGroup.calls.length){let call=telephony.conferenceGroup.calls[0];call.onstatechange=()=>{if(call.vowifiQuality==='bad'){CallScreen.remindBadWfc();}};}}
function getCallFromCallMap(listItem){var call=null;imsCallsItem.forEach((item,imsCall)=>{if(item===listItem){call=imsCall;}});return call;}
function hangUpFromCallMap(listItem){var call=getCallFromCallMap(listItem);if(call){call.hangUp();}}
function separateCallFromCallMap(listItem){var call=getCallFromCallMap(listItem);if(call){telephony.conferenceGroup.remove(call);ConferenceGroupUI.removeCall(listItem);imsCallsItem.delete(call);}}
return{addToGroupDetails:addToGroupDetails,addToImsGroupDetails:addToImsGroupDetails,removeFromGroupDetails:removeFromGroupDetails,signalConferenceEnded:signalConferenceEnded,isGroupDetailsShown:isGroupDetailsShown,hangUpFromCallMap:hangUpFromCallMap,separateCallFromCallMap:separateCallFromCallMap,get conferenceGroupLength(){return telephony.conferenceGroup.calls.length;},get imsCallsItem(){return imsCallsItem;},get currentDuration(){return ConferenceGroupUI.currentDuration;}};})();