'use strict';

let PreloadApp = {
  itemSum : 0,
  PRELOAD_SIZE: 4,

  /**
   * This is template string of list item.
   * If the dom structure of list item is changed, we need to change here too.
   */
  template(c) {
    let getSimIcon = (c) => {
      let icon;
      let simNum = navigator.mozIccManager ? navigator.mozIccManager.iccIds.length : 0;
      if (simNum === 1) {
        icon = `sim-card`;
      } else {
        icon = `sim-card-${c.category.indexOf('SIM0') >= 0 ? '1' : '2'}`;
      }
      return `<i class="icon" data-icon="${icon}"></i>`;
    };

    let simicon = c.category && c.category.indexOf('SIM') >= 0 ? getSimIcon(c) : '';
    let icon = '';
    if (!this.isLowMemoryDevice) {
      if (c.photo && c.photo.length) {
        icon = `<span class="icon photo" data-id="${c.id}"><canvas /></span>`;
      } else {
        icon = '<i class="icon" data-icon="contacts" role="presentation"></i>';
      }
    }

    let name = '';
    if (c.name && c.name[0]) {
      name = c.name[0];
    } else if (c.tel && c.tel[0]) {
      name = c.tel[0].value;
    } else if (c.email && c.email[0]) {
      name = c.email[0].value;
    }

    const favicon = c.category && c.category.includes('favorite') ? '<i class="icon" data-icon="favorite-on"></i>' : '';

    return `<div tabindex="-1" class="list-item" data-type="list" data-id="${c.id}">
      <div class="contact-list-item">
        ${icon}
        <div class="content">
          <div class="primary">
            <a data-l10n-id=${name ? '\'\'' : 'no-name'} href="/contacts/${c.id}">${name}</a>
          </div>
        </div>
        ${simicon}
        ${favicon}
      </div>
    </div>`;
  },

  init() {
    this.ssr = document.getElementById('ssr');
    let hash = window.location.hash;
    if (hash) {
      this.ssr.classList.add('hidden');
      LazyLoader.load('dist/bundle.js', () => {
        console.time('loadreact');
      });
    } else {
      window.addEventListener('DOMContentLoaded', this);
      this.content = document.querySelector('.content-placeholder');
      window.addEventListener('fullyloaded', this);
    }
    this._handle_largetextenabledchanged();
    window.addEventListener('largetextenabledchanged', this);
    window.cachedContacts = [];
  },

  _handle_largetextenabledchanged() {
    document.body.classList.toggle('large-text', navigator.largeTextEnabled);
  },

  handleEvent(evt) {
    switch (evt.type) {
      case 'largetextenabledchanged':
        this._handle_largetextenabledchanged();
        break;
      case 'DOMContentLoaded':
        window.removeEventListener('DOMContentLoaded', this);
        this.render();
        break;
      case 'fullyloaded':
        this.ssr.classList.add('hidden');
        break;
      default:
        break;
    }
  },

  drawPhoto(contact, canvas) {
    if (contact.photo && contact.photo.length) {
      const img = new Image();
      const target = 32;
      let url = URL.createObjectURL(contact.photo[0]);
      let _drawSquare = () => {
        const scalex = img.width / target;
        const scaley = img.height / target;
        const scale = Math.min(scalex, scaley);

        const l = target * scale;
        const x = (img.width - l) / 2;
        const y = (img.height - l) / 2;

        canvas.width = canvas.height = target;
        let context = canvas.getContext('2d', {
          willReadFrequently: true
        });
        context.drawImage(img, x, y, l, l, 0, 0, target, target);
      };

      img.src = url;
      img.onload = () => {
        contact._photoImage = img;
        window.cachedContacts.push(contact);
        _drawSquare();
      };
      img.onerror = () => {
        img.src = '';
        URL.revokeObjectURL(url);
      };
    }
  },

  render() {
    let iceDOM = '';
    // This is first launch.
    // We still need to look at the database to know if there is contact data or not.
    // Step 1: read local storage for ICE.
    // This may not be accurate, but we assume no other apps will change the ice list.
    let ice = window.localStorage.getItem('ice_contacts');
    if (ice) {
      ice = JSON.parse(ice);
      let hasIce = ice.some((c) => { return !!c.id; });
      if (hasIce) {
        this.itemSum += 1;
        iceDOM = '<div tabindex="-1" class="list-item"><i role="presentation" class="icon" data-icon="ice-contacts"></i><div class="content"><div class="primary"><a href="/icelist"><span data-l10n-id="ICEContactsGroup">ICE Contacts</span></a></div></div><i role="presentation" class="icon" data-icon="forward"></i></div>';
      }
    }
    // Step 2: read local storage for favorite
    // This may not be accurate,
    // but we assume no other apps will change the favorite state for mozContact.
    let favoriteDOM = '';
    if (window.localStorage.getItem('hasFavorites')) {
      this.itemSum += 1;
      favoriteDOM = '<div tabindex="-1" class="list-item"><i role="presentation" class="icon icon-list" data-icon="favorite-on"></i><div class="content"><div class="primary"><a href="/favorite"><span data-l10n-id="favorite-contacts">Favorite contacts</span></a></div></div><i role="presentation" class="icon" data-icon="forward"></i></div>';
    }

    // Step 3: read local storage for group
    // This may not be accurate,
    // but we assume no other apps will change the group state for mozContact.
    let groupDOM = '';
    if (window.localStorage.getItem('hasGroups')) {
      this.itemSum += 1;
      groupDOM = '<div tabindex="-1" class="list-item"><i role="presentation" class="icon icon-list" data-icon="group-contacts"></i><div class="content"><div class="primary"><a href="/group"><span data-l10n-id="group">Group</span></a></div></div><i role="presentation" class="icon" data-icon="forward"></i></div>';
    }

    // Step 4: read real contact data.
    const limit = this.PRELOAD_SIZE - this.itemSum;
    if (limit > 0) {
      console.time('loadcontact');
      const category = ({
        'phone': 'DEVICE',
        'sim': 'SIM',
        'phone-and-sim': 'KAICONTACT'
      })[window.localStorage.getItem('memory')] || 'KAICONTACT';

      const options = {
        sortBy: window.localStorage.getItem('sort') || 'givenName',
        sortOrder: 'ascending',
        sortLanguage: navigator.language
      };

      let rendPage = (contacts) => {
        navigator.getFeature('hardware.memory').then((memOnDevice) => {
          this.isLowMemoryDevice = memOnDevice <= 256;
          this.r(contacts, iceDOM, favoriteDOM, groupDOM);
        }).catch((err) => {
          console.info('Error when detecting hardware.memory:', err);
          this.r(contacts, iceDOM, favoriteDOM, groupDOM);
        });
      };

      let accountsShow = window.localStorage.getItem('AccountsShow');
      if (accountsShow) {
        accountsShow = JSON.parse(accountsShow);
      }
      let request = window.navigator.mozContacts.getAll(options);
      let contacts = [];
      request.onsuccess = (e) => {
        const match = e.target.result;
        if (match) {
          if (match.category.indexOf(category) > -1) {
            let bShow = true;
            if (accountsShow) {
              const index = match.category.indexOf('ACCOUNT');
              if (index > -1) {
                bShow = accountsShow[match.category[index + 1]];
              }
            }
            if (bShow) {
              contacts.push(match);
            }
            if (contacts.length < limit) {
              request.continue();
            } else {
              rendPage(contacts);
            }
          } else {
            request.continue();
          }
        } else {
          rendPage(contacts);
        }
      };

      request.onerror = () => {
        // Show loading SIM contacts page when get 'Busy' error.
        // When all SIM contacts are loaded, we will get 'refreshed'
        // change message, and then we can load and show all contacts.
        if ('Busy' === request.error.name) {
          this.content.innerHTML = `<div class="list-all">
            <div class="main-list">
              <div class="contact-list">
                <div class="list-items">
                  <div class="loading-contacts primary">
                    <div data-l10n-id="reading-contacts"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="header-progress" />
          </div>
          `;
          navigator.mozContacts.addEventListener('contactchange', function handler(evt) {
            if (evt.reason === 'refreshed') {
              navigator.mozContacts.removeEventListener('contactchange', handler);
              PreloadApp.load();
            }
          });
        }
      };
    } else {
      navigator.mozL10n.once(() => {
        this.r(null, iceDOM, favoriteDOM, groupDOM);
      });
    }
  },

  r(contacts, iceDOM, favoriteDOM, groupDOM) {
    let str = '';
    let searchstr = `<div class="search-container"><div data-index="0" data-type="input" tabindex="-1" class="list-item input-item focus"><div class="content"><input id="fake-search" placeholder="${navigator.mozL10n.get('search')}" class="navigable primary" type="text"></div></div></div>`;
    if (contacts) {
      for (let i = 0; i < contacts.length; i++) {
        str += this.template(contacts[i]);
      }
      if (!str) {
        document.getElementById('fake-settings-button').classList.remove('hidden');
        document.getElementById('fake-new-button').classList.remove('hidden');
        str = groupDOM ? '' : '<div class="no-result primary" is="null"><div data-l10n-id="start-adding" is="null"></div></div>';
        searchstr = '';
      }
    }

    let content = this.content;
    content.innerHTML = `${searchstr}
      <div class="list-all">
        ${iceDOM}${favoriteDOM}${groupDOM}
        <div class="main-list">
          <div class="contact-list">
            <div class="list-items">
              ${str}
            </div>
          </div>
        </div>
      </div>
      `;
    let search = document.querySelector('.search-container input');
    if (search) {
      search.focus();
      search.addEventListener('input', () => {
        window._search_cache = search.value;
      });
    } else {
      this.noSearch = true;
    }
    console.timeEnd('loadcontact');

    // draw photo after canvas rendered
    !this.isLowMemoryDevice && contacts && contacts.forEach((c) => {
      this.drawPhoto(c, document.querySelector(`.photo[data-id='${c.id}'] canvas`));
    });

    this.load();
  },

  load() {
    window.performance && window.performance.mark('visuallyLoaded');
    window.requestAnimationFrame(() => {
      const DELAY = !this.noSearch ? 500 : 0;
      setTimeout(() => {
        LazyLoader.load('dist/bundle.js', () => {
          console.time('loadreact');
        });
      }, DELAY);
    });
  }
};

PreloadApp.init();
