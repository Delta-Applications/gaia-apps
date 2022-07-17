define(["require","modules/settings_panel","modules/settings_service","modules/dialog_service","shared/device_storage/enumerate_all","shared/wifi_helper","modules/wifi_utils"],function(e){var t=e("modules/settings_panel"),n=e("modules/settings_service");e("modules/dialog_service");var i=e("shared/device_storage/enumerate_all"),o=e("shared/wifi_helper");return o.getWifiManager(),e("modules/wifi_utils"),function(){function e(){var e={menuClassName:"menu-button",header:{l10nId:"message"},items:[{name:"Select",l10nId:"select",priority:2,method:function(){var e=o.panel.querySelector("li.focus");navigator.mozSettings.createLock().set({"settings.wifi.certificatefile":e.dataset.fullName}),n.navigate(NavigationMap.previousSection.slice(1))}}]};SettingsSoftkey.init(e),SettingsSoftkey.show()}var o={};return t({onInit:function(e){o={panel:e,wlanCertificateFilesList:e.querySelector(".wifi-wlan-certificate-files-List")},this._dialogPanelShow=!1,this.certificateFileNumFlag=!1},onBeforeShow:function(){this._cleanup()},onShow:function(){this._createScanList(o.wlanCertificateFilesList);var e=o.panel.querySelector("gaia-header"),t=NavigationMap.previousSection.slice(1);e&&e.setAttribute("data-href",t)},onBeforeHide:function(){},_cleanup:function(){for(;o.wlanCertificateFilesList.hasChildNodes();)o.wlanCertificateFilesList.removeChild(o.wlanCertificateFilesList.lastChild)},_replaceFilePath:function(e,t){var n="/"+e.storageName+"/",i=e.storagePath+"/";return t.replace(n,i)},_getFileAbsolutePath:function(e,t){for(var n=0;n<e.length;n++)if(t.indexOf(e[n].storageName+"/")>=0)return this._replaceFilePath(e[n],t)},_createScanList:function(t){var n=navigator.getDeviceStorages("sdcard"),o=i(n,""),r=document.getElementById("wifi-wapi-confirm-dialog");r.hidden=!0,o.onsuccess=function(){var i=o.result;if(i){var a=this._parseExtension(i.name);if(this._isWlanCertificateFile(a)){var s=this._getFileAbsolutePath(n,i.name),c=this._createLinkAnchor(s);c.setAttribute("role","menuitem"),t.appendChild(c),this.certificateFileNumFlag=!0}o.continue()}else NavigationMap.menuReset(null,!1),r.hidden=this.certificateFileNumFlag,this.certificateFileNumFlag?e():SettingsSoftkey.hide()}.bind(this),o.onerror=function(){r.hidden=!1,console.warn("failed to get file:"+o.error.name)}},_setWlanCertificateItemsEnabled:function(e){for(var t=o.wlanCertificateFilesList.querySelectorAll("li"),n=e?function(e){e.classList.remove("disabled")}:function(e){e.classList.add("disabled")},i=0;i<t.length;i++)n(t[i])},_createLinkAnchor:function(e){var t=document.createElement("a"),n=this._parseFilename(e);t.textContent=n;var i=document.createElement("li");return i.appendChild(t),i.dataset.fullName=e,i.dataset.name=n,i},_parseFilename:function(e){return e.slice(e.lastIndexOf("/")+1,e.lastIndexOf("."))},_parseExtension:function(e){var t=e.split(".");return t.length>1?t.pop():""},_isWlanCertificateFile:function(e){var t=["cer","crt","pem","der","p12","pfx"];return t.indexOf(e)>-1}})}});