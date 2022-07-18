define(["require", "modules/mvvm/observable"], function (t) {
    var e = t("modules/mvvm/observable"),
        n = function () {
            this._enabled = !1, this._appStorage = navigator.getDeviceStorage("apps"), this.storage = e({
                usedPercentage: 0,
                totalSize: 0,
                usedSize: 0,
                freeSize: 0
            })
        };
    n.prototype = {
        get enabled() {
            return this._enabled
        },
        set enabled(t) {
            this._enabled !== t && (this._enabled = t, t ? (this._attachListeners(), this._getSpaceInfo()) : this._detachListeners())
        },
        _attachListeners: function () {
            this._appStorage.addEventListener("change", this), document.addEventListener("visibilitychange", this)
        },
        _detachListeners: function () {
            this._appStorage.removeEventListener("change", this), document.removeEventListener("visibilitychange", this)
        },
        handleEvent: function (t) {
            switch (t.type) {
                case "change":
                    this._getSpaceInfo();
                    break;
                case "visibilitychange":
                    document.hidden || this._getSpaceInfo()
            }
        },
        _getSpaceInfo: function () {
            var t = this._appStorage;
            return t ? (t.totalSpace().onsuccess = function (e) {
                this.storage.totalSize = e.target.result, t.usedSpace().onsuccess = function (t) {
                    this.storage.usedSize = t.target.result, this.storage.freeSize = this.storage.totalSize - this.storage.usedSize;
                    var e = 0 === this.storage.totalSize ? 0 : 100 * this.storage.usedSize / this.storage.totalSize;
                    e > 100 && (e = 100), this.storage.usedPercentage = e
                }.bind(this)
            }.bind(this), void 0) : (console.error("Cannot get DeviceStorage for: app"), void 0)
        }
    };
    var i = new n;
    return i.enabled = !0, i
});