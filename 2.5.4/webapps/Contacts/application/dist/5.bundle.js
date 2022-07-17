webpackJsonp([5],{298:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),s=t(3),u=n(s),c=t(4),l=n(c),f=t(5),d=n(f),p=t(21),h=n(p),v=t(349),y=n(v),b=t(341),m=n(b),g=t(311),_=n(g),w=t(312),k=n(w),O=function(e){function t(e){o(this,t);var n=r(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.name="SocialServiceImporter",n.DEBUG=!1,n.state={progress:-1,total:0},n}return a(t,e),i(t,[{key:"componentDidMount",value:function(){this.debug("did mount");var e={};window.ssimporter=this,this.store=y.default,this._softKey=h.default.create(this.element,e),this.import(this.props.service)}},{key:"import",value:function(e){var t=this;y.default.getFriends(e).then(function(n){t.debug("friendsHash:"),t.GmailConnector=_.default,t.ContactsImporter=m.default;var o=void 0;"gmail"===e?o=_.default:"live"===e&&(o=k.default);var r=new m.default(n,o);t.importer=r,t.updateSoftKeys(),r.on("imported",function(e){t.setState({saved:e.name,progress:r.imported,total:r.total})}),r.on("finished",function(){l.default.request("back")}),r.import()}).catch(function(n){t.debug("getFriends aborted",n);var o=navigator.mozL10n.get,r={gmail:"Gmail",live:"Outlook"},a="socialServiceContacts-error";navigator.onLine||(a="socialServiceContacts-noNetwork"),l.default.request("ToastManager:show",{text:o(a,{service:r[e]})}),l.default.request("back")})}},{key:"updateSoftKeys",value:function(){var e={left:"cancel",center:"",right:""};this._softKey.update(e)}},{key:"componentWillUnmount",value:function(){this._softKey.destroy()}},{key:"onKeyDown",value:function(e){switch(e.key){case"SoftLeft":case"EndCall":case"Backspace":e&&e.preventDefault(),this.importer&&this.importer.cancel()}}},{key:"render",value:function(){var e=this,t=null,n=null,o=null;if(this.state.total){var r=this.state.progress/this.state.total*100,a={width:r+"%"},i={width:"calc(100% - "+r+"% - 0.3rem)"};t=u.default.createElement("div",{className:"progress"},u.default.createElement("div",{className:"progress-active",style:a}),u.default.createElement("div",{className:"progress-inactive",style:i})),n=u.default.createElement("div",{className:"secondary"},this.state.progress,"/",this.state.total),o=u.default.createElement("div",{className:"primary","data-l10n-id":"importing-contacts-from-"+this.props.service})}else o=u.default.createElement("div",{className:"primary","data-l10n-id":"reading-contacts-from-"+this.props.service});return u.default.createElement("div",{className:"social-service-importer",ref:function(t){e.element=t},tabIndex:"-1",onKeyDown:function(t){return e.onKeyDown(t)}},u.default.createElement("div",{className:"header h1","data-l10n-id":"importContactsTitle",ref:"header"}),u.default.createElement("div",{className:"body"},u.default.createElement("div",{className:"list-item","data-multi-line":"true"},u.default.createElement("div",{className:"content"},o,n,t))))}}]),t}(d.default);exports.default=O},311:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),s=t(8),u=n(s),c=t(136),l=t(133),f=n(l),d={"GData-Version":"3.0"},p=function(e){function t(){o(this,t);var e=r(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return e.name="GmailConnector",e.photoUrls={},e.accessToken=null,e}return a(t,e),i(t,[{key:"buildRequestHeaders",value:function(e){var t=d;return t.Authorization="Bearer "+e,t}},{key:"listAllContacts",value:function(e,t){this.accessToken=e,this.photoUrls={},this.getContacts(e,t)}},{key:"getContacts",value:function(e,t){var n=this,o=["names","phoneNumbers","emailAddresses","birthdays","biographies","organizations","addresses","photos"].join(","),r=["personFields="+o,"pageSize=1000"].join("&"),a={success:function(e){var o=e.connections,r=o.map(function(e){var t=(0,c.personToMozContact)(e);return t.uid=e.resourceName,e.photos&&e.photos.length&&(n.photoUrls[e.resourceName]=e.photos[0].url),t});t.success({data:r})},error:t.error,timeout:t.timeout},i="https://people.googleapis.com/v1/people/me/connections?"+r;return this.performAPIRequest(i,a,e)}},{key:"performAPIRequest",value:function(e,t,n){return f.default.get(e,t,{requestHeaders:this.buildRequestHeaders(n)})}},{key:"listDeviceContacts",value:function(){return new Promise(function(e){var t={filterValue:"DEVICE",filterOp:"contains",filterBy:["category"]},n=navigator.mozContacts.find(t);n.onsuccess=function(){e(n.result)},n.onerror=function(){e([])}})}},{key:"adaptDataForSaving",value:function(e){return e.category=["DEVICE"],e}},{key:"downloadContactPicture",value:function(e,t){var n=this.buildContactPhotoURL(e);return f.default.get(n,t,{responseType:"blob"})}},{key:"buildContactPhotoURL",value:function(e){return this.photoUrls&&this.photoUrls[e.uid]?this.photoUrls[e.uid]+"?access_token="+this.accessToken:null}}]),t}(u.default),h=new p;exports.default=h},312:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function i(e,t){return{type:[e],streetAddress:t.street||"",locality:t.city||"",region:t.state||"",countryName:t.countryOrRegion||"",postalCode:t.postalCode||""}}function s(e){return"urn:uuid:"+(e.user_id||e.id)}function u(e){return e.split(":")[2]}Object.defineProperty(exports,"__esModule",{value:!0});var c=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),l=t(8),f=n(l),d=t(133),p=n(d),h=function(e){function t(){var e,n,a,i;o(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return n=a=r(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),a.name="LiveConnector",a.DEBUG=!1,a._requestHeaders={},i=n,r(a,i)}return a(t,e),c(t,[{key:"listAllContacts",value:function(e,t){this.debug("listAllContacts:"),this.access_token=e,Object.assign(this._requestHeaders,{Authorization:"Bearer "+e});var n=["https://graph.microsoft.com/v1.0/","me/contacts","?$top=10000"];return p.default.get(n.join(""),t,{requestHeaders:this._requestHeaders})}},{key:"listDeviceContacts",value:function(e){var t={filterValue:"DEVICE",filterOp:"contains",filterBy:["category"]},n=navigator.mozContacts.find(t);n.onsuccess=function(){e.success(n.result)},n.onerror=function(){e.error(n.error)}}},{key:"cleanContacts",value:function(){}},{key:"adaptDataForShowing",value:function(e){this.debug("adaptDataForShowing:");var t={};return t.uid=e.id,t.givenName=[e.givenName||""],t.familyName=[e.surname||""],t.email1=e.emailAddresses[0]?e.emailAddresses[0].address:"",t}},{key:"adaptDataForSaving",value:function(e){this.debug("adaptDataForSaving:",e.displayName);var t={givenName:[e.givenName||""],familyName:[e.surname||""],name:[e.displayName||""],tel:[],email:[],adr:[],category:["DEVICE"],url:[{type:["source"],value:s(e)}]};return e.birthday&&(t.bday=new Date(e.birthday)),Array.isArray(e.emailAddresses)&&e.emailAddresses.forEach(function(e){e.address&&t.email.push({type:["personal"],value:e.address})}),e.mobilePhone&&t.tel.push({type:["mobile"],value:e.mobilePhone}),Array.isArray(e.homePhones)&&e.homePhones.forEach(function(e){t.tel.push({type:["home"],value:e})}),Array.isArray(e.businessPhones)&&e.businessPhones.forEach(function(e){t.tel.push({type:["work"],value:e})}),e.homeAddress&&0!==Object.keys(e.homeAddress).length&&t.adr.push(i("home",e.homeAddress)),e.businessAddress&&0!==Object.keys(e.businessAddress).length&&t.adr.push(i("work",e.businessAddress)),t}},{key:"getContactUid",value:function(e){var t="-1",n=e.url;if(Array.isArray(n)){var o=n.filter(function(e){return Array.isArray(e.type)&&-1!==e.type.indexOf("source")});o[0]&&(t=u(o[0].value))}return t}},{key:"downloadContactPicture",value:function(e,t){if(this.debug("downloadContactPicture: id:",e.id),e.id){var n=["https://graph.microsoft.com/v1.0/","me/contacts","('"+e.id+"')","/photo/$value"];return p.default.get(n.join(""),t,{requestHeaders:this._requestHeaders,responseType:"blob"})}t.success(null)}},{key:"startSync",value:function(){}},{key:"automaticLogout",get:function(){return!0}}]),t}(f.default),v=new h;exports.default=v},341:function(e,exports,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),i=t(81),s=function(e){return e&&e.__esModule?e:{default:e}}(i),u=function(e){function t(e,r){n(this,t);var a=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return a.name="ContactsImporter",a.DEBUG=!1,a._currentIndex=0,a.debug("init:"),a.type=r.name.replace("Connector","").toLowerCase(),a.contacts=e,a.total=a.contacts.length,a.connector=r,a.isOnLine=navigator.onLine,a.numMergedDuplicated=0,window.addEventListener("online",a),window.addEventListener("offline",a),a}return r(t,e),a(t,[{key:"_handle_online",value:function(){this.isOnLine=navigator.isOnLine}},{key:"_handle_offline",value:function(){this.isOnLine=navigator.isOnLine}},{key:"importContact",value:function(){var e=this;this.debug("importContact: _currentIndex:",this._currentIndex);var t=this.contacts[this._currentIndex],n=this.connector.adaptDataForSaving(t),o={success:function(t){e.pictureReady(t,n)},error:this.save.bind(this,n),timeout:this.save.bind(this,n)};!0===this.isOnLine?this.connector.downloadContactPicture(t,o):o.success(null),this._currentIndex++}},{key:"pictureReady",value:function(e,t){if(!e)return void this.save(t);t.photo=[e],this.save(t)}},{key:"_import",value:function(){if(0===this.total)return void this.done();this.importContact()}},{key:"continue",value:function(){this.debug("continue save: imported, aborted:",this.imported,this.aborted),this.aborted||this._currentIndex===this.total?this.done():this._import()}}]),t}(s.default);exports.default=u},345:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),s=t(8),u=n(s),c=t(132),l=n(c),f=t(346),d=n(f),p=function(e){function t(){var e,n,a,i;o(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return n=a=r(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),a.name="Oauth2",a.DEBUG=!1,i=n,r(a,i)}return a(t,e),i(t,[{key:"start",value:function(){this.accessTokenCbData=null,this.isd=l.default}},{key:"clearStorage",value:function(e){l.default.remove(this.getKey(e))}},{key:"getKey",value:function(e){var t="tokenData";return"facebook"!==e&&(t="tokenData_"+e),t}},{key:"getAccessToken",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return new Promise(function(o,r){if(t.accessTokenCbData={state:"friends",service:e,resolve:o,reject:r},n)return void t.startOAuth(e);l.default.get(t.getKey(e)).then(function(n){if(!n||!n.access_token)return t.debug("no existing token data, will start oauth flow soon"),void t.startOAuth(e);var r=n.access_token,a=Number(n.expires),i=n.token_ts;if(0!==a&&Date.now()-i>=a)return t.debug("Access token has expired, restarting flow"),void t.startOAuth(e);o(r)})})}},{key:"startOAuth",value:function(e){var t=this;this.debug("starting flow"),this.clearStorage(e),d.default.startFlow(e).then(function(e){t.debug("got parameters:");var n=e.expires_in;l.default.put(t.getKey(t.accessTokenCbData.service),{access_token:e.access_token,expires:1e3*n,token_ts:Date.now()}),t.accessTokenCbData&&t.accessTokenCbData.resolve(e.access_token),t.accessTokenCbData=null}).catch(function(e){t.debug("oauthflow aborted",e),t.accessTokenCbData&&t.accessTokenCbData.reject(),t.accessTokenCbData=null})}}]),t}(u.default),h=new p;h.start(),window.oauth2=h,exports.default=h},346:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),s=t(8),u=n(s),c=t(347),l=n(c),f=window.location.origin,d=function(e){function t(){var e,n,a,i;o(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return n=a=r(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),a.name="Oauthflow",a.DEBUG=!1,i=n,r(a,i)}return a(t,e),i(t,[{key:"start",value:function(){window.addEventListener("message",this)}},{key:"_handle_message",value:function(e){var t=this,n=e.data;n&&n.access_token&&e.origin===f&&window.setTimeout(function(){t.resolve&&t.resolve(n),t.resolve=null,t.reject=null},0)}},{key:"startFlow",value:function(e){var t=this;return new Promise(function(n,o){var r=l.default[e],a=encodeURIComponent(r.redirectURI),i=r.scope.join(","),s=encodeURIComponent(i),u=["client_id="+r.applicationId,"redirect_uri="+a,"response_type=token","scope="+s,"approval_prompt=force","state=friends"];t.resolve=n,t.reject=o;var c=u.join("&"),f=r.loginPage+c,d=window.open(f,"","dialog");t.child=d;var p=t;window.addEventListener("focus",function e(){window.removeEventListener("focus",e),p.reject&&p.reject(),p.resolve=null,p.reject=null})})}}]),t}(u.default),p=new d;p.start(),window.oaf=p,exports.default=p},347:function(e,exports,t){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default={facebook:{redirectURI:"https://www.facebook.com/connect/login_success.html",loginPage:"https://m.facebook.com/dialog/oauth/?",applicationId:"123456",scope:["friends_about_me","friends_birthday","friends_hometown","friends_location","friends_work_history","read_stream"],redirectMsg:"http://intense-tundra-4122.herokuapp.com/fbowd/oauth2_new/dialogs_end.html",redirectLogout:"http://intense-tundra-4122.herokuapp.com/fbowd/oauth2_new/dialogs_end.html",imgDetailWidth:200,imgThumbSize:120},live:{redirectURI:"https://www.kaiostech.com",loginPage:"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?",applicationId:"ceeb01c9-e3b8-4360-b315-cd478b736062",scope:["contacts.read"],logoutUrl:"https://login.live.com/logout.srf"},gmail:{redirectURI:"http://localhost",loginPage:"https://accounts.google.com/o/oauth2/auth?",applicationId:"100183967378-i5vsj453tr6e6od88p6ijrtjqf8lakfe.apps.googleusercontent.com",scope:["https://www.googleapis.com/auth/contacts"],logoutUrl:"https://accounts.google.com/Logout"}}},349:function(e,exports,t){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function r(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(exports,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),s=t(8),u=n(s),c=t(311),l=n(c),f=t(312),d=n(f),p=t(345),h=n(p),v=function(e){function t(){var e,n,a,i;o(this,t);for(var s=arguments.length,u=Array(s),c=0;c<s;c++)u[c]=arguments[c];return n=a=r(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),a.name="SocialServiceStore",a.DEBUG=!1,i=n,r(a,i)}return a(t,e),i(t,[{key:"start",value:function(){window.sss=this,this.oauth2=h.default}},{key:"tokenExpired",value:function(e){return 190===e.code||"request_token_expired"===e}},{key:"contactsReady",value:function(){}},{key:"ensureConnector",value:function(e){this.connector=null,"gmail"===e?this.connector=l.default:"live"===e&&(this.connector=d.default)}},{key:"getFriends",value:function(e,t){var n=this;return this.debug("getting friends for "+e),h.default.getAccessToken(e,t).then(function(t){return n.debug("access_token="+t),new Promise(function(o,r){if(n.resolve=o,n.ensureConnector(e),n.connector.listAllContacts(t,{success:n._listAllContactsSuccess.bind(n),error:function(t){if(401===t.status)return void n.getFriends(e,!0).then(function(e){o(e)});r(t)},timeout:function(){}}),navigator.mozContacts){var a={success:n.contactsReady.bind(n),error:function(e){window.console.error("Error while retrieving existing dev contacts: ",e)}};n.connector.listDeviceContacts(a)}})}).catch(function(e){throw e})}},{key:"_listAllContactsSuccess",value:function(e){if(this.debug("_listAllContactsSuccess:"),void 0===e.error){var t=e.data||e.value;this.debug("friends length:",t.length),this.resolve(t)}}}]),t}(u.default),y=new v;y.start(),exports.default=y}});
//# sourceMappingURL=5.bundle.js.map