'use strict';
(function (exports) {
    var HardwareButtonsBaseState;
    var HardwareButtonsHomeState;
    var HardwareButtonsSleepState;
    var HardwareButtonsVolumeState;
    var HardwareButtonsWakeState;
    var HardwareButtonsScreenshotState;
    var HardwareButtonsKeyPadState;
    var HardwareButtonsLaunchState;
    var HardwareButtonsEndcallState;
    var HardwareButtons = function HardwareButtons() {
        this._started = false;
        this._smskey = 'none';
        this._timer = undefined;
        this._haveKeydown = false;
        this._initStatus = false;
        this._isLongPressPower = false;
    };
    HardwareButtons.STATES = {};
    HardwareButtons.prototype.HOLD_INTERVAL = 1500;
    HardwareButtons.prototype.HOME_INTERVAL = 2000;
    HardwareButtons.prototype.LONG_HOLD_INTERVAL = 1500;
    HardwareButtons.prototype.REPEAT_DELAY = 700;
    HardwareButtons.prototype.REPEAT_INTERVAL = 100;
    HardwareButtons.prototype.name = 'HardwareButtons';
    HardwareButtons.prototype.isPowerkey = false;
    HardwareButtons.prototype.start = function hb_start() {
        if (this._started) {
            throw 'Instance should not be start()\'ed twice.';
        }
        this._started = true;
        this.key = {};
        this.hasKeyDownHandle = null;
        this.keydownTimeStamp = 0;
        this.state = new HardwareButtonsBaseState(this);
        this.browserKeyEventManager = new BrowserKeyEventManager();
        this._turnscreenOnHandle = this.turnscreenOnHandle.bind(this);
        window.addEventListener('mozbrowserbeforekeydown', this);
        window.addEventListener('mozbrowserbeforekeyup', this);
        window.addEventListener('mozbrowserafterkeydown', this);
        window.addEventListener('mozbrowserafterkeyup', this);
        window.addEventListener('keydown', this);
        window.addEventListener('keydown', this._turnscreenOnHandle, true);
        window.addEventListener('keyup', this);
        Service.request('SettingsCore:addObserver', 'keyboard.vibration', (value) => {
            this._vibrationEnabled = value;
        });
        Service.register('handleEvent', this);
        Service.request('SettingsCore:addObserver', 'multifunction.value', (value) => {
            if (value) {
                this._smskey = value;
            }
        });
    };
    HardwareButtons.prototype.stop = function hb_stop() {
        if (!this._started) {
            throw 'Instance was never start()\'ed but stop() is called.';
        }
        this._started = false;
        if (this.state && this.state.exit) {
            this.state.exit();
        }
        this.state = null;
        window.removeEventListener('mozbrowserbeforekeydown', this);
        window.removeEventListener('mozbrowserbeforekeyup', this);
        window.removeEventListener('mozbrowserafterkeydown', this);
        window.removeEventListener('mozbrowserafterkeyup', this);
        window.removeEventListener('keydown', this);
        window.removeEventListener('keydown', this._turnscreenOnHandle, true);
        window.removeEventListener('keyup', this);
    };
    HardwareButtons.prototype.publish = function hb_publish(type, detail) {
        window.dispatchEvent(new CustomEvent(type, {
            bubbles: type === 'home',
            detail: detail
        }));
    };
    HardwareButtons.prototype.setState = function hb_setState(s, type) {
        if (this.state && this.state.exit) {
            this.state.exit(type);
        }
        this.state = new HardwareButtons.STATES[s](this);
        if (this.state && this.state.enter) {
            this.state.enter(type);
        }
    };
    HardwareButtons.prototype.isHeadsetKey = function hb_isHeadsetKey(evt) {
        return (evt.key === 'HeadsetHook' || Service.query('isHeadsetConnected') && (evt.key === 'VolumeUp' || evt.key === 'VolumeDown'));
    };
    HardwareButtons.prototype.screeshotProcess = function hb_screeshotProcess(evt) {
        if (evt.type.indexOf('keydown') >= 0) {
            if (!this.direction) {
                if (evt.key === '*') {
                    this.direction = 'star-button-press';
                } else if (evt.key === '#') {
                    this.direction = 'hash-button-press';
                }
            } else {
                if (evt.key === '*' && this.direction === 'hash-button-press' || evt.key === '#' && this.direction === 'star-button-press') {
                    this.publish('screenshot');
                    this.setState('base');
                }
            }
        } else if (evt.type.indexOf('keyup') >= 0) {
            if (!(evt.key === '*' && this.direction === 'hash-button-press' || evt.key === '#' && this.direction === 'star-button-press')) {
                this.direction = null;
            }
        }
    };
    HardwareButtons.prototype.turnscreenOnHandle = function hb_turnscreenOnHandle(evt) {
        if (this.browserKeyEventManager.screenOff() && !this.isHeadsetKey(evt)) {
            evt.stopPropagation();
            evt.preventDefault();
            Service.request('turnScreenOn', 'power ' + evt.type + ' ' + evt.key);
        }
    }
    HardwareButtons.prototype.recorderLastKeyDown = function hb_recorderLastKeyDown(evt) {
        if (evt.type.includes('keydown') && evt.timeStamp > this.keydownTimeStamp) {
            this.keydownTimeStamp = evt.timeStamp;
            window.clearTimeout(this.hasKeyDownHandle);
            this.hasKeyDownHandle = window.setTimeout(() => {
                this.keydownTimeStamp = 0;
                this.hasKeyDownHandle = null;
            }, 3000);
            this.hasKeyDownHandle = null;
        }
    }
    HardwareButtons.prototype.hasKeyDown = function hb_hasKeyDown(evt) {
        return !!this.keydownTimeStamp;
    }
    HardwareButtons.prototype.handleEvent = function hb_handleEvent(evt) {
        console.log('[system:hardware_button] 1 evt.key:%s, evt.type:%s', evt.key, evt.type);
        this.recorderLastKeyDown(evt);
        if (evt.key === 'Power') {
            console.log('[system:hardware_button]: power key pressed');
            this.isPowerkey = false;
            if (evt.type === 'keydown' || evt.type === 'mozbrowserbeforekeydown') {
                if (evt.type === 'keydown') {
                    this._haveKeydown = true;
                }
                if (evt.type === 'mozbrowserbeforekeydown') {
                    console.log('[system:hardware_button] Only set initStatus in mozbrowserbeforekeydown ');
                    this._initStatus = ScreenManager.screenEnabled;
                }
                this._isLongPressPower = false;
                console.log('[system:hardware_button] Screen _initStatus before keydown : ' + this._initStatus);
                console.log('[system:hardware_button] Screen haveKeydown before keydown : ' + this._haveKeydown);
                console.log('[system:hardware_button] Flag isLongPressPower when keydown is : ' + this._isLongPressPower);
                if (!ScreenManager.screenEnabled) {
                    this.publish('wake');
                    this.setState('wake', 'sleep-button-press');
                }
                if (!this._timer) {
                    this._timer = setTimeout(function () {
                        this.publish('holdsleep');
                        navigator.vibrate(50);
                        this.setState('sleep', 'sleep-button-release');
                        console.log('[system:hardware_button]  long press keydown');
                        this._isLongPressPower = true;
                    }.bind(this), this.LONG_HOLD_INTERVAL);
                }
            } else if (evt.type === 'keyup' || evt.type === 'mozbrowserbeforekeyup') {
                console.log('[system:hardware_button] Screen _initStatus when keyup : ' + this._initStatus);
                console.log('[system:hardware_button] Screen current status when keyup : ' + ScreenManager.screenEnabled);
                console.log('[system:hardware_button] Screen haveKeydown when keyup : ' + this._haveKeydown);
                if (this._timer) {
                    clearTimeout(this._timer);
                    this._timer = undefined;
                    console.log('[system:hardware_button] keyup event  clear long press timeout');
                }
                this._haveKeydown = false;
                console.log('[system:hardware_button] Flag isLongPressPower when keyup is : ' + this._isLongPressPower);
                if (this._initStatus && !this._isLongPressPower) {
                    this.publish('sleep');
                    this.setState('sleep', 'sleep-button-press');
                    console.log('[system:hardware_button] keyup when screen is on');
                }
                this._initStatus = false;
            }
            console.log('[system:hardware_button] powerkey handled, return now');
            return;
        } else {
            this.isPowerkey = true;
        }
        if (this._vibrationEnabled && evt.key !== 'flip' && !(dialerAgent && dialerAgent._callscreenWindow.isActive())) {
            switch (evt.type) {
                case 'mozbrowserbeforekeydown':
                    this.key[evt.key] = evt.type;
                    break;
                case 'keydown':
                    if (this.key[evt.key]) {
                        delete this.key[evt.key];
                    }
                    if (!evt.repeat) {
                        navigator.vibrate(50);
                    }
                    break;
                case 'mozbrowserafterkeydown':
                    if (this.key[evt.key]) {
                        navigator.vibrate(50);
                        delete this.key[evt.key];
                    }
                    break;
            }
        }
        if (evt.type === 'mozbrowserbeforekeydown' && evt.key !== 'flip' && ScreenManager.lidOpened) {
            console.log('kaios:hardware_button 2 turnKeypadBacklightOn request');
            Service.request('turnKeypadBacklightOn');
        }
        this.screeshotProcess(evt);
        var buttonEventType = this.browserKeyEventManager.getButtonEventType(evt);
        if (this.browserKeyEventManager.screenOff() && !this.isHeadsetKey(evt)) {
            evt.preventDefault();
            console.log('kaios:hardware_button 3 turnScreenOn request');
            Service.request('turnScreenOn', 'power ' + evt.type + ' ' + evt.key);
            return;
        }
        if ('mozbrowserbeforekeydown' === evt.type) {
            if ('Backspace' === evt.key && !Service.query('KeyboardManager.isActivated')) {
                this.hometimer = window.setTimeout(() => {
                    if (Service.currentApp && Service.currentApp.origin === 'app://contact.gaiamobile.org') {
                        let keg = new KeyboardEventGenerator();
                        keg.generate(new KeyboardEvent('keydown', {
                            key: 'EndCall'
                        }));
                        keg.generate(new KeyboardEvent('keyup', {
                            key: 'EndCall'
                        }));
                    } else {
                        this.publish('home', {
                            kill: true
                        });
                    }
                }, this.HOME_INTERVAL);
            }
        }
        if (Service.query('canResponseGVA', evt)) {
            clearTimeout(this.assistanttimer);
            this.assistanttimer = window.setTimeout(() => {
                Service.request('launchGVA');
            }, this.HOLD_INTERVAL);
        }
        if (evt.type.indexOf('keyup') >= 0) {
            console.log('kaios:hardware_button 4  keyup');
            clearTimeout(this.hometimer);
            clearTimeout(this.assistanttimer);
            this.hometimer = null;
            this.assistanttimer = null;
        }
        if (!buttonEventType) {
            return;
        }
        this.state.process(buttonEventType);
    };
    HardwareButtons.prototype.shouldLaunchApp = function hb_shouldLaunchApp() {
        const launching = this.launchAppTimer;
        if (!this.launchAppTimer) {
            this.launchAppTimer = setTimeout(() => {
                this.launchAppTimer = null;
            }, 2000);
        }
        return (!launching && InitLogoHandler.finished && (!window.FtuLauncher || !window.FtuLauncher.isFtuRunning()) && Service.query('ScreenManager.lidOpened') !== false && !Service.query('AttentionWindowManager.hasActiveWindow') && !Service.query('locked'));
    };
    HardwareButtonsBaseState = HardwareButtons.STATES.base = function HardwareButtonsBaseState(hb) {
        this.hardwareButtons = hb;
    };
    HardwareButtonsBaseState.prototype.process = function (type) {
        switch (type) {
            case 'home-button-press':
                this.hardwareButtons.setState('home', type);
                return;
            case 'endcall-button-press':
                this.hardwareButtons.setState('endcall', type);
                return;
            case 'sleep-button-press':
                if (ScreenManager.screenEnabled) {
                    this.hardwareButtons.publish('sleep');
                    this.hardwareButtons.setState('sleep', type);
                }
                return;
            case 'sleep-button-release':
                console.log('[system:hardware_button] process : ' + this.hardwareButtons.isPowerkey);
                if (!ScreenManager.screenEnabled) {
                    this.hardwareButtons.publish('wake');
                    this.hardwareButtons.setState('wake', type);
                }
                return;
            case 'arrowup-button-press':
            case 'arrowdown-button-press':
                if (!Service.query('hasVolumeKey') && Service.query('DialerAgent.isAlerting')) {
                    this.hardwareButtons.publish('mute-alert');
                } else {
                    this.hardwareButtons.setState('keypad', type);
                }
                return;
            case 'volume-up-button-press':
            case 'volume-down-button-press':
                if (Service.query('DialerAgent.isAlerting')) {
                    this.hardwareButtons.publish('mute-alert');
                } else {
                    if (!ScreenManager.lidOpened && !navigator.mozPower.extScreenEnabled) {
                        dump(`first volume key event to wake up exteranl screen`);
                        this.hardwareButtons.publish('extscreen-toggle');
                    } else {
                        this.hardwareButtons.setState('volume', type);
                    }
                }
                return;
            case 'hash-button-press':
                this.hardwareButtons.setState('keypad', type);
                if (!Service.query('hasVolumeKey') && Service.query('DialerAgent.isAlerting')) {
                    this.hardwareButtons.publish('mute-alert');
                }
                return;
            case 'flip-button-release':
            case 'flip-button-press':
            case 'browserback-button-press':
            case 'backspace-button-press':
            case 'softleft-button-press':
            case 'softright-button-press':
            case 'enter-button-press':
            case 'arrowup-button-press':
            case 'arrowdown-button-press':
            case '1-button-press':
            case '2-button-press':
            case '3-button-press':
            case '4-button-press':
            case '5-button-press':
            case 'd-button-press':
            case '0-button-press':
            case 'e-button-press':
            case 'i-button-press':
            case 'o-button-press':
            case 'r-button-press':
            case 'w-button-press':
            case 'a-button-press':
            case 'star-button-press':
                this.hardwareButtons.setState('keypad', type);
                return;
            case 'sms-button-press':
            case 'camera-button-press':
                this.hardwareButtons.setState('launch', type);
                return;
            case 'home-button-release':
            case 'volume-up-button-release':
            case 'volume-down-button-release':
                return;
            case 'led-button-press':
                this.hardwareButtons.publish('led-press');
                return;
            case 'a-button-release':
            case 'star-button-release':
            case 'hash-button-release':
            case 'endcall-button-release':
            case 'backspace-button-release':
            case 'softleft-button-release':
            case 'softright-button-release':
            case 'enter-button-release':
            case 'arrowup-button-release':
            case 'arrowdown-button-release':
            case '1-button-release':
            case '2-button-release':
            case '3-button-release':
            case '4-button-release':
            case '5-button-release':
            case '0-button-release':
                return;
        }
        console.error('Unexpected hardware key: ', type);
    };
    HardwareButtonsHomeState = HardwareButtons.STATES.home = function HardwareButtonsHomeState(hb) {
        this.hardwareButtons = hb;
        this.timer = undefined;
    };
    HardwareButtonsHomeState.prototype.enter = function () {
        this.timer = setTimeout(function () {
            this.hardwareButtons.publish('holdhome');
            navigator.vibrate(50);
            this.hardwareButtons.setState('base');
        }.bind(this), 500);
    };
    HardwareButtonsHomeState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    HardwareButtonsHomeState.prototype.process = function (type) {
        switch (type) {
            case 'home-button-release':
                this.hardwareButtons.publish('home');
                navigator.vibrate(50);
                this.hardwareButtons.setState('base', type);
                return;
            case 'volume-up-button-press':
            case 'volume-down-button-press':
            case 'sleep-button-release':
                this.hardwareButtons.publish('wake');
                this.hardwareButtons.setState('wake', type);
                return;
        }
        console.error('Unexpected hardware key: ', type);
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsSleepState = HardwareButtons.STATES.sleep = function HardwareButtonsSleepState(hb) {
        this.hardwareButtons = hb;
        this.timer = undefined;
    };
    HardwareButtonsSleepState.prototype.process = function (type) {
        switch (type) {
            case 'a-button-press':
            case 'star-button-press':
            case '4-button-press':
            case '5-button-press':
            case 'd-button-press':
                this.hardwareButtons.setState('keypad', type);
                return;
            case 'sleep-button-release':
                this.hardwareButtons.publish('wake');
                this.hardwareButtons.setState('wake', type);
                return;
            case 'volume-down-button-press':
                this.hardwareButtons.setState('screenshot', type);
                return;
            case 'volume-up-button-press':
                this.hardwareButtons.setState('volume', type);
                this.hardwareButtons.setState('base', type);
                return;
            case 'home-button-press':
                this.hardwareButtons.publish('wake');
                this.hardwareButtons.setState('wake', type);
                return;
            case 'led-button-press':
                this.hardwareButtons.publish('led-press');
                return;
        }
        console.error('Unexpected hardware key: ', type);
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsVolumeState = HardwareButtons.STATES.volume = function HardwareButtonsVolumeState(hb) {
        this.hardwareButtons = hb;
        this.timer = undefined;
        this.repeating = false;
    };
    HardwareButtonsVolumeState.prototype.repeat = function () {
        this.repeating = true;
        if (this.direction === 'volume-up-button-press') {
            this.hardwareButtons.publish('volumeup');
        } else {
            this.hardwareButtons.publish('volumedown');
        }
        this.timer = setTimeout(this.repeat.bind(this), this.hardwareButtons.REPEAT_INTERVAL);
    };
    HardwareButtonsVolumeState.prototype.enter = function (type) {
        this.direction = type;
        this.repeating = false;
        this.timer = setTimeout(this.repeat.bind(this), this.hardwareButtons.REPEAT_DELAY);
    };
    HardwareButtonsVolumeState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    HardwareButtonsVolumeState.prototype.process = function (type) {
        switch (type) {
            case 'home-button-press':
                this.hardwareButtons.setState('base', type);
                return;
            case 'camera-button-press':
                if (this.direction === 'volume-down-button-press') {
                    this.hardwareButtons.setState('screenshot', type);
                    return;
                }
                break;
            case 'sleep-button-press':
                if (this.direction === 'volume-down-button-press') {
                    this.hardwareButtons.setState('screenshot', type);
                    return;
                }
                this.hardwareButtons.setState('sleep', type);
                return;
            case 'volume-up-button-release':
                if (this.direction === 'volume-up-button-press') {
                    if (!this.repeating) {
                        this.hardwareButtons.publish('volumeup');
                    }
                    this.hardwareButtons.setState('base', type);
                    return;
                }
                break;
            case 'volume-down-button-release':
                if (this.direction === 'volume-down-button-press') {
                    if (!this.repeating) {
                        this.hardwareButtons.publish('volumedown');
                    }
                    this.hardwareButtons.setState('base', type);
                    return;
                }
                break;
            default:
                return;
        }
        console.error('Unexpected hardware key: ', type);
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsWakeState = HardwareButtons.STATES.wake = function HardwareButtonsWakeState(hb) {
        this.hardwareButtons = hb;
        this.timer = undefined;
        this.delegateState = null;
    };
    HardwareButtonsWakeState.prototype.enter = function (type) {
        if (type === 'home-button-press') {
            this.delegateState = new HardwareButtonsHomeState(this.hardwareButtons);
        } else {
            this.delegateState = new HardwareButtonsSleepState(this.hardwareButtons);
        }
        this.timer = setTimeout(function () {
            if (type === 'home-button-press') {
                this.hardwareButtons.publish('holdsleep');
            }
            this.hardwareButtons.setState('base', type);
        }.bind(this), 500);
    };
    HardwareButtonsWakeState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };
    HardwareButtonsWakeState.prototype.process = function (type) {
        switch (type) {
            case 'home-button-release':
            case 'sleep-button-release':
                this.hardwareButtons.setState('base', type);
                return;
            default:
                this.delegateState.process(type);
                return;
        }
    };
    HardwareButtonsScreenshotState = HardwareButtons.STATES.screenshot = function HardwareButtonsScreenshotState(hb) {
        this.hardwareButtons = hb;
        this.timer = undefined;
    };
    HardwareButtonsScreenshotState.prototype.enter = function () {
        this.hardwareButtons.publish('screenshot');
        this.hardwareButtons.setState('base');
    };
    HardwareButtonsScreenshotState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    HardwareButtonsScreenshotState.prototype.process = function (type) {
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsKeyPadState = HardwareButtons.STATES.keypad = function HardwareButtonsKeyPadState(hb) {
        this.hardwareButtons = hb;
    };
    HardwareButtonsKeyPadState.prototype.enter = function (type) {
        this.direction = type;
        this.hardwareButtons.publish(type);
        if ('a-button-press' === type || 'hash-button-press' === type || 'star-button-press' === type || '4-button-press' === type) {
            const eventName = 'hold' + type.split('-')[0];
            this.timer = setTimeout(function () {
                this.hardwareButtons.publish(eventName);
                this.hardwareButtons.setState('base');
            }.bind(this), this.hardwareButtons.HOLD_INTERVAL);
        } else if ((type === '5-button-press' || type === 'd-button-press') && Service.query('isPocketMode')) {
            this.timer = setTimeout(() => {
                this.hardwareButtons.publish('holdSOS');
                this.hardwareButtons.setState('base');
            }, this.hardwareButtons.LONG_HOLD_INTERVAL);
        }
    };
    HardwareButtonsKeyPadState.prototype.process = function (type) {
        var eventType;
        switch (type) {
            case 'a-button-release':
            case 'star-button-release':
            case '4-button-release':
                break;
            case 'flip-button-release':
            case 'flip-button-press':
                this.hardwareButtons.publish(type);
                break;
            case 'browserback-button-release':
            case 'backspace-button-release':
            case 'softleft-button-release':
            case 'softright-button-release':
            case 'enter-button-release':
            case 'arrowup-button-release':
            case 'arrowdown-button-release':
            case '1-button-release':
            case '2-button-release':
            case '3-button-release':
            case '5-button-release':
            case '0-button-release':
            case 'e-button-release':
            case 'i-button-release':
            case 'o-button-release':
            case 'r-button-release':
            case 'w-button-release':
            case 'hash-button-release':
                if (this.direction === 'backspace-button-press' && type === 'backspace-button-release') {
                    let kill = false;
                    if (Service.query('isLowMemoryDevice')) {
                        let app = appWindowManager.getActiveApp();
                        kill = !appWindowManager.isPlayingContent(app);
                    }
                    let frontWindow = Service.query('getTopMostWindow');
                    if (frontWindow.manifest && frontWindow.manifest.name === 'Camera') {
                        kill = true;
                    }
                    this.hardwareButtons.publish('home', {
                        kill: kill,
                        back: true
                    });
                }
                if (type === 'softright-button-release') {
                    if (this.direction !== 'softright-button-press') {
                        break;
                    }
                }
                if (type === 'softleft-button-release') {
                    if (this.direction !== 'softleft-button-press') {
                        break;
                    }
                }
                eventType = type.replace('-button-release', '');
                this.hardwareButtons.publish(eventType);
                break;
            default:
                if (!type || type.indexOf('-press') < 0) {
                    console.error('Unexpected hardware key: ', type);
                }
        }
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsKeyPadState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    HardwareButtonsEndcallState = HardwareButtons.STATES.endcall = function (hb) {
        this.hardwareButtons = hb;
    };
    HardwareButtonsEndcallState.prototype.enter = function (type) {
        this.hardwareButtons.publish(type);
        let interval;
        if (Service.query('hasEndCallKey') && Service.query('getTopMostWindow').isHomescreen) {
            interval = 500;
        } else {
            interval = this.hardwareButtons.LONG_HOLD_INTERVAL;
        }
        this.timer = setTimeout(function () {
            this.hardwareButtons.publish('holdsleep');
            navigator.vibrate(50);
            this.hardwareButtons.setState('base');
        }.bind(this), interval);
    };
    HardwareButtonsEndcallState.prototype.process = function (type) {
        switch (type) {
            case 'endcall-button-release':
                let frontWindow = Service.query('getTopMostWindow');
                if (frontWindow.manifest && frontWindow.manifest.name === 'Contact') {
                    this.hardwareButtons.publish('home', {
                        kill: false
                    });
                } else {
                    this.hardwareButtons.publish('home', {
                        kill: true
                    });
                }
                break;
        }
        this.hardwareButtons.setState('base', type);
    };
    HardwareButtonsEndcallState.prototype.exit = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    HardwareButtonsLaunchState = HardwareButtons.STATES.launch = function HardwareButtonsLaunchState(hb) {
        this.hardwareButtons = hb;
    };
    HardwareButtonsLaunchState.prototype.enter = function (type) {
        this.direction = type;
        this.hardwareButtons.publish(type);
    };
    HardwareButtonsLaunchState.prototype.process = function (type) {
        var name, url;
        switch (type) {
            case 'volume-down-button-press':
                if (this.direction === 'camera-button-press') {
                    this.hardwareButtons.setState('screenshot', type);
                    return;
                }
                break;
            case 'sms-button-release':
                if ((!this.hardwareButtons._smskey) || (this.hardwareButtons._smskey === 'none')) {
                    var activity = new MozActivity({
                        name: 'configure',
                        data: {
                            target: 'device',
                            section: 'multifunction'
                        }
                    });
                } else if (this.hardwareButtons._smskey === 'internetSharing') {
                    var activity = new MozActivity({
                        name: 'configure',
                        data: {
                            target: 'device',
                            section: 'hotspot'
                        }
                    });
                } else {
                    url = 'app://' + this.hardwareButtons._smskey + '.gaiamobile.org';
                    this.hardwareButtons.publish(type);
                }
                break;
            case 'camera-button-release':
                name = type.replace('-button-release', '');
                url = 'app://' + name + '.gaiamobile.org';
                this.hardwareButtons.publish(type);
                break;
            default:
                if (!type || type.indexOf('-press') < 0) {
                    console.error('Unexpected hardware key: ', type);
                }
        }
        if (url && this.hardwareButtons.shouldLaunchApp()) {
            navigator.mozApps.mgmt.getAll().onsuccess = function (event) {
                var apps = event.target.result;
                apps.some((app) => app.origin === url && app.launch());
            };
        }
        this.hardwareButtons.setState('base', type);
    };
    exports.hardwareButtons = new HardwareButtons();
    exports.hardwareButtons.start();
    exports.HardwareButtons = HardwareButtons;
}(window));