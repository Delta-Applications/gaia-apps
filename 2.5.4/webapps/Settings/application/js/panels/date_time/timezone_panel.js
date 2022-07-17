define(["require","modules/settings_panel","modules/settings_service"],function(e){var t=e("modules/settings_panel"),n=e("modules/settings_service");return function(){function e(){var e={menuClassName:"menu-button",header:{l10nId:"message"},items:[{name:"Cancel",l10nId:"cancel",priority:1,method:function(){n.navigate("dateTime")}},{name:"Select",l10nId:"select",priority:2,method:function(){}}]};SettingsSoftkey.init(e),SettingsSoftkey.show()}function i(e,t){s=t;for(var n=0;n<e.length;n++){var i=document.createElement("li"),r=document.createElement("gaia-radio"),c=document.createElement("p"),u=document.createElement("label");i.setAttribute("role","presentation"),i.setAttribute("id",e[n].city),r.setAttribute("data-role","menuitemradio"),r.setAttribute("name","tz");var l=e[n].city.replace(/.*?\//,"");c.dataset.l10nId=l,u.textContent="UTC"+e[n].offset.substring(0,e[n].offset.indexOf(",")),a.appendChild(i),i.appendChild(r),r.appendChild(c),r.appendChild(u),e[n].city===t&&(r.checked=!0,o(t))}}function o(e){var t=window.navigator.mozSettings;t.createLock().set({"time.timezone.user-selected":e}),s=e}function r(){var e=c.querySelector("li.focus");e.classList.remove("focus");var t=document.getElementById(s);t.focus(),t.classList.add("focus")}var a=null,s=null,c=null;return t({onInit:function(e,t){c=e,a=e.querySelector(".timezone"),i(t.list,t.defaultCity)},onBeforeShow:function(){var t=window.navigator.mozSettings;req=t.createLock().get("time.timezone.user-selected"),req.onsuccess=function(){var e=req.result["time.timezone.user-selected"];if(e!=s){s=e;for(var t=document.querySelectorAll('gaia-radio[name="tz"]'),n=0,i=t.length;i>n;n++)t[n].checked=!1;document.getElementById(s).childNodes[0].checked=!0}},e(),window.addEventListener("panelready",r),window.addEventListener("keydown",this)},onBeforeHide:function(){window.removeEventListener("keydown",this),window.removeEventListener("panelready",r)},handleEvent:function(e){switch(e.key){case"Enter":case"Accept":this._handleSelectChange(),n.navigate("dateTime")}},_handleSelectChange:function(){for(var e=document.querySelector("li.focus"),t=e.querySelector("gaia-radio"),n=document.querySelectorAll('gaia-radio[name="'+t.getAttribute("name")+'"]'),i=0,r=n.length;r>i;i++)n[i].checked=!1;t.checked=!0,o(e.id)}})}});