'use strict';

const PRIMARY_SIM_CARD_ID = 0;
const SECOND_SIM_CARD_ID = 1;

// 6.3.2 random time value between 5 and 10 minuts
// to re-post the information to server
const SECOND_TIME_POST_INTERVAL_MIN = 5*60*1000;
const SECOND_TIME_POST_INTERVAL_MAX = 10*60*1000;

// 6.3.2
// timeout for terminal waiting http response is 10 seconds
const XHR_TIMEOUT_MS = 10000;

// 1 hour to start a new round
const NEW_ROUND_POST_INTERVAL = 1*60*60*1000;

// 5.1.2
// if wifi is not connected when phone boot up,
// terminal should wait 30 minuts for wifi connection
const WAIT_WIFI_POST_INTERVAL = (1000 * 60 * 30);


//register.success: 
//1 register success without sim information
//2 register success with sim information
const REG_WITHOUT_SIM = 1;
const REG_WITH_SIM = 2;

/*MCC     MNC        SPN
  460     00         China Mobile
  460     01         China Unicom
  460     02         China Mobile
  460     03         China TELECOM
  460     06         China Unicom
  460     07         China Mobile
  460     05         China TELECOM
*/
const  CMCC_MCC_MNC = ["46000", "46002", "46007"];//China Mobile
const  CUCC_MCC_MNC = ["46001", "46006"];//China Unicom
const  CTCC_MCC_MNC = ["46003", "46005", "46011"];//China TELECOM

const CMCC = 'CMCC';
const CUCC = 'CUCC';
const CTCC = 'CTCC';
const CU_CUCC = 'TA1059-AAROW1DS27ROW2'; 
const MAX_ROUNDS = 10;
// const MAX_ROUNDS_FOR_ONE_BOOT = 3;
// const MAX_TIMES_FOR_ONE_ROUND = 3;

function debug(info){
  dump('aiyan DeviceManagerService:: '+info);
}

var DeviceManagerService = {
  
  _totalRounds: 0, //<=MAX_ROUNDS rounds
  // _oneBootRounds: 0, //<=MAX_ROUNDS_FOR_ONE_BOOT rounds
  // _oneRoundTimes: 0, // <= MAX_TIMES_FOR_ONE_ROUND times,

  // 6.6.1 
  // http://dm.wo.com.cn:6001/register?ver=1.1&model=&manuf=& sign=
  //_url: 'http://dm.wo.com.cn:6001/register?',
  _url: 'http://zzhc.vnet.cn/',

  _connections: null,
  _iccManager: null,
  _wifiManager: null,

  _isWifiRegisterdDM: false,
  _isDataRegisterdDM: false,
  _isCardAndRadioReady: false,

  iccid1_device: "00000000000000000000",
  iccid2_device: "00000000000000000000",
  iccid_card: ['00000000000000000000','00000000000000000000'],
  _osVersioninDevice:'0.1', // to listen the version change

  preinit: function() {
    this._connections = window.navigator.mozMobileConnections;
    this._iccManager = window.navigator.mozIccManager;
    this._wifiManager = window.navigator.mozWifiManager;
  },

  init: function() {
    debug("init:");

    if(!this._connections || !this._iccManager || !this._wifiManager){
      return;
    }

    // roaming state
    this.getSettings('ril.data.defaultServiceId').then((value,error) =>{
      if(this._connections[value].voice.roaming) {
        debug("now is roaming, not support self-register");
        return;
      }

      // getSettings is async method, make sure the order is correct
      // listen system OTA
      this._osVersioninDevice = navigator.engmodeExtension.getPropertyValue('persist.register.version');
      var osver = navigator.engmodeExtension.getPropertyValue('ro.build.version.fih');
      if(this._osVersioninDevice !== osver) {
        this.resetICCIDinDevice();
        navigator.engmodeExtension.setPropertyValue('persist.register.version', osver);
      }

      this.removeAllExistAlarm();
      AlarmMessageHandler.addCallback(this.handleAlarm.bind(this));

      if(this.isSimInserted()) {
        debug("init: total rounds is " + this._totalRounds);
        if (this._totalRounds >= 0 && this._totalRounds < MAX_ROUNDS) {
          this.start();
        }
      } else {
        debug("sim card not inserted");
      }

    }).catch(e => {debug(e);});
  },

  start: function(){
    debug("start");
    this._totalRounds++;

//    window.addEventListener('wifi-statuschange', this);

    // wifi will be connected very soon
    // when insert sim card, but sim card is not ready,
    // we can not get the information from sim card
    // so we need to wait the cardstatechange
//    this.addCardAndRadioStateChangeListener();

    /*var kaios = navigator.engmodeExtension;
    if(kaios) {
      kaios.setPropertyValue('persist.register.iccid1', '11111111111111111111');
      kaios.setPropertyValue('persist.register.iccid2', '22222222222222222222');
    }*/

    // if no CTCC card, no need register
    if(!this.checkSimType()) {
      debug("no CTCC card, no need register");
      this.close();
      return;
    }

    this.getPrimarySimType().then((value, error)=>{
      debug("sim type is :" + value);
      let accessType = '';
      if(value == CTCC) {
        // simcard is CTCC, check if wifi connected
        if(this.getWifiConnectionState()){
          accessType = "WiFi";
        } else if(this.getDataConnectionState()) {
          accessType = 'Mobile';
        } else {
          debug("wifi and data connections are both invalid");
          this.startNextRound();
          return;
        }
      } else {
        if(this.getWifiConnectionState()){
          accessType = "WiFi";
        } else {
          debug("primary sim not CTCC and wifi not connect");
          this.startNextRound();
          return;
        }
      }

      // check the iccid
      this.getICCIDinDevice();
      this.getICCIDofSimCard();

      if(this.iccid_card[0] != this.iccid1_device || this.iccid_card[1] != this.iccid2_device) {
        // start post
        this.startCheck(accessType);
      } else {
        debug("iccid are the same, no need report");
      }

    }).catch(e => {debug(e);});

    
    

    /*if((this.isCardAndRadioStateReady() || !this.isSimInserted()) &&
        this.getWifiConnectionState()){
      this.checkIfRegister();
    } else if (!this.getWifiConnectionState()) {
      //5.1.2 wait wifi
      this.addAlarm('WAIT_WIFI_POST', WAIT_WIFI_POST_INTERVAL);
    }*/

  },

  close: function mtm_close(){
    debug(" close");
//    this.removeNetListerner();

    this.removeAllExistAlarm();
//    this.removeCardAndRadioListener();
  },

/*  removeNetListerner: function(){
    debug("removeNetListerner");
    if (this._connections) {
      for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if (conn) {
          conn.removeEventListener('datachange', this);
        }
      }
    }

    window.removeEventListener('wifi-statuschange', this);
  },*/

/*  removeCardAndRadioListener: function(){
    debug("removeCardAndRadioListener");
    if (this._connections) {
      for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if (conn) {
          conn.addEventListener('radiostatechange', this);
        }
        if(conn && conn.iccId){
          let iccCard = this._iccManager.getIccById(conn.iccId);
          if (iccCard) {
            iccCard.removeEventListener('cardstatechange', this);
          }
        }
      }
    }
  },*/

  /**
   * check if phone has registered on server or not.
   * @param {String} acctype: access server network type(wifi or mobile).
   */
  /*checkIfRegister: function() {
    debug("checkIfRegister");

    let accessType = '';

    if(this.getWifiConnectionState()) {
      accessType = 'WiFi';
    } else if(this.getDataConnectionState()){
      accessType = 'Mobile';
    } else {
      debug("no network!");
      this.restartNetListerners();
      return;
    }

    this.getSettings('register.success')
          .then((value, error) => {
      if (REG_WITH_SIM === value 
        || (REG_WITHOUT_SIM === value && !(this.isSimInserted()))) {
        debug("register state:" + value 
          + ", isSimInserted=" + this.isSimInserted());
        this.close();
        return;
      } else {
        this.updateTotalCheckTimes().then(value => {
          if(this._oneBootRounds > 0 && this._oneBootRounds <= MAX_ROUNDS_FOR_ONE_BOOT) {
            this.startCheck(accessType);
          } else if(this._oneBootRounds > MAX_ROUNDS_FOR_ONE_BOOT){
              this.close();
          }
        }).catch(e => {debug(e);});
      }
    }).catch(e => {debug(e);});
  },*/

  startCheck: function(accessType) {
    this.generateDeviceInfo(accessType).then((value) => {
      if (!value){
        debug("get device information error");
        return;
      }

      let src = JSON.stringify(value);//'{"REGVER":"7.0","MEID":"004402972493591","MODEL":"HMD-TA 1287","SWVER":"0.2032.10.08","SIM1CDMAIMSI":"","UETYPE":"1","SIM1ICCID":"89860316780107379841","SIM1LTEIMSI":"460110756706842","SIM1TYPE":"1","SIM2CDMAIMSI":"","SIM2ICCID":"","SIM2LTEIMSI":"","SIM2TYPE":"","MACID":"88:51:7a:df:aa:6a","OSVER":"KaiOS 2.5.4","ROM":"4G","RAM":"512M","IMEI1":"004402972493591","IMEI2":"004402972497592","SIM1CELLID":"7509123","SIM2CELLID":"","DATASIM":"1","SIM1VoLTESW":"1","SIM2VoLTESW":"","ACCESSTYPE":"2","REGDATE":"1970-01-01 08:04:58"}';
      //JSON.stringify(value);
      debug("json data = " + src);
 //     this.generateUrlStr(src).then((url) => {
        // if (!url){
        //   debug("get url error");
        //   return;
        // }
        // encry device info
        this.base64Encrypt(src).then(data => {
          if (!data){
            debug("base64Encrypt error");
            return;
          }
          debug("start post: url = " + this._url);
          this.post(this._url, data, this.postSucess.bind(this), this.postFailed.bind(this));
        }).catch(e => {debug(e);});
 //     }).catch(e => {debug(e);});
    }).catch(e => {debug(e);});
  },

  /*updateTotalCheckTimes: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      self._oneRoundTimes ++;
      if(self._oneRoundTimes > MAX_TIMES_FOR_ONE_ROUND) {
        self._oneRoundTimes = 1;
        self._oneBootRounds ++;
        self.getSettings('check.total.rounds').then((value, error) => {
          self._totalRounds = value + 1;

          debug("updateTotalCheckTimes1:(" + self._totalRounds + ", " 
                                              + self._oneBootRounds + ", "
                                              + self._oneRoundTimes + ")");
        navigator.mozSettings.createLock().set({
            'check.total.rounds': self._totalRounds
        });
          resolve(self._oneBootRounds);
      }).catch(e => {debug(e);});
      } else {
        debug("updateTotalCheckTimes2:(" + self._totalRounds + ", " 
                                              + self._oneBootRounds + ", "
                                              + self._oneRoundTimes + ")");
        navigator.mozSettings.createLock().set({
            'check.total.rounds': self._totalRounds
          });
        resolve(self._oneBootRounds);
      }
    });
  },*/

  postSucess: function mtm_postSucess(){
    debug("postSucess:(" + this._totalRounds + ")");
    // 1: register success without sim information
    // 2: register success with sim information
    // other: not registerd success
    /*let registerStatus = 0;
    debug("postSucess:isSimInserted:" + this.isSimInserted());
    if(!this.isSimInserted()){
      registerStatus = REG_WITHOUT_SIM;
    } else {
      registerStatus = REG_WITH_SIM;
    }
    debug("postSucess:set register.success:" + registerStatus);
    navigator.mozSettings.createLock().set({
        'register.success': registerStatus
    });*/
    // save the iccid into device
    this.iccid1_device = iccid_card[0];
    this.iccid2_device = iccid_card[1];
    this.saveICCIDintoDevice();

    this.close();
  },

  postFailed: function mtm_postSucess(){
    this.startNextRound();
  },

  /**
   * get information from server through http request
   * 200 for registered succuss
   * other response for registered failed
   * https://segmentfault.com/a/1190000004322487
   */
  post: function(url, data, onsuccess, onerror) {
    if (!window.XMLHttpRequest){
      debug("do not support window.XMLHttpRequest");
      return;
    }

    var xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.open('POST', url, true);
    xhr.timeout = XHR_TIMEOUT_MS;
    xhr.responseType = 'json';

    xhr.setRequestHeader('Content-Type', 'application/encrypted-json');//6.6.1

    xhr.setRequestHeader('Content-Length', data.length);

    xhr.onreadystatechange = function() {
      //readyState(0:unsent,1:opened; 2:headers_received; 3:loading; 4: done)
      // xhr.status
      // 200 ok
      // 400 model or sign is null
      // 410 not exit the phone model in server database
      // 411 (this is the uri decode error)
      // 412 RSA dectypt error
      // 413 data error
      // 414 AES dectypt error

      debug("onreadystatechange:readyState="+ xhr.readyState);
      debug("onreadystatechange:status="+ xhr.status);
      //debug("onreadystatechange:responseText="+ xhr.responseText);
      debug("onreadystatechange:responseType="+ xhr.responseType);
      debug("onreadystatechange:responseURL ="+ xhr.responseURL );
    };
    xhr.onload = function fmdr_xhr_onload() {
      //// readyState will be 4
      // if (xhr.status == 200) {
      //   onsuccess();
      // } else {
      //   onerror();
      // }
      var json = xhr.response;
      if(json['resultCode'] === '0' && json['resultDesc'] === 'Success') {
        onsuccess();
      } else {
        debug("resultCode = " + json['resultCode'] + "; resultDesc = " + json['resultDesc']);
        onerror(); 
      }
    };

    xhr.onerror = function fmd_xhr_onerror() {
      onerror();
    };

    xhr.ontimeout = function fmd_xhr_ontimeout() {
      onerror();
    };

    xhr.send(data);
  },

  /**
   * 6.1 the device information
   * device information should be JSON formate.
   * return value is JSON object
   */
  generateDeviceInfo: function(acctype){
    var self = this;
    var deviceInfo = {};
    debug("generateDeviceInfo start");
    return new Promise(function(resolve, reject) {
      self.getDeviceInfo(acctype).then((value) => {
        for (let a in value){
          deviceInfo[a] = value[a];
        }
        self.getSimInfor(PRIMARY_SIM_CARD_ID).then((value) => {
          for (let b in value){
            deviceInfo[b] = value[b];
          }
          self.getSimInfor(SECOND_SIM_CARD_ID).then((value) => {
            for (let c in value){
              deviceInfo[c] = value[c];
            }
            self.getOtherInfo().then((value) => {
              for (let d in value){
                deviceInfo[d] = value[d];
              }
              /*deviceInfo['Tag'] = self._totalRounds + "." 
                            + self._oneBootRounds + "."
                            + self._oneRoundTimes*/
              debug("deviceInfo="+JSON.stringify(deviceInfo));
              resolve(deviceInfo);
            }).catch(e => {debug(e);});
          }).catch(e => {debug(e);});
        }).catch(e => {debug(e);});
      }).catch(e => {debug(e);});
    });
  },

  getDeviceInfo: function(acctype) {
    var self = this;
    var deviceInfo = {};
    debug("getDeviceInfo start");

    deviceInfo['REGVER'] = "8.0";
    deviceInfo['MEID'] = "11111111111111";
    deviceInfo['MODEL'] = "HMD-TA 1287";
    var swVersion = navigator.engmodeExtension.getPropertyValue('ro.build.version.fih');
    deviceInfo['SWVER'] = swVersion? swVersion : '';
    deviceInfo['UETYPE'] = "1";

    return new Promise(function(resolve, reject) {
      // get MACID
      self.getSettings('deviceinfo.mac').then((value,error) =>{
        deviceInfo['MACID'] = value ? value : '';
        // get OS version
        self.getSettings('deviceinfo.os').then((value,error) =>{
          deviceInfo['OSVER'] = "KaiOS " +　(value ? value : '');

          //deviceInfo['ROM'] = "4G";
          //deviceInfo['RAM'] = "512M";

          //deviceInfo['REGDATE'] = self.saveCurrentTime();
          //deviceInfo['ACCESSTYPE'] = acctype;

          debug("getDeviceInfo start:"+JSON.stringify(deviceInfo));
          resolve(deviceInfo);
        }).catch(e => {debug(e);});
      }).catch(e => {debug(e);});
    });
  },

  isSimInserted: function() {
    var result = false;
    if (this._connections) {
        for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
         if(conn && conn.iccId){
          result = true;
        }
      }
    }
    return result;
  },

  getSimInfor: function mtm_getSimInfo(index){
    var self = this;
    var simInfo = {};
    debug("getSimInfor start");
    return new Promise(function(resolve, reject) {
      self.getIMEI(index).then((value, error) => {
        if (value){
          simInfo['IMEI' + (index + 1)] = value;
        }

        var conn = self._connections[index];
        if(!conn || !conn.iccId){
          /*resolve(simInfo);
          debug("1getSimInfor:"+JSON.stringify(simInfo));
          return;*/
          simInfo['SIM' + (index + 1) + 'ICCID'] = '';
          simInfo['SIM' + (index + 1) + 'CDMAIMSI'] = '';
          simInfo['SIM' + (index + 1) + 'LTEIMSI'] = '';
          //simInfo['SIM' + (index + 1) + 'TYPE'] = '';
          simInfo['SIM' + (index + 1) + 'CELLID'] = '';
        }

        let iccObj = self._iccManager.getIccById(conn.iccId);
        let iccInfo = iccObj ? iccObj.iccInfo : null;
        if (iccInfo) {
          let mcc_mnc = iccInfo.mcc + iccInfo.mnc;

          simInfo['SIM' + (index + 1) + 'ICCID'] = conn.iccId;
          simInfo['SIM' + (index + 1) + 'CDMAIMSI'] = '';
          simInfo['SIM' + (index + 1) + 'LTEIMSI'] = iccInfo.imsi;
          //simInfo['SIM' + (index + 1) + 'TYPE'] = iccInfo.iccType;

          if(conn.voice && conn.voice.cell){
            //let gsmLocationAreaCode = conn.voice.cell.gsmLocationAreaCode;
            let gsmCellId = conn.voice.cell.gsmCellId;

            simInfo['SIM' + (index + 1) + 'CELLID'] = gsmCellId;
            //simInfo['LAC' + (index + 1)] = gsmLocationAreaCode;
          }
        }

        resolve(simInfo);
        debug("getSimInfor card "+index+"::"+JSON.stringify(simInfo));

      }).catch(e => {debug(e);});
    });
  },

  getOtherInfo: function(){
    var self = this;
    var otherInfo = {};
    debug("getOtherInfo start");
    return new Promise(function(resolve, reject) {
      // which sim card is used
      self.getSettings('ril.data.defaultServiceId').then((value,error) =>{
        debug("getOtherInfo simdata value:" + value);
        otherInfo['DATASIM'] = (value != null) ? (value + 1) : '0';
        resolve(otherInfo);

        // get VOLTE status
        /*let p1 = '';
        let p2 = '';
        self.getSettings('ril.ims.enabled').then((value,error) =>{
          p1 = value ? value : '';
          self.getSettings('ril.ims.preferredProfile').then((value,error) =>{
            p2 = value ? value : '';

            debug("getOtherInfo p1:"+ p1 + "; p2:" + p2);

            if(p1 && p2 != 'wifi-only') {
              otherInfo['VoLTESW'] = '1';
            } else {
              otherInfo['VoLTESW'] = '2';
            }
            debug("getOtherInfo start:"+JSON.stringify(otherInfo));
            resolve(otherInfo);
          }).catch(e => {debug(e);});
        }).catch(e => {debug(e);});*/
      }).catch(e => {debug(e);});
    });
  },

  getCarrier: function(mcc_mnc){
    var carrier = "";
    if(CMCC_MCC_MNC.indexOf(mcc_mnc) != -1){
      carrier = CMCC;
    } else  if(CUCC_MCC_MNC.indexOf(mcc_mnc) != -1){
      carrier = CUCC;
    } else  if(CTCC_MCC_MNC.indexOf(mcc_mnc) != -1){
      carrier = CTCC;
    }
    return carrier;
  },

  getIMEI: function mtm_getIMEI(aServiceId) {
    if (!this._connections) {
      debug('No mozMobileConnections!!!');
      return;
    }
    var connection = this._connections[aServiceId];

    return new Promise(function(resolve, reject) {
      var request = connection.getDeviceIdentities();
      request.onsuccess = function() {
        var value = request.result.imei;
        resolve(value);
      };
      request.onerror = function() {
        var errorMsg = 'Could not retrieve the IMEI code';
        reject(errorMsg);
      };
    });
  },

  getNetworkType: function mtm_getSupportedNetworkType(connection) {
    /**
     * Type of connection.
     *
     * Possible values: 'gsm', 'gprs', 'edge', 'umts', 'hsdpa', 'hsupa', 'hspa',
     *                  'hspa+', 'is95a', 'is95b', '1xrtt', 'evdo0', 'evdoa',
     *                  'evdob', 'ehrpd', 'lte' or null (unknown).
     */

    // the function is just for telecom, can not be used for other operator
    if(connection.voice){
      if('gsm' === connection.voice.type) {
        return "GSM";
      } else if('lte' === connection.voice.type) {
        return "LTE";
      } else {
        return "WCDMA";
      }
    }
  },


  /**
   * get setting value from DB.
   * @param {String} name.
   */
  getSettings: function(key) {
    var settings = navigator.mozSettings;
    if (!settings) {
      debug('No mozSettings!!!');
    }

    return new Promise(function(resolve, reject) {

      var request = settings.createLock().get(key);
      request.onsuccess = function() {
        var value = request.result[key];
        debug("getSettings:onsuccess:"+key+"="+value);
        resolve(value);
      };
      request.onerror = function(error) {
        debug("getSettings " + key +" : " + 'error');
        reject(error);
      };
    });
  },

  // var iccid1_device = "00000000000000000000";
  // var iccid2_device = "00000000000000000000";
  // var iccid_card = new Array();

  /**
    * get simcard iccid
    *
    */
  getICCIDofSimCard: function(){
    if(this._connections) {
      for(var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if(conn.iccId) {
          this.iccid_card[i] = conn.iccId;
        }
        debug("iccid" + i + " = " + this.iccid_card[i]);
      }
    }

  },

  /**
    * get simcard iccid
    *
    */
  getICCIDinDevice: function(){
    var kaios = navigator.engmodeExtension;
    if(kaios) {
      this.iccid1_device = kaios.getPropertyValue('persist.register.iccid1');
      if(!this.iccid1_device) {
        this.iccid1_device = '00000000000000000000';
      }
      this.iccid2_device = kaios.getPropertyValue('persist.register.iccid2');
      if(!this.iccid2_device) {
        this.iccid2_device = '00000000000000000000';
      }
    }
    debug("iccid1_device = " + this.iccid1_device + "; iccid2_device = " + this.iccid2_device);
  },

  saveICCIDintoDevice: function(){
    var kaios = navigator.engmodeExtension;
    if(kaios) {
      kaios.setPropertyValue('persist.register.iccid1', this.iccid1_device);
      kaios.setPropertyValue('persist.register.iccid2', this.iccid2_device);
    }
  },

  resetICCIDinDevice: function(){
    var kaios = navigator.engmodeExtension;
    if(kaios) {
      kaios.setPropertyValue('persist.register.iccid1', '00000000000000000000');
      kaios.setPropertyValue('persist.register.iccid2', '00000000000000000000');
    }
  },

  /**
    * get primary sim type, CMCC, CUCC or CTCC
    *
    */
    getPrimarySimType: function() {
      let carrier;
      var self = this;
      return new Promise(function(resolve, reject){
        self.getSettings('ril.data.defaultServiceId').then((value,error) =>{
          debug("primary sim id is: " + value);
          var conn = self._connections[value];
          if(!conn || !conn.iccId) {
            debug("data not connected for primary sim card");
            this.startNextRound();
            return;
          }
          debug("getPrimarySimType, conn.iccId = " + conn.iccId);
          let iccObj = self._iccManager.getIccById(conn.iccId);
          let iccInfo = iccObj ? iccObj.iccInfo : null;
          if (iccInfo) {
            debug("iccinfo: mcc : mnc = " + iccInfo.mcc + "; " + iccInfo.mnc);
            let mcc_mnc = iccInfo.mcc + iccInfo.mnc;
            carrier = self.getCarrier(mcc_mnc);
            debug("carrier = " + carrier);
          }
          resolve(carrier);
        });
      });
    },

    // check if has CTCC card, if no, no need register
    checkSimType: function() {
      var carrier;
      var self = this;
      var len = self._connections.length;
      debug("connection count = " + len);
      for(var i = 0; i < len; i++) {
        var conn = self._connections[i];
        debug("conn = " + conn);
        if(!conn || !conn.iccId) {
          continue;
        }
        debug("checkSimType, conn.iccId = " + conn.iccId);
        let iccObj = self._iccManager.getIccById(conn.iccId);
        let iccInfo = iccObj ? iccObj.iccInfo : null;
        if (iccInfo) {
          debug("iccinfo: mcc : mnc = " + iccInfo.mcc + "; " + iccInfo.mnc);
          let mcc_mnc = iccInfo.mcc + iccInfo.mnc;
          carrier = self.getCarrier(mcc_mnc);
          if(carrier == CTCC) {
            return true;
          }
        }
      }
      return false;
    },

  //==================================================================================
  /* 6.5 AES encrypt the device information
  */
  aesEncrypt: function mtm_aesEncrypt(src){
    var self = this;
    return new Promise(function(resolve, reject) {
      LazyLoader.load(['js/dmservice/CryptoJSv3.1.2/components/core.js',
        'js/dmservice/CryptoJSv3.1.2/components/enc-base64.js',
        'js/dmservice/CryptoJSv3.1.2/components/md5.js',
        'js/dmservice/CryptoJSv3.1.2/components/evpkdf.js',
        'js/dmservice/CryptoJSv3.1.2/components/cipher-core.js',
        'js/dmservice/CryptoJSv3.1.2/components/mode-ecb.js',
        'js/dmservice/CryptoJSv3.1.2/components/aes.js',
        'js/dmservice/jsrsasign-all-min.js'], function() {
          
        // generate AES key with the md5 
        // abstract is a 128 bit string
        // 128(bit)=32(16 byte hexadecimal)

        let abstract = CryptoJS.MD5(src);
        debug("aesEncrypt:abstract =" + abstract);

        // the key must be the result of CryptoJS.enc.Utf8.parse()
        // or there will be "Error: Malformed UTF-8 data"
        // let key = CryptoJS.enc.Utf8.parse(abstract);
        // the result of md5 is already hex
        let key = abstract;
        debug("CryptoJS:key =" + key);

        // make the abstract as the cipher key for AES
        // AES/ECB/PKCS5Padding
        let encryptedData = CryptoJS.AES.encrypt(src, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        let encryptedDataStr = encryptedData.toString();
        debug("CryptoJS:encryptedDataStr =" + encryptedDataStr);


        let encryptedStr = encryptedData.ciphertext.toString(); //hex
        debug("CryptoJS:encryptedStr =" + encryptedStr);

        // decrypt method for test======================begin.
        let decryptedData = CryptoJS.AES.decrypt({
          ciphertext: CryptoJS.enc.Hex.parse(encryptedStr)
          }, key, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        let decryptedStr = decryptedData.toString(CryptoJS.enc.Utf8);
        debug("CryptoJS:decryptUtf8String =" + decryptedStr);
        // decrypt method for test======================end.

        //need post byte array to server
        var longInt8View = new Int8Array(encryptedStr.length/2);
        debug("longInt8View.length="+longInt8View.length)

        for (var a = 0; a < encryptedStr.length - 1; a += 2) {
          longInt8View[a/2] = parseInt(encryptedStr.substr(a, 2), 16);
          //debug("longInt8View["+a/2+"] = " + longInt8View[a/2]);
        }

        resolve(longInt8View);
      });
    });
  },

  // base64 encrypt
  base64Encrypt: function(src) {
    var self = this;
    return new Promise(function(resolve, reject) {
      LazyLoader.load(['js/dmservice/CryptoJSv3.1.2/components/core.js',
        'js/dmservice/CryptoJSv3.1.2/components/enc-base64.js',
        'js/dmservice/CryptoJSv3.1.2/components/core-min.js'], function() {
          // encrypt
          var wordarray = CryptoJS.enc.Utf8.parse(src);
          var encryptData = CryptoJS.enc.Base64.stringify(wordarray);
          debug("base64 encrypted:" + encryptData);

           // decode .............test
           var parsedData = CryptoJS.enc.Base64.parse(encryptData);
           debug("base64 parsed:" + parsedData.toString(CryptoJS.enc.Utf8));
           // decode .............test

           resolve(encryptData);
        });
    });
  },

  //==================================================================================
  getWifiConnectionState: function mtm_getWifiConnectionState() {
    let result = false;

    if (!this._wifiManager) {
      result = false;
    }
    if (this._wifiManager.connection.status === 'connected') {
      result = true;
    } else {
      result = false;
    }
    debug("getWifiConnectionState:" + result);
    return result;
  },

  getDataConnectionState: function mtm_getDataConnectionState() {
    var isDataConnected = false;
    if (!this._connections) {
      debug('No mozMobileConnections!!!');
      return isDataConnected;
    }

    var len = this._connections.length;

    for (var i = 0; i < len; i++) {
      var con = this._connections[i];
      if (con && con.data) {
        isDataConnected = (con.data.connected
          && !(con.data.roaming) || isDataConnected);
      }
    }
    debug("getDataConnectionState isDataConnected = " + isDataConnected);
    return isDataConnected;
  },

/*  addDataListener: function(){
    if (this._connections) {
      for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if (conn && conn.data) {
          conn.addEventListener('datachange', this);
        }
      }
    }
  },*/

/*  addCardAndRadioStateChangeListener: function(){
    if (this._connections) {
      for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if(conn && conn.iccId){
          let iccCard = this._iccManager.getIccById(conn.iccId);
          if (iccCard) {
            iccCard.addEventListener('cardstatechange', this);
          }
        }
        if(conn){
          conn.addEventListener('radiostatechange', this);
        }
      }
    }
  },*/

  /*isCardAndRadioStateReady: function(){
    let isReady = false;
    if (this._connections) {
      for (var i = 0; i < this._connections.length; i++) {
        let conn = this._connections[i];
        if(conn && conn.iccId){
          let iccCard = this._iccManager.getIccById(conn.iccId);
          if (iccCard) {
            let cardState = iccCard.cardState;
            let radioState = conn.radioState;
            debug("isCardAndRadioStateReady:cardState = " + cardState);
            debug("isCardAndRadioStateReady:radioState = " + radioState);
            if (cardState === 'ready' && radioState === 'enabled') {
              isReady = true;
              this.removeCardAndRadioListener();
            }
          }
        }
      }
    }
    return isReady;
  },*/

/*  restartNetListerners: function () {
    this._isWifiRegisterdDM = false;
    window.addEventListener('wifi-statuschange', this);
    this.isAlarmExist('WAIT_WIFI_POST').then(value => {
      if(!value) {
        this._isDataRegisterdDM = false;
        this.addDataListener();
      }
    });
  },*/

  /**
    *
    *
    */
  startNextRound: function() {
    debug("startNextRound, now round number is:(" + this._totalRounds + ")");
    if(this._totalRounds < MAX_ROUNDS){
      this.removeExistAlarm('NEW_ROUND_POST');
      this.addAlarm('NEW_ROUND_POST', NEW_ROUND_POST_INTERVAL);
    } else {
      debug("startNextRound, request has got to MAX ROUND");
      this.close();
    }
  },

  /*handleEvent: function sb_handleEvent(evt) {
    debug("handleEvent:" + evt.type);
    switch (evt.type) {
      case 'wifi-statuschange':
      //sometimes, this event will be received more than one time
      if (this._isWifiRegisterdDM === false && this.getWifiConnectionState()) {
        this.removeExistAlarm('WAIT_WIFI_POST');
        if(this.isCardAndRadioStateReady() || !this.isSimInserted()){
          this.checkIfRegister();
          this._isWifiRegisterdDM = true;
        }
      }
      break;
      case 'datachange':
      //sometimes, this event will be received more than one time
      if(this._isDataRegisterdDM === false && this.getDataConnectionState()){
        this.checkIfRegister();
        this._isDataRegisterdDM = true;
      }
      break;
      case 'cardstatechange':
      case 'radiostatechange':
      let isReady = this.isCardAndRadioStateReady();
      if(this._isCardAndRadioReady === false && isReady){
        this.checkIfRegister();
        this._isCardAndRadioReady = isReady;
      }
      break;
      default:
      break;
    }
  },*/

  //=========================================================================
  addAlarm: function mtm_addAlarm(key, interval) {
    debug("addAlarm " + key + " after " + interval);
    if (interval <= 0) {
      debug('addAlarm, interval=' + interval + '; no need to add alarm');
      return;
    }
    var alarmService = window.navigator.mozAlarms;
    if(!alarmService){
      debug('no mozAlarms');
      return;
    }

    var alarmDate = new Date(Date.now() + interval);
    var request = alarmService.add(alarmDate, 'ignoreTimezone', {
        dmAlarmType: key
      });

    request.onsuccess = function () {
      debug('next ' + key + ' AlarmDate is ' + alarmDate);
    }
    request.onerror = function () {
      debug('add alarm failed: ' + this.error);
    }
  },

  handleAlarm: function mtm_handleAlarm(message){
    if(!message || !message.data || !(message.data.dmAlarmType)) {
      return;
    }
    debug("handleAlarm:"+ message.data.dmAlarmType)
    switch (message.data.dmAlarmType) {
      case 'SECOND_TIME_POST':
      case 'NEW_ROUND_POST':
        // if alarm started, but no network, 
        // we need to add the network listen
        //this.checkIfRegister();
        this.start();
        break;
      case 'WAIT_WIFI_POST':
        if(this.getWifiConnectionState()){
          this.checkIfRegister();
        } else if(this.getDataConnectionState()){
          this.checkIfRegister();
        } else {
          this.addDataListener();
        }
        break;
      default:
        break;
    }
  },


  removeExistAlarm: function mtm_removeExistAlarm(type) {
    var requst = navigator.mozAlarms.getAll();
    requst.onsuccess = function(e) {
      var result = e.target.result;
      for (var i = 0; i < result.length; i++) {
        if (result[i].id && result[i].data &&
          result[i].data.dmAlarmType === type) {
          debug("removeExistAlarm:" + result[i].data.dmAlarmType);
          navigator.mozAlarms.remove(Number(result[i].id));
        }
      }
    };
    requst.onerror = function(e) {
    };
  },
  isAlarmExist: function (type) {
    var requst = navigator.mozAlarms.getAll();
    var self = this;
    return new Promise(function(resolve, reject) {
      requst.onsuccess = function(e) {
        var result = e.target.result;
        for (var i = 0; i < result.length; i++) {
          if (result[i].id && result[i].data &&
            result[i].data.dmAlarmType === type) {
            debug("isAlarmExist:" + result[i].data.dmAlarmType + "is true!");
            resolve(true);
          }
        }
        resolve(false);
      };
      requst.onerror = function(e) {
        resolve(false);
      };
    });
  },

  removeAllExistAlarm: function mtm_removeAllExistAlarm() {
    var requst = navigator.mozAlarms.getAll();
    requst.onsuccess = function(e) {
      var result = e.target.result;
      for (var i = 0; i < result.length; i++) {
        if (result[i].id && result[i].data &&
          (result[i].data.dmAlarmType === 'SECOND_TIME_POST' || 
           result[i].data.dmAlarmType === 'NEW_ROUND_POST' ||
           result[i].data.dmAlarmType === 'WAIT_WIFI_POST' )) {
          debug("removeExistAlarm:" + result[i].data.dmAlarmType);
          navigator.mozAlarms.remove(Number(result[i].id));
        }
      }
    };
    requst.onerror = function(e) {
    };
  },

  // 6.1 first time to boot up
  // time formate: YYYY-MM-DD HH:mm:SS
  //# see http://pubs.opengroup.org/onlinepubs/007908799/xsh/strftime.html
  saveCurrentTime: function() {
    let date = new Date(Date.now());

    let f = new navigator.mozL10n.DateTimeFormat();
    let result = f.localeFormat(date, '%Y-%m-%d') 
            + ' ' + f.localeFormat(date, '%H:%M:%S');
    debug("saveCurrentTime:" + result);
    navigator.mozSettings.createLock().set({
      'first.bootup.date': result
    });
    return result;
  },

  setServer: function() {
    let url = this._url
    navigator.mozSettings.createLock().set({
      'register.server.url': url
    });
  },

  /*initRoundsForFirstBootUp: function() {
    this._totalRounds = 1;
    this._oneBootRounds = 0;
    this._oneRoundTimes = 0;
    navigator.mozSettings.createLock().set({
          'check.total.rounds': 0
        });
  },*/
};


/**
 * the first time phone boot up, DeviceManagerService receive 
 * the message "ftudone"
 */
window.addEventListener('ftudone', function initMobileTerminalManager(evt) {
  window.removeEventListener('ftudone', initMobileTerminalManager);
  debug('init triggered by ftudone');

  DeviceManagerService.preinit();
  DeviceManagerService.init();

  // navigator.mozSettings.createLock().get('first.bootup.date')
  // need save the right firts boot up time, 
  // but the time is updated so sllowly
  // i have to wait
  /*let curef = navigator.engmodeExtension.getPrefValue("fota.commercial.ref", "na");
  if (curef === CU_CUCC) {
     debug("ftudone: It's CUCC, start DM process");
     DeviceManagerService.preinit();
     if(DeviceManagerService.isCardAndRadioStateReady() || 
        DeviceManagerService.getWifiConnectionState()) {
        window.setTimeout(() => {
        DeviceManagerService.saveCurrentTime();
        DeviceManagerService.init();
        }, 1000*60);
     } else {
        window.addEventListener('moztimechange', function timeChange() {
        debug("ftudone moztimechange");
        DeviceManagerService.saveCurrentTime();
        DeviceManagerService.init();
        window.removeEventListener('moztimechange', timeChange);
        });
     }
     DeviceManagerService.initRoundsForFirstBootUp();
   }
  else { 
    debug(" ftudone: Not CUCC, NO DM"); 
   }*/
});

/**
 * every time phone boot up, DeviceManagerService receive 
 * the message "ftuskip"
 */
window.addEventListener('ftuskip', function initMobileTerminalManager(evt) {
  window.removeEventListener('ftuskip', initMobileTerminalManager);
  debug('init triggered by ftuskip');
  DeviceManagerService.preinit();
  DeviceManagerService.init();

  /*let curef = navigator.engmodeExtension.getPrefValue("fota.commercial.ref", "na");
  if (curef === CU_CUCC) {
    debug("ftuskip: It's CUCC, start DM process");
    DeviceManagerService.preinit();
    DeviceManagerService.init();
  }
  else {
    debug("ftuskip: Not CUCC, NO DM");
  }*/
});
