'use strict';

(function(exports){
  var NT_DOM_HELPER = {

        container: document.getElementById('touchless-notification-overlay'),

        getNotificationCount : function _getCount(){
          return NT_DOM_HELPER.getNotifications().length;
        },

        getNotifications: function _getDisplayed() {
          var notifications = [];
          var items = document.querySelectorAll(".fake-notification.displayed");
          var number = items.length;
          for (var i = 0; i < number; ++i)
            notifications.push(items[i]);

          var items = document.querySelectorAll(".notification:not([style*='display: none;']");
          var number = items.length;
          for (var i = 0; i < number; ++i)
            notifications.push(items[i]);

          return notifications;
        },

        getCmasNotifications: function _getDisplayedCmas(){
            return document.querySelectorAll(".priority-notifications .notification:not([style*='display: none;']");
        },

        getFocusedNotification: function _getFocused(){
          var focused = NT_DOM_HELPER.container.querySelector('.focus');
          if (focused) {
            if (focused.hidden
              || (focused.classList.contains('fake-notification') && !focused.classList.contains('displayed')) // fake notification
              || ( focused.classList.contains('media-notification') && focused.style.getPropertyValue('display') === 'none')) {
              focused.classList.remove('focus');
              var items = this.getNotifications();
              if (items[0]) {
                items[0].classList.add('focus');
                return items[0];
              }
              return null;
            }
          }
          return focused;
        }
    };
    exports.NT_DOM_HELPER = NT_DOM_HELPER;
})(window);
