'use strict'
if(typeof window.$!=='function'){window.$=function(id){return(typeof id==='string')?document.getElementById(id):id;};}
if(typeof window.lget!=='function'){window.lget=navigator.mozL10n.get;}
if(typeof String.prototype.contains!=='function'){String.prototype.contains=function(substr){return-1!==this.indexOf(substr);};}
if(typeof Array.prototype.contains!=='function'){Array.prototype.contains=function(item){return-1!==this.indexOf(item);};}
var Message={show:function(id){var toast={messageL10nId:id,latency:2000,useTransition:true};if(!SystemToaster.isInitialized())
SystemToaster.initialize($('fxa-toaster'));SystemToaster.showToast(toast);}};var loadPhoneUtils=function(number){return new Promise(resolve=>{if(!number){resolve(null);return;}
LazyLoader.load(["js/phoneutils/PhoneNumber.js","js/phoneutils/PhoneNumberNormalizer.js","js/phoneutils/PhoneNumberUtils.js"],()=>{PhoneNumberUtils.parse(number).then(phone=>{resolve(phone);});});});};var createRegionSelect=function createRegionSelect(number,callback){var href='../shared/resources/mcc.json';var xhr=new XMLHttpRequest();xhr.open('GET',href,true);xhr.responseType='json';xhr.onload=function(){loadPhoneUtils(number).then(phone=>{var code=phone&&phone.region;var selected=buildUp(code,xhr.response);selected.nationalNumber=phone&&phone.nationalNumber||'';callback(selected);});};xhr.onerror=function(){console.error('Error getting file');callback();};xhr.send();function compare(a,b){const genreA=a.full.toUpperCase();const genreB=b.full.toUpperCase();let comparison=0;if(genreA>genreB){comparison=1;}else if(genreA<genreB){comparison=-1;}
return comparison;}
function buildUp(code,source){var ret={l10nId:'fxa-cc-unitedstates',value:'+1'};var select=ViewManager.curView.querySelector('select.region-code');if(!select){return ret;}
if(!code){code='us';}
select.innerHTML='';var ar=[];Object.values(source).sort(compare).forEach((c)=>{if(ar.indexOf(c.full)>-1){return;}
var l10nId='fxa-cc-'+
c.full.toLowerCase().replace(/ /g,'').replace(/,/g,'').replace(/\./g,'').replace(/\(/g,'').replace(/\)/g,'').replace(/&/g,'').replace(/'/g,'');var option=document.createElement('option');option.setAttribute('value',c.prefix);option.setAttribute('data-l10n-id',l10nId);option.setAttribute('code',c.code);if(c.code.toLowerCase()===code.toLowerCase()){option.setAttribute('selected','selected');ret.l10nId=l10nId;ret.value=c.prefix;if(select.getAttribute('keyMatch')){select.setAttribute(select.getAttribute('keyMatch'),c.code);}}
select.appendChild(option);ar.push(c.full);});return ret;}};function _validePassword(passwordValue){if(passwordValue.length===0){return'PASSWORD_EMPTY';}
if(!passwordValue||passwordValue.length<8){return'PASSWORD_LESS';}
if(passwordValue.length>20){return'PASSWORD_MORE';}
if(!_passwdPolicyCheck(passwordValue)){return'PASSWORD_ERROR';}
return'';}
function _passwdPolicyCheck(passwd){var allowedSpecial=".,@!?-:&\'()#+=/¡¿*;$\"<>%^\\~`|[]©{}®£¥€";var specialTested=passwd.match(/\W/g);if(specialTested){var found=specialTested.find(c=>{return allowedSpecial.indexOf(c)<0;});if(found){return false}}
return(/^(?![^a-zA-Z]+$)(?!\D+$).{8,20}$/.test(passwd))}
function _isEmailValid(emailEl){return emailEl&&emailEl.value&&emailEl.validity.valid&&_checkEmail(emailEl.value);}
function _checkEmail(email){var reg=/^(?:[0-9A-Za-z]{1,30})(?:[-._][0-9A-Za-z_]{1,30}){0,2}@(?:[0-9A-Za-z]{1,30})(?:[-._][0-9A-Za-z]{1,30}){0,2}[.][0-9A-Za-z]{2,20}$/;return reg.test(email);}
function _loadPhoneNumber(){var _conns=navigator.mozMobileConnections;if(!_conns){return;}
var phoneNumber=null;Array.prototype.some.call(_conns,function(conn,index){var iccId=conn.iccId;if(!iccId){return;}
var iccObj=navigator.mozIccManager.getIccById(iccId);if(!iccObj){return;}
var iccInfo=iccObj.iccInfo;if(!iccInfo){return;}
phoneNumber=iccInfo.msisdn||iccInfo.mdn;if(phoneNumber){if(phoneNumber.indexOf('+')===-1){phoneNumber='+'+phoneNumber;}
return true;}});return phoneNumber;}
function _getInternationalPhoneNumber(phoneNumber,cc){var hasPlusSign=phoneNumber&&phoneNumber.indexOf('+')==0;var ret='';if(hasPlusSign&&cc&&phoneNumber&&phoneNumber.indexOf(cc)>-1){ret=phoneNumber;}else if(!hasPlusSign&&cc&&phoneNumber){ret=cc+phoneNumber;}
return ret;}
function _getTimeRemaining(endTime){var t=Date.parse(endTime)-Date.parse(new Date());var seconds=Math.floor((t/1000)%60);var minutes=Math.floor((t/1000/60)%60);return{'total':t,'minutes':minutes,'seconds':seconds};}
var _retryInterval={5:1*60*1000,6:5*60*1000,7:15*60*1000,8:60*60*1000,9:4*60*60*1000};function _wrongPaswordRetry(){window.parent.asyncStorage.getItem('checkpassword.retrycount',function(value){var count=value||0;count+=1;window.parent.asyncStorage.setItem('checkpassword.retrycount',count);if(count>=5){if(count>10){count=10;}
var inverval=_retryInterval[count];var enableTime=(new Date()).getTime()+inverval;window.parent.asyncStorage.setItem('checkpassword.enabletime',enableTime);}});}
function _rightPasswordRetryRest(){window.parent.asyncStorage.setItem('checkpassword.retrycount',0);window.parent.asyncStorage.setItem('checkpassword.enabletime',0);}
function _showConfirmation(config,onYes){var bodyId='fxa-confirm-dialog-body';var titleId='fxa-confirm-dialog-title';if(config&&config.bodyId){bodyId=config.bodyId;}
if(config&&config.titleId){titleId=config.titleId;}
var bodyArgs={};if(config&&config.bodyArgs){bodyArgs=config.bodyArgs;}
var dialogConfig={title:{id:titleId,args:{}},body:{id:bodyId,args:bodyArgs},backcallback:function(){},cancel:{name:'No',l10nId:'fxa-no',priority:1,callback:function(){}},confirm:{name:'Yes',l10nId:'fxa-yes',priority:3,callback:function(){onYes&&onYes();}}};var dialog=new ConfirmDialogHelper(dialogConfig);dialog.show(document.getElementById('app-confirmation-dialog'));}
function showHint(config){var bodyId='fxa-confirm-dialog-body';var titleId='fxa-confirm-dialog-title';if(config&&config.bodyId){bodyId=config.bodyId;}
if(config&&config.titleId){titleId=config.titleId;}
var bodyArgs={};if(config&&config.bodyArgs){bodyArgs=config.bodyArgs;}
var bodyObj={id:bodyId,args:bodyArgs};if(config&&config.text){bodyObj={text:config.text};}
var dialogConfig={title:{id:titleId,args:{}},body:bodyObj,accept:{l10nId:'ok',priority:2,callback:function(){},}};var dialog=new ConfirmDialogHelper(dialogConfig);dialog.show(document.getElementById('app-confirmation-dialog'));}
function retryFailsHint(timeInMs){var delta=timeInMs-new Date().getTime();if(delta<0){return;}
delta=delta/1000;var hours=Math.floor(delta/3600);delta%=3600;var minutes=Math.floor(delta/60);var seconds=Math.floor(delta%60);accountUtils.debug("hours: "+hours);accountUtils.debug("minutes: "+minutes);accountUtils.debug("seconds: "+seconds);var timeMsg='';if(hours>0){timeMsg=lget('try-again-hours',{n:hours});}else if(minutes>0){timeMsg=lget('try-again-minutes',{n:minutes});}else if(seconds>0){timeMsg=lget('try-again-seconds',{n:seconds});}
var config={};var baseMsg=lget('fxa-multiple-sign-in-attempts-content-1')+' ';config.text=baseMsg+timeMsg;showHint(config);}
var accountUtils={DEBUG:false,debug:function(...args){if(this.DEBUG){args.unshift('[KaiAccount]');console.log.apply(console,args);}}}
var settingsLock=window.navigator.mozSettings.createLock();var request=settingsLock.get('kaiaccount.debug.enabled');request.onsuccess=(()=>{accountUtils.DEBUG=request.result['kaiaccount.debug.enabled']===true;});function showNotiIfOffline(){if(navigator.connection&&navigator.connection.type!=='cellular'&&navigator.connection.type!=='wifi'){window.parent.Service.request('SystemToaster:show',{textL10n:'fxa-offline-error-message-1'});}}
showNotiIfOffline();