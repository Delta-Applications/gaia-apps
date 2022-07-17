
(function(exports){'use strict';let rttCache={};function cloneMessage(message){if(message===undefined){return undefined;}
if(!message){return null;}
let newMessage={};for(let p in message){newMessage[p]=message[p];}
return newMessage;}
function setMessage(callId,messageId,messageContent){if(!callId){console.log('RTT cache setMessage: callId is null');return;}
if(!rttCache[callId]){rttCache[callId]={};}
rttCache[callId][messageId]=cloneMessage(messageContent);RttBubbleControl.updateMessage(callId,messageId);}
function getMessage(callId,messageId){if(!callId||!rttCache[callId]){console.log('RTT cache getMessage: callId is invalid '+callId);return null;}
return cloneMessage(rttCache[callId][messageId]);}
function getLastMessage(callId,direction){let lastMessage={};if(!callId||!rttCache[callId]){return lastMessage;}
let length=Object.keys(rttCache[callId]).length;let i=length-1;for(i;i>=0;i--){let message=rttCache[callId][i];if(message&&message.direction===direction&&message.body&&message.body!=='<br>'){lastMessage.body=message.body;break;}}
if(lastMessage.body){lastMessage.id=i;}
return lastMessage;}
function clearCache(callId){if(callId){delete rttCache[callId];}else{for(let p in rttCache){delete rttCache[p];}}}
exports.RttCache={getMessage:getMessage,setMessage:setMessage,clearCache:clearCache,getLastMessage:getLastMessage};})(window);