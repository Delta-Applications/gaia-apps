/* exported RecorderView */
'use strict';

(function (exports) {
  class RecorderView {

    constructor() {
      this.container = null;
      this.containerSelector = '#recorder-timer';
      this.element = null;
      this.beginTimeStamp = Date.now();
      this.animateReq = null;
      this.init();
    }

    init() {
      this.container = document.querySelector(this.containerSelector);
      this.element = document.getElementById('timer');
    }

    show() {
      this.container.classList.remove('hidden');
      this.beginTimeStamp = Date.now();
      this.render();
    }

    hide() {
      this.container.classList.add('hidden');
      cancelAnimationFrame(this.animateReq);
    }

    render() {
      const reqAnimate = () => {
        const time = this.formatDuration(Date.now() - this.beginTimeStamp);
        this.element.innerHTML = time;
        this.animateReq = requestAnimationFrame(reqAnimate);
      };
      this.animateReq = requestAnimationFrame(reqAnimate);
    }

    formatDuration(timeStamp) {
      function padding(s) {
        return (s.toString().length <= 1 ? '0' + s : s);
      }

      const seconds = parseInt(timeStamp / 1000, 10);
      var hour = padding(Math.floor(seconds / 60 / 60));
      var minute = padding(Math.floor(seconds / 60 % 60));
      var second = padding(Math.floor(seconds % 60));
      return `${hour === '00' ? '' : hour + ':'}${minute}:${second}`;
    }

  }

  exports.RecorderView = new RecorderView();
})(window);