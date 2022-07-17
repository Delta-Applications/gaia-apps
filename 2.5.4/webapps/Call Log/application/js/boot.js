(() => {
  const HTML_CACHE_VERSION = '1.0.1';
  const cache = getValideCache();
  if (cache) {
    let snapshot = document.getElementById('snapshot');
    snapshot.innerHTML = cache;
  }
  window.setTimeout(() => {
    LazyLoader.load('dist/app.js', () => {});
  }, cache ? 300 : 0);

  window.addEventListener('DOMContentLoaded', () => {
    if (window.performance) {
      window.performance.mark('visuallyLoaded');
    }
  });
  navigator.getFeature('hardware.memory').then((memOnDevice) => {
    localStorage.setItem('hardware-memory', memOnDevice);
    if (memOnDevice === 256) {
      document.body.classList.add('low-memory-device');
    }
  });

  window.addEventListener('largetextenabledchanged', () => {
    document.body.classList.toggle('large-text', navigator.largeTextEnabled);
  });
  document.body.classList.toggle('large-text', navigator.largeTextEnabled);

  function getValideCache() {
    const isPick = window.location.hash === '#pick';
    if (isPick) {
      return null;
    }
    const snapshotCache = window.localStorage.getItem('snapshot');
    if (snapshotCache) {
      const index = snapshotCache.indexOf(':');
      const value = snapshotCache.substring(0, index).split(',');
      if (HTML_CACHE_VERSION === value[0] && navigator.language === value[1]) {
        return snapshotCache.substring(index + 1);
      } else {
        window.localStorage.setItem('snapshot', null);
      }
    }
    return null;
  }

})();
