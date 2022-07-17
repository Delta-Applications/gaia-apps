'use strict';(function(exports){var VERSION=3;var SEARCH_CACHE_KEY='search.cache';var SEARCH_PROVIDER_KEY='search.provider';var DEFAULT_PROVIDERS_URL='/shared/js/search_providers.json';var provider=null;var providers={};var defaultEngine=null;var updatedFun;var readyPromise;var resolver;function extend(dest,source){for(var k in source){if(source.hasOwnProperty(k)){var value=source[k];if(dest.hasOwnProperty(k)&&typeof dest[k]==='object'&&typeof value==='object'){extend(dest[k],value);}else{dest[k]=value;}}}
return dest;}
function resolveUrl(urlConf){var params=Object.keys(urlConf.params).map(function(k){return k+'='+urlConf.params[k];}).join('&');return urlConf.url+(params?'?'+params:'');}
function loadProviderConfig(){LazyLoader.getJSON(DEFAULT_PROVIDERS_URL).then(result=>{var conns=navigator.mozMobileConnections||[];var mccs=Array.prototype.slice.call(conns).map(function(conn){if(conn.voice&&conn.voice.network){return Format.padLeft(conn.voice.network.mcc,3,'0')+'-'+
Format.padLeft(conn.voice.network.mnc,3,'0');}});var engines=SearchProvider.pickEngines(result,mccs,result.partner_code||null,navigator.language);defaultEngine=engines.defaultEngine;providers=engines.providers;var cache={};cache[SEARCH_CACHE_KEY]={};cache[SEARCH_CACHE_KEY].defaultEngine=defaultEngine;cache[SEARCH_CACHE_KEY].providers=providers;cache[SEARCH_CACHE_KEY].version=VERSION;navigator.mozSettings.createLock().set(cache);providersLoaded();});}
function providersLoaded(){SettingsListener.observe(SEARCH_PROVIDER_KEY,false,value=>{if(value===false||!(value in providers)){provider=defaultEngine;}else{provider=value;}
if(resolver&&isReady()){resolver();resolver=null;}
if(updatedFun){updatedFun();}});}
function isReady(){return provider!==null&&Object.keys(providers).length;}
var SearchProvider=function(key){if(!provider||!(key in providers[provider])){return false;}
return providers[provider][key];};SearchProvider.providerUpdated=function(cb){updatedFun=cb;};SearchProvider.setProvider=function(value){if(!(value in providers)){return false;}
var setting={};setting[SEARCH_PROVIDER_KEY]=value;navigator.mozSettings.createLock().set(setting);};SearchProvider.selected=function(){return provider;};SearchProvider.providers=function(){return providers;};SearchProvider.pickEngines=function(config,sims,partnerCode,locale){config=JSON.parse(JSON.stringify(config));var engine=config.defaultEngines;var usersConfig={defaultEngine:null,providers:{}};if(partnerCode in config.partnerConfig&&locale in config.partnerConfig[partnerCode]){engine=config.partnerConfig[partnerCode][locale];}
sims.forEach(function(sim){if(sim in config.simConfigs&&locale in config.simConfigs[sim]){engine=config.simConfigs[sim][locale];}});usersConfig.defaultEngine=engine.defaultEngine;Object.keys(engine.providers).forEach(function(provider){var obj=config.search_providers[provider];if(locale in config.locales&&provider in config.locales[locale]){obj=extend(obj,config.locales[locale][provider]);}
obj=extend(obj,engine.providers[provider]);usersConfig.providers[provider]={'title':obj.title,'searchUrl':ClientIdCustomizer.parse(resolveUrl(obj.search)),'suggestUrl':resolveUrl(obj.suggest)};});return usersConfig;};SearchProvider.ready=function(){if(readyPromise){return readyPromise;}
var req=navigator.mozSettings.createLock().get(SEARCH_CACHE_KEY);req.onsuccess=function(){if(SEARCH_CACHE_KEY in req.result&&req.result[SEARCH_CACHE_KEY].version===VERSION){defaultEngine=req.result[SEARCH_CACHE_KEY].defaultEngine;providers=req.result[SEARCH_CACHE_KEY].providers;providersLoaded();}else{loadProviderConfig();}};readyPromise=new Promise(resolve=>{resolver=resolve;});return readyPromise;};exports.SearchProvider=SearchProvider;})(window);