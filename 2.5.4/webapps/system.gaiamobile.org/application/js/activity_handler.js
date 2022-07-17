/* (c) 2017 KAI OS TECHNOLOGIES (HONG KONG) LIMITED All rights reserved. This
 * file or any portion thereof may not be reproduced or used in any manner
 * whatsoever without the express written permission of KAI OS TECHNOLOGIES
 * (HONG KONG) LIMITED. KaiOS is the trademark of KAI OS TECHNOLOGIES (HONG KONG)
 * LIMITED or its affiliate company and may be registered in some jurisdictions.
 * All other trademarks are the property of their respective owners.
 */
/* global Service */
function showRebootDeviceDialog(appName, activity) {
  const _ = navigator.mozL10n.get;
  Service.request('DialogService:show', {
    header: _('restart-phone'),
    content: _('restart-content', { appName }),
    ok: 'restart',
    cancel: 'cancel',
    onOk: () => {
      Service.request('startPowerOff', true);
    },
    onBack: () => {
      activity.postError('cancel');
    },
    onCancel: () => {
      activity.postError('cancel');
    },
    translated: true
  });
}

window.navigator.mozSetMessageHandler('activity', (activity) => {
  const { name, data } = activity.source;
  switch (name) {
    case 'view':
      window.browser.handleActivity(activity);
      break;
    case 'reboot-device':
      showRebootDeviceDialog(data.appName, activity);
      break;
    case 'offline-dialog':
      window.isOnline().then((connected) => {
        if (!connected) {
          Service.request('OfflineDialog:show');
        }
      });
      break;
    default:
      break;
  }
});

