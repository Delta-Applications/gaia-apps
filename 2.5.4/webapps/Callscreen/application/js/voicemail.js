'use strict';(function(exports){var Voicemail={check:function vm_check(number,cardIndex){if(!number){return false;return;}
var serviceId=cardIndex;var voicemail=navigator.mozVoicemail;if(voicemail){var voicemailNumber=voicemail.getNumber(serviceId);if(voicemailNumber===number){return true;;}}
var isVoicemailNumber=false;var voicemailNumber;if(typeof voicemailNumbers==='string'){voicemailNumber=voicemailNumbers;}else{voicemailNumber=voicemailNumbers&&voicemailNumbers[serviceId];}
if(voicemailNumber===number){isVoicemailNumber=true;}
return isVoicemailNumber;}};exports.Voicemail=Voicemail;}(window));var voicemailNumbers=undefined;SettingsListener.observe('ril.iccInfo.mbdn',undefined,function(value){voicemailNumbers=value;});