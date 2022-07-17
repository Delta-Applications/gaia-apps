'use strict';var OperatorName={userOperatorName:function mo_userOperatorName(conn,currentLanguage){var mcc,mnc;var operatorName;if(conn&&conn.voice&&conn.voice.network&&conn.voice.connected){mcc=conn.voice.network.mcc;mnc=conn.voice.network.mnc;dump(`operator_name.js, mcc=${mcc},mnc=${mnc}, language=${currentLanguage}`);if(mcc=='460'&&(mnc=='00'||mnc=='04'||mnc=='07'||mnc=='08')){if(currentLanguage=="zh-CN"||currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="中国移动";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='460'&&(mnc=='01'||mnc=='09')){if(currentLanguage=="zh-CN"||currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="中国联通";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='460'&&(mnc=='03'||mnc=='11')){if(currentLanguage=="zh-CN"||currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="中国电信";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='466'&&mnc=='97'){if(currentLanguage=="zh-CN"){operatorName="台湾大哥大";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="臺灣大哥大";}else{operatorName=conn.voice.network.longName;}
operatorName=this._apt_in_twm(operatorName,currentLanguage,conn.iccId);}
else if(mcc=='466'&&mnc=='01'){if(currentLanguage=="zh-CN"){operatorName="远传电信";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="遠傳電信";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='466'&&mnc=='92'){if(currentLanguage=="zh-CN"){operatorName="中华电信";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="中華電信";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='466'&&mnc=='89'){if(currentLanguage=="zh-CN"){operatorName="台湾之星";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="臺灣之星";}else{operatorName=conn.voice.network.longName;}}
else if(mcc=='466'&&mnc=='05'){if(currentLanguage=="zh-CN"){operatorName="亚太电信";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="亞太電信";}else{operatorName=conn.voice.network.longName;}}
else{operatorName=conn.voice.network.longName;}}
dump("operator_name.js, operatorName:"+operatorName);return operatorName;},_apt_in_twm:function mo_apt_in_twm(operatorName,currentLanguage,iccId){const icc=navigator.mozIccManager.getIccById(iccId);let simmcc=icc.iccInfo.mcc;let simmnc=icc.iccInfo.mnc;dump(`operator_name, _apt_in_twm simmcc=${simmcc},simmnc=${simmnc}`);if(simmcc=='466'&&simmnc=='05'){if(currentLanguage=="zh-CN"){operatorName="亚太电信";}else if(currentLanguage=="zh-TW"||currentLanguage=="zh-HK"){operatorName="亞太電信";}else{operatorName="APT";}}
return operatorName;},userCNOperatorStatus:function mo_userCNOperatorStatus(conn,signalLevel,hasActiveCall,voiceConnected,dataConnected){const isAbsent=!conn.iccId;let stateL10nId,carrierName;if(conn&&conn.voice&&conn.voice.network&&conn.voice.network.mcc=='460'){if(isAbsent){if(conn.voice.state===null){stateL10nId='noSimCard';dump('operator_name.js CN, noSimCard');}else{stateL10nId='emergencyCallsOnly';dump('operator_name.js, CN, noSimCard but eccOnly');}}
else{if(conn.voice.state===null||signalLevel==0){stateL10nId='noService';dump('operator_name.js CN, SIM in but noService');}
else if(voiceConnected||dataConnected||hasActiveCall&&navigator.mozTelephony.active.serviceId===index){if(conn.voice.network&&conn.voice.network.longName){carrierName=conn.voice.network.longName;dump(`operator_name.js, CN, normal service, carrierName:${carrierName}`);}
else{stateL10nId='emergencyCallsOnly';dump('operator_name.js, CN, SIM in but emergencyCallsOnly');}}
else{if(conn.voice.state==='searching'){stateL10nId='searching';dump('operator_name.js, CN, SIM in but searching');}
else if(conn.voice.emergencyCallsOnly){stateL10nId='emergencyCallsOnly';dump('operator_name.js, CN, SIM in emergencyCallsOnly');}
else{stateL10nId='noService';dump('operator_name.js, CN, SIM in but not searching, noService');}}}}
return stateL10nId;},userAUOperatorStatus:function mo_userAUOperatorStatus(conn,cardState,signalLevel,hasActiveCall,voiceConnected,dataConnected){const isAbsent=!conn.iccId;let stateL10nId,carrierName;dump('operator_name.js, AU, conn.voice.state:'+conn.voice.state);if(isAbsent){if((conn.voice.state===null)||(conn.voice.state==='searching')){stateL10nId='nocard-noservice';dump('operator_name.js, AU, noSimCard with no coverage');}else{stateL10nId='nocard-eccOnly';dump('operator_name.js, AU, noSimCard but eccOnly');}}else if(cardState!=='ready'){stateL10nId='unusablecard-eccOnly';dump('operator_name.js, AU, sim card locked');}
else{if(conn.voice.state===null||signalLevel==0){stateL10nId='noService';dump('operator_name.js, AU, SIM in but noService');}
else if(voiceConnected||dataConnected||hasActiveCall&&navigator.mozTelephony.active.serviceId===index){if(conn.voice.network&&conn.voice.network.longName){carrierName=conn.voice.network.longName;dump(`operator_name.js,AU, normal service, carrierName:${carrierName}`);}
else{stateL10nId='unusablecard-eccOnly';dump('operator_name.js, AU, SIM in but emergencyCallsOnly');}}
else{if(conn.voice.state==='searching'){stateL10nId='unusablecard-eccOnly';dump('operator_name.js, AU, SIM in but searching');}
else if(conn.voice.emergencyCallsOnly){stateL10nId='unusablecard-eccOnly';dump('operator_name.js, AU, SIM in emergencyCallsOnly');}
else{stateL10nId='noService';dump('operator_name.js,AU, SIM in but not searching, noService');}}}
return stateL10nId;},userNZOperatorStatus:function mo_userNZOperatorStatus(conn,signalLevel,hasActiveCall,voiceConnected,dataConnected){const isAbsent=!conn.iccId;let stateL10nId,carrierName;if(conn&&conn.voice&&conn.voice.network&&conn.voice.network.mcc=='530'){if(isAbsent){stateL10nId='nocard-eccOnly';dump('operator_name.js, NZ, noSimCard but eccOnly');}
else{if(conn.voice.state===null||signalLevel==0){stateL10nId='noService';dump('operator_name.js, NZ, SIM in but noService');}
else if(voiceConnected||dataConnected||hasActiveCall&&navigator.mozTelephony.active.serviceId===index){if(conn.voice.network&&conn.voice.network.longName){carrierName=conn.voice.network.longName;dump(`operator_name.js NZ, normal service, carrierName:${carrierName}`);}
else{stateL10nId='unusablecard-eccOnly';dump('operator_name.js, NZ, SIM in but emergencyCallsOnly');}}
else{if(conn.voice.state==='searching'){stateL10nId='searching';dump('operator_name,js, NZ, SIM in but searching');}
else if(conn.voice.emergencyCallsOnly){stateL10nId='unusablecard-eccOnly';dump('operator_name.js, NZ,  SIM in emergencyCallsOnly');}
else{stateL10nId='noService';dump('operator_name.js, NZ, SIM in but not searching, noService');}}}}
return stateL10nId;},};