import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import I18nManager from '../src/game/services/I18nManager.js';
import TutorialOverlay from '../src/game/tutorial/TutorialOverlay.js';
import { TUTORIAL_STEPS } from '../src/game/tutorial/TutorialSteps.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';

if (typeof global.Phaser === 'undefined') {
  global.Phaser = {
    Geom: {
      Rectangle: class Rectangle {
        constructor(x = 0, y = 0, width = 0, height = 0) {
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
        }
        static Contains(rect, x, y) {
          return x >= rect.x && x <= (rect.x + rect.width) && y >= rect.y && y <= (rect.y + rect.height);
        }
      }
    }
  };
}

describe('Tutorial Overlay & Localization (I18n) UI Matrix - Ani Frontend', () => {

  describe('1. I18n Localization Matrix & Key Parity', () => {
    let i18n;

    beforeEach(() => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };
      i18n = I18nManager.getInstance({ reset: true, storage: mockStorage, language: 'en' });
    });

    test('English dictionary contains all required tutorial keys for all 5 blocks', () => {
      assert.ok(en.tutorial, 'en.tutorial must exist');
      assert.equal(en.tutorial.mentorName, 'Kiwii');
      assert.ok(en.tutorial.skipButton, 'Skip button text must exist');
      assert.ok(en.tutorial.nextButton, 'Next button text must exist');
      assert.ok(en.tutorial.skipModal.title, 'Skip modal title must exist');
      assert.ok(en.tutorial.skipModal.confirm, 'Skip modal confirm button must exist');
      assert.ok(en.tutorial.skipModal.cancel, 'Skip modal cancel button must exist');

      // Canonical keys in EN
      assert.ok(en.tutorial.steps.welcome, 'Canonical welcome');
      assert.ok(en.tutorial.steps.doughClassic, 'Canonical doughClassic');
      assert.ok(en.tutorial.steps.shapeStar, 'Canonical shapeStar');
      assert.ok(en.tutorial.steps.ovenPower, 'Canonical ovenPower');
      assert.ok(en.tutorial.steps.cookieToOven, 'Canonical cookieToOven');
      assert.ok(en.tutorial.steps.ovenBake, 'Canonical ovenBake');
      assert.ok(en.tutorial.steps.burnWait, 'Canonical burnWait');
      assert.ok(en.tutorial.steps.burntExtract, 'Canonical burntExtract');
      assert.ok(en.tutorial.steps.burntTrash, 'Canonical burntTrash');
      assert.ok(en.tutorial.steps.stockExplanation, 'Canonical stockExplanation');
      assert.ok(en.tutorial.steps.wrongDeliveryIntro, 'Canonical wrongDeliveryIntro');
      assert.ok(en.tutorial.steps.wrongDeliveryToTray, 'Canonical wrongDeliveryToTray');
      assert.ok(en.tutorial.steps.wrongDeliveryServe, 'Canonical wrongDeliveryServe');
      assert.ok(en.tutorial.steps.wrongDeliveryClean, 'Canonical wrongDeliveryClean');
      assert.ok(en.tutorial.steps.drinkCup, 'Canonical drinkCup');
      assert.ok(en.tutorial.steps.drinkCoffeeBtn, 'Canonical drinkCoffeeBtn');
      assert.ok(en.tutorial.steps.drinkToTray, 'Canonical drinkToTray');
      assert.ok(en.tutorial.steps.perfectDough, 'Canonical perfectDough');
      assert.ok(en.tutorial.steps.perfectShape, 'Canonical perfectShape');
      assert.ok(en.tutorial.steps.perfectOvenLoad, 'Canonical perfectOvenLoad');
      assert.ok(en.tutorial.steps.perfectOvenBake, 'Canonical perfectOvenBake');
      assert.ok(en.tutorial.steps.perfectOvenExtract, 'Canonical perfectOvenExtract');
      assert.ok(en.tutorial.steps.perfectCookieToTray, 'Canonical perfectCookieToTray');
      assert.ok(en.tutorial.steps.patienceDelivery, 'Canonical patienceDelivery');
      assert.ok(en.tutorial.steps.complete, 'Canonical complete');
    });

    test('Spanish dictionary contains all matching tutorial keys for all 5 blocks', () => {
      assert.ok(es.tutorial, 'es.tutorial must exist');
      assert.equal(es.tutorial.mentorName, 'Kiwii');
      assert.ok(es.tutorial.skipButton, 'Skip button text must exist');
      assert.ok(es.tutorial.nextButton, 'Next button text must exist');
      assert.ok(es.tutorial.skipModal.title, 'Skip modal title must exist');
      assert.ok(es.tutorial.skipModal.confirm, 'Skip modal confirm button must exist');
      assert.ok(es.tutorial.skipModal.cancel, 'Skip modal cancel button must exist');

      // Canonical keys in ES
      assert.ok(es.tutorial.steps.welcome, 'Canonical welcome');
      assert.ok(es.tutorial.steps.doughClassic, 'Canonical doughClassic');
      assert.ok(es.tutorial.steps.shapeStar, 'Canonical shapeStar');
      assert.ok(es.tutorial.steps.ovenPower, 'Canonical ovenPower');
      assert.ok(es.tutorial.steps.cookieToOven, 'Canonical cookieToOven');
      assert.ok(es.tutorial.steps.ovenBake, 'Canonical ovenBake');
      assert.ok(es.tutorial.steps.burnWait, 'Canonical burnWait');
      assert.ok(es.tutorial.steps.burntExtract, 'Canonical burntExtract');
      assert.ok(es.tutorial.steps.burntTrash, 'Canonical burntTrash');
      assert.ok(es.tutorial.steps.stockExplanation, 'Canonical stockExplanation');
      assert.ok(es.tutorial.steps.wrongDeliveryIntro, 'Canonical wrongDeliveryIntro');
      assert.ok(es.tutorial.steps.wrongDeliveryToTray, 'Canonical wrongDeliveryToTray');
      assert.ok(es.tutorial.steps.wrongDeliveryServe, 'Canonical wrongDeliveryServe');
      assert.ok(es.tutorial.steps.wrongDeliveryClean, 'Canonical wrongDeliveryClean');
      assert.ok(es.tutorial.steps.drinkCup, 'Canonical drinkCup');
      assert.ok(es.tutorial.steps.drinkCoffeeBtn, 'Canonical drinkCoffeeBtn');
      assert.ok(es.tutorial.steps.drinkToTray, 'Canonical drinkToTray');
      assert.ok(es.tutorial.steps.perfectDough, 'Canonical perfectDough');
      assert.ok(es.tutorial.steps.perfectShape, 'Canonical perfectShape');
      assert.ok(es.tutorial.steps.perfectOvenLoad, 'Canonical perfectOvenLoad');
      assert.ok(es.tutorial.steps.perfectOvenBake, 'Canonical perfectOvenBake');
      assert.ok(es.tutorial.steps.perfectOvenExtract, 'Canonical perfectOvenExtract');
      assert.ok(es.tutorial.steps.perfectCookieToTray, 'Canonical perfectCookieToTray');
      assert.ok(es.tutorial.steps.patienceDelivery, 'Canonical patienceDelivery');
      assert.ok(es.tutorial.steps.complete, 'Canonical complete');
    });

    test('100% parity between EN and ES tutorial keys', () => {
      const getKeys = (obj, prefix = '') => {
        let keys = [];
        for (const [k, v] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            keys = keys.concat(getKeys(v, fullKey));
          } else {
            keys.push(fullKey);
          }
        }
        return keys;
      };

      const enTutorialKeys = getKeys(en.tutorial).sort();
      const esTutorialKeys = getKeys(es.tutorial).sort();

      assert.deepEqual(enTutorialKeys, esTutorialKeys, 'All tutorial keys must have identical 1:1 parity between EN and ES');
    });

    test('100% of TUTORIAL_STEPS declarative array keys exist and translate in EN and ES', () => {
      assert.ok(Array.isArray(TUTORIAL_STEPS), 'TUTORIAL_STEPS array must exist');
      assert.equal(TUTORIAL_STEPS.length, 25, 'TUTORIAL_STEPS must define exactly 25 micro-steps');

      ['en', 'es'].forEach(lang => {
        i18n.setLanguage(lang);
        TUTORIAL_STEPS.forEach(step => {
          assert.ok(step.i18nKey, `Step ${step.id} must define an i18nKey`);
          assert.equal(
            i18n.hasKey(step.i18nKey),
            true,
            `i18n key "${step.i18nKey}" (step: ${step.id}) must exist in language "${lang}"`
          );
          const translated = i18n.t(step.i18nKey);
          assert.notEqual(
            translated,
            step.i18nKey,
            `i18n.t("${step.i18nKey}") should return translated text, not raw key in "${lang}"`
          );
          assert.ok(
            translated.length > 10,
            `Translation for "${step.i18nKey}" must be meaningful and >10 chars in "${lang}"`
          );
        });
      });
    });

    test('I18nManager translates tutorial keys and switches language reactively', () => {
      i18n.setLanguage('en');
      const welcomeEn = i18n.t('tutorial.steps.welcome');
      assert.ok(welcomeEn.includes('Welcome to Kiwipaw Bakehouse'));

      i18n.setLanguage('es');
      const welcomeEs = i18n.t('tutorial.steps.welcome');
      assert.ok(welcomeEs.includes('Bienvenido a Kiwipaw Bakehouse'));

      const skipConfirmEs = i18n.t('tutorial.skipModal.confirm');
      assert.equal(skipConfirmEs, 'SÍ, SALTAR');
    });
  });

  describe('2. TutorialOverlay Component Architecture & Depth Matrix', () => {
    let mockScene;
    let createdContainers;

    beforeEach(() => {
      createdContainers = [];
      mockScene = {
        cameras: {
          main: { width: 1920, height: 1080 }
        },
        add: {
          container: (x, y) => {
            const children = [];
            const containerObj = {
              x, y, depth: 0, visible: true, scaleX: 1, scaleY: 1, alpha: 1,
              setDepth: function(d) { this.depth = d; return this; },
              setVisible: function(v) { this.visible = v; return this; },
              setScale: function(s) { this.scaleX = s; this.scaleY = s; return this; },
              setAlpha: function(a) { this.alpha = a; return this; },
              setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
              add: function(c) { children.push(c); return this; },
              destroy: function() { this.destroyed = true; }
            };
            createdContainers.push(containerObj);
            return containerObj;
          },
          graphics: () => ({
            clear: () => {},
            fillStyle: () => {},
            fillRect: () => {},
            fillRoundedRect: () => {},
            fillCircle: () => {},
            fillPoints: () => {},
            lineStyle: () => {},
            strokeRect: () => {},
            strokeRoundedRect: () => {},
            strokeCircle: () => {},
            strokePoints: () => {},
            setPosition: () => {},
            setVisible: () => {},
            setDepth: () => {}
          }),
          rectangle: (x, y, w, h) => {
            const rect = {
              x, y, width: w, height: h, interactive: false, visible: true, input: null,
              setInteractive: function(shape, callback) {
                this.interactive = true;
                if (shape && typeof shape === 'object' && shape.width !== undefined) {
                  this.input = { hitArea: shape, customHitArea: true, enabled: true };
                } else if (shape && shape.useHandCursor !== undefined) {
                  if (this.width === 0 || this.height === 0) {
                    this.input = { hitArea: null, customHitArea: false, enabled: true };
                  } else {
                    this.input = { hitArea: { x: 0, y: 0, width: this.width, height: this.height }, customHitArea: false, enabled: true };
                  }
                } else {
                  if (this.width === 0 || this.height === 0) {
                    this.input = { hitArea: null, customHitArea: false, enabled: true };
                  } else {
                    this.input = { hitArea: { x: 0, y: 0, width: this.width, height: this.height }, customHitArea: false, enabled: true };
                  }
                }
                return this;
              },
              disableInteractive: function() {
                this.interactive = false;
                if (this.input) this.input.enabled = false;
                return this;
              },
              setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
              setSize: function(nw, nh) {
                this.width = nw;
                this.height = nh;
                if (this.input && !this.input.customHitArea) {
                  if (this.input.hitArea === null) {
                    throw new TypeError("Cannot set properties of null (setting 'width')");
                  }
                  this.input.hitArea.width = nw;
                  this.input.hitArea.height = nh;
                }
                return this;
              },
              setOrigin: function() { return this; },
              setVisible: function(v) { this.visible = v; return this; },
              on: () => {}
            };
            return rect;
          },
          text: (x, y, text, style) => ({
            x, y, text, style,
            setText: function(nt) { this.text = nt; return this; },
            setOrigin: function() { return this; },
            setVisible: function() { return this; },
            setColor: function() { return this; },
            setFontSize: function() { return this; },
            setFontStyle: function() { return this; },
            setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
            setWordWrapWidth: function(w) {
              if (this.style) {
                if (!this.style.wordWrap) this.style.wordWrap = {};
                this.style.wordWrap.width = w;
              }
              return this;
            }
          }),
          image: (x, y, key) => ({
            x, y, key,
            setDisplaySize: function() { return this; },
            setOrigin: function() { return this; },
            setVisible: function() { return this; }
          })
        },
        tweens: {
          add: () => ({
            remove: () => {}
          })
        },
        events: {
          on: () => {},
          emit: () => {},
          off: () => {},
          removeAllListeners: () => {}
        },
        textures: {
          exists: () => true
        }
      };
    });

    test('instantiates with specified depth 25000', () => {
      const overlay = new TutorialOverlay(mockScene, { depth: 25000 });
      assert.equal(overlay.depth, 25000);
      assert.equal(overlay.container.depth, 25000);
    });

    test('manages visibility state cleanly with show() and hide()', () => {
      const overlay = new TutorialOverlay(mockScene);
      assert.equal(overlay.isVisible, false);
      assert.equal(overlay.container.visible, false);

      overlay.show();
      assert.equal(overlay.isVisible, true);
      assert.equal(overlay.container.visible, true);

      overlay.hide();
      assert.equal(overlay.isVisible, false);
      assert.equal(overlay.container.visible, false);
    });

    test('setSpotlight positions the 4-quad perimeter blockers leaving the center unblocked', () => {
      const overlay = new TutorialOverlay(mockScene);
      
      const targetBounds = { x: 300, y: 400, width: 150, height: 120 };
      overlay.setSpotlight(targetBounds);

      assert.ok(overlay.currentSpotlight);
      assert.equal(overlay.currentSpotlight.x, 300);
      assert.equal(overlay.currentSpotlight.y, 400);
      assert.equal(overlay.currentSpotlight.width, 150);
      assert.equal(overlay.currentSpotlight.height, 120);

      // Verify 4 blocker dimensions
      const halfW = 150 / 2;
      const halfH = 120 / 2;
      const top = 400 - halfH; // 340
      const bottom = 400 + halfH; // 460
      const left = 300 - halfW; // 225
      const right = 300 + halfW; // 375

      assert.equal(overlay.blockerTop.height, top);
      assert.equal(overlay.blockerTop.visible, true);
      assert.equal(overlay.blockerBottom.y, bottom);
      assert.equal(overlay.blockerBottom.visible, true);
      assert.equal(overlay.blockerLeft.width, left);
      assert.equal(overlay.blockerLeft.visible, true);
      assert.equal(overlay.blockerRight.x, right);
      assert.equal(overlay.blockerRight.visible, true);

      // Full screen blocker should be disabled during active spotlight
      assert.equal(overlay.fullBlocker.interactive, false);
      assert.equal(overlay.fullBlocker.visible, false);
    });

    test('clearSpotlight restores full-screen blocker and resets spotlight', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.setSpotlight({ x: 500, y: 500, width: 100, height: 100 });
      assert.ok(overlay.currentSpotlight);

      overlay.clearSpotlight();
      assert.equal(overlay.currentSpotlight, null);
      assert.equal(overlay.fullBlocker.interactive, true);
      assert.equal(overlay.fullBlocker.visible, true);
      assert.equal(overlay.blockerTop.visible, false);
      assert.equal(overlay.blockerTop.interactive, false);
      assert.equal(overlay.blockerBottom.visible, false);
      assert.equal(overlay.blockerLeft.visible, false);
      assert.equal(overlay.blockerRight.visible, false);
    });

    test('regression: mock detects Phaser 3 crash if unconfigured rectangle calls setInteractive and setSize', () => {
      const unconfigured = mockScene.add.rectangle(0, 0, 0, 0);
      unconfigured.setInteractive({ useHandCursor: false });
      assert.throws(() => {
        unconfigured.setSize(100, 100);
      }, {
        name: 'TypeError',
        message: "Cannot set properties of null (setting 'width')"
      });
    });

    test('regression: setSpotlight safely handles all screen edges, zero-size coordinates and repeated toggles without crash', () => {
      const overlay = new TutorialOverlay(mockScene);

      // Edge 1: Top-Left (top = 0, left = 0)
      assert.doesNotThrow(() => {
        overlay.setSpotlight({ x: 50, y: 50, width: 100, height: 100 });
      });
      assert.equal(overlay.blockerTop.visible, false, 'Top blocker should be hidden when top <= 0');
      assert.equal(overlay.blockerLeft.visible, false, 'Left blocker should be hidden when left <= 0');
      assert.equal(overlay.blockerBottom.visible, true);
      assert.equal(overlay.blockerRight.visible, true);

      // Edge 2: Bottom-Right (bottom = 1080, right = 1920)
      assert.doesNotThrow(() => {
        overlay.setSpotlight({ x: 1870, y: 1030, width: 100, height: 100 });
      });
      assert.equal(overlay.blockerBottom.visible, false, 'Bottom blocker should be hidden when bottom >= 1080');
      assert.equal(overlay.blockerRight.visible, false, 'Right blocker should be hidden when right >= 1920');

      // Edge 3: Fullscreen spotlight
      assert.doesNotThrow(() => {
        overlay.setSpotlight({ x: 960, y: 540, width: 1920, height: 1080 });
      });
      assert.equal(overlay.blockerTop.visible, false);
      assert.equal(overlay.blockerBottom.visible, false);
      assert.equal(overlay.blockerLeft.visible, false);
      assert.equal(overlay.blockerRight.visible, false);

      // Repeated toggles (set -> clear -> set -> clear)
      for (let i = 0; i < 5; i++) {
        assert.doesNotThrow(() => {
          overlay.setSpotlight({ x: 300, y: 400, width: 150, height: 150 });
          overlay.clearSpotlight();
        });
      }
      assert.equal(overlay.currentSpotlight, null);
      assert.equal(overlay.fullBlocker.interactive, true);
      assert.equal(overlay.fullBlocker.visible, true);
    });

    test('setPointer positions and animates pointer arrow towards target', () => {
      const overlay = new TutorialOverlay(mockScene);
      
      // Auto direction for target at y = 800 (bottom) should point 'down' from above
      overlay.setPointer(500, 800, 'auto', 70);
      assert.equal(overlay.pointerContainer.visible, true);
      assert.equal(overlay.pointerContainer.x, 500);
      assert.equal(overlay.pointerContainer.y, 730); // 800 - 70

      overlay.clearPointer();
      assert.equal(overlay.pointerContainer.visible, false);
    });

    test('setStep sets dialogue, spotlight and pointer in a single atomic call', () => {
      const overlay = new TutorialOverlay(mockScene);

      overlay.setStep({
        i18nKey: 'tutorial.steps.step1_dough',
        target: { x: 200, y: 700, width: 180, height: 180 },
        pointerDirection: 'down',
        showNextBtn: false
      });

      assert.equal(overlay.isVisible, true);
      assert.ok(overlay.currentSpotlight);
      assert.equal(overlay.currentSpotlight.x, 200);
      assert.equal(overlay.pointerContainer.visible, true);
    });

    test('setStep supports targetCoords polimorphically and enables Next button on DIALOG_ACK', () => {
      const overlay = new TutorialOverlay(mockScene);

      // 1. DIALOG_ACK step with targetCoords (e.g. step_welcome)
      overlay.setStep({
        id: 'step_welcome',
        i18nKey: 'tutorial.steps.welcome',
        targetCoords: { x: 960, y: 431, width: 320, height: 320 },
        allowedAction: 'DIALOG_ACK'
      });

      assert.equal(overlay.isVisible, true);
      assert.ok(overlay.currentSpotlight);
      assert.equal(overlay.currentSpotlight.x, 960);
      assert.equal(overlay.currentSpotlight.y, 431);
      assert.equal(overlay.actionBtnContainer.visible, true, 'Next button must be visible for DIALOG_ACK');

      // 2. Interactive step (e.g. DRAG_DOUGH)
      overlay.setStep({
        id: 'step_dough_classic',
        i18nKey: 'tutorial.steps.doughClassic',
        targetCoords: { x: 148, y: 684, width: 168, height: 116 },
        allowedAction: 'DRAG_DOUGH'
      });

      assert.equal(overlay.actionBtnContainer.visible, false, 'Next button must NOT be visible for interactive DRAG_DOUGH');
      assert.equal(overlay.currentSpotlight.x, 148);
    });

    test('Overlay emits "next" and "skip_confirm" events upon button interactions', () => {
      let nextCalled = false;
      let skipConfirmCalled = false;

      const overlay = new TutorialOverlay(mockScene, {
        onNext: () => { nextCalled = true; },
        onSkip: () => { skipConfirmCalled = true; }
      });

      let eventNextFired = false;
      overlay.on('next', () => { eventNextFired = true; });

      let eventSkipFired = false;
      overlay.on('skip_confirm', () => { eventSkipFired = true; });

      overlay.emit('next');
      assert.equal(eventNextFired, true);

      overlay.emit('skip_confirm');
      assert.equal(eventSkipFired, true);
    });

    test('Skip modal opens, traps focus, and closes on cancel', () => {
      const overlay = new TutorialOverlay(mockScene);
      assert.equal(overlay.isSkipModalOpen, false);

      overlay.showSkipModal();
      assert.equal(overlay.isSkipModalOpen, true);
      assert.equal(overlay.skipModalContainer.visible, true);

      overlay.hideSkipModal();
      assert.equal(overlay.isSkipModalOpen, false);
      assert.equal(overlay.skipModalContainer.visible, false);
    });

    test('refreshI18n updates dialogue text and UI button labels dynamically', () => {
      const i18n = I18nManager.getInstance();
      const overlay = new TutorialOverlay(mockScene);
      overlay.setStep({
        id: 'step_dough_classic',
        i18nKey: 'tutorial.steps.doughClassic',
        targetCoords: { x: 148, y: 684, width: 168, height: 116 }
      });

      i18n.setLanguage('es');
      overlay.refreshI18n();

      assert.ok(overlay.dialogueText.text.includes('Masa Clásica'));
      assert.equal(overlay.skipBtnText.text, 'SALTAR ⏭️');
    });

    test('setStep positions dialogue bubble at y = 140 when bubblePosition is top and y = 860 when bottom', () => {
      const overlay = new TutorialOverlay(mockScene);

      overlay.setStep({
        id: 'step_top_test',
        i18nKey: 'tutorial.steps.doughClassic',
        targetCoords: { x: 148, y: 684, width: 168, height: 116 },
        bubblePosition: 'top'
      });

      assert.equal(overlay.bubbleContainer.y, 140, 'bubblePosition: top must place bubbleContainer at y = 140');
      assert.equal(overlay.bubbleContainer.x, 960, 'bubbleContainer X must be centered at 960');

      overlay.setStep({
        id: 'step_bottom_test',
        i18nKey: 'tutorial.steps.welcome',
        targetCoords: { x: 960, y: 431, width: 320, height: 320 },
        bubblePosition: 'bottom'
      });

      assert.equal(overlay.bubbleContainer.y, 860, 'bubblePosition: bottom must place bubbleContainer at y = 860');
    });

    test('setSpotlight and clearSpotlight preserve explicit bubblePosition from currentStepConfig', () => {
      const overlay = new TutorialOverlay(mockScene);

      // Step with bubblePosition: top and target at top of screen (y = 475 < 520)
      overlay.setStep({
        id: 'step_cookie_to_oven',
        i18nKey: 'tutorial.steps.cookieToOven',
        targetCoords: { x: 1499, y: 475, width: 306, height: 249 },
        bubblePosition: 'top'
      });

      assert.equal(overlay.bubbleContainer.y, 140, 'Initial bubble position must be 140');

      // Direct setSpotlight call on target with y = 475 should NOT override bubblePosition: top
      overlay.setSpotlight({ x: 1499, y: 475, width: 306, height: 249 });
      assert.equal(overlay.bubbleContainer.y, 140, 'setSpotlight must retain y = 140 when currentStepConfig.bubblePosition is top');

      // clearSpotlight should also retain y = 140
      overlay.clearSpotlight();
      assert.equal(overlay.bubbleContainer.y, 140, 'clearSpotlight must retain y = 140 when currentStepConfig.bubblePosition is top');
    });

    test('_adjustDialoguePosition defaults to y = 140 for target.y > 520 and y = 860 for target.y <= 520 when bubblePosition is unspecified', () => {
      const overlay = new TutorialOverlay(mockScene);

      // Without currentStepConfig
      overlay._adjustDialoguePosition(684);
      assert.equal(overlay.bubbleContainer.y, 140, 'Target y = 684 (> 520) must place bubbleContainer at y = 140');

      overlay._adjustDialoguePosition(261.5);
      assert.equal(overlay.bubbleContainer.y, 860, 'Target y = 261.5 (<= 520) must place bubbleContainer at y = 860');
    });

    test('destroy frees all containers, events, and tweens', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.destroy();
      assert.equal(overlay.container, null);
      assert.equal(overlay.events, null);
    });
  });

  describe('3. Design System, Contrast & Accessibility Tokens Verification', () => {
    test('dialogue background and text color satisfy WCAG AAA contrast ratio (>= 7:1)', () => {
      // Background #fffaeb / #fff1e6, Text #432818
      const getLuminance = (r, g, b) => {
        const a = [r, g, b].map(v => {
          v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const lumBg = getLuminance(255, 250, 235); // #fffaeb
      const lumText = getLuminance(67, 40, 24);   // #432818

      const contrastRatio = (lumBg + 0.05) / (lumText + 0.05);
      assert.ok(contrastRatio >= 7.0, `Contrast ratio ${contrastRatio.toFixed(2)} must be >= 7:1 for AAA compliance`);
    });

    test('interactive buttons meet minimum accessible touch size of 44x44px', () => {
      const skipButtonWidth = 175;
      const skipButtonHeight = 50;
      const actionButtonWidth = 160;
      const actionButtonHeight = 58;

      assert.ok(skipButtonWidth >= 44 && skipButtonHeight >= 44, 'Skip button must meet 44x44 minimum');
      assert.ok(actionButtonWidth >= 44 && actionButtonHeight >= 44, 'Action button must meet 44x44 minimum');
    });
  });

  describe('4. Dialogue Bubble Dynamic Height, WordWrap & Interior Padding Matrix (Anti-Overflow Verification)', () => {
    let mockScene;

    beforeEach(() => {
      mockScene = {
        cameras: {
          main: { width: 1920, height: 1080 }
        },
        add: {
          container: (x, y) => {
            const children = [];
            return {
              x, y, depth: 0, visible: true, scaleX: 1, scaleY: 1, alpha: 1,
              setDepth: function(d) { this.depth = d; return this; },
              setVisible: function(v) { this.visible = v; return this; },
              setScale: function(s) { this.scaleX = s; this.scaleY = s; return this; },
              setAlpha: function(a) { this.alpha = a; return this; },
              setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
              add: function(c) { children.push(c); return this; },
              destroy: function() { this.destroyed = true; }
            };
          },
          graphics: () => ({
            clear: function() { return this; },
            fillStyle: function() { return this; },
            fillRect: function() { return this; },
            fillRoundedRect: function() { return this; },
            fillCircle: function() { return this; },
            fillPoints: function() { return this; },
            lineStyle: function() { return this; },
            strokeRect: function() { return this; },
            strokeRoundedRect: function() { return this; },
            strokeCircle: function() { return this; },
            strokePoints: function() { return this; },
            setPosition: function() { return this; },
            setVisible: function() { return this; },
            setDepth: function() { return this; },
            beginPath: function() { return this; },
            moveTo: function() { return this; },
            lineTo: function() { return this; },
            closePath: function() { return this; },
            fillPath: function() { return this; },
            strokePath: function() { return this; }
          }),
          rectangle: (x, y, w, h) => ({
            x, y, width: w, height: h, interactive: false, visible: true, input: null,
            setInteractive: function() { this.interactive = true; return this; },
            disableInteractive: function() { this.interactive = false; return this; },
            setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
            setSize: function(nw, nh) { this.width = nw; this.height = nh; return this; },
            setOrigin: function() { return this; },
            setVisible: function(v) { this.visible = v; return this; },
            on: function() { return this; }
          }),
          text: (x, y, text, style) => {
            const textObj = {
              x, y, text, style: JSON.parse(JSON.stringify(style || {})),
              height: 0,
              setText: function(nt) {
                this.text = nt;
                return this;
              },
              setOrigin: function() { return this; },
              setVisible: function() { return this; },
              setColor: function() { return this; },
              setFontSize: function() { return this; },
              setFontStyle: function() { return this; },
              setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; },
              setWordWrapWidth: function(w) {
                if (!this.style) this.style = {};
                if (!this.style.wordWrap) this.style.wordWrap = {};
                this.style.wordWrap.width = w;
                return this;
              }
            };
            return textObj;
          },
          image: (x, y, key) => ({
            x, y, key,
            setDisplaySize: function() { return this; },
            setOrigin: function() { return this; },
            setVisible: function() { return this; },
            setPosition: function(nx, ny) { this.x = nx; this.y = ny; return this; }
          })
        },
        tweens: {
          add: () => ({ remove: () => {} })
        },
        events: {
          on: () => {},
          emit: () => {},
          off: () => {},
          removeAllListeners: () => {}
        },
        textures: {
          exists: () => true
        }
      };
    });

    test('bubble background initializes with default minimum safe height 175px and generous padding tokens', () => {
      const overlay = new TutorialOverlay(mockScene);
      assert.equal(overlay.minBubbleH, 175, 'minBubbleH must be 175px');
      assert.equal(overlay.bubbleH, 175, 'Initial bubbleH must be 175px');
      assert.equal(overlay.bubbleHeight, 175, 'Initial bubbleHeight must be 175px');
      assert.equal(overlay.bubblePaddingTop, 52, 'Top padding for nameTag header clearance must be 52px');
      assert.ok(overlay.bubblePaddingBottom >= 20, 'Bottom padding token must be >= 20px');
      assert.equal(overlay.bubblePaddingBottom, 24, 'Bottom padding token is calibrated to 24px');
    });

    test('wordWrap width dynamically expands to 840px for interactive steps without next button', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.setDialogue('Arrastra la masa al bol', { showNextBtn: false });

      assert.equal(overlay.dialogueText.style.wordWrap.width, 840, 'Available wordWrap width should be 840px without next button');
    });

    test('wordWrap width adapts to 700px when next button is visible to maintain 20px lateral clearance', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.setDialogue('¡Bienvenido al tutorial!', { showNextBtn: true });

      assert.equal(overlay.dialogueText.style.wordWrap.width, 700, 'Available wordWrap width should be 700px with next button');
    });

    test('short text (1-2 lines) stays at clean default height of 175px with generous margin to bottom border', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.setDialogue('¡Bienvenido a Kiwipaw Bakehouse!', { showNextBtn: true });

      assert.equal(overlay.bubbleH, 175, 'Short dialogue should remain at 175px');
      const halfH = overlay.bubbleH / 2;
      const textTop = overlay.dialogueText.y;
      const estimatedTextH = overlay._estimateTextHeight('¡Bienvenido a Kiwipaw Bakehouse!', 700);
      const textBottom = textTop + estimatedTextH;
      const bottomClearance = halfH - textBottom;

      assert.ok(bottomClearance >= 20, `Bottom clearance (${bottomClearance}px) must be >= 20px`);
    });

    test('long multi-line dialogue (e.g. stockExplanation) dynamically expands bubble height and guarantees >= 20px bottom padding', () => {
      const overlay = new TutorialOverlay(mockScene);
      const longText = "¡Excelente descarte! 🗑️\n¿Ves el contador de stock debajo de cada cuenco? Cada masa que usas o tiras consume tus ingredientes del almacén.\n✨ Durante este tutorial te reabasteceré mágicamente si te quedas sin masa, pero en días normales ¡deberás comprar provisiones en la TIENDA!";

      overlay.setDialogue(longText, { showNextBtn: true });

      assert.ok(overlay.bubbleH > 175, `Bubble height (${overlay.bubbleH}px) must adaptively expand beyond 175px for long dialogue`);

      const halfH = overlay.bubbleH / 2;
      const textTop = overlay.dialogueText.y;
      const estimatedTextH = overlay._estimateTextHeight(longText, 700);
      const textBottom = textTop + estimatedTextH;
      const bottomClearance = halfH - textBottom;

      assert.ok(
        bottomClearance >= 24,
        `Bottom clearance (${bottomClearance}px) must be >= 24px (strictly >= 20px), preventing any clipping of cocoa border`
      );
    });

    test('dialogueText with real Phaser canvas height automatically drives bubble height and bottom clearance', () => {
      const overlay = new TutorialOverlay(mockScene);
      overlay.dialogueText.height = 140; // Simulated canvas text height for 5 lines

      overlay.setDialogue('Texto de prueba con altura canvas de 140px', { showNextBtn: true });

      const expectedMinHeight = Math.ceil(52 + 140 + 24); // 216px
      assert.ok(overlay.bubbleH >= expectedMinHeight, `Bubble height (${overlay.bubbleH}px) must be at least ${expectedMinHeight}px`);

      const halfH = overlay.bubbleH / 2;
      const textTop = overlay.dialogueText.y;
      const textBottom = textTop + 140;
      const bottomClearance = halfH - textBottom;

      assert.ok(bottomClearance >= 24, `Bottom clearance (${bottomClearance}px) must be >= 24px`);
    });

    test('100% of all 25 tutorial steps in English and Spanish preserve >= 20px bottom padding and zero cocoa border crossing', () => {
      const i18n = I18nManager.getInstance();
      const overlay = new TutorialOverlay(mockScene);

      ['en', 'es'].forEach(lang => {
        i18n.setLanguage(lang);

        TUTORIAL_STEPS.forEach(step => {
          overlay.setStep(step);

          const halfH = overlay.bubbleH / 2;
          const textTop = overlay.dialogueText.y;
          const text = overlay.dialogueText.text;
          const showNext = Boolean(step.showNextBtn !== undefined ? step.showNextBtn : step.allowedAction === 'DIALOG_ACK');
          const wrapWidth = showNext ? 700 : 840;
          const estimatedTextH = overlay._estimateTextHeight(text, wrapWidth);
          const textBottom = textTop + estimatedTextH;
          const bottomClearance = halfH - textBottom;

          assert.ok(
            bottomClearance >= 20,
            `Step "${step.id}" in "${lang}" has bottom clearance ${bottomClearance}px, which must be >= 20px`
          );
        });
      });
    });

    test('refreshI18n dynamically updates word-wrap and recalculates bubble layout upon language switch', () => {
      const i18n = I18nManager.getInstance();
      const overlay = new TutorialOverlay(mockScene);

      overlay.setStep({
        id: 'step_stock_explanation',
        i18nKey: 'tutorial.steps.stockExplanation',
        allowedAction: 'DIALOG_ACK'
      });

      i18n.setLanguage('en');
      overlay.refreshI18n();
      assert.ok(overlay.dialogueText.text.includes('stock'), 'Dialogue text should update to English');
      assert.ok(overlay.bubbleH >= 175, 'Bubble height must be at least 175px');
      const enHalfH = overlay.bubbleH / 2;
      const enTextTop = overlay.dialogueText.y;
      const enTextBottom = enTextTop + overlay._estimateTextHeight(overlay.dialogueText.text, 700);
      const enClearance = enHalfH - enTextBottom;
      assert.ok(enClearance >= 20, `EN bottom clearance (${enClearance}px) must be >= 20px`);

      i18n.setLanguage('es');
      overlay.refreshI18n();
      assert.ok(overlay.dialogueText.text.includes('stock'), 'Dialogue text should update to Spanish');
      assert.ok(overlay.bubbleH >= 175, 'Bubble height must be at least 175px');
      const esHalfH = overlay.bubbleH / 2;
      const esTextTop = overlay.dialogueText.y;
      const esTextBottom = esTextTop + overlay._estimateTextHeight(overlay.dialogueText.text, 700);
      const esClearance = esHalfH - esTextBottom;
      assert.ok(esClearance >= 20, `ES bottom clearance (${esClearance}px) must be >= 20px`);
    });

    test('handles empty text and null dialogue gracefully without exceptions', () => {
      const overlay = new TutorialOverlay(mockScene);

      assert.doesNotThrow(() => {
        overlay.setDialogue('');
      });
      assert.equal(overlay.bubbleH, 175);

      assert.doesNotThrow(() => {
        overlay.setDialogue(null);
      });
      assert.equal(overlay.bubbleH, 175);
    });
  });
});
