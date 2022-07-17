'use strict';

const DownloadNotificationStore = (function() {

  let downloadNotifications = new Map();

  function savedNotification() {
    const obj = {};
    downloadNotifications.forEach((item, id) => {
      obj[id] = item;
    });
    try {
      window.localStorage.setItem('download-notifications',
        JSON.stringify(obj));
    } catch (e) {
      console.log('savedNotification failed');
    }
  }

  function init() {
    const cache =
      window.localStorage.getItem('download-notifications');
    // restore to memory
    if (cache) {
      const obj = JSON.parse(cache);
      Object.keys(obj).forEach((id) => {
        addNotification(id);
      });
    }
  }

  function removeNotification(id) {
    downloadNotifications.delete(id);
    savedNotification();
  }

  function addNotification(id) {
    if (!downloadNotifications.has(id)) {
      downloadNotifications.set(id, 'true');
      savedNotification();
    }
  }

  function isDeletedNotification(id) {
    return !downloadNotifications.has(id);
  }

  return {
    init,
    addNotification,
    removeNotification,
    isDeletedNotification
  };
})();

DownloadNotificationStore.init();

