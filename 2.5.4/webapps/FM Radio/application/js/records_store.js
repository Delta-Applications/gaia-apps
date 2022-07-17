/* exported RecordsStore */
'use strict';

(function (exports) {
  const SD_CARD_INDEX = 1;
  class RecordsStore {

    constructor() {
      // const record db state is ready
      this.RECORDS_STORE_STATE_READY = 'ready';
      this.state = '';
      this.isSaving = false;
      this.sdIsAvailable = false;
      this.deviceStorages = [];
      this.minSpace = 300 * 1024;
      this.maxChunksSize = 500 * 1024;
      this.initDB();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          RecorderControl.stop();
        } else {
          this.initDB();
        }
      });
    }

    initDB() {
      this.deviceStorages = navigator.getDeviceStorages('sdcard');
      this.deviceStorages[1] && this.deviceStorages[1].available().then((e) => {
        this.sdIsAvailable = e;
      });
      let recordDB = new MediaDB('sdcard', null, {
        excludeFilter: /^(\/sdcard(1)?\/audio)(.)*.(opus|rcd|oga)$/
      });

      recordDB.onready = (e) => {
        this.state = this.RECORDS_STORE_STATE_READY;
      };

      this.db = recordDB;
    }

    get(filename, success, error) {
      this.db.getFile(filename, success, error);
    }

    add(filename, blob, success, error) {
      this.isSaving = true;
      this.db.addFile(filename, blob, () => {
        this.isSaving = false;
        success();
      }, error);
    }

    append(filename, blob, success, error) {
      this.isSaving = true;
      this.db.appendFile(filename, blob, () => {
        this.isSaving = false;
        success();
      }, error);
    }

    rename(filePath, newName, success, error) {
      this.deviceStorages[SD_CARD_INDEX].getRoot().then((root) => {
        root.renameTo(filePath, newName).then((e) => {
          if (success) {
            success(e);
          }
        });
      }, (e) => {
        if (error) {
          error(e);
        }
      })
    }

    checkSpace(state) {
      return new Promise((resolve, reject) => {
        this.db.freeSpace((result) => {
          if (result <= this.minSpace && 'new' === state) {
            FMRadio.showMessage('sd-card-full');
            reject('storage almost full');
          }
          resolve(result);
        });
      });
    }

    hasSDCard() {
      return this.deviceStorages.length > 1 && this.sdIsAvailable === 'available';
    }

    isSDCardSetDefault() {
      return this.deviceStorages.length > 1 && this.deviceStorages[SD_CARD_INDEX].default;
    }
  }

  exports.RecordsStore = new RecordsStore();
})(window);