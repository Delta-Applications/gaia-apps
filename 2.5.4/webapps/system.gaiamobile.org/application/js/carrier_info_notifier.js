'use strict';var CarrierInfoNotifier={_sound:'style/notifications/ringtones/notifier_shake.ogg',_notificationId:6000+Math.floor(Math.random()*999),init:function cin_init(){navigator.mozSetMessageHandler('cdma-info-rec-received',this.showCDMA.bind(this));navigator.mozSetMessageHandler('salestracker-register-server',this.showSalesTrackerToaster.bind(this));},showSalesTrackerToaster:function cin_showSalesTrackerToaster(message){if(message.display){Service.request('SystemToaster:show',{text:message.display});}},showCDMA:function cin_showCDMA(message){if(message.display){this.show(message.display,'cdma-record-info');}
if(message.extendedDisplay){var text=message.extendedDisplay.records.map(function(elem){return elem.content;}).join(' ');this.show(text,'cdma-record-info');}},show:function cin_show(message,title){var showDialog=function cin_showDialog(){Service.request('DialogService:show',{header:title,content:message,type:'alert',translated:true});};if(!window.Service.query('locked')){this.dispatchEvent('emergencyalert');this.playNotification();showDialog();return;}
var notificationId=++this._notificationId;var notification=Service.request('NotificationStore:add',{id:notificationId,title:title,text:message,callback:function showDialogAndDismiss(){showDialog();Service.request('NotificationStore:remove',notificationId);}});},playNotification:function cin_playNotification(){var ringtonePlayer=new Audio();ringtonePlayer.src=this._sound;ringtonePlayer.mozAudioChannelType='notification';ringtonePlayer.play();window.setTimeout(function smsRingtoneEnder(){ringtonePlayer.pause();ringtonePlayer.src='';},2000);},dispatchEvent:function cin_dispatchEvent(name,detail){var evt=document.createEvent('CustomEvent');evt.initCustomEvent(name,true,true,detail);window.dispatchEvent(evt);}};CarrierInfoNotifier.init();