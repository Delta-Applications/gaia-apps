'use strict';(function(exports){var DialerAgent=function DialerAgent(){var telephony=navigator.mozTelephony;if(!telephony){return;}
this._telephony=telephony;this._callEndPromptTime=2000;this._started=false;this._shouldVibrate=true;this._alerting=false;this._vibrateInterval=null;this._readOut=false;this._readOutData='';this._isBlockedNumber=false;var player=new Audio();this._player=player;player.mozAudioChannelType='ringer';player.preload='metadata';player.loop=true;this.freeCallscreenWindow=this.freeCallscreenWindow.bind(this);this.makeFakeNotification=this.makeFakeNotification.bind(this);this._storage=navigator.getDeviceStorage('sdcard');var conn=window.navigator.mozMobileConnections&&window.navigator.mozMobileConnections[0];if(conn&&conn.voice&&conn.voice.network&&conn.voice.network.mcc){SimplePhoneMatcher.mcc=conn.voice.network.mcc;}};DialerAgent.prototype.name='DialerAgent';DialerAgent.prototype.freeCallscreenWindow=function(){var conCall=this._telephony.conferenceGroup;var numOpenLines=this._telephony.calls.length+
((conCall.state||conCall.calls.length)?1:0);if(this._callscreenWindow&&(numOpenLines===0)&&!this._callscreenWindow.isVisible()){this._callscreenWindow.free();}};DialerAgent.prototype.start=function da_start(){if(!this._telephony){return;}
if(this._started){throw'Instance should not be start()\'ed twice.';}
this._started=true;SettingsListener.observe('dialer.ringtone','',function(value){this.defaultRingtone=value;}.bind(this));VersionHelper.getVersionInfo().then(function(versionInfo){if(versionInfo.isUpgrade()){LazyLoader.load('js/tone_upgrader.js',function(){toneUpgrader.perform('ringtone');});}},function(err){console.error('VersionHelper failed to lookup version settings.');});var lock=navigator.mozSettings.createLock();var querychecked=lock.get('AMX.defaultringtone.checked');querychecked.onsuccess=function(){var resultchecked=querychecked.result['AMX.defaultringtone.checked'];dump('dialer_agent >>> AMXchecked == '+resultchecked);var skuidValue=navigator.engmodeExtension.getPropertyValue('ro.boot.skuid');dump('dialer_agent >>>first time after factory reset >>> skuidValue == '+skuidValue);if(resultchecked==undefined&&skuidValue=="62GMX"){LazyLoader.load('js/amx_toneinit.js',function(){AmxToneInit.perform('ringtone');});navigator.mozSettings.createLock().set({'AMX.defaultringtone.checked':true});}}.bind(this);SettingsListener.observe('vibration.enabled',true,function(value){this._shouldVibrate=!!value;if(!this._shouldVibrate&&this._vibrateInterval){window.clearInterval(this._vibrateInterval);}
else if(this._alerting){this._vibrateInterval=window.setInterval(function vibrate(){navigator.vibrate([200]);},600);navigator.vibrate([200]);}}.bind(this));this._telephony.addEventListener('callschanged',this);if(this._telephony.conferenceGroup){this._telephony.conferenceGroup.addEventListener('callschanged',this);this._telephony.conferenceGroup.addEventListener('statechange',()=>{var conCall=this._telephony.conferenceGroup;if(conCall&&(conCall.calls.length||conCall.state)){return;}
var calls=this._telephony.calls;if(!calls.length){Service.request('cancelActivityMenu');setTimeout(()=>{if(!this._telephony.calls.length){Service.request('turnScreenOn','statechange');this._callscreenWindow.closeWindow();this.abandonChannel();}},this._callEndPromptTime);}});}
window.addEventListener('sleep',this);window.addEventListener('stop-alert',this);window.addEventListener('mute-alert',this);window.addEventListener('iac-callscreencomms',this);window.addEventListener('attentionopened',this);window.addEventListener('homescreenloaded',this);this._callscreenWindow=new CallscreenWindow();this._callscreenWindow.hide();if(applications&&applications.ready){this.makeFakeNotification();}else{window.addEventListener('applicationready',this.makeFakeNotification);}
Service.registerState('onCall',this);Service.registerState('isAlerting',this);Service.register('freeCallscreenWindow',this);return this;};DialerAgent.prototype.makeFakeNotification=function(){window.removeEventListener('applicationready',this.makeFakeNotification);this._callscreenWindow&&this._callscreenWindow.makeNotification();};DialerAgent.prototype.stop=function da_stop(){if(!this._started){return;}
this._started=false;this._telephony.removeEventListener('callschanged',this);if(this._telephony.conferenceGroup){this._telephony.conferenceGroup.removeEventListener('callschanged',this);}
window.removeEventListener('sleep',this);};DialerAgent.prototype.onCall=function(){return this._telephony.calls.length||this._telephony.conferenceGroup.state;}
DialerAgent.prototype.handleEvent=function da_handleEvent(evt){console.log('kaiosdialeragent: evt.type=%s',evt.type);if(evt.type==='homescreenloaded'){this._callscreenWindow&&this._callscreenWindow.ensure();return;}
if(evt.type==='mute-alert'){this._muteAlerting();return;}
if(evt.type==='stop-alert'||evt.type==='sleep'){this._stopAlerting();return;}
if(evt.type==='iac-callscreencomms'){this._handleIac(evt);return;}
if(evt.type==='attentionopened'){if(evt.detail.isCallscreenWindow&&!this._telephony.calls.length){window.setTimeout(()=>{if(!this._telephony.calls.length){this._callscreenWindow._terminated=false;this._callscreenWindow.closeWindow();this.abandonChannel();}});}
return;}
if(evt.type!=='callschanged'){return;}
var calls=this._telephony.calls;if(calls.length!==0){var index=calls.length-1;if(calls[index].state==='incoming'||calls[index].state==='connected'&&calls[index].secondId&&calls[index].secondId.number){var incomingCall=calls[index];var number=incomingCall.secondId?incomingCall.secondId.number:incomingCall.id.number;if(Service.query('remoteLockEnabled')){incomingCall.hangUp();return;}
if(incomingCall.emergency){this.handleCallschanged();}else{var options={filterBy:['number'],filterValue:number,filterOp:'fuzzyMatch'};navigator.mozContacts.findBlockedNumbers(options).then((contacts)=>{if(contacts&&contacts.length){this._isBlockedNumber=true;incomingCall.hangUp();}else{if(Service.query('isParentalControl')){options.filterBy=['tel'];navigator.mozContacts.find(options).then((contacts)=>{if(contacts&&contacts.length){this.handleCallschanged();}else{this._isBlockedNumber=true;incomingCall.hangUp();}});}else{this.handleCallschanged();}}});}}else{this.handleCallschanged();}}else{this.handleCallschanged();}};DialerAgent.prototype.handleCallschanged=function da_handleCallschanged(){if(this._isBlockedNumber){this._isBlockedNumber=false;return;}
Service.request('turnScreenOn','handleCallschanged');Service.request('cancelActivityMenu');if(this._telephony.conferenceGroup&&(this._telephony.conferenceGroup.calls.length||this._telephony.conferenceGroup.state)){let index=navigator.mozTelephony.conferenceGroup.calls[0].serviceId;Service.request('updateWifiCallState',{onCall:'onCall',index:index});return;}
var calls=this._telephony.calls;var self=this;if(calls.length===0){Service.request('updateWifiCallState',{onCall:''});setTimeout(()=>{if(!this._telephony.calls.length&&this._callscreenWindow.isActive()){this._callscreenWindow.closeWindow();this.abandonChannel();}},this._callEndPromptTime);return;}
Service.request('updateWifiCallState',{onCall:'onCall',index:calls[0].serviceId});if(!this._callscreenWindow.isVisible()||calls.length!==0){this.openCallscreen();}
if(this._alerting||calls[0].state!=='incoming'){return;}
var incomingCall=calls[0];var readoutEnable=Service.query('Accessibility.screenReaderEnabled');self._startAlerting(incomingCall);var number=incomingCall.secondId?incomingCall.secondId.number:incomingCall.id.number;var detail={alert:true,number:number};this._readOutData='';Contacts.quickFindByNumber(number,function lookup(contact){if(contact&&contact.name){detail.name=contact.name[0];self._readOutData+=detail.name;}
else{self._readOutData+=detail.number;}
Service.request('BgCallNotice:show',{text:navigator.mozL10n.get('incoming-call'),title:self._readOutData});self._readOutData+=navigator.mozL10n.get('incoming');var incomingEvt=new CustomEvent('incomingcall',{detail:detail});window.ExternalScreenManager.send(incomingEvt);});if(calls.length===1&&calls[0].state==='incoming'&&readoutEnable){this.readOutInfo(true);}
incomingCall.addEventListener('statechange',function callStateChange(){if(self._telephony.calls.length&&self._telephony.calls[0].state==='incoming'){return;}
Service.request('BgCallNotice:close');incomingCall.removeEventListener('statechange',callStateChange);self._stopAlerting();if(readoutEnable){self.readOutInfo(false);}
var incomingEvt=new CustomEvent('incomingcall',{detail:{alert:false}});window.ExternalScreenManager.send(incomingEvt);});};DialerAgent.prototype.readOutInfo=function da_readOutInfo(readorNot){if(this._readOut===readorNot){return;}
this._readOut=readorNot;if(this._readOut){setTimeout(()=>{Service.request('Accessibility:speak',this._readOutData,null,{repeat:true});},1200);}
else{Service.request('Accessibility:cancelSpeech');}};DialerAgent.prototype._startAlerting=function da_startAlerting(call){this._alerting=true;this.requestChannel();this._unmuteAlerting();if('vibrate'in navigator&&this._shouldVibrate){this._vibrateInterval=window.setInterval(function vibrate(){navigator.vibrate([200]);},600);navigator.vibrate([200]);}
if(!this._player.pause){this._player.paused();}
var number=call.secondId?call.secondId.number:call.id.number;Contacts.quickFindByNumber(number,(contact)=>{if(contact&&contact.ringtone){this._getRingtone(contact.ringtone).then((blob)=>{this._player.src=URL.createObjectURL(blob);if(this._alerting){this._player.play();}}).catch(()=>{this._playDefault();});}else{this._playDefault();}});};DialerAgent.prototype.requestChannel=function da_requestChannel(call){if(!this.audioChannelClient){this.audioChannelClient=new AudioChannelClient('ringer');this.audioChannelClient.requestChannel();}};DialerAgent.prototype.abandonChannel=function da_requestChannel(call){if(this.audioChannelClient){this.audioChannelClient.abandonChannel();this.audioChannelClient=null;}};DialerAgent.prototype._getRingtone=function da_getRingtone(ringtone){return new Promise((resolve,reject)=>{if(ringtone.indexOf('builtin:ringtone/')>-1){var base='/shared/resources/media/ringtones/';var url=base+ringtone.split('/')[1]+'.ogg';var xhr=new XMLHttpRequest();xhr.open('GET',url);xhr.overrideMimeType('audio/ogg');xhr.responseType='blob';xhr.send();xhr.onload=function(){resolve(xhr.response);};xhr.onerror=function(){var err=new Error('Could not read sound file: '+url+' (status: '+xhr.status+')');console.error(err);reject(err);};}else{var req=this._storage.get(ringtone);req.onsuccess=function(){resolve(this.result.slice());};req.onerror=function(){console.warn('Unable to get the ringtone: '+ringtone);reject(false);};}});};DialerAgent.prototype._playDefault=function da_playDefault(){if(this.defaultRingtone&&this._alerting){var settingsUrl=new SettingsURL();var ringtoneName=this.defaultRingtone.name;var playRingtone=()=>{this._player.src=settingsUrl.set(this.defaultRingtone);this._player.play();};playRingtone();}};DialerAgent.prototype.isAlerting=function(first_argument){return this._alerting;};DialerAgent.prototype._stopAlerting=function da_stopAlerting(){var player=this._player;this._alerting=false;if(player&&!player.paused){player.pause();player.currentTime=0;}
window.clearInterval(this._vibrateInterval);};DialerAgent.prototype._muteAlerting=function da_muteAlerting(){this._player.volume=0;window.clearInterval(this._vibrateInterval);};DialerAgent.prototype._unmuteAlerting=function da_muteAlerting(){this._player.volume=1;};DialerAgent.prototype._handleIac=function da__handleIac(evt){if(evt.detail.type==='rec-insufficient-storage'){navigator.mozSettings.createLock().get('device.storage.writable.name').then(result=>{var location=result['device.storage.writable.name'];var title='sd-card-full-title';var body='sd-card-full-body';if(location==='sdcard'){title='phone-storage-full-title';body='phone-storage-full-body';}
Service.request('DialogService:show',{header:title,content:body,ok:'settings',onOk:function(){var activityReq=new MozActivity({name:'configure',data:{target:'device',section:'mediaStorage'}});},type:'confirm'});});}else if(evt.detail.type==='stop-alerting'&&this.isAlerting()){this._stopAlerting();}};DialerAgent.prototype.openCallscreen=function(){if(this._callscreenWindow){this._callscreenWindow.ensure();this._callscreenWindow.show();this._callscreenWindow.requestOpen();}};exports.DialerAgent=DialerAgent;}(window));