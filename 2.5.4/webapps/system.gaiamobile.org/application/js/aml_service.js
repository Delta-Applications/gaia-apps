
const AML_MSG_TIME_OUT=30*60*1000;function AmlMsgScheduler(aServiceId){this._serviceId=aServiceId;this._queue=[];this._listenNetworkFlag=false;this._msgManager=window.navigator.mozMobileMessage;this._iccManager=window.navigator.mozIccManager;if(navigator.mozMobileConnections){this._mobileConnection=window.navigator.mozMobileConnections[aServiceId];}
this.send_queue_msg=this._sendMsgInqueue.bind(this);}
AmlMsgScheduler.prototype={_serviceId:0,_queue:null,_mobileConnection:null,_listenNetworkFlag:null,_msgManager:null,_iccManager:null,_addNetworkCheckListener:function(){if(this._mobileConnection&&this._mobileConnection.voice){this._mobileConnection.addEventListener('voicechange',this.send_queue_msg);}
if(this._mobileConnection&&this._mobileConnection.data){this._mobileConnection.addEventListener('datachange',this.send_queue_msg);}
if(this._mobileConnection&&this._mobileConnection._imsHandler){this._mobileConnection._imsHandler.addEventListener('capabilitychange',this.send_queue_msg);}
this._listenNetworkFlag=true;},_removeNetworkCheckListener:function(){this._listenNetworkFlag=false;if(this._mobileConnection&&this._mobileConnection.voice){this._mobileConnection.removeEventListener('voicechange',this.send_queue_msg);}
if(this._mobileConnection&&this._mobileConnection.data){this._mobileConnection.removeEventListener('datachange',this.send_queue_msg);}
if(this._mobileConnection&&this._mobileConnection._imsHandler){this._mobileConnection._imsHandler.removeEventListener('capabilitychange',this.send_queue_msg);}},_sendMsgInqueue:function(){if(this._queue.length===0&&this._listenNetworkFlag){this._removeNetworkCheckListener();return;}
if(!this._hasNetwork()){return;}
DUMP('Aml: begin to send msg in quee,remove all listener');this._removeNetworkCheckListener();let snapshot=this._queue;this._queue=[];snapshot.forEach((aMsg)=>{this._sendToServer(aMsg)});},_sendBySms:function(aOption){if(!this._msgManager){DUMP('Aml: send sms error: no _msgManager');return;}
let sendOpts={serviceId:this._serviceId};let request=this._msgManager.sendSilently(aOption.recipient,aOption.content,sendOpts);},_sendByHttp:function(aOption){DUMP('Aml: _sendByHttp');let xhr=new XMLHttpRequest({mozSystem:true});xhr.open('POST',aOption.amlServerAddress,true);xhr.send(aOption.content);},_createAmlContent(aOption){let content='';content+='A"ML='+aOption.header+';';if(aOption.lt){content+='lt='+aOption.lt+';';}
if(aOption.lg){content+='lg='+aOption.lg+';';}
if(aOption.rd){content+='rd='+aOption.rd+';';}
if(aOption.top){content+='top='+aOption.top+';';}
if(this._mobileConnection&&this._mobileConnection.voice&&this._mobileConnection.voice.cell&&this._mobileConnection.voice.cell.gsmCellId){content+='ci='+this._mobileConnection.voice.cell.gsmCellId+';';}
if(aOption.pm){content+='pm='+aOption.pm+';';}
if(aOption.si){content+='si='+aOption.si+';';}
if(aOption.ei){content+='ei='+aOption.ei+';';}
if(aOption.mcc){content+='mcc='+aOption.mcc+';';}
if(aOption.mnc){content+='mnc='+aOption.mnc+';';}
content+='ml=';let length=0;if(content.length>=98){length=content.length+3;}else if(content.length<9){length=content.length+1;}else{length=content.length+2;}
content+=length;return content;},_sendToServer:function(aOption){if(aOption.timeStamp&&(Date.now()>aOption.timeStamp+AML_MSG_TIME_OUT)){DUMP('Aml: time beyond 30 minutes return');return;}
let roaming=this._mobileConnection.voice.roaming;if(!aOption.allowWhenRoaming&&roaming){DUMP('Aml: allowWhenroaming  is false now is roaming');return;}
if(roaming){aOption.recipient=aOption.longNumber||aOption.shortNumber;DUMP('Aml: now is roaming');}else{aOption.recipient=aOption.shortNumber||aOption.longNumber;}
aOption.content=this._createAmlContent(aOption);DUMP('Aml: aml content ='+aOption.content);if(aOption.allowSMSTech){this._sendBySms(aOption);}
if(roaming&&aOption.allowHTTPTech){this._sendByHttp(aOption);}},send:function(aOption){if(this._hasNetwork()){DUMP('Aml: has network ,sned now');aOption.timeStamp=null;this._sendToServer(aOption);}else{DUMP('Aml: no network , push in quee');aOption.timeStamp=Date.now();this._queue.push(aOption);if(!this._listenNetworkFlag){this._addNetworkCheckListener();}}},_hasNetwork:function(){let conn=this._mobileConnection;if(!conn){return false;}
let voice=conn&&conn.voice;let imsHandler=conn&&conn.imsHandler;if(imsHandler&&imsHandler.capability){return true;}else if(voice&&voice.state==='registered'){return true;}else{return false;}}};function AmlService(){let rilNumer=navigator.mozMobileConnections.length;this._schdules=[];for(let i=0;i<rilNumer;i++){this._schdules.push(new AmlMsgScheduler(i));}}
AmlService.prototype={_schdules:null,sendAmlMessage:function(aServiceId,aOption){let aClient=this._schdules[aServiceId];if(aClient){aClient.send(aOption);}}}
let amlService=null;window.addEventListener('iac-aml-msg',(evt)=>{if(!amlService){amlService=new AmlService();}
amlService.sendAmlMessage(evt.detail.id,evt.detail.data);});