define(["require","shared/settings_listener","modules/settings_panel","panels/accessibility_screenreader/confirm_dialog"],function(e){var t=e("shared/settings_listener"),n=e("modules/settings_panel"),i=e("panels/accessibility_screenreader/confirm_dialog"),o="accessibility.screenreader";return function(){var e;return n({onInit:function(n){e=n.querySelector("#screenreader-enable input");var r=n.querySelector("#screenreader-confirm-dialog");i.init({container:r,confirmButton:r.querySelector("button.danger"),heading:r.querySelector("h1"),text:r.querySelector("p")}),e.onclick=function(e){e.preventDefault(),SettingsDBCache.getSettings(function(e){i.show(!e[o])})},t.observe(o,!1,function(t){e.checked=t})}})}});