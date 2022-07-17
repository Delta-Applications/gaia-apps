'use strict';
/* global Service, DownloadUI, DownloadHelper */
const DownloadHandler = (function () {
  const _ = navigator.mozL10n.get;

  function fileNotFoundDialog(filename) {
    const id = 'download-file-not-found-dialog';
    const config = {
      id,
      title: _('download_file_not_found_title'),
      message: _('download_file_not_found_body', { filename: filename }),
      primarybtntext: _('ok'),
      onDialogPrimaryBtnClick: () => {
        Service.request('DialogService:hide', id);
      }
    };
    Service.request('DialogService:show', config);
  }

  function handlerOpenDownload({ download, filename }) {
    // Attempts to open the file
    const req = DownloadHelper.open(download);
    req.onerror = () => {
      if (req.error.code === 'FILE_NOT_FOUND') {
        fileNotFoundDialog(filename);
      }
      handlerError({
        filename,
        download,
        error: req.error
      });
    };
  }

  /**
   * DownloadUI will use an existing DOM element to render the dialog,
   * which may cause problem in system app. So we have our own UI.
   */
  function handlerError({ filename, download, error }) {
    // Canceled activites are normal and shouldn't be interpreted as errors.
    // Unfortunately, this isn't reported in a standard way by our
    // applications (or third party apps for that matter). This is why we
    // have this lazy filter here that may need to be updated in the future
    // but hopefully will just get removed.
    if (error.message &&
      (error.message.toLowerCase().endsWith('canceled') ||
      error.message.toLowerCase().endsWith('cancelled'))) {
      return;
    }
    let onOk;
    switch (error._download_message || error.message) {
      case 'NO_SDCARD':
      case 'UNMOUNTED_SDCARD':
      case 'FILE_NOT_FOUND':
      case 'NO_PROVIDER':
        break;

      case 'MIME_TYPE_NOT_SUPPORTED':
      default:
        onOk = () => {
          // We need to wait the current dialog to close because DialogService
          // does not support multiple dialogs.
          window.setTimeout(() => {
            showDownloadUI(filename, DownloadUI.TYPE.DELETE, () => {
              DownloadHelper.remove(download);
            });
          });
        };
        break;
    }

    showDownloadUI(filename, DownloadUI.TYPE[error.message], onOk);
  }

  function showDownloadUI(fileName, type, onOk) {
    var message = '';
    var _ = navigator.mozL10n.get;
    var args = Object.create(null);
    args.name = fileName;
    message = _(type.name + '_download_message', args);

    Service.request('DialogService:show', {
      header: _(type.name + '_download_title'),
      content: message,
      type: onOk ? 'confirm' : 'alert',
      translated: true,
      onOK: onOk
    });
  }

  return {
    fileNotFoundDialog,
    handlerError,
    handlerOpenDownload,
    showDownloadUI
  };
})();
window.DownloadHandler = DownloadHandler;
