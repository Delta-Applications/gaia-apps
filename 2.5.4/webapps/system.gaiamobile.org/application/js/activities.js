'use strict';
/* global applications, ManifestHelper */

(function(exports) {

  /**
   * Handles relaying of information for web activities.
   * Contains code to display the list of valid activities,
   * and fires an event off when the user selects one.
   * @class Activities
   */
  function Activities() {
    window.addEventListener('mozChromeEvent', this);
    window.addEventListener('appopened', this);
    window.addEventListener('home', this);
    Service.registerState('activitiesShowing', this);
  }

  Activities.prototype = {
    /** @lends Activities */
    activitiesShowing: function() {
      return this._id &&
        !!document.querySelector('.option-menu-root .menu-item');
    },
    /**
    * General event handler interface.
    * Updates the overlay with as we receive load events.
    * @memberof Activities.prototype
    * @param {DOMEvent} evt The event.
    */
    handleEvent: function(evt) {
      switch (evt.type) {
        /**
         * We need to drop the event manually because we won't get oncancel
         * if the entire app is closed.
         * Gecko will send the open-app event twice if we don't cancel it between the
         * two activity chooser.
         */
        case 'home':
          if (this._id) {
            this.cancel();
          }
          break;
        case 'mozChromeEvent':
          var detail = evt.detail;
          switch (detail.type) {
            case 'activity-choice':
              this.chooseActivity(detail);
              break;
          }
          break;
      }
    },

   /**
    * Displays the activity menu if needed.
    * If there is only one option, the activity is popup actionmenu launched.
    * @memberof Activities.prototype
    * @param {Object} detail The activity choose event detail.
    */
    chooseActivity: function(detail) {
      this._id = detail.id;
      var choices = detail.choices;
      this.publish('activityrequesting', detail);
      if (choices.length === 1 && !(detail.name == 'share')) {
        this.choose('0', choices[0].manifest);
      } else {
        //
        // Our OMA Forward Lock DRM implementation relies on a "view"
        // activity to invoke the "fl" app when the user clicks on a
        // link to content with a mime type of
        // "application/vnd.oma.dd+xml" or "application/vnd.oma.drm.message".
        //
        // In order for this to be secure, we need to ensure that the
        // FL app is the only one that can respond to view activity
        // requests for those particular mime types. Here in the System app
        // we don't know what the type associated with an activity request is
        // but we do know the name of the activity. So if this is an activity
        // choice for a "view" activity, and the FL app is one of the choices
        // then we must select the FL app without allowing the user to choose
        // any of the others.
        //
        // If we wanted to be more general here we could perhaps
        // modify this code to allow any certified app to handle the
        // activity, but it is much simpler to restrict to the FL app
        // only.
        //
        if (detail.name === 'view') {
          var flAppIndex = choices.findIndex(function(choice) {
            var matchingRegex =
              /^(http|https|app)\:\/\/fl\.gaiamobile\.org\//;
            return matchingRegex.test(choice.manifest);
          });
          if (flAppIndex !== -1) {
            this.choose(flAppIndex.toString(10),
              choices[flAppIndex].manifest); // choose() requires a string
            return;
          }
        }

        // Since the mozChromeEvent could be triggered by a 'click', and gecko
        // event are synchronous make sure to exit the event loop before
        // showing the list.
        setTimeout((function nextTick() {
          // Bug 852785: force the keyboard to close before the activity menu
          // shows
          window.dispatchEvent(new CustomEvent('activitymenuwillopen'));

          var activityNameL10nId = 'activity-' + detail.name;
          Service.request('showOptionMenu', {
            header: activityNameL10nId,
            options: this._listItems(choices, detail.name),
            onCancel: this.cancel.bind(this),
            hasCancel: true
          }, Service.query('getTopMostWindow'));
        }).bind(this));
        }
    },

    isInvalidApp(manifest) {
      const app = applications.getByManifestURL(manifest);
      return app && app.role === 'invalid';
    },

   /**
    * The user chooses an activity from the activity menu.
    * @memberof Activities.prototype
    * @param {Number} choice The activity choice.
    */
    choose: function(choice, manifest) {
      if (Service.query('isFtuRunning') && manifest ===
        'https://api.kaiostech.com/apps/manifest/OSlAbgrhLArfT7grf4_N') {
        this.cancel();
      } else if (manifest && this.isInvalidApp(manifest)) {
        Service.request('SystemToaster:show', {
          textL10n:'invalidAppPrompt'
        });
        this.cancel();
      } else if (Service.query('promptRestrictedAppDialog',
        { manifestURL: manifest })) {
        this.cancel();
      } else {
        const returnedChoice = {
          id: this._id,
          type: 'activity-choice',
          value: choice
        };
        this._sendEvent(returnedChoice);
        delete this._id;
      }
    },

    cancelActivityMenu: function() {
      if (this._id) {
        Service.request('hideOptionMenu');
        this.cancel();
      }
    },

   /**
    * Cancels from the activity menu.
    * @memberof Activities.prototype
    */
    cancel: function() {
      var returnedChoice = {
        id: this._id,
        type: 'activity-choice',
        value: -1
      };
      this._sendEvent(returnedChoice);
      delete this._id;
    },

    publish: function(eventName, detail) {
      var event = new CustomEvent(eventName, { detail: detail });
      window.dispatchEvent(event);
    },

    /**
     * Sends an event to the platform when a user makes a choice
     * or cancels the activity menu.
     * @memberof Activities.prototype
     * @param {Number} value The index of the selected activity.
     */
    _sendEvent: function(value) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent('mozContentEvent', true, true, value);
      window.dispatchEvent(event);
    },

    /**
     * Formats and returns a list of activity choices.
     * @memberof Activities.prototype
     * @param {Array} choices The list of activity choices.
     * @return {Array}
     */
    _listItems: function(choices, name) {
      let sortItems = [];
      const highPriorityApps_pick = {
        'app://gallery.gaiamobile.org/manifest.webapp': 0,
        'app://video.gaiamobile.org/manifest.webapp': 1,
        'app://camera.gaiamobile.org/manifest.webapp': 2,
        'app://music.gaiamobile.org/manifest.webapp': 3,
        'app://contact.gaiamobile.org/manifest.webapp': 4,
        'app://download.gaiamobile.org/manifest.webapp': 5,
        'app://soundrecorder.gaiamobile.org/manifest.webapp': 6
      };
      const highPriorityApps_share = {
        'app://bluetooth.gaiamobile.org/manifest.webapp': 0,
        'app://sms.gaiamobile.org/manifest.webapp': 1,
        'app://email.gaiamobile.org/manifest.webapp': 2
      };
      let highPriorityApps = {};
      if (name === 'pick') {
        highPriorityApps = highPriorityApps_pick;
      } else if (name === 'share') {
        highPriorityApps = highPriorityApps_share;
      }


      // Same length with highPriorityApps,
      // just for avoid circular include circular.
      let items = [0, 0, 0, 0, 0, 0, 0];

      choices.forEach((choice, index) => {
        let app = applications.getByManifestURL(choice.manifest);
        if (!app) {
          return;
        }

        let manifest = choice.manifest;
        let position = highPriorityApps[manifest];
        let item = {
          label: new ManifestHelper(app.manifest).name,
          callback: () => {
            this.choose(index, choices[index].manifest);
          },
          value: index
        };
        if (position !== undefined) {
          items[position] = item;
        } else {
          items.push(item);
        }
      });

      items.forEach((item) => {
        if (item) {
          sortItems.push(item);
        }
      });
      return sortItems;
    }
  };

  exports.Activities = Activities;

}(window));
