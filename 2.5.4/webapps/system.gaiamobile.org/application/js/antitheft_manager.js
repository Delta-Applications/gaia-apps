'use strict';
(function(exports) {
  var AntitheftAlarmManager = {
    timeSpan: 60 * 24 * 60 * 1000,
    storageKey: "mozid_fresh_time",

    appendAlarms: function() {
      var _self = this;
      this.createAlarms();
      AlarmMessageHandler.addCallback(function(message) {
        if (message.data && message.data.type === 'refreshMozId') {
          _self.createAlarms();
          navigator.mozId.request();
        }
      });

      window.addEventListener('online', function() {
        // Refresh the token any how.
        navigator.mozId.request();
      });

      window.addEventListener('moztimechange', this.onTimeChange.bind(this));
    },
    onTimeChange: function() {
      clearTimeout(this.timeChangeTimer);
      this.timeChangeTimer = setTimeout(() => {
        // Do not touch alarm if there's a valid one.
        var lastAlarmTime = localStorage.getItem(this.storageKey);
        var diff = lastAlarmTime ? lastAlarmTime - Date.now() : 0;
        if (diff > 0 &&  diff < this.timeSpan) {
          return;
        }

        this.createAlarms(true);
      }, 5000);
    },
    createAlarms: function(forceDelete) {
      var _self = this;
      this.checkAndDeleteAlarm(forceDelete).then((found) => {
        if (found) {
          return;
        }

        var nextAlarm = new Date(Date.now() + _self.timeSpan);
        var request = navigator.mozAlarms.add(
          nextAlarm, 'ignoreTimezone', { type: 'refreshMozId' }
        );

        request.onsuccess = function(data) {
          localStorage.setItem(_self.storageKey, nextAlarm.getTime());
        };

        request.onerror = function(err) {
        };
      })
    },
    checkAndDeleteAlarm: function(forceDelete) {
      return new Promise((resolve, reject) => {
        var alarmRequest = navigator.mozAlarms.getAll();
        alarmRequest.onsuccess = function () {
          var found = false;
          this.result.forEach(function (alarm) {
            if (alarm.data.type === 'refreshMozId') {
              // We keep one alarm
              if (found || forceDelete) {
                navigator.mozAlarms.remove(alarm.id);
              } else {
                found = true;
              }
            }
          });
          resolve(found);
        }
        alarmRequest.onerror = function () {
          resolve(false);
        };
      })
    }
  }
  exports.AntitheftAlarmManager = AntitheftAlarmManager;
}(window));
