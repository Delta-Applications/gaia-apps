define(["require","modules/settings_panel","panels/call_iccs/call_icc_handler"],function(e){var t=e("modules/settings_panel"),n=e("panels/call_iccs/call_icc_handler");return function(){var e=document.querySelectorAll("#call-iccs li");return t({onInit:function(){n.init()},onBeforeShow:function(){ListFocusHelper.addEventListener(e)},onBeforeHide:function(){ListFocusHelper.removeEventListener(e)}})}});