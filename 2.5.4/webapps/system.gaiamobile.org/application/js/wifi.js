'use strict';var Wifi={name:'Wifi',wifiEnabled:true,OPEN_NETWORK_TAG:'open-network-notification',NO_INTERNET_TAG:'no-internet-notification',closeWifiNotificationByTag:function(tag){return Notification.get().then((notifications)=>{notifications.forEach((notification)=>{if(!notification){return;}
if(!notification.tag||!notification.tag.startsWith(tag)){return;}
notification.close();});return Promise.resolve();});},showNoInternetNotification:function(network){if(this.noInternetNotification){this.noInternetNotification.close();this.noInternetNotification=null;}
var _=navigator.mozL10n.get;var title=_('wifi-no-internet-title');var body=_('wifi-no-internet-body');this.noInternetNotification=new window.Notification(title,{body:body,tag:this.NO_INTERNET_TAG,data:{icon:'wifi-32px'},mozbehavior:{showOnlyOnce:true}});this.noInternetNotification.onclick=()=>{var _=navigator.mozL10n.get;var header=_('wifi-no-internet-header');var content=_('wifi-no-internet-content',{'name':network.ssid});if(this.noInternetNotification){this.noInternetNotification.close();this.noInternetNotification=null;}
Service.request('DialogService:show',{header:header,content:content,translated:true,type:'confirm',ok:'yes',cancel:'no',onOk:()=>{},onCancel:()=>{window.navigator.mozWifiManager.forget(network);}});};},init:function wf_init(){if(!window.navigator.mozSettings){return;}
if(!window.navigator.mozWifiManager){let key='wifi.enabled';let req=navigator.mozSettings.createLock().get(key);req.onsuccess=function(){if(req.result[key]){SettingsListener.getSettingsLock().set({'wifi.enabled':false});}}
return;}
var self=this;var wifiManager=window.navigator.mozWifiManager;wifiManager.onenabled=function onWifiEnabled(){var evt=document.createEvent('CustomEvent');evt.initCustomEvent('wifi-enabled',true,false,null);window.dispatchEvent(evt);};wifiManager.ondisabled=function onWifiDisabled(){var evt=document.createEvent('CustomEvent');evt.initCustomEvent('wifi-disabled',true,false,null);window.dispatchEvent(evt);};wifiManager.onstatuschange=function onWifiStatusChange(event){var evt=document.createEvent('CustomEvent');evt.initCustomEvent('wifi-statuschange',true,false,null);window.dispatchEvent(evt);if(event.status==='disconnected'){if(self.noInternetNotification){self.noInternetNotification.close();self.noInternetNotification=null;}}};wifiManager.onstationinfoupdate=(event)=>{this.connectedClients=event.station;var evt=document.createEvent('CustomEvent');evt.initCustomEvent('wifi-stationchange',true,false,null);window.dispatchEvent(evt);};this.closeWifiNotificationByTag(this.OPEN_NETWORK_TAG).then(()=>{wifiManager.onopennetwork=(e)=>{if(e.availability){if(this.openNetworkNotifyEnabled){this.showOpenNetworkNotification();}}else{if(this.notification){this.notification.close();this.notification=null;}}}});this.closeWifiNotificationByTag(this.NO_INTERNET_TAG).then(()=>{wifiManager.onwifihasinternet=(e)=>{if(!e.hasInternet){this.showNoInternetNotification(e.network);}else{if(this.noInternetNotification){this.noInternetNotification.close();this.noInternetNotification=null;}}};});SettingsListener.observe('wifi.enabled',true,function(value){if(!wifiManager&&value){self.wifiEnabled=false;if(value){SettingsListener.getSettingsLock().set({'wifi.enabled':false});}
return;}
self.wifiEnabled=value;});Service.register('closeWifiNotificationByTag',this);Service.registerState('connectedClients',this);window.Service.request('addObserver','wifi.notification',this);},showOpenNetworkNotification:function(){let notifOptions={body:navigator.mozL10n.get('open-wifi-available'),icon:window.location.protocol+'//'+window.location.hostname+'/style/icons/captivePortal.png',tag:this.OPEN_NETWORK_TAG,mozbehavior:{showOnlyOnce:true}};this.notification=new Notification(navigator.mozL10n.get('wifi-available'),notifOptions);this.notification.addEventListener('click',()=>{this.notification.close();this.notification=null;new window.MozActivity({name:'configure',data:{target:'device',section:'wifi-available-networks'}});});},observe:function(key,value){if(value){this.openNetworkNotifyEnabled=true;if(window.navigator.mozWifiManager.openNetworkNotify){this.showOpenNetworkNotification();}}else{this.openNetworkNotifyEnabled=false;}}};Wifi.init();