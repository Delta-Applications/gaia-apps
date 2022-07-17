/* exported RecorderControl */
'use strict';

(function (exports) {
  const TIMESLICE = 1000;

  class RecorderControl {

    constructor() {
      // recorder status is idle
      this.RECORDER_STATUS_INACTIVE = 'inactive';
      // recorder status is recording
      this.RECORDER_STATUS_RECORDING = 'recording';
      // recorder status is paused
      this.RECORDER_STATUS_PAUSED = 'paused';

      this.mediaRecorder = null;
      this.chunks = [];
      this.spaceSize = null;
      this.audioBlob = null;
      // current save file mode is append or add.
      this.isAppend = false;
    }

    init() {
      let _this = this;
      const constraints = {
        audio: { audioSource: 'fm' }
      };
      return new Promise((resovle, reject) => {
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.ondataavailable = function (e) {
            _this.chunks.push(e.data);
            if (_this.mediaRecorder) {
              let dataSize = new Blob(_this.chunks).size;
              if (dataSize >= RecordsStore.maxChunksSize) {
                _this.chunksReachThreshold();
              }
              if (_this.spaceSize <= dataSize + RecordsStore.minSpace) {
                _this.stop();
                FMRadio.showMessage('sd-card-full');
              }
            }
          };

          this.mediaRecorder.onstart = function (e) {
            if (!_this.lock) {
              _this.lock = navigator.requestWakeLock('screen');
            }
          };

          this.mediaRecorder.onstop = function (e) {
            StatusManager.update();
            _this.audioBlob = new Blob(_this.chunks, { 'type': 'audio/ogg;' +
                ' codecs=opus' });
            if (_this.lock && _this.lock.unlock) {
              _this.lock.unlock();
              _this.lock = null;
            }
            RecorderView.hide();
            if (_this.isAppend) {
              _this.trySaveFile(_this.fileNameCache, 0, true);
            } else {
              _this.trySaveFile();
            }
            _this.isAppend = false;
          };

          resovle(this.mediaRecorder);
        }).catch((error) => {
          _this.error('getUserMedia error occured: ' + error);
          reject(error);
        });
      })
    };

    error(e) {
      console.error(e);
    };

    get state() {
      if (this.mediaRecorder) return this.mediaRecorder.state;
      return this.RECORDER_STATUS_INACTIVE;
    };

    start() {
      this.chunks = [];
      RecordsStore.checkSpace('new').then((val) => {
        this.spaceSize = val;
        // spaceSize less than min space, don't record.
        if (this.spaceSize <= RecordsStore.minSpace) {
          return FMRadio.showMessage('sd-card-full');
        }
        this.init().then(() => {
          if (this.mediaRecorder.state === this.RECORDER_STATUS_INACTIVE) {
            this.mediaRecorder.start(TIMESLICE);
            StatusManager.update();
            RecorderView.show();
          }
        });
      });
    };

    stop() {
      if (!this.mediaRecorder) {
        return;
      }
      if (this.mediaRecorder.state !== this.RECORDER_STATUS_INACTIVE) {
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
      }
    }

    chunksReachThreshold() {
      this.audioBlob = new Blob(this.chunks, {
        'type': 'audio/ogg; codecs=opus'
      });
      this.chunks = [];
      // when first reach the max chunks size, cache the
      // filePath(will append to this path), isAppend is false,
      // 2st or later isAppend is true.
      if (!this.isAppend) {
        this.fileNameCache = this.generateFileName(0);
      }
      this.trySaveFile(this.fileNameCache);
      this.isAppend = true;
    }

    // judge the filePath exist or not . if not exist save the file. and if
    // exist generate new file path with suffix or appendNamed file.
    trySaveFile(fileNameCache, suffixNum = 0, appendEnd) {
      let fileName = fileNameCache || this.generateFileName(suffixNum);
      let filePath = this.generateFilePath(fileName);
      RecordsStore.get(filePath, () => {
        if (fileNameCache) {
          this.appendFile(filePath, appendEnd);
        } else {
          this.trySaveFile(fileNameCache, ++suffixNum);
        }
      }, (e) => {
        this.addFile(filePath, fileName, !fileNameCache);
      });
    }

    addFile(filePath, fileName, showMsg = true) {
      RecordsStore.add(filePath, this.audioBlob, () => {
        if (!showMsg) return;
        this.saveFileDone(fileName);
      }, (e) => {
        this.error('--add file error--' + e);
      })
    }

    appendFile(filePath, appendEnd) {
      RecordsStore.append(filePath, this.audioBlob, () => {
        if (appendEnd) {
          this.renameAppendedFile();
        }
        this.audioBlob = null;
      }, (e) => {
        this.error('--append file error--' + e);
      })
    }

    renameAppendedFile() {
      let fileName = this.generateFileName();
      let filePath = this.generateFilePath(this.fileNameCache);
      RecordsStore.rename(filePath, fileName, () => {
        this.saveFileDone(fileName);
      }, (e) => {
        this.error('--rename file error--' + e);
      });
    }

    saveFileDone(fileName) {
      window.dispatchEvent(new CustomEvent('turnOffOnRecording'));
      FMRadio.showMessage('record-saved-success', {
        messageL10nArgs: {
          name: fileName
        }
      });
    }

    generateFileName(suffixNum) {
      const currentFrequency = FrequencyDialer.getFrequency();
      const currentFreqeuncyObj = FrequencyManager.getCurrentFrequencyObject(currentFrequency);
      const frequencyName = typeof currentFreqeuncyObj === 'object' ? currentFreqeuncyObj.name.replace(' MHz', '') : currentFrequency;
      const mediaName = `${frequencyName}${this.getCurrentDataTime()}`;
      return `${mediaName}${suffixNum ? '_' + suffixNum : ''}.oga`;
    }

    generateFilePath(fileName) {
      return `FM Radio/${fileName}`
    }

    getCurrentDataTime() {
      function padding(s) {
        return (s.toString().length <= 1 ? '0' + s : s);
      }
      const date = new Date();
      const year = padding(date.getFullYear());
      const month = padding(date.getMonth() + 1);
      const day = padding(date.getDate());
      const hour = padding(date.getHours());
      const minute = padding(date.getMinutes());

      return `${month}${day}${year}${hour}${minute}`;
    }

  }

  exports.RecorderControl = new RecorderControl();
})(window);