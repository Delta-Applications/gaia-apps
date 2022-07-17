'use strict';var DtmfHelper=(function(){let dtmfEnabled=true;let dtmfTone=null;let lastPressedKey=null;let keypadSoundIsEnabled=false;let shortTone=false;let dtmfNumber='';let gTonesFrequencies={'1':[697,1209],'2':[697,1336],'3':[697,1477],'4':[770,1209],'5':[770,1336],'6':[770,1477],'7':[852,1209],'8':[852,1336],'9':[852,1477],'*':[941,1209],'0':[941,1336],'#':[941,1477]};let acceptKey=['1','2','3','4','5','6','7','8','9','*','0','#'];function init(){window.addEventListener('keydown',keyHandler);window.addEventListener('keyup',keyHandler);SettingsListener.observe('phone.ring.keypad',false,function(value){keypadSoundIsEnabled=!!value;});SettingsListener.observe('phone.dtmf.type',false,function(value){shortTone=(value==='short');});}
function keyHandler(evt){let key=CallScreen.translateKey(evt.key);if(acceptKey.indexOf(key)===-1||!dtmfEnabled||!CallsHandler.canShowDtmfScreen){return;}
if(evt.type==='keydown'){if(keypadSoundIsEnabled){TonePlayer.start(gTonesFrequencies[key],shortTone);}
playDtmfTone(key);dtmfNumber+=key;lastPressedKey=key;CallScreen.showDtmfNumber(dtmfNumber);}else{if(keypadSoundIsEnabled){TonePlayer.stop();}
if(key===lastPressedKey){stopDtmfTone();lastPressedKey=null;}}}
function press(value){playDtmfTone(value);TonePlayer.start(gTonesFrequencies[value],true);setTimeout(()=>{TonePlayer.stop();stopDtmfTone();});}
function playDtmfTone(key){var serviceId=0;if(CallsHandler.activeCall){serviceId=CallsHandler.activeCall.call.serviceId;}else{serviceId=navigator.mozTelephony.active.calls[0].serviceId;}
if(dtmfTone){dtmfTone.stop();dtmfTone=null;}
dtmfTone=new DtmfTone(key,shortTone,serviceId);dtmfTone.play();}
function stopDtmfTone(){if(!dtmfTone){return;}
dtmfTone.stop();dtmfTone=null;}
function disableDtmf(){dtmfEnabled=false;}
function enableDtmf(){dtmfEnabled=true;}
return{init:init,press:press,disableDtmf:disableDtmf,enableDtmf:enableDtmf,get dtmfNumber(){return dtmfNumber;},set dtmfNumber(number){dtmfNumber=number;}};})();