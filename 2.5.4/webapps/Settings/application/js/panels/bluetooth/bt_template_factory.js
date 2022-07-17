define([],function(){function e(e,n,o){var a=o,s=document.createElement("span");t(s,a.name,a.address);var c=document.createElement("small");c.classList.add("break-word"),c.classList.add("bt-item"),"remote"===e&&c.setAttribute("data-l10n-id","device-status-tap-pair"),"paired"!==e||"audio-card"!==a.type&&"input-keyboard"!==a.type&&"audio-input-microphone"!==a.type||("connected"===a.connectionStatus?c.setAttribute("data-l10n-id","device-status-tap-disconnect"):c.setAttribute("data-l10n-id","device-status-tap-connect"));var u=document.createElement("li"),d=document.createElement("a");return d.classList.add("break-all"),u.classList.add("bluetooth-device"),u.attribute=o,r("device.type = "+a.type),""===a.type?u.classList.add("bluetooth-type-unknown"):u.classList.add("bluetooth-type-"+a.type),a.name&&(u.dataset.name=a.name),a.paired&&(u.dataset.paired=a.paired),a.address&&(u.dataset.address=a.address),i(u,c,a.descriptionText,a),d.appendChild(s),d.appendChild(c),u.appendChild(d),"function"==typeof n&&(d.onclick=function(){n(o)}),a.observe("name",function(e){t(s,e)}),a.observe("descriptionText",function(e){i(u,c,e,a)}),u}function t(e,t,n){e.textContent=""!==t?t:n}function n(e,t){t&&window.dispatchEvent(new CustomEvent(e,{detail:t}))}function i(e,t,i,o){switch(r("_updateItemDescriptionText(): descriptionText = "+i),i){case"tapToConnect":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","paried-with-device"),t.setAttribute("data-l10n-args",JSON.stringify({deviceName:o.name}));break;case"pairing":n("bluetooth-pair-status",i),e.setAttribute("aria-disabled",!0),e.classList.add("none-select"),t.setAttribute("data-l10n-id","device-status-pairing");break;case"paired":n("bluetooth-pair-status",i),e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","paried-with-device"),t.setAttribute("data-l10n-args",JSON.stringify({deviceName:o.name}));break;case"connecting":e.setAttribute("aria-disabled",!0),e.classList.add("none-select"),t.setAttribute("data-l10n-id","device-status-connecting");break;case"connectedWithDeviceMedia":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","device-status-tap-disconnect");break;case"connectedWithDevice":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","device-status-tap-disconnect");break;case"connectedWithMedia":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","device-status-tap-disconnect");break;case"connectedWithNoProfileInfo":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","device-status-connected");break;case"disconnected":(o.hasAudioCard||"input-keyboard"===o.type)&&(e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),"#devicesInthearea"!==Settings.currentPanel?(t.removeAttribute("data-l10n-id"),t.setAttribute("data-l10n-id","device-status-tap-connect")):(t.setAttribute("data-l10n-id","paried-with-device"),t.setAttribute("data-l10n-args",JSON.stringify({deviceName:o.name}))));break;case"pairFailure":e.removeAttribute("aria-disabled"),e.classList.remove("none-select"),t.setAttribute("data-l10n-id","device-status-tap-pair")}}var o=!1,r=function(){};return o&&(r=function(e){console.log("--> [BluetoothTemplateFactory]: "+e)}),function(t,n){return e.bind(null,t,n)}});