'use strict';var Utils={prettyDuration:function(node,duration,l10n){var elapsed=new Date(duration);var h=elapsed.getUTCHours();var m=elapsed.getUTCMinutes();var s=elapsed.getUTCSeconds();const durationL10n={h:(h>9?'':'0')+h,m:(m>9?'':'0')+m,s:(s>9?'':'0')+s};const l10nId=h>0?'callDurationHours':'callDurationMinutes';const _=navigator.mozL10n.get;const durationString=_(l10nId,durationL10n);node.textContent=l10n?_(l10n,{duration:durationString}):durationString;},getPhoneNumberPrimaryInfo:function ut_getPhoneNumberPrimaryInfo(matchingTel,contact){if(contact){if(contact.name&&contact.name.length&&contact.name[0]!==''){return contact.name;}else if(contact.org&&contact.org.length&&contact.org[0]!==''){return contact.org;}}
if(matchingTel){return matchingTel.value;}
return null;},_getPhoneNumberType:function ut_getPhoneNumberType(matchingTel){var type=matchingTel.type;if(Array.isArray(type)){type=type[0];}
var _=navigator.mozL10n.get;var result=type?_(type):_('mobile');result=result?result:type;return result;},getPhoneNumberAdditionalInfo:function ut_getPhoneNumberAdditionalInfo(matchingTel){var result=this._getPhoneNumberType(matchingTel);var carrier=matchingTel.carrier;if(carrier){result+=', '+carrier;}
return result;}};