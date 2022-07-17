(function(exports) {
  'use strict';
  const BALCKLIST = 'example.com';
  const IACCHANNEL = 'amucomms';

  function InternalUsageMetrics() {}

  const IUM = InternalUsageMetrics;
  IUM.prototype.transmit = function transmit(data) {

    var apps = data.apps;
    if (Object.keys(apps).length === 0) {
      return;
    }
    var shareableApps = {};
    var dayKey = this.getDayKey();

    for (var manifest in apps) {
      if (manifest.indexOf(BALCKLIST) === -1) {
        var app = apps[manifest];
        var objKeys = Object.keys(app);
        let objApp = objKeys.length ?
          app[objKeys[objKeys.length - 1]] : null;
        if (objApp) {
          var usage = {
            usageTime: objApp.usageTime,
            invocations: objApp.invocations,
            crashed: objApp.crashed
          };
          shareableApps[manifest] = usage;
        }
      }
    }

    if (Object.keys(shareableApps).length === 0) {
      return;
    }

    this.broadcast(shareableApps);
  }

  IUM.prototype.broadcast = function broadcast(data) {
    var dayKey = this.getDayKey();
    navigator.mozApps.getSelf().onsuccess = function(evt) {
      var app = evt.target.result;
      app.connect(IACCHANNEL).then(function onConnAccepted(ports) {
        ports.forEach(function(port) {
        port.postMessage({'action': 'collect', 'data': data, 'date': dayKey});
      });
      }, function onConnRejected(reason) {
        console.warn('IAC error:', reason);
      });
    }
  }


  IUM.prototype.getDayKey = function(date) {
    date = date || new Date();
    var dayKey = date.toISOString().substring(0, 10);
    return dayKey.replace(/-/g, '');
  };

  exports.InternalUsageMetrics = InternalUsageMetrics;
}(window));
