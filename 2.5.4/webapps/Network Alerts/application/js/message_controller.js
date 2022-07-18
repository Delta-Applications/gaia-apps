'use strict';(function(exports){let MessageControllers=function(){this.DEBUG=true;this.name='MessageController';this.isChecking=false;this.isReverse=false;this.messageCache=[];this.currentWindow=null;this.windowHashMap=new Map();this.needSkip=false;};MessageControllers.prototype.debug=function(s){if(this.DEBUG){console.log(`-*- CMAS ${this.name} -*- ${s}`);}};MessageControllers.prototype.init=function(){window.addEventListener('message',this.handleEvent.bind(this));window.navigator.mozSetMessageHandler('cellbroadcast-received',(message)=>{if(!this.notice){this.notice=new Notices();}
this.onCellBroadcast(message);});Utils.getOperatorName();};MessageControllers.prototype.onCellBroadcast=function(message){Utils.setWakeLock('cpu');Store.init();if(!this.isChecking){this.isChecking=true;this.debug(`onCellBroadcast message -> ${JSON.stringify(message)}`);if(!Utils.isEmergencyAlert(message)&&!Utils.isOperatorChannels(message.messageId)){return;}
Utils.ITLangueageCheck(message).then((value)=>{this.debug('ITLangueageCheck isneedto skip this cb message for Italy  :'+value);this.needSkip=value;},this);this.checkMessage(message).then((value)=>{if(value&&!this.needSkip){this.showMessage(message);}
this.debug('Start handle cache message '+'while message cache array length greater than 0.');this.handleCacheMessage(value);});}else{this.debug('Cache unchecked message while DUT receive multiple messages');this.messageCache.push(message);}};MessageControllers.prototype.checkMessage=function(message){return new Promise((resolve)=>{if(!Utils.isEmergencyAlert(message)){this.debug(`checkMessage it is not a emergency alert.`);this.isChecking=false;return resolve(false);}else{return MessageManager.checkIfMessageCanShow(message).then((value)=>{this.debug(`checkMessage isShow value -> ${value}`);this.isChecking=false;resolve(value);});}});};MessageControllers.prototype.showMessage=function(message){if(!this.rings){this.rings=new Rings();}
let win=null;if(!this.isReverse||this.windowHashMap.size<=0){win=Utils.sendAlert(message);this.currentWindow=win;}
this.windowHashMap.set(message.timestamp,{message,window:win});this.rings.startSoundAndVibrate(message.messageId);this.setPeriodReminder();this.notice.sendNotification(message);};MessageControllers.prototype.getTargetWindow=function(){let tDate;let tWin;this.windowHashMap.forEach((win,date)=>{if(tDate){if((!this.isReverse&&tDate<date)||(this.isReverse&&tDate>date)){tDate=date;tWin=win;}}else{tDate=date;tWin=win;}});return tWin;};MessageControllers.prototype.closeOldWindow=function(win){win.addEventListener('visibilitychange',()=>{if(document.hidden){win.close();}});};MessageControllers.prototype.getCloseWindow=function(messageTimestamp){let tWin=null;this.windowHashMap.forEach((win,date)=>{if(messageTimestamp===date&&win.window){tWin=win.window;return;}});return tWin;};MessageControllers.prototype.handleEvent=function(event){let data=event.data;let messageType=data.type;this.debug(`handleEvent message data -> ${JSON.stringify(data)}`);switch(messageType){case'closeAttentionWindow':this.rings.stopSoundAndVibrate();let messageTimestamp=data.timestamp;let needCloseWindow=null;if(this.windowHashMap.size>0&&messageTimestamp){needCloseWindow=this.getCloseWindow(messageTimestamp);this.windowHashMap.delete(messageTimestamp);}
if(this.windowHashMap.size>0){let targetWin=this.getTargetWindow();if(targetWin.window){needCloseWindow&&needCloseWindow.close();this.currentWindow=targetWin.window;}else{needCloseWindow&&this.closeOldWindow(needCloseWindow);this.currentWindow=Utils.sendAlert(targetWin.message);}
this.setPeriodReminder();}else{MessageManager.stopPeriodReminder().then(()=>{this.currentWindow.close();window.close();});}
break;default:break;}};MessageControllers.prototype.setPeriodReminder=function(bReset=true){this.debug(`setPeriodReminder`);MessageManager.startPeriodReminder(bReset,()=>{if(this.currentWindow){this.debug(`It's time to lighten screen, vibrate and sound.`);let targetWin=this.getTargetWindow();this.closeOldWindow(this.currentWindow);this.currentWindow=Utils.sendAlert(targetWin.message);this.rings.startSoundAndVibrate(targetWin.message.messageId);this.setPeriodReminder(false);}});};MessageControllers.prototype.handleCacheMessage=function(needShow){if(!this.isChecking){if(this.messageCache.length>0){const cacheMessage=this.messageCache.pop();this.onCellBroadcast(cacheMessage);}else if(!needShow&&!this.currentWindow&&document.hidden){window.close();}}};exports.MessageController=new MessageControllers();})(window);