'use strict';(function(exports){var NPSAlarmTimer=function(){this.log('constructor');this.INTERVAL=14*24*60*60*1000;this.TIME_POWER_OFF_CONSIDERED=navigator.engmodeExtension.getPropertyValue('persist.nps.off_time_considered');if(!this.TIME_POWER_OFF_CONSIDERED){this.TIME_POWER_OFF_CONSIDERED=true;}
this.alarms=navigator.mozAlarms;this.settings=navigator.mozSettings;this.in_progress=false;this.log('JWJ: Init set in progress as false');AlarmMessageHandler.addCallback(alarm=>{this.trigger(alarm);});this.addEventListener();this.addSettingsObservers();if(this.TIME_POWER_OFF_CONSIDERED){this.log('constructor, system power off time is not considered, '
+'no need update alarm timer while system power on');}else{this.log('constructor, start update nps alarm timer from system');this.updateSettingsValue({'nps.settings.update_timer':false});}};NPSAlarmTimer.prototype.addEventListener=function(){window.addEventListener('screenchange',this.handleEvent.bind(this));window.addEventListener('presskeypoweroff',this.handleEvent.bind(this));window.addEventListener('lockscreen-request-unlock',this.handleEvent.bind(this));};NPSAlarmTimer.prototype.addSettingsObservers=function(){this.log('addSettingsObservers');if(!this.settings){this.log('addSettingsObservers, invalid settings parameter, try 1000ms later');setTimeout(function(){this.addSettingsObservers();}.bind(this),1000);return;}
this.settings.addObserver('nps.settings.invalid',this.handle.bind(this));this.settings.addObserver('nps.settings.reset_timer',this.handle.bind(this));this.settings.addObserver('nps.settings.update_timer',this.handle.bind(this));this.settings.addObserver('nps.settings.suspend_timer',this.handle.bind(this));this.settings.addObserver('nps.settings.interval_changed',this.handle.bind(this));this.settings.addObserver('nps.settings.after_time_changed',this.handle.bind(this));this.settings.addObserver('nps.settings.before_time_changed',this.handle.bind(this));};NPSAlarmTimer.prototype.handleEvent=function(event){this.log('handleEvent, event.type: '+event.type);var trigger=false;switch(event.type){case'screenchange':this.screenEnabled=event.detail.screenEnabled;var screenLocked=Service.query('locked');this.log('handleEvent, screenEnabled: '+this.screenEnabled);this.log('handleEvent, screenLocked: '+screenLocked);if(this.screenEnabled&&!screenLocked){this.log('handleEvent, screen changed to on, and screen is not locked, '
+'check and trigger alarm timer if need');trigger=true;}
break;case'lockscreen-request-unlock':this.log('handleEvent, screenEnabled: '+this.screenEnabled);if(this.screenEnabled){this.log('handleEvent, screen changed to on, '
+'check and trigger alarm timer if need');trigger=true;}
break;case'presskeypoweroff':localStorage.setItem('cancelFeedbackNum',0);if(this.TIME_POWER_OFF_CONSIDERED){this.log('handleEvent, system power off time is not considered, '
+'no need update alarm timer while system power off');}else{this.log('handleEvent, suspend nps alarm timer from system power off');this.updateSettingsValue({'nps.settings.suspend_timer':false});}
break;}
if(trigger){this.checkAndTriggerIfNeed();}};NPSAlarmTimer.prototype.handle=function(event){this.log('handle, event: '+JSON.stringify(event));var value=event.settingValue;switch(event.settingName){case'nps.settings.invalid':this.log('handle, alarm timer is '+(value?'valid':'invalid'));if(!value){this.log('handle, bail');return;}
this.log('handle, alarm timer changed to invalid, remove');this.removeExistAlarms();break;case'nps.settings.reset_timer':this.log('handle, alarm timer should '+(value?'':'not ')+'be reset');if(!value){this.log('handle, bail');return;}
this.log('handle, start reset alarm timer');this.ensureAlarmsValid(function(){var currenttime=Date.now();this.resetTimer(currenttime,currenttime);}.bind(this));break;case'nps.settings.update_timer':this.log('handle, update alarm timer called from '+(value?'ftu':'system'));this.log('handle, start update alarm timer');this.ensureAlarmsValid(function(){this.updateTimer(value);}.bind(this));break;case'nps.settings.suspend_timer':this.log('handle, suspend alarm timer called from '
+(value?'factory reset':'system power off'));this.log('handle, start suspend alarm timer');this.suspendTimer(value,!value);break;case'nps.settings.before_time_changed':this.log('handle, start suspend alarm timer');this.suspendTimer(false,false,value);break;case'nps.settings.after_time_changed':this.log('handle, start update alarm timer 1000ms later');setTimeout(function(){this.log('handle, start update alarm timer');this.ensureAlarmsValid(function(){this.updateTimer(false,Date.now());}.bind(this));}.bind(this),1000);break;case'nps.settings.interval_changed':this.log('handle, nps alarm timer interval changed');this.INTERVAL=value;this.log('handle, start suspend alarm timer');this.suspendTimer(false,false);this.log('handle, start update alarm timer 1000ms later');setTimeout(function(){this.log('handle, start update alarm timer');this.ensureAlarmsValid(function(){this.updateTimer(false);}.bind(this));}.bind(this),1000);break;}};NPSAlarmTimer.prototype.checkTriggeredAlarmExist=function(triggeredAlarm,callback){this.log('checkTriggeredAlarmExist, triggered alarm: '+JSON.stringify(triggeredAlarm));if(!triggeredAlarm){this.log('checkTriggeredAlarmExist, invalid triggeredAlarm, just trigger!');if(callback&&typeof callback==='function'){callback(true);}
return;}
this.getAllAlarms(function(alarms){var exist=false;if(alarms){alarms.forEach(function(alarm){this.log('checkTriggeredAlarmExist, current alarm: '+JSON.stringify(alarm));if(alarm.data.isNPSAlarmTimer){exist=(alarm.id===triggeredAlarm.id)&&(alarm.date===triggeredAlarm.date);}}.bind(this));}
this.log('checkTriggeredAlarmExist, current triggered alarm is '
+(exist?'':'not ')+'exist');if(callback&&typeof callback==='function'){callback(exist);}}.bind(this));};NPSAlarmTimer.prototype.checkAndTriggerAlarm=function(alarm){this.log('checkAndTriggerAlarm, alarm: '+JSON.stringify(alarm));this.checkTriggeredAlarmExist(alarm,function(exist){this.log('checkAndTriggerAlarm, current triggered alarm is '
+(exist?'':'not ')+'exist');if(exist){this.log('checkAndTriggerAlarm, update trigger flag as true, wait for trigger');this.updateSettingsValue({'nps.alarm.wait_for_trigger':true});this.log('checkAndTriggerAlarm, update triggered as true');this.updateSettingsValue({'nps.alarm.has_triggered':true});}}.bind(this));};NPSAlarmTimer.prototype.trigger=function(alarm){this.log('trigger, trigger alarm: '+JSON.stringify(alarm));if(alarm&&alarm.data&&!alarm.data.isNPSAlarmTimer){this.log('trigger, invalid alarm timer, bail');return;}
this.log('trigger, update trigger flag as true, wait for trigger');this.updateSettingsValue({'nps.alarm.wait_for_trigger':true});this.log('trigger, update triggered as true');this.updateSettingsValue({'nps.alarm.has_triggered':true});this.checkAndTriggerIfNeed();};NPSAlarmTimer.prototype.checkAndTriggerIfNeed=function(){this.log('checkAndTriggerIfNeed');this.readSettingsValue('nps.alarm.wait_for_trigger',function(trigger){this.log('checkAndTriggerIfNeed, should be trigger: '+trigger);if(!trigger){this.log('checkAndTriggerIfNeed, bail');return;}
this.log('checkAndTriggerIfNeed, show nps alarm dialog');this.readSettingsValue('nps.feedback.in_progress',function(inprogress){this.log('checkAndTriggerIfNeed, nps feedback is '
+(inprogress?'':'not ')+'in progress');if(inprogress){this.log('checkAndTriggerIfNeed, do not show nps dialog again, bail');return;}
if(this.in_progress){this.log('JWJ: in progress already 2, return directly');return;}
NPSAlarmDialog.show(function(){this.log('checkAndTriggerIfNeed, nps dialog is cancelled');let cancelFeedbackNum=localStorage.getItem('cancelFeedbackNum');this.log('checkAndTriggerIfNeed,cancelFeedbackNum=========='+cancelFeedbackNum);if(isNaN(cancelFeedbackNum)||!cancelFeedbackNum){this.log('checkAndTriggerIfNeed,reset timer when the alarm dialog is first triggerred');this.updateSettingsValue({'nps.settings.reset_timer':true});this.updateSettingsValue({'nps.feedback.in_progress':false});this.in_progress=false;this.log('JWJ: cancelled so set in progress as false');cancelFeedbackNum=1;}else{this.log('checkAndTriggerIfNeed, disable nps after the alarm dialog is secondly shown');this.updateSettingsValue({'nps.settings.invalid':true});this.updateSettingsValue({'nps.alarm.wait_for_trigger':false});}
localStorage.setItem('cancelFeedbackNum',cancelFeedbackNum);}.bind(this),function(){this.log('checkAndTriggerIfNeed, nps dialog is shown');this.log('checkAndTriggerIfNeed, update feedback in progress as true');this.updateSettingsValue({'nps.feedback.in_progress':true});this.in_progress=true;this.log('JWJ: set in progress as true');}.bind(this));this.log('checkAndTriggerIfNeed, update trigger flag as false');this.updateSettingsValue({'nps.alarm.wait_for_trigger':false});}.bind(this));}.bind(this));};NPSAlarmTimer.prototype.ensureAlarmsValid=function(callback){this.log('ensureAlarmsValid');if(!this.alarms){this.log('ensureAlarmsValid, invalid alarms, try 1000ms later');setTimeout(function(){this.ensureAlarmsValid(callback);}.bind(this),1000);return;}
if(callback&&typeof callback==='function'){callback();}};NPSAlarmTimer.prototype.calculateInterval=function(starttime,pasttime){if(this.TIME_POWER_OFF_CONSIDERED&&!timechanged){return starttime-pasttime+this.INTERVAL;}else{return currenttime-pasttime+this.INTERVAL;}};NPSAlarmTimer.prototype.updateSettingsValue=function(settings){this.settings.createLock().set(settings);};NPSAlarmTimer.prototype.readSettingsValue=function(settingskey,callback){var request=this.settings.createLock().get(settingskey);request.onsuccess=function(){var result=request.result[settingskey];if(callback&&typeof callback==='function'){callback(result);}}.bind(this);request.onerror=function(){if(callback&&typeof callback==='function'){callback();}}.bind(this);};NPSAlarmTimer.prototype.getAllAlarms=function(callback){this.log('getAllAlarms');var request=this.alarms.getAll();request.onsuccess=function(){this.log('getAllAlarms, get alarms success');if(callback&&typeof callback==='function'){callback(request.result);}}.bind(this);request.onerror=function(){this.log('getAllAlarms, get alarms failed');if(callback&&typeof callback==='function'){callback();}}.bind(this);};NPSAlarmTimer.prototype.removeExistAlarms=function(callback){this.log('removeExistAlarms');this.getAllAlarms(function(alarms){if(alarms){alarms.forEach(function(alarm){this.log('removeExistAlarms, current alarm: '+JSON.stringify(alarm));if(alarm.data.isNPSAlarmTimer){this.log('removeExistAlarms, remove alarm: '+JSON.stringify(alarm));this.alarms.remove(alarm.id);}}.bind(this));}
this.log('removeExistAlarms, alarm timer have been removed');this.log('removeExistAlarms, update alarm timer exist flag as false');this.updateSettingsValue({'nps.alarm.exist':false});if(callback&&typeof callback==='function'){callback();}}.bind(this));};NPSAlarmTimer.prototype.resetAlarm=function(currenttime,starttime,pasttime){this.log('resetAlarm');var now=Date.now();var timechanged=!!currenttime;this.log('resetAlarm, current time: '+currenttime);this.log('resetAlarm, start time: '+starttime);this.log('resetAlarm, past time: '+pasttime);currenttime=currenttime?currenttime:now;starttime=starttime?starttime:now;this.log('resetAlarm, current time: '+new Date(currenttime));this.log('resetAlarm, start time: '+new Date(starttime));this.log('resetAlarm, timechanged: '+timechanged);if(!this.TIME_POWER_OFF_CONSIDERED||timechanged){starttime=currenttime;}
this.log('resetAlarm, start time: '+new Date(starttime));var alarmTime=starttime-pasttime+this.INTERVAL;this.log('resetAlarm, alarm time: '+new Date(alarmTime));this.log('resetAlarm, now time: '+new Date(now));if(alarmTime<=now){this.log('resetAlarm, alarm has been ended already, trigger');this.trigger();return;}
this.log('resetAlarm, reset start time');this.updateSettingsValue({'nps.alarm.start_time':now});this.removeExistAlarms(function(){this.log('resetAlarm, exist alarms have been removed');var request=this.alarms.add(alarmTime,'ignoreTimezone',{isNPSAlarmTimer:true});request.onsuccess=function(){this.log('resetAlarm, reset alarm success');this.log('resetAlarm, update alarm timer exist flag as true');this.updateSettingsValue({'nps.alarm.exist':true});this.log('resetAlarm, update alarm timer triggered flag as false');this.updateSettingsValue({'nps.alarm.has_triggered':false});}.bind(this);request.onerror=function(){this.log('resetAlarm, reset alarm failed');}.bind(this);}.bind(this));};NPSAlarmTimer.prototype.resetTimer=function(currenttime,starttime,pasttime){this.log('resetTimer');if(!pasttime){this.log('resetTimer, invalid past time, update past time as 0');pasttime=0;this.updateSettingsValue({'nps.alarm.past_time':pasttime});}
this.log('resetTimer, reset alarm');this.resetAlarm(currenttime,starttime,pasttime);};NPSAlarmTimer.prototype.updateTimer=function(ftu,currenttime){this.log('updateTimer, is called from '+(ftu?'ftu':'system'));if(!this.alarms){this.log('updateTimer, invalid alarms, bail');return;}
this.readSettingsValue('nps.alarm.exist',function(exist){this.log('updateTimer, alarm timer '+(exist?'':'not ')+'exist');if(!exist&&!ftu){this.log('updateTimer, alarm timer must be exist while not called from ftu, bail');return;}
this.readSettingsValue('nps.alarm.has_triggered',function(triggered){this.log('updateTimer, read alarm triggered flag: '+triggered);if(triggered){this.log('updateTimer, alarm has been triggered, bail');return;}
this.readSettingsValue('nps.alarm.start_time',function(starttime){this.log('updateTimer, read alarm start time: '+starttime);this.readSettingsValue('nps.alarm.past_time',function(pasttime){this.log('updateTimer, read alarm past time: '+pasttime);if(!starttime&&!pasttime&&!ftu){this.log('updateTimer, both start time and past time are invalid, '
+'alarm must be reset from FTU, not system');return;}
this.log('updateTimer, start reset timer');this.resetTimer(currenttime,starttime,pasttime);}.bind(this));}.bind(this));}.bind(this));}.bind(this));};NPSAlarmTimer.prototype.suspendTimer=function(factoryRest,powerOff,currenttime){this.log('suspendTimer');if(this.TIME_POWER_OFF_CONSIDERED&&(factoryRest||powerOff)){this.log('suspendTimer, system power off time should be considered, so '
+(factoryRest?'factory reset':'system power off')
+' operation should not suspend alarm timer');return;}
this.readSettingsValue('nps.alarm.exist',function(exist){this.log('suspendTimer, alarm timer '+(exist?'':'not ')+'exist');if(!exist){this.log('suspendTimer, alarm timer must be exist, bail');return;}
this.readSettingsValue('nps.alarm.has_triggered',function(triggered){this.log('suspendTimer, read alarm triggered flag: '+triggered);if(triggered){this.log('suspendTimer, alarm has been triggered, bail');return;}
this.readSettingsValue('nps.alarm.start_time',function(starttime){console.log('suspendTimer, read alarm start time: '+starttime);this.readSettingsValue('nps.alarm.past_time',function(pasttime){console.log('suspendTimer, read alarm past time: '+pasttime);var now=currenttime?currenttime:Date.now();var currentPastTime=now-starttime+pasttime;this.log('suspendTimer, update past time');this.updateSettingsValue({'nps.alarm.past_time':currentPastTime});}.bind(this));}.bind(this));}.bind(this));}.bind(this));};NPSAlarmTimer.prototype.log=function(msg){console.log('NPS NPSAlarmTimer '+msg);};new NPSAlarmTimer();})(window);