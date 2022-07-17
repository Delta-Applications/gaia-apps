/* globals actionList */
'use strict';

var NavigationMap = {
  currentActivatedLength: 0,
  init: function() {
    console.log('NavigationMap Init (CallScreen)');
    document.addEventListener("menuEvent", function(e) {
      NavigationMap.menuIsActive = e.detail.menuVisible;
      if (e.detail.menuVisible) {
        NavigationManager.reset('.menu-button');
      }
    });
  }
};
