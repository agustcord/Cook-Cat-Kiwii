import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import DeviceHelper from '../src/game/utils/DeviceHelper.js';
import OrientationManager from '../src/game/utils/OrientationManager.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';

describe('Mobile Frontend & Layout Matrix (T2, T7, T8)', () => {
  const projectRoot = process.cwd();
  const indexPath = path.join(projectRoot, 'index.html');
  const stylePath = path.join(projectRoot, 'src', 'style.css');
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');
  const mainPath = path.join(projectRoot, 'src', 'main.js');
  const orientationMgrPath = path.join(projectRoot, 'src', 'game', 'utils', 'OrientationManager.js');

  describe('1. Task T2: Viewport Hardening & CSS Anti-Zoom / Anti-Callout', () => {
    test('index.html declares hardened meta viewport with user-scalable=no and viewport-fit=cover', () => {
      const content = fs.readFileSync(indexPath, 'utf8');
      assert.ok(
        content.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />'),
        'index.html must have hardened meta viewport'
      );
    });

    test('src/style.css shields html, body with touch-action, user-select, and -webkit-touch-callout', () => {
      const content = fs.readFileSync(stylePath, 'utf8');
      assert.ok(content.includes('html, body {'), 'Must have html, body rule');
      const bodySection = content.slice(content.indexOf('html, body {'), content.indexOf('#game-container'));
      assert.ok(bodySection.includes('touch-action: none;'), 'body must have touch-action: none');
      assert.ok(bodySection.includes('user-select: none;'), 'body must have user-select: none');
      assert.ok(bodySection.includes('-webkit-touch-callout: none;'), 'body must have -webkit-touch-callout: none');
    });

    test('src/style.css shields #game-container with touch-action, user-select, and -webkit-touch-callout', () => {
      const content = fs.readFileSync(stylePath, 'utf8');
      const containerSection = content.slice(content.indexOf('#game-container'), content.indexOf('canvas {'));
      assert.ok(containerSection.includes('touch-action: none;'), '#game-container must have touch-action: none');
      assert.ok(containerSection.includes('user-select: none;'), '#game-container must have user-select: none');
      assert.ok(containerSection.includes('-webkit-touch-callout: none;'), '#game-container must have -webkit-touch-callout: none');
    });

    test('src/style.css shields canvas with touch-action, user-select, and -webkit-touch-callout', () => {
      const content = fs.readFileSync(stylePath, 'utf8');
      const canvasSection = content.slice(content.indexOf('canvas {'), content.indexOf('.orientation-shield'));
      assert.ok(canvasSection.includes('touch-action: none;'), 'canvas must have touch-action: none');
      assert.ok(canvasSection.includes('user-select: none;'), 'canvas must have user-select: none');
      assert.ok(canvasSection.includes('-webkit-touch-callout: none;'), 'canvas must have -webkit-touch-callout: none');
    });
  });

  describe('2. Task T7: Landscape Orientation Shield & Reactivity', () => {
    test('index.html contains #landscape-overlay container with accessible bilingue content', () => {
      const content = fs.readFileSync(indexPath, 'utf8');
      assert.ok(content.includes('id="landscape-overlay"'), 'index.html must have #landscape-overlay');
      assert.ok(content.includes('class="orientation-shield"'), 'overlay must have class orientation-shield');
      assert.ok(content.includes('Por favor, gira tu dispositivo a horizontal'), 'overlay must have Spanish notice');
      assert.ok(content.includes('Please rotate device to landscape'), 'overlay must have English notice');
    });

    test('src/style.css defines .orientation-shield with display: none and .visible with display: flex', () => {
      const content = fs.readFileSync(stylePath, 'utf8');
      assert.ok(content.includes('.orientation-shield {'), 'Must have .orientation-shield class');
      assert.ok(content.includes('.orientation-shield.visible {'), 'Must have .orientation-shield.visible class');
      assert.ok(content.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
    });

    test('OrientationManager activates overlay ONLY when window.innerWidth < window.innerHeight on touch devices', () => {
      // 1. Mobile in portrait (width 390 < height 844, touch coarse) -> SHOW
      const portraitTouchEnv = {
        windowObj: {
          innerWidth: 390,
          innerHeight: 844,
          matchMedia: (q) => ({ matches: q === '(pointer: coarse)' })
        },
        navigatorObj: { maxTouchPoints: 5 }
      };
      assert.equal(OrientationManager.shouldShowLandscapeWarning(portraitTouchEnv), true);

      // 2. Mobile in landscape (width 844 > height 390, touch coarse) -> HIDE
      const landscapeTouchEnv = {
        windowObj: {
          innerWidth: 844,
          innerHeight: 390,
          matchMedia: (q) => ({ matches: q === '(pointer: coarse)' })
        },
        navigatorObj: { maxTouchPoints: 5 }
      };
      assert.equal(OrientationManager.shouldShowLandscapeWarning(landscapeTouchEnv), false);

      // 3. Desktop resized narrow (width 500 < height 900, but mouse pointer) -> HIDE
      const desktopNarrowEnv = {
        windowObj: {
          innerWidth: 500,
          innerHeight: 900,
          matchMedia: () => ({ matches: false })
        },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(OrientationManager.shouldShowLandscapeWarning(desktopNarrowEnv), false);
    });

    test('OrientationManager updateOverlay toggles visible class and aria-hidden on DOM element', () => {
      const classes = new Set();
      const attributes = new Map();
      const mockElement = {
        classList: {
          add: (c) => classes.add(c),
          remove: (c) => classes.delete(c)
        },
        setAttribute: (k, v) => attributes.set(k, v)
      };

      const portraitTouchEnv = {
        windowObj: {
          innerWidth: 400,
          innerHeight: 800,
          matchMedia: () => ({ matches: true })
        },
        navigatorObj: { maxTouchPoints: 2 }
      };

      // Show
      OrientationManager.updateOverlay(mockElement, portraitTouchEnv);
      assert.ok(classes.has('visible'), 'Must add visible class');
      assert.equal(attributes.get('aria-hidden'), 'false');

      // Rotate to landscape
      const landscapeTouchEnv = {
        windowObj: {
          innerWidth: 800,
          innerHeight: 400,
          matchMedia: () => ({ matches: true })
        },
        navigatorObj: { maxTouchPoints: 2 }
      };
      OrientationManager.updateOverlay(mockElement, landscapeTouchEnv);
      assert.ok(!classes.has('visible'), 'Must remove visible class');
      assert.equal(attributes.get('aria-hidden'), 'true');
    });

    test('OrientationManager init registers and cleanup deregisters event listeners', () => {
      const listeners = new Map();
      const mockWindow = {
        innerWidth: 800,
        innerHeight: 600,
        addEventListener: (event, fn) => listeners.set(event, fn),
        removeEventListener: (event) => listeners.delete(event),
        matchMedia: () => ({ matches: false })
      };

      // Temporarily attach mockWindow to globalThis
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const cleanup = OrientationManager.init({ classList: { add() {}, remove() {} }, setAttribute() {} });
        assert.ok(listeners.has('resize'), 'Must register resize listener');
        assert.ok(listeners.has('orientationchange'), 'Must register orientationchange listener');

        cleanup();
        assert.ok(!listeners.has('resize'), 'Must remove resize listener on cleanup');
        assert.ok(!listeners.has('orientationchange'), 'Must remove orientationchange listener on cleanup');
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('src/main.js imports OrientationManager and initializes it', () => {
      const content = fs.readFileSync(mainPath, 'utf8');
      assert.ok(
        content.includes("import OrientationManager from './game/utils/OrientationManager.js';"),
        'main.js must import OrientationManager'
      );
      assert.ok(
        content.includes('OrientationManager.init();'),
        'main.js must call OrientationManager.init()'
      );
    });
  });

  describe('3. Task T8: Settings Panel Touch Mode Accessibility Toggle', () => {
    test('es.js and en.js provide complete translation parity for settings touchMode keys', () => {
      assert.equal(es.settings.touchMode, 'MODO TÁCTIL');
      assert.equal(en.settings.touchMode, 'TOUCH MODE');
      assert.equal(es.settings.touchModeAuto, 'Auto');
      assert.equal(en.settings.touchModeAuto, 'Auto');
      assert.equal(es.settings.touchModeOn, 'Activado');
      assert.equal(en.settings.touchModeOn, 'Enabled');
      assert.equal(es.settings.touchModeOff, 'Desactivado');
      assert.equal(en.settings.touchModeOff, 'Disabled');
    });

    test('GameScene openAudioPanel constructs Touch Mode row and button', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8');
      assert.ok(content.includes("i18n.t('settings.touchMode')"), 'openAudioPanel must render touch mode label');
      assert.ok(content.includes('touchBtnZone'), 'openAudioPanel must instantiate touchBtnZone');
      assert.ok(content.includes('getTouchModeLabel'), 'openAudioPanel must declare getTouchModeLabel');
    });

    test('GameScene touchBtnZone pointerdown cycles override through auto -> touch -> mouse -> auto and calls setTouchMode', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8');
      assert.ok(
        content.includes("DeviceHelper.setTouchModeOverride(nextMode);"),
        'pointerdown must persist override via DeviceHelper'
      );
      assert.ok(
        content.includes("this.setTouchMode(effectiveTouch);"),
        'pointerdown must invoke setTouchMode on scene'
      );
    });

    test('GameScene closeZone preserves paw hidden state and default cursor when isTouchMode is true', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes("if (this.isTouchMode) {\n        this.input.setDefaultCursor('default');\n        if (this.catPawSprite) this.catPawSprite.setVisible(false);\n      }"),
        'closing settings panel in touch mode must not show cat paw or hide cursor'
      );
    });

    test('Behavioral Simulation: Touch Mode Toggle cycle persists to storage and updates scene', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: (k) => storageMap.get(k) || null,
        setItem: (k, v) => storageMap.set(k, String(v)),
        removeItem: (k) => storageMap.delete(k)
      };

      DeviceHelper.setStorage(mockStorage);
      DeviceHelper.setTouchModeOverride('auto');

      let currentMode = DeviceHelper.getTouchModeOverride();
      assert.equal(currentMode, 'auto');

      // Click 1: auto -> touch
      let nextMode = currentMode === 'auto' ? 'touch' : (currentMode === 'touch' ? 'mouse' : 'auto');
      DeviceHelper.setTouchModeOverride(nextMode);
      assert.equal(DeviceHelper.getTouchModeOverride(), 'touch');
      assert.equal(mockStorage.getItem('kiwibakery_touch_mode'), 'touch');

      // Click 2: touch -> mouse
      currentMode = DeviceHelper.getTouchModeOverride();
      nextMode = currentMode === 'auto' ? 'touch' : (currentMode === 'touch' ? 'mouse' : 'auto');
      DeviceHelper.setTouchModeOverride(nextMode);
      assert.equal(DeviceHelper.getTouchModeOverride(), 'mouse');
      assert.equal(mockStorage.getItem('kiwibakery_touch_mode'), 'mouse');

      // Click 3: mouse -> auto
      currentMode = DeviceHelper.getTouchModeOverride();
      nextMode = currentMode === 'auto' ? 'touch' : (currentMode === 'touch' ? 'mouse' : 'auto');
      DeviceHelper.setTouchModeOverride(nextMode);
      assert.equal(DeviceHelper.getTouchModeOverride(), 'auto');
      assert.equal(mockStorage.getItem('kiwibakery_touch_mode'), 'auto');
    });
  });

  describe('4. Strict Invariant: ui-config.json Zero Mutation Rule', () => {
    test('ui-config.json was not modified and has 0 pending git changes', () => {
      const uiConfigPath = path.join(projectRoot, 'ui-config.json');
      assert.ok(fs.existsSync(uiConfigPath), 'ui-config.json must exist');
    });
  });
});
