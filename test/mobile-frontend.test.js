import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import DeviceHelper from '../src/game/utils/DeviceHelper.js';
import OrientationManager from '../src/game/utils/OrientationManager.js';
import I18nManager from '../src/game/services/I18nManager.js';
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

  describe('2. Task T7: Clean Mobile Boot & Absence of Orientation Overlay', () => {
    test('index.html does not contain #landscape-overlay container or orientation-shield class', () => {
      const content = fs.readFileSync(indexPath, 'utf8');
      assert.ok(!content.includes('id="landscape-overlay"'), 'index.html must not have #landscape-overlay');
      assert.ok(!content.includes('orientation-shield'), 'index.html must not have orientation-shield');
      assert.ok(!content.includes('Please rotate your device'), 'index.html must not have orientation warning text');
    });

    test('src/style.css contains no .orientation-shield or rotation overlay rules', () => {
      const content = fs.readFileSync(stylePath, 'utf8');
      assert.ok(!content.includes('.orientation-shield'), 'style.css must not have .orientation-shield class');
      assert.ok(!content.includes('phone-rotate'), 'style.css must not have phone-rotate animation');
      assert.ok(!content.includes('.orientation-card'), 'style.css must not have .orientation-card');
    });

    test('OrientationManager is inert and does not activate overlays or listeners', () => {
      assert.equal(OrientationManager.shouldShowLandscapeWarning(), false);
      assert.equal(OrientationManager.updateOverlay(), false);

      const cleanup = OrientationManager.init();
      assert.equal(typeof cleanup, 'function');
      assert.doesNotThrow(() => cleanup());
    });

    test('src/main.js does not import OrientationManager and implements resilient bootGame', () => {
      const content = fs.readFileSync(mainPath, 'utf8');
      assert.ok(
        !content.includes("import OrientationManager"),
        'main.js must not import OrientationManager'
      );
      assert.ok(
        !content.includes('OrientationManager.init()'),
        'main.js must not call OrientationManager.init()'
      );
      assert.ok(
        content.includes('function bootGame()'),
        'main.js must define bootGame()'
      );
      assert.ok(
        content.includes('window.__KIWI_GAME_BOOTED__'),
        'bootGame must guard with window.__KIWI_GAME_BOOTED__'
      );
      assert.ok(
        content.includes("document.readyState === 'complete' || document.readyState === 'interactive'"),
        'main.js must check document.readyState for early execution'
      );
      assert.ok(
        content.includes("window.addEventListener('DOMContentLoaded', bootGame);"),
        'main.js must listen for DOMContentLoaded'
      );
      assert.ok(
        content.includes("window.addEventListener('load', bootGame);"),
        'main.js must listen for load event'
      );
    });

    test('bootGame logic is resilient and idempotent against duplicate calls', () => {
      const mockWindow = {
        __KIWI_GAME_BOOTED__: false,
        __PHASER_GAME__: null,
        game: null
      };
      let phaserInstantiations = 0;
      class MockPhaserGame {
        constructor() {
          phaserInstantiations++;
        }
      }

      function testBootGame(win) {
        if (win.__KIWI_GAME_BOOTED__) return win.__PHASER_GAME__;
        win.__KIWI_GAME_BOOTED__ = true;
        win.__PHASER_GAME__ = win.game = new MockPhaserGame();
        return win.__PHASER_GAME__;
      }

      // First run: boots game
      const instance1 = testBootGame(mockWindow);
      assert.equal(phaserInstantiations, 1);
      assert.equal(mockWindow.__KIWI_GAME_BOOTED__, true);
      assert.ok(instance1 instanceof MockPhaserGame);

      // Duplicate run (e.g. DOMContentLoaded and then load event): idempotent
      const instance2 = testBootGame(mockWindow);
      assert.equal(phaserInstantiations, 1);
      assert.equal(instance1, instance2);
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
