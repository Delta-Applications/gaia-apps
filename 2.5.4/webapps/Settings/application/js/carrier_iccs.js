var IccHandlerForCarrierSettings=function(e,t){function n(){function n(e){var t=i.bind(null,e),n=c.getIccById(e);if(n){n.addEventListener("cardstatechange",t);var o=a(e);o&&(o.addEventListener("datachange",t),o.addEventListener("radiostatechange",t))}}if(u=e.navigator.mozMobileConnections,s&&u&&c&&1!==DsdsSettings.getNumberOfIccSlots()){d.forEach(function(e){var n=t.getElementById(e);f[d.indexOf(e)]=n.querySelector("small")}),d.forEach(function(e){var n=t.getElementById(e),i=n.querySelector("a");i.addEventListener("click",function(){DsdsSettings.setIccCardIndexForCellAndDataSettings(d.indexOf(e))})}),l.forEach(function(e){var n=t.getElementById(e),i=n.querySelector("a");i.addEventListener("click",function(){DsdsSettings.setIccCardIndexForCellAndDataSettings(l.indexOf(e))})});for(var r=u.length,p=0;r>p;p++){var m=u[p];m.iccId||(o(d[p],!0),o(l[p],!0)),i(m.iccId),n(m.iccId)}c.addEventListener("iccdetected",function(e){var t=e.iccId;i(t),n(t)}),c.addEventListener("iccundetected",function(e){var t=e.iccId,n=i.bind(null,t),o=a(t);o&&(o.removeEventListener("datachange",n),o.removeEventListener("radiostatechange",n))})}}function i(e){var t=r(e),n=f[t];n.style.fontStyle="italic";var i=c.getIccById(e);if(!i)return n.textContent="",n.setAttribute("data-l10n-id",_getCardDesription("absent")),o(d[t],!0),o(l[t],!0),void 0;var s=a(e);if(!s)return n.textContent="",n.removeAttribute("data-l10n-id"),o(d[t],!0),o(l[t],!0),void 0;if("enabled"!==s.radioState)return n.setAttribute("data-l10n-id",_getCardDesription("null")),o(d[t],!0),o(l[t],!0),void 0;"enabled"===s.radioState&&(n.textContent="",n.removeAttribute("data-l10n-id"),o(d[t],!1),o(l[t],!1));var u=i.cardState;return"ready"!==u?(n.setAttribute("data-l10n-id",_getCardDesription(u||"null")),o(d[t],!0),o(l[t],!0),void 0):(n.style.fontStyle="normal",_getOperatorName(s,n),o(d[t],!1),o(l[t],!1),void 0)}function o(e,n){var i=t.getElementById(e),o=i.querySelector("a");n?(i.setAttribute("aria-disabled",!0),i.classList.add("none-select"),o.removeAttribute("href"),i.disabled=!0):("menuItem-carrier-sim1"===e||"menuItem-carrier-sim2"===e?o.setAttribute("href","#carrier-operatorSettings"):o.setAttribute("href","#apn-settings"),i.removeAttribute("aria-disabled"),i.classList.remove("none-select"),i.disabled=!1)}function r(e){for(var t=0;t<u.length;t++)if(u[t].iccId===e)return t;return-1}function a(e){for(var t=0;t<u.length;t++)if(u[t].iccId===e)return u[t];return null}var s=e.navigator.mozSettings,c=e.navigator.mozIccManager,u=null,d=["menuItem-carrier-sim1","menuItem-carrier-sim2"],l=["menuItem-apn-sim1","menuItem-apn-sim2"],f=[];return{init:n}}(this,document);