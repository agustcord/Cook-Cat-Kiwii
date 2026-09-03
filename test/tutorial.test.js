import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Cookie from '../src/game/Cookie.js';
import { TUTORIAL_STEPS, getStepById, getStepsByBlock } from '../src/game/tutorial/TutorialSteps.js';
import TutorialManager, { resolveTargetBounds, extractGameObjectBounds, DEFAULT_TARGET_BOUNDS } from '../src/game/tutorial/TutorialManager.js';
import TutorialOverlay from '../src/game/tutorial/TutorialOverlay.js';
import SaveManager from '../src/game/services/SaveManager.js';
import CrazyGamesSDK from '../src/game/services/CrazyGamesSDK.js';
import I18nManager from '../src/game/services/I18nManager.js';
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

function createMockPhaserScene() {
  const eventHandlers = new Map();
  const createdContainers = [];

  return {
    day: 1,
    cameras: {
      main: { width: 1920, height: 1080 }
    },
    stock: {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 2, choco: 0, glazing: 0 },
      drink: { coffee_beans: 2, milk: 2 }
    },
    updateStockTexts: () => {},
    updateDrinkStockTexts: () => {},
    showFeedbackText: () => {},
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
          on: function(evt, fn) {
            if (!this._events) this._events = new Map();
            if (!this._events.has(evt)) this._events.set(evt, []);
            this._events.get(evt).push(fn);
            return this;
          },
          emit: function(evt, ...args) {
            if (this._events && this._events.has(evt)) {
              this._events.get(evt).forEach(fn => fn(...args));
            }
          }
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
        setFontStyle: function() { return this; }
      }),
      image: (x, y, key) => ({
        x, y, key,
        setDisplaySize: function() { return this; },
        setOrigin: function() { return this; },
        setVisible: function() { return this; }
      })
    },
    tweens: {
      add: () => ({ remove: () => {} })
    },
    events: {
      on: (event, handler) => {
        if (!eventHandlers.has(event)) eventHandlers.set(event, []);
        eventHandlers.get(event).push(handler);
      },
      off: (event, handler) => {
        if (eventHandlers.has(event)) {
          const list = eventHandlers.get(event).filter(h => h !== handler);
          eventHandlers.set(event, list);
        }
      },
      emit: (event, ...args) => {
        if (eventHandlers.has(event)) {
          eventHandlers.get(event).forEach(h => h(...args));
        }
      }
    },
    time: {
      delayedCall: (delay, callback) => {
        callback();
        return { destroy: () => {} };
      }
    },
    textures: {
      exists: () => true
    },
    _createdContainers: createdContainers
  };
}

describe('Tutorial Subsystem - Architecture, State Machine & Pedagogical Flow Matrix', () => {

  describe('1. TutorialSteps Declarative Structure & Pedagogical Matrix', () => {
    test('defines all 6 pedagogical blocks in correct sequential order', () => {
      assert.ok(Array.isArray(TUTORIAL_STEPS));
      assert.equal(TUTORIAL_STEPS.length, 40, 'TUTORIAL_STEPS must contain exactly 40 micropasos');

      const blocks = TUTORIAL_STEPS.map(s => s.block);
      // Check that all blocks 1, 2, 3, 4, 5, 6 exist
      assert.ok(blocks.includes(1), 'Block 1 must exist');
      assert.ok(blocks.includes(2), 'Block 2 must exist');
      assert.ok(blocks.includes(3), 'Block 3 must exist');
      assert.ok(blocks.includes(4), 'Block 4 must exist');
      assert.ok(blocks.includes(5), 'Block 5 must exist');
      assert.ok(blocks.includes(6), 'Block 6 must exist');

      // Verify non-decreasing block order
      for (let i = 1; i < blocks.length; i++) {
        assert.ok(blocks[i] >= blocks[i - 1], `Block order should be sequential: ${blocks[i]} >= ${blocks[i - 1]}`);
      }
    });

    test('every step has valid schema: id, block, i18nKey, targetKey, allowedAction, triggerEvent, targetCoords, bubblePosition, showPointer', () => {
      TUTORIAL_STEPS.forEach((step, idx) => {
        assert.ok(typeof step.id === 'string' && step.id.length > 0, `Step at ${idx} must have id string`);
        assert.ok(typeof step.block === 'number' && step.block >= 1 && step.block <= 6, `Step ${step.id} must have block 1-6`);
        assert.ok(typeof step.i18nKey === 'string' && step.i18nKey.startsWith('tutorial.steps.'), `Step ${step.id} must have valid i18nKey (got ${step.i18nKey})`);
        assert.ok(typeof step.targetKey === 'string', `Step ${step.id} must have targetKey string`);
        assert.ok(typeof step.allowedAction === 'string', `Step ${step.id} must have allowedAction`);
        assert.ok(typeof step.triggerEvent === 'string', `Step ${step.id} must have triggerEvent`);
        assert.ok(step.targetCoords && typeof step.targetCoords.x === 'number' && typeof step.targetCoords.y === 'number', `Step ${step.id} must have targetCoords`);
        assert.ok(step.bubblePosition === 'top' || step.bubblePosition === 'bottom', `Step ${step.id} must have bubblePosition 'top' or 'bottom' (got ${step.bubblePosition})`);
        assert.ok(typeof step.showPointer === 'boolean', `Step ${step.id} must have boolean showPointer (got ${step.showPointer})`);
      });
    });

    test('getStepById finds existing step and returns undefined for unknown', () => {
      const firstStep = TUTORIAL_STEPS[0];
      assert.equal(getStepById(firstStep.id), firstStep);
      assert.equal(getStepById('non_existent_step_12345'), undefined);
    });

    test('getStepsByBlock filters steps accurately for each block', () => {
      for (let b = 1; b <= 6; b++) {
        const stepsInBlock = getStepsByBlock(b);
        assert.ok(stepsInBlock.length > 0, `Block ${b} should contain at least 1 step`);
        stepsInBlock.forEach(s => assert.equal(s.block, b));
      }
    });

    test('validates the 4 forced error / safety scenarios in step sequence', () => {
      // 1. Forced mistake #1: Burn in oven & discard in trash (Block 2)
      const block2Steps = getStepsByBlock(2);
      const hasBurnEvent = block2Steps.some(s => s.triggerEvent === 'game:cookie_burnt' || s.id.includes('burn'));
      const hasTrashEvent = block2Steps.some(s => s.triggerEvent === 'game:cookie_trashed' || s.id.includes('trash'));
      assert.ok(hasBurnEvent, 'Block 2 must include forced cookie burning step');
      assert.ok(hasTrashEvent, 'Block 2 must include trash bin discard step');

      // 2. Forced mistake #2: Stock warning and auto-restock guarantee (Block 3)
      const block3Steps = getStepsByBlock(3);
      const hasStockDemo = block3Steps.some(s => s.targetKey.includes('stock') || s.id.includes('stock'));
      assert.ok(hasStockDemo, 'Block 3 must include stock limit demo');

      // 3. Forced mistake #3: Wrong delivery with angry shake and no game over (Block 4)
      const block4Steps = getStepsByBlock(4);
      const hasWrongDelivery = block4Steps.some(s => s.id.includes('wrong') || s.allowedAction.includes('DELIVER') || s.triggerEvent === 'game:tray_delivered');
      assert.ok(hasWrongDelivery, 'Block 4 must include wrong delivery step');

      // 4. Block 5: Beverage brewing + perfect bake + victory
      const block5Steps = getStepsByBlock(5);
      const hasDrinkBrew = block5Steps.some(s => s.id.includes('drink') || s.triggerEvent === 'game:drink_brewed' || s.triggerEvent === 'game:drink_to_tray' || s.triggerEvent === 'game:cup_placed');
      const hasFinalDelivery = block5Steps.some(s => s.triggerEvent === 'game:tray_delivered' || s.id.includes('deliver'));
      assert.ok(hasDrinkBrew, 'Block 5 must include drink preparation');
      assert.ok(hasFinalDelivery, 'Block 5 must include final order delivery');
    });

    test('100% of all 40 tutorial steps resolve to real translated text in English and Spanish', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };
      const i18n = I18nManager.getInstance({ reset: true, storage: mockStorage });

      ['en', 'es'].forEach(lang => {
        i18n.setLanguage(lang);

        TUTORIAL_STEPS.forEach((step, idx) => {
          assert.ok(
            i18n.hasKey(step.i18nKey),
            `[${lang.toUpperCase()}] Step #${idx + 1} (${step.id}) key '${step.i18nKey}' must exist in locale dictionary`
          );

          const translated = i18n.t(step.i18nKey);
          assert.notEqual(
            translated,
            step.i18nKey,
            `[${lang.toUpperCase()}] Step #${idx + 1} (${step.id}) translation must not return raw key`
          );

          assert.ok(
            translated.length >= 10,
            `[${lang.toUpperCase()}] Step #${idx + 1} (${step.id}) text length (${translated.length}) should be >= 10 chars`
          );

          assert.ok(
            !/\{[a-zA-Z0-9_]+\}/.test(translated),
            `[${lang.toUpperCase()}] Step #${idx + 1} (${step.id}) has unreplaced placeholders: "${translated}"`
          );
        });
      });
    });
  });

  describe('2. TutorialManager State Machine & Lifecycle Matrix', () => {
    let mockScene;

    beforeEach(() => {
      mockScene = createMockPhaserScene();
    });

    test('initializes cleanly in Day 1 scene with active state and instantiates TutorialOverlay', () => {
      const tm = new TutorialManager(mockScene);
      assert.equal(tm.isActive, false);
      assert.equal(tm.isCompleted, false);
      assert.equal(tm.currentStepIndex, 0);
      assert.ok(tm.overlay instanceof TutorialOverlay, 'TutorialManager must instantiate TutorialOverlay');
      assert.equal(tm.overlay.depth, 25000);

      tm.start();
      assert.equal(tm.isActive, true);
      assert.ok(tm.getCurrentStep());
      assert.equal(tm.getCurrentStep().id, TUTORIAL_STEPS[0].id);
      assert.equal(tm.overlay.isVisible, true, 'Overlay must be visible after tm.start()');
      assert.ok(tm.overlay.dialogueText.text.length > 0, 'Overlay dialogueText must receive translated text on start');
    });

    test('advances step linearly upon valid event emissions and syncs overlay atomically', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();

      const initialStep = tm.getCurrentStep();
      assert.equal(initialStep.id, TUTORIAL_STEPS[0].id);

      // Simulate event matching the first step's triggerEvent
      const targetEvent = initialStep.triggerEvent;
      mockScene.events.emit(targetEvent, { base: 'classic' });

      // Should have advanced to step index 1
      assert.equal(tm.currentStepIndex, 1);
      assert.equal(tm.getCurrentStep().id, TUTORIAL_STEPS[1].id);

      // Overlay should reflect step 1 configuration
      assert.equal(tm.overlay.currentStepConfig.id, TUTORIAL_STEPS[1].id);
      assert.ok(tm.overlay.currentSpotlight, 'Spotlight should be active on interactive step');
      assert.equal(tm.overlay.currentSpotlight.x, TUTORIAL_STEPS[1].targetCoords.x);
    });

    test('does not advance step on mismatched or invalid payload event', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();

      // Find step that expects classic dough
      const doughStepIndex = TUTORIAL_STEPS.findIndex(s => s.allowedAction === 'DRAG_DOUGH');
      if (doughStepIndex >= 0) {
        tm.goToStep(TUTORIAL_STEPS[doughStepIndex].id);
        const current = tm.getCurrentStep();

        // Emit wrong base
        mockScene.events.emit('game:dough_placed', { base: 'chocolate' });
        // Should remain on the same step if validation fails
        assert.equal(tm.getCurrentStep().id, current.id);

        // Emit correct base
        mockScene.events.emit('game:dough_placed', { base: 'classic' });
        // Now it should advance
        assert.notEqual(tm.getCurrentStep().id, current.id);
      }
    });

    test('goToStep jumps to desired step, updates overlay, and emits change notification', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();

      let notifiedStep = null;
      tm.on('step_changed', (step) => {
        notifiedStep = step;
      });

      const targetId = TUTORIAL_STEPS[4].id;
      const success = tm.goToStep(targetId);

      assert.equal(success, true);
      assert.equal(tm.getCurrentStep().id, targetId);
      assert.equal(notifiedStep.id, targetId);
      assert.equal(tm.overlay.currentStepConfig.id, targetId);
    });

    test('skip deactivates manager, marks completion in SaveManager, and hides overlay', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };
      SaveManager.getInstance({ reset: true, storage: mockStorage });

      const tm = new TutorialManager(mockScene);
      tm.start();
      assert.equal(tm.isActive, true);
      assert.equal(tm.overlay.isVisible, true);

      tm.skip();
      assert.equal(tm.isActive, false);
      assert.equal(tm.isCompleted, true);
      assert.equal(tm.overlay.isVisible, false);

      const saved = SaveManager.getInstance().loadGame();
      assert.equal(saved.tutorialCompleted, true);
    });

    test('overlay skip_confirm event triggers manager skip and saves state', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };
      SaveManager.getInstance({ reset: true, storage: mockStorage });

      const tm = new TutorialManager(mockScene);
      tm.start();
      assert.equal(tm.isActive, true);

      // Trigger skip confirmation from overlay UI
      tm.overlay.emit('skip_confirm');

      assert.equal(tm.isActive, false);
      assert.equal(tm.isCompleted, true);
      assert.equal(tm.overlay.isVisible, false);

      const saved = SaveManager.getInstance().loadGame();
      assert.equal(saved.tutorialCompleted, true);
    });

    test('overlay next event triggers dialog acknowledgment and advances step', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();
      assert.equal(tm.currentStepIndex, 0);

      // Trigger next button click from overlay
      tm.overlay.emit('next');

      assert.equal(tm.currentStepIndex, 1);
    });

    test('completing the final step calls happytime, saves completion, and hides overlay', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };
      SaveManager.getInstance({ reset: true, storage: mockStorage });

      let happyTimeCalled = false;
      const mockSDK = {
        isAvailable: () => true,
        game: {
          happytime: () => { happyTimeCalled = true; }
        }
      };
      CrazyGamesSDK.getInstance({ reset: true, sdk: mockSDK });

      const tm = new TutorialManager(mockScene);
      tm.start();

      // Jump to last step
      const lastStep = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];
      tm.goToStep(lastStep.id);

      // Trigger completion
      tm.complete();

      assert.equal(tm.isCompleted, true);
      assert.equal(tm.isActive, false);
      assert.equal(happyTimeCalled, true);
      assert.equal(tm.overlay.isVisible, false);

      const saved = SaveManager.getInstance().loadGame();
      assert.equal(saved.tutorialCompleted, true);
    });

    test('destroy frees listeners and destroys overlay instance cleanly', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();
      const overlayRef = tm.overlay;

      tm.destroy();

      assert.equal(tm.overlay, null);
      assert.equal(tm.isActive, false);
      assert.equal(overlayRef.container, null);
    });
  });

  describe('3. Safety Nets: Assisted Restock & Anti-Death Patience Protection', () => {
    let mockScene;

    beforeEach(() => {
      mockScene = createMockPhaserScene();
      mockScene.stock = {
        dough: { classic: 0, chocolate: 0, oat: 0 },
        topping: { sprinkles: 0, choco: 0, glazing: 0 },
        drink: { coffee_beans: 0, milk: 0 }
      };
    });

    test('checkSafetyRestock replenishes depleted ingredients during Day 1 tutorial', () => {
      const tm = new TutorialManager(mockScene);
      assert.equal(mockScene.stock.dough.classic, 0);
      assert.equal(mockScene.stock.drink.coffee_beans, 0);

      // Start tutorial triggers initial checkSafetyRestock
      tm.start();
      assert.ok(mockScene.stock.dough.classic >= 3, 'Classic dough should be restocked to at least 3');
      assert.ok(mockScene.stock.drink.coffee_beans >= 2, 'Coffee beans should be restocked to at least 2');
      assert.ok(mockScene.stock.topping.sprinkles >= 2, 'Sprinkles should be restocked to at least 2');
      assert.ok(mockScene.stock.drink.milk >= 2, 'Milk should be restocked to at least 2');

      // Now deplete again mid-tutorial
      mockScene.stock.dough.classic = 0;
      mockScene.stock.drink.coffee_beans = 0;
      mockScene.stock.topping.sprinkles = 0;
      mockScene.stock.drink.milk = 0;
      const restocked = tm.checkSafetyRestock();
      assert.equal(restocked, true);
      assert.ok(mockScene.stock.dough.classic >= 3, 'Classic dough should be restocked to at least 3');
      assert.ok(mockScene.stock.drink.coffee_beans >= 2, 'Coffee beans should be restocked to at least 2');
      assert.ok(mockScene.stock.topping.sprinkles >= 2, 'Sprinkles should be restocked to at least 2');
      assert.ok(mockScene.stock.drink.milk >= 2, 'Milk should be restocked to at least 2');
    });

    test('isPatienceProtected returns true when tutorial is active on Day 1', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();

      assert.equal(tm.isPatienceProtected(), true);

      tm.skip();
      assert.equal(tm.isPatienceProtected(), false);
    });
  });

  describe('4. SaveManager - Tutorial State Serialization Matrix', () => {
    test('getDefaultState includes tutorialCompleted: false', () => {
      const sm = SaveManager.getInstance({ reset: true });
      const def = sm.getDefaultState();
      assert.equal(def.tutorialCompleted, false);
    });

    test('saveGame correctly persists tutorialCompleted flag', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };

      const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
      sm.saveGame({ day: 1, tutorialCompleted: true });

      const loaded = sm.loadGame();
      assert.equal(loaded.tutorialCompleted, true);
    });
  });

  describe('5. Step Dough Classic & Drag Interactivity Matrix', () => {
    let mockScene;

    beforeEach(() => {
      mockScene = createMockPhaserScene();
    });

    test('step_dough_classic coordinates match GameScene classic dough dimensions exactly', () => {
      const step = getStepById('step_dough_classic');
      assert.ok(step, 'step_dough_classic must exist');
      assert.equal(step.targetCoords.x, 148, 'Classic dough X coordinate');
      assert.equal(step.targetCoords.y, 684, 'Classic dough Y coordinate');
      assert.equal(step.targetCoords.width, 168, 'Classic dough width');
      assert.equal(step.targetCoords.height, 116, 'Classic dough height');
      assert.equal(step.allowedAction, 'DRAG_DOUGH', 'Allowed action must be DRAG_DOUGH');
      assert.equal(step.triggerEvent, 'game:dough_placed', 'Trigger event must be game:dough_placed');
    });

    test('setting step_dough_classic leaves screen unblocked for smooth dragging', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();

      // Advance from welcome to step_dough_classic
      tm.handleGameEvent('game:dialog_acknowledged');
      const current = tm.getCurrentStep();
      assert.equal(current.id, 'step_dough_classic');

      const overlay = tm.overlay;
      assert.ok(overlay, 'Overlay must exist');
      assert.ok(overlay.currentSpotlight, 'Spotlight must be active');
      assert.equal(overlay.currentSpotlight.x, 148);
      assert.equal(overlay.currentSpotlight.y, 684);

      // Full screen blocker must be disabled
      assert.equal(overlay.fullBlocker.interactive, false, 'Full screen blocker must not block clicks');
      assert.equal(overlay.fullBlocker.visible, false);

      // Perimeter blockers must not intercept mouse pointer during dragging
      assert.equal(overlay.blockerTop.interactive, false, 'Top blocker must not capture pointer');
      assert.equal(overlay.blockerBottom.interactive, false, 'Bottom blocker must not capture pointer');
      assert.equal(overlay.blockerLeft.interactive, false, 'Left blocker must not capture pointer');
      assert.equal(overlay.blockerRight.interactive, false, 'Right blocker must not capture pointer');
    });

    test('step_dough_classic validates payload strictly and advances to step_shape_star', () => {
      const tm = new TutorialManager(mockScene);
      tm.start();
      tm.handleGameEvent('game:dialog_acknowledged');

      // Invalid dough base does not advance step
      tm.handleGameEvent('game:dough_placed', { base: 'chocolate' });
      assert.equal(tm.getCurrentStep().id, 'step_dough_classic', 'Mismatched dough base should not advance');

      // Correct dough base advances to shape step
      tm.handleGameEvent('game:dough_placed', { base: 'classic' });
      assert.equal(tm.getCurrentStep().id, 'step_shape_star', 'Classic dough should advance to step_shape_star');
    });
  });

  describe('6. Dynamic Bounds Resolution & Visual Calibration Matrix (Phase 1 Fix)', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();

      // Configurar GameObjects reales correspondientes a GameScene.js
      mockGameScene.ovenBtnPowerZone = mockGameScene.add.rectangle(1375, 261.5, 50, 50);
      mockGameScene.ovenBtnBakeZone = mockGameScene.add.rectangle(1434, 261.5, 50, 50);
      mockGameScene.ovenDoorZone = mockGameScene.add.rectangle(1499, 475, 306, 249);
      mockGameScene.ovenTimerZone = mockGameScene.add.rectangle(1535, 261.5, 160, 60);
      mockGameScene.ovenExtractZone = mockGameScene.add.rectangle(1494, 717, 206, 56);
      mockGameScene.trashContainer = mockGameScene.add.container(619, 911);
      mockGameScene.trashBinZone = mockGameScene.trashContainer;

      mockGameScene.doughButtons = {
        classic: mockGameScene.add.image(148, 684, 'masa_vainilla'),
        chocolate: mockGameScene.add.image(142, 829.5, 'masa_chocolate'),
        oat: mockGameScene.add.image(135.5, 958.5, 'masa_avena')
      };
      mockGameScene.doughButtons.classic.width = 168;
      mockGameScene.doughButtons.classic.height = 116;

      mockGameScene.doughStockTexts = {
        classic: mockGameScene.add.text(148, 750, 'Stock: 10')
      };

      mockGameScene.shapeButtons = {
        star: mockGameScene.add.rectangle(384, 721, 109, 109),
        heart: mockGameScene.add.rectangle(497, 721, 109, 109),
        cat: mockGameScene.add.rectangle(610, 721, 109, 109),
        fish: mockGameScene.add.rectangle(723, 721, 109, 109)
      };

      mockGameScene.cupStackZone = mockGameScene.add.rectangle(431, 347, 64, 51);
      mockGameScene.btnCoffeeZone = mockGameScene.add.rectangle(287, 424, 83, 68);
      mockGameScene.btnMilkZone = mockGameScene.add.rectangle(385, 422, 83, 68);
      mockGameScene.drinkMachine = mockGameScene.add.image(351, 507, 'drink_machine');
      mockGameScene.drinkMachine.width = 320;
      mockGameScene.drinkMachine.height = 320;

      mockGameScene.deliveryDragZone = mockGameScene.add.rectangle(1037, 675, 375, 118);
      mockGameScene.prepTrayZone = mockGameScene.add.rectangle(960, 911, 375, 169);
      mockGameScene.prepTraySprites = [mockGameScene.add.image(960, 911, 'cookie_star_classic_baked')];
      mockGameScene.prepTraySprites[0].width = 103;
      mockGameScene.prepTraySprites[0].height = 103;

      mockGameScene.currentCustomer = {
        x: 960,
        y: 431,
        sprite: {
          x: 960,
          y: 506,
          width: 338,
          height: 338,
          getBounds: () => ({ x: 791, y: 337, width: 338, height: 338, centerX: 960, centerY: 506 })
        }
      };

      // Implementar getTutorialTarget en mockGameScene
      mockGameScene.getTutorialTarget = function(targetKey) {
        switch (targetKey) {
          case 'customer': return this.currentCustomer.sprite;
          case 'dough_classic': return this.doughButtons.classic;
          case 'stock_dough_classic': return this.doughStockTexts.classic;
          case 'shape_star': return this.shapeButtons.star;
          case 'oven_power': return this.ovenBtnPowerZone;
          case 'oven_bake': return this.ovenBtnBakeZone;
          case 'oven_door': return this.ovenDoorZone;
          case 'oven_timer': return this.ovenTimerZone;
          case 'oven_extract': return this.ovenExtractZone;
          case 'trash_bin': return this.trashBinZone;
          case 'cup_stack': return this.cupStackZone;
          case 'btn_coffee': return this.btnCoffeeZone;
          case 'btn_milk': return this.btnMilkZone;
          case 'drink_machine': return this.drinkMachine;
          case 'delivery_tray': return this.deliveryDragZone;
          case 'table_cookie':
          case 'prep_cookie': return this.prepTraySprites?.[0] || this.prepTrayZone;
          case 'prep_table':
          case 'prep_tray': return this.prepTrayZone;
          case 'drink_cup': return this.machineCupSprite || this.cupStackZone;
          default: return null;
        }
      };
    });

    test('extractGameObjectBounds extracts center and dimensions from Phaser Rectangle/Zone', () => {
      const rect = { x: 1375, y: 261.5, width: 50, height: 50, originX: 0.5, originY: 0.5 };
      const bounds = extractGameObjectBounds(rect);
      assert.ok(bounds);
      assert.equal(bounds.x, 1375);
      assert.equal(bounds.y, 261.5);
      assert.equal(bounds.width, 50);
      assert.equal(bounds.height, 50);
    });

    test('extractGameObjectBounds extracts world bounds from getBounds() method', () => {
      const objWithBounds = {
        getBounds: () => ({ x: 100, y: 200, width: 80, height: 40, centerX: 140, centerY: 220 })
      };
      const bounds = extractGameObjectBounds(objWithBounds);
      assert.ok(bounds);
      assert.equal(bounds.x, 140);
      assert.equal(bounds.y, 220);
      assert.equal(bounds.width, 80);
      assert.equal(bounds.height, 40);
    });

    test('resolveTargetBounds resolves oven_power directly to real GameScene power button coords', () => {
      const bounds = resolveTargetBounds('oven_power', mockGameScene);
      assert.ok(bounds);
      assert.equal(bounds.x, 1375, 'Power button X must match real oven power button');
      assert.equal(bounds.y, 261.5, 'Power button Y must match real oven power button');
      assert.ok(bounds.width >= 50, 'Power button width');
      assert.ok(bounds.height >= 50, 'Power button height');
    });

    test('resolveTargetBounds resolves oven_bake directly to real GameScene bake button coords', () => {
      const bounds = resolveTargetBounds('oven_bake', mockGameScene);
      assert.ok(bounds);
      assert.equal(bounds.x, 1434, 'Bake button X must match real oven bake button');
      assert.equal(bounds.y, 261.5, 'Bake button Y must match real oven bake button');
    });

    test('resolveTargetBounds resolves oven_door directly to real GameScene door coords', () => {
      const bounds = resolveTargetBounds('oven_door', mockGameScene);
      assert.ok(bounds);
      assert.equal(bounds.x, 1499);
      assert.equal(bounds.y, 475);
      assert.equal(bounds.width, 306);
      assert.equal(bounds.height, 249);
    });

    test('resolveTargetBounds resolves oven_extract directly to real GameScene extract button coords', () => {
      const bounds = resolveTargetBounds('oven_extract', mockGameScene);
      assert.ok(bounds);
      assert.equal(bounds.x, 1494);
      assert.equal(bounds.y, 717);
    });

    test('resolveTargetBounds dynamically adapts when GameObject is repositioned at runtime', () => {
      // Mover el botón power en tiempo de ejecución
      mockGameScene.ovenBtnPowerZone.x = 1400;
      mockGameScene.ovenBtnPowerZone.y = 280;

      const dynamicBounds = resolveTargetBounds('oven_power', mockGameScene);
      assert.equal(dynamicBounds.x, 1400);
      assert.equal(dynamicBounds.y, 280);
    });

    test('resolveTargetBounds falls back cleanly to calibrated DEFAULT_TARGET_BOUNDS when scene is null', () => {
      const powerFallback = resolveTargetBounds('oven_power', null);
      assert.ok(powerFallback);
      assert.equal(powerFallback.x, 1375);
      assert.equal(powerFallback.y, 261.5);

      const starFallback = resolveTargetBounds('shape_star', null);
      assert.ok(starFallback);
      assert.equal(starFallback.x, 384);
      assert.equal(starFallback.y, 721);

      const trayFallback = resolveTargetBounds('delivery_tray', null);
      assert.ok(trayFallback);
      assert.equal(trayFallback.x, 1037);
      assert.equal(trayFallback.y, 675);
    });

    test('all 40 tutorial steps in TUTORIAL_STEPS resolve to valid calibrated bounds with 100% precision', () => {
      TUTORIAL_STEPS.forEach((step, idx) => {
        const resolved = resolveTargetBounds(step, mockGameScene);
        assert.ok(resolved, `Step #${idx + 1} (${step.id}) must resolve target bounds`);
        assert.ok(typeof resolved.x === 'number' && !isNaN(resolved.x), `Step ${step.id} resolved.x must be number`);
        assert.ok(typeof resolved.y === 'number' && !isNaN(resolved.y), `Step ${step.id} resolved.y must be number`);
        assert.ok(resolved.width > 0, `Step ${step.id} resolved.width must be > 0`);
        assert.ok(resolved.height > 0, `Step ${step.id} resolved.height must be > 0`);
      });
    });

    test('TutorialManager _syncOverlayStep passes dynamic resolved bounds to overlay.setStep', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      // Ir al paso de oven_power (id: 'step_oven_power')
      const success = tm.goToStep('step_oven_power');
      assert.equal(success, true);

      const overlay = tm.overlay;
      assert.ok(overlay.currentSpotlight);
      assert.equal(overlay.currentSpotlight.x, 1375, 'Spotlight X should be 1375 for oven_power');
      assert.equal(overlay.currentSpotlight.y, 261.5, 'Spotlight Y should be 261.5 for oven_power');
    });
  });

  describe('7. Dialogue Bubble Anti-Collision & Table Clearance Matrix (Captain Fix)', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('step_cookie_to_oven positions Kiwii dialogue banner at top (y = 140), leaving work table (y=911) completely clear', () => {
      const step = getStepById('step_cookie_to_oven');
      assert.ok(step, 'step_cookie_to_oven must exist');
      assert.equal(step.bubblePosition, 'top', 'step_cookie_to_oven must be configured with bubblePosition: top');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      const success = tm.goToStep('step_cookie_to_oven');
      assert.equal(success, true);

      const overlay = tm.overlay;
      assert.ok(overlay, 'TutorialOverlay must exist');
      assert.equal(overlay.bubbleContainer.y, 140, 'Dialogue bubble must be at y = 140 (top) during step_cookie_to_oven');
      assert.equal(overlay.bubbleContainer.x, 960, 'Dialogue bubble X must be centered (960)');

      // Prep tray is at y = 911, bubble is at y = 140 (height 175 -> range 52.5 to 227.5)
      const bubbleTop = overlay.bubbleContainer.y - 175 / 2; // 52.5
      const bubbleBottom = overlay.bubbleContainer.y + 175 / 2; // 227.5
      const prepTableTop = 650;
      const prepTableBottom = 950;

      // Ensure absolutely zero overlap between bubble and prep table
      assert.ok(bubbleBottom < prepTableTop, `Dialogue banner bottom (${bubbleBottom}) must be completely above prep table top (${prepTableTop})`);
    });

    test('all 25 prep table interaction steps position dialogue banner cleanly at top (y = 140)', () => {
      const expectedTopSteps = [
        'step_dough_classic',
        'step_shape_star',
        'step_cookie_to_oven',
        'step_burnt_extract',
        'step_burnt_trash',
        'step_stock_explanation',
        'step_wrong_delivery_intro',
        'step_wrong_delivery_to_tray',
        'step_wrong_delivery_serve',
        'step_wrong_delivery_clean',
        'step_drink_to_tray',
        'step_perfect_dough',
        'step_perfect_shape',
        'step_perfect_oven_load',
        'step_perfect_oven_extract',
        'step_perfect_cookie_to_tray',
        'step_patience_delivery',
        'step_client2_dough',
        'step_client2_shape',
        'step_client2_oven_load',
        'step_client2_oven_extract',
        'step_topping_sprinkles',
        'step_client2_cookie_to_tray',
        'step_client2_drink_to_tray',
        'step_client2_delivery'
      ];

      const tm = new TutorialManager(mockGameScene);
      tm.start();

      expectedTopSteps.forEach(stepId => {
        const step = getStepById(stepId);
        assert.ok(step, `Step ${stepId} must exist`);
        assert.equal(step.bubblePosition, 'top', `Step ${stepId} must have bubblePosition: top`);

        tm.goToStep(stepId);
        assert.equal(tm.overlay.bubbleContainer.y, 140, `Step ${stepId} must place dialogue bubble at y = 140`);
      });
    });

    test('all 15 upper station / ACK steps position dialogue banner cleanly at bottom (y = 860)', () => {
      const expectedBottomSteps = [
        'step_welcome',
        'step_oven_power',
        'step_oven_bake',
        'step_oven_baking',
        'step_oven_bell',
        'step_drink_cup',
        'step_drink_coffee_btn',
        'step_perfect_oven_bake',
        'step_client1_farewell',
        'step_client2_intro',
        'step_client2_oven_bake',
        'step_client2_cup',
        'step_client2_coffee',
        'step_client2_milk_mix',
        'step_tutorial_complete'
      ];

      const tm = new TutorialManager(mockGameScene);
      tm.start();

      expectedBottomSteps.forEach(stepId => {
        const step = getStepById(stepId);
        assert.ok(step, `Step ${stepId} must exist`);
        assert.equal(step.bubblePosition, 'bottom', `Step ${stepId} must have bubblePosition: bottom`);

        tm.goToStep(stepId);
        assert.equal(tm.overlay.bubbleContainer.y, 860, `Step ${stepId} must place dialogue bubble at y = 860`);
      });
    });

    test('TutorialManager._syncOverlayStep infers top position for table actions even if bubblePosition is omitted', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      const customTableStep = {
        id: 'step_custom_drag',
        block: 1,
        i18nKey: 'tutorial.steps.doughClassic',
        targetKey: 'oven_door',
        targetCoords: { x: 1499, y: 475, width: 306, height: 249 },
        allowedAction: 'LOAD_OVEN',
        triggerEvent: 'game:cookie_loaded_oven'
        // bubblePosition omitted on purpose
      };

      tm._syncOverlayStep(customTableStep);
      assert.equal(tm.overlay.bubbleContainer.y, 140, 'Inferred bubblePosition must be top (y = 140) for LOAD_OVEN action');

      const customHighYStep = {
        id: 'step_custom_bottom_target',
        block: 1,
        i18nKey: 'tutorial.steps.doughClassic',
        targetKey: 'custom',
        targetCoords: { x: 500, y: 700, width: 100, height: 100 },
        allowedAction: 'CUSTOM_ACTION',
        triggerEvent: 'game:custom'
        // bubblePosition omitted on purpose
      };

      tm._syncOverlayStep(customHighYStep);
      assert.equal(tm.overlay.bubbleContainer.y, 140, 'Inferred bubblePosition must be top (y = 140) for target.y = 700 > 520');
    });

    test('Geometry validation: top banner bounding box (y in [52.5, 227.5]) has zero overlap with table interaction zone (y in [650, 950])', () => {
      const bannerW = 1040;
      const bannerH = 175;
      const topBannerY = 140;

      const topBannerBounds = {
        top: topBannerY - bannerH / 2,     // 52.5
        bottom: topBannerY + bannerH / 2,  // 227.5
        left: 960 - bannerW / 2,          // 440
        right: 960 + bannerW / 2          // 1480
      };

      assert.ok(topBannerBounds.top >= 0, 'Top banner must not clip past top screen boundary (y >= 0)');
      assert.ok(topBannerBounds.bottom <= 350, 'Top banner bottom must stay above y = 350');
      assert.ok(topBannerBounds.bottom < 650, 'Top banner bottom must not touch work table zone (y = 650..950)');
      assert.ok(topBannerBounds.left >= 0 && topBannerBounds.right <= 1920, 'Top banner X must stay fully on screen');
    });
  });

  describe('8. Two-Phase Visual Guidance (Origin ➔ Destination) Drag Matrix (Captain Fix)', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();

      mockGameScene.ovenBtnPowerZone = mockGameScene.add.rectangle(1375, 261.5, 50, 50);
      mockGameScene.ovenBtnBakeZone = mockGameScene.add.rectangle(1434, 261.5, 50, 50);
      mockGameScene.ovenDoorZone = mockGameScene.add.rectangle(1499, 475, 306, 249);
      mockGameScene.ovenTimerZone = mockGameScene.add.rectangle(1535, 261.5, 160, 60);
      mockGameScene.ovenExtractZone = mockGameScene.add.rectangle(1494, 717, 206, 56);
      mockGameScene.trashContainer = mockGameScene.add.container(619, 911);
      mockGameScene.trashBinZone = mockGameScene.trashContainer;

      mockGameScene.doughButtons = {
        classic: mockGameScene.add.image(148, 684, 'masa_vainilla'),
        chocolate: mockGameScene.add.image(142, 829.5, 'masa_chocolate'),
        oat: mockGameScene.add.image(135.5, 958.5, 'masa_avena')
      };
      mockGameScene.doughButtons.classic.width = 168;
      mockGameScene.doughButtons.classic.height = 116;

      mockGameScene.doughStockTexts = {
        classic: mockGameScene.add.text(148, 750, 'Stock: 10')
      };

      mockGameScene.shapeButtons = {
        star: mockGameScene.add.rectangle(384, 721, 109, 109),
        heart: mockGameScene.add.rectangle(497, 721, 109, 109),
        cat: mockGameScene.add.rectangle(610, 721, 109, 109),
        fish: mockGameScene.add.rectangle(723, 721, 109, 109)
      };

      mockGameScene.cupStackZone = mockGameScene.add.rectangle(431, 347, 64, 51);
      mockGameScene.btnCoffeeZone = mockGameScene.add.rectangle(287, 424, 83, 68);
      mockGameScene.btnMilkZone = mockGameScene.add.rectangle(385, 422, 83, 68);
      mockGameScene.drinkMachine = mockGameScene.add.image(351, 507, 'drink_machine');
      mockGameScene.drinkMachine.width = 320;
      mockGameScene.drinkMachine.height = 320;

      mockGameScene.deliveryDragZone = mockGameScene.add.rectangle(1037, 675, 375, 118);
      mockGameScene.prepTrayZone = mockGameScene.add.rectangle(960, 911, 375, 169);
      mockGameScene.prepTraySprites = [mockGameScene.add.image(960, 911, 'cookie_star_classic_baked')];
      mockGameScene.prepTraySprites[0].width = 103;
      mockGameScene.prepTraySprites[0].height = 103;

      mockGameScene.currentCustomer = {
        x: 960,
        y: 431,
        sprite: {
          x: 960,
          y: 506,
          width: 338,
          height: 338,
          getBounds: () => ({ x: 791, y: 337, width: 338, height: 338, centerX: 960, centerY: 506 })
        }
      };

      mockGameScene.getTutorialTarget = function(targetKey) {
        switch (targetKey) {
          case 'customer': return this.currentCustomer.sprite;
          case 'dough_classic': return this.doughButtons.classic;
          case 'stock_dough_classic': return this.doughStockTexts.classic;
          case 'shape_star': return this.shapeButtons.star;
          case 'oven_power': return this.ovenBtnPowerZone;
          case 'oven_bake': return this.ovenBtnBakeZone;
          case 'oven_door': return this.ovenDoorZone;
          case 'oven_timer': return this.ovenTimerZone;
          case 'oven_extract': return this.ovenExtractZone;
          case 'trash_bin': return this.trashBinZone;
          case 'cup_stack': return this.cupStackZone;
          case 'btn_coffee': return this.btnCoffeeZone;
          case 'btn_milk': return this.btnMilkZone;
          case 'drink_machine': return this.drinkMachine;
          case 'delivery_tray': return this.deliveryDragZone;
          case 'table_cookie':
          case 'prep_cookie': return this.prepTraySprites?.[0] || this.prepTrayZone;
          case 'prep_table':
          case 'prep_tray': return this.prepTrayZone;
          case 'drink_cup': return this.machineCupSprite || this.cupStackZone;
          default: return null;
        }
      };
    });

    test('all drag steps in TUTORIAL_STEPS define sourceTargetKey and destinationTargetKey with valid coords', () => {
      const dragSteps = TUTORIAL_STEPS.filter(s =>
        s.allowedAction.startsWith('DRAG_') ||
        s.allowedAction === 'LOAD_OVEN' ||
        s.allowedAction === 'DELIVER_ORDER'
      );

      assert.ok(dragSteps.length >= 10, `There must be at least 10 drag steps, found ${dragSteps.length}`);

      dragSteps.forEach(step => {
        assert.ok(
          typeof step.sourceTargetKey === 'string' && step.sourceTargetKey.length > 0,
          `Step ${step.id} must define sourceTargetKey (got ${step.sourceTargetKey})`
        );
        assert.ok(
          typeof step.destinationTargetKey === 'string' && step.destinationTargetKey.length > 0,
          `Step ${step.id} must define destinationTargetKey (got ${step.destinationTargetKey})`
        );
        assert.ok(
          step.sourceCoords && typeof step.sourceCoords.x === 'number' && typeof step.sourceCoords.y === 'number',
          `Step ${step.id} must define valid sourceCoords`
        );
        assert.ok(
          step.destinationCoords && typeof step.destinationCoords.x === 'number' && typeof step.destinationCoords.y === 'number',
          `Step ${step.id} must define valid destinationCoords`
        );
      });
    });

    test('step_cookie_to_oven targets table_cookie (origin) at rest and oven_door (destination) during drag', () => {
      const step = getStepById('step_cookie_to_oven');
      assert.ok(step, 'step_cookie_to_oven must exist');
      assert.equal(step.sourceTargetKey, 'table_cookie', 'Source key must be table_cookie');
      assert.equal(step.destinationTargetKey, 'oven_door', 'Destination key must be oven_door');
      assert.equal(step.targetKey, 'table_cookie', 'targetKey at rest should match source');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_cookie_to_oven');

      const overlay = tm.overlay;

      // Fase 1: En reposo (Antes de agarrar) -> Señala la galleta en la mesa (y = 911, x = 960)
      assert.ok(overlay.currentSpotlight);
      assert.equal(overlay.currentSpotlight.x, 960, 'Phase 1 spotlight X must point to cookie on table');
      assert.equal(overlay.currentSpotlight.y, 911, 'Phase 1 spotlight Y must point to cookie on table');

      // Fase 2: Al agarrar y arrastrar (game:drag_start) -> Señala la puerta del horno (y = 475, x = 1499)
      mockGameScene.events.emit('game:drag_start', { item: 'table_cookie' });

      assert.equal(tm.isDragging, true);
      assert.equal(overlay.currentSpotlight.x, 1499, 'Phase 2 spotlight X must dynamically switch to oven door');
      assert.equal(overlay.currentSpotlight.y, 475, 'Phase 2 spotlight Y must dynamically switch to oven door');

      // Fase 3: Al soltar sin completar (game:drag_end) -> Vuelve a señalar la galleta en la mesa
      mockGameScene.events.emit('game:drag_end', { item: 'table_cookie' });

      assert.equal(tm.isDragging, false);
      assert.equal(overlay.currentSpotlight.x, 960, 'Phase 3 spotlight X must smoothly revert to cookie on table');
      assert.equal(overlay.currentSpotlight.y, 911, 'Phase 3 spotlight Y must smoothly revert to cookie on table');

      // Fase 4: Al completar la acción (game:cookie_loaded_oven) -> Avanza al paso siguiente (step_oven_bake)
      mockGameScene.events.emit('game:drag_start', { item: 'table_cookie' });
      assert.equal(overlay.currentSpotlight.x, 1499);

      mockGameScene.events.emit('game:cookie_loaded_oven', { count: 1 });
      mockGameScene.events.emit('game:drag_end', { item: 'table_cookie' });

      assert.equal(tm.getCurrentStep().id, 'step_oven_bake', 'Should advance to step_oven_bake upon successful oven load');
      assert.equal(overlay.currentSpotlight.x, 1434, 'Next step spotlight should point to oven bake button');
      assert.equal(overlay.currentSpotlight.y, 261.5, 'Next step spotlight should point to oven bake button');
    });

    test('step_burnt_trash targets table_cookie at rest and trash_bin during drag', () => {
      const step = getStepById('step_burnt_trash');
      assert.ok(step);
      assert.equal(step.sourceTargetKey, 'table_cookie');
      assert.equal(step.destinationTargetKey, 'trash_bin');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_burnt_trash');

      const overlay = tm.overlay;

      // Fase 1: En reposo
      assert.equal(overlay.currentSpotlight.x, 960);
      assert.equal(overlay.currentSpotlight.y, 911);

      // Fase 2: Arrastre a basurero
      mockGameScene.events.emit('game:drag_start', { item: 'table_cookie' });
      assert.equal(overlay.currentSpotlight.x, 619);
      assert.equal(overlay.currentSpotlight.y, 911);
      assert.equal(overlay.currentSpotlight.isError, true, 'Trash bin highlight must indicate error style');

      // Fase 3: Descarte exitoso
      mockGameScene.events.emit('game:cookie_trashed');
      mockGameScene.events.emit('game:drag_end', { item: 'table_cookie' });

      assert.equal(tm.getCurrentStep().id, 'step_stock_explanation');
    });

    test('step_dough_classic targets dough_classic at rest and prep_table during drag', () => {
      const step = getStepById('step_dough_classic');
      assert.ok(step);
      assert.equal(step.sourceTargetKey, 'dough_classic');
      assert.equal(step.destinationTargetKey, 'prep_table');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_dough_classic');

      const overlay = tm.overlay;

      // Fase 1: Masa en reposo
      assert.equal(overlay.currentSpotlight.x, 148);
      assert.equal(overlay.currentSpotlight.y, 684);

      // Fase 2: Sosteniendo masa -> Mesa de preparación
      mockGameScene.events.emit('game:drag_start', { item: 'dough', base: 'classic' });
      assert.equal(overlay.currentSpotlight.x, 960);
      assert.equal(overlay.currentSpotlight.y, 911);

      // Fase 3: Soltar fuera -> Vuelve a masa
      mockGameScene.events.emit('game:drag_end', { item: 'dough', base: 'classic' });
      assert.equal(overlay.currentSpotlight.x, 148);
      assert.equal(overlay.currentSpotlight.y, 684);

      // Colocación exitosa
      mockGameScene.events.emit('game:dough_placed', { base: 'classic' });
      assert.equal(tm.getCurrentStep().id, 'step_shape_star');
    });

    test('step_shape_star targets shape_star at rest and table_cookie during drag', () => {
      const step = getStepById('step_shape_star');
      assert.ok(step);
      assert.equal(step.sourceTargetKey, 'shape_star');
      assert.equal(step.destinationTargetKey, 'table_cookie');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_shape_star');

      const overlay = tm.overlay;

      // Fase 1: Molde estrella en reposo
      assert.equal(overlay.currentSpotlight.x, 384);
      assert.equal(overlay.currentSpotlight.y, 721);

      // Fase 2: Sosteniendo molde -> Galleta en mesa
      mockGameScene.events.emit('game:drag_start', { item: 'shape', shape: 'star' });
      assert.equal(overlay.currentSpotlight.x, 960);
      assert.equal(overlay.currentSpotlight.y, 911);

      // Fase 3: Aplicar corte
      mockGameScene.events.emit('game:shape_applied', { shape: 'star' });
      assert.equal(tm.getCurrentStep().id, 'step_oven_power');
    });

    test('step_drink_cup targets cup_stack at rest and drink_machine during drag', () => {
      const step = getStepById('step_drink_cup');
      assert.ok(step);
      assert.equal(step.sourceTargetKey, 'cup_stack');
      assert.equal(step.destinationTargetKey, 'drink_machine');

      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_drink_cup');

      const overlay = tm.overlay;

      // Fase 1: Pila de vasos en reposo
      assert.equal(overlay.currentSpotlight.x, 431);
      assert.equal(overlay.currentSpotlight.y, 347);

      // Fase 2: Arrastrando vaso -> Cafetera
      mockGameScene.events.emit('game:drag_start', { item: 'cup_stack' });
      assert.equal(overlay.currentSpotlight.x, 351);
      assert.equal(overlay.currentSpotlight.y, 507);

      // Fase 3: Vaso colocado
      mockGameScene.events.emit('game:cup_placed');
      assert.equal(tm.getCurrentStep().id, 'step_drink_coffee_btn');
    });

    test('step_wrong_delivery_serve and step_patience_delivery target delivery_tray at rest and customer during drag', () => {
      ['step_wrong_delivery_serve', 'step_patience_delivery'].forEach(stepId => {
        const step = getStepById(stepId);
        assert.equal(step.sourceTargetKey, 'delivery_tray');
        assert.equal(step.destinationTargetKey, 'customer');

        const tm = new TutorialManager(mockGameScene);
        tm.start();
        tm.goToStep(stepId);

        const overlay = tm.overlay;

        // Fase 1: Bandeja en reposo
        assert.equal(overlay.currentSpotlight.x, 1037);
        assert.equal(overlay.currentSpotlight.y, 675);

        // Fase 2: Arrastre a cliente
        mockGameScene.events.emit('game:drag_start', { item: 'delivery_tray' });
        assert.equal(overlay.currentSpotlight.x, 960);
        assert.equal(overlay.currentSpotlight.y, 506); // sprite centerY in mock
      });
    });

    test('non-drag steps (buttons and ACK) ignore game:drag_start and game:drag_end cleanly', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_oven_power');

      const overlay = tm.overlay;
      assert.equal(overlay.currentSpotlight.x, 1375);
      assert.equal(overlay.currentSpotlight.y, 261.5);

      // Emit drag start on a button step
      mockGameScene.events.emit('game:drag_start', { item: 'something' });
      assert.equal(overlay.currentSpotlight.x, 1375, 'Spotlight should remain on power button');
      assert.equal(overlay.currentSpotlight.y, 261.5);

      mockGameScene.events.emit('game:drag_end', { item: 'something' });
      assert.equal(overlay.currentSpotlight.x, 1375, 'Spotlight should remain on power button');
      assert.equal(overlay.currentSpotlight.y, 261.5);
    });

    test('TutorialOverlay.setTarget switches target coordinates without clearing or resetting dialogue text', () => {
      const overlay = new TutorialOverlay(mockGameScene);
      overlay.setStep({
        id: 'test_step',
        text: 'Instrucción de prueba de Kiwii',
        targetCoords: { x: 100, y: 200, width: 50, height: 50 }
      });

      assert.equal(overlay.dialogueText.text, 'Instrucción de prueba de Kiwii');
      assert.equal(overlay.currentSpotlight.x, 100);
      assert.equal(overlay.currentSpotlight.y, 200);

      // Call setTarget to update target coordinates only
      overlay.setTarget({ x: 500, y: 600, width: 80, height: 80 });

      assert.equal(overlay.dialogueText.text, 'Instrucción de prueba de Kiwii', 'Dialogue text must not be cleared or altered');
      assert.equal(overlay.currentSpotlight.x, 500);
      assert.equal(overlay.currentSpotlight.y, 600);
      assert.equal(overlay.currentSpotlight.width, 80);
      assert.equal(overlay.currentSpotlight.height, 80);
    });
  });

  // =========================================================================
  // 9. PREP TRAY COOKIE DRAG & STEP_COOKIE_TO_OVEN INTEGRATION MATRIX
  // =========================================================================
  describe('9. Prep Tray Cookie Drag & step_cookie_to_oven Integration Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
      mockGameScene.ovenBtnPowerZone = { x: 1375, y: 261.5, displayWidth: 60, displayHeight: 60 };
      mockGameScene.ovenBtnBakeZone = { x: 1434, y: 261.5, displayWidth: 60, displayHeight: 60 };
      mockGameScene.ovenDoorZone = { x: 1499, y: 475, displayWidth: 306, displayHeight: 249 };
      mockGameScene.prepTrayZone = { x: 960, y: 911, displayWidth: 375, displayHeight: 169 };
      mockGameScene.prepTraySprites = [{ x: 960, y: 911, displayWidth: 103, displayHeight: 103 }];

      mockGameScene.getTutorialTarget = function(targetKey) {
        switch (targetKey) {
          case 'oven_power': return this.ovenBtnPowerZone;
          case 'oven_bake': return this.ovenBtnBakeZone;
          case 'oven_door': return this.ovenDoorZone;
          case 'table_cookie':
          case 'prep_cookie': return this.prepTraySprites?.[0] || this.prepTrayZone;
          case 'prep_table':
          case 'prep_tray': return this.prepTrayZone;
          default: return null;
        }
      };
    });

    test('GameScene.js has no undefined cookieInstance references in dragstart', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      
      const drawCookieStartIndex = gameSceneCode.indexOf('drawCookie()');
      assert.ok(drawCookieStartIndex !== -1, 'drawCookie method must exist');
      const drawCookieCode = gameSceneCode.slice(drawCookieStartIndex, gameSceneCode.indexOf('updateCookieVisuals()', drawCookieStartIndex));

      assert.ok(
        drawCookieCode.includes('cookieInstance =') || drawCookieCode.includes('cookie,'),
        'drawCookie dragstart must declare or bind cookieInstance before emitting game:drag_start'
      );
      assert.ok(
        drawCookieCode.includes("item: 'table_cookie'"),
        'drawCookie dragstart must emit item: table_cookie'
      );
      assert.ok(
        drawCookieCode.includes('sprite.setDepth(30000)'),
        'drawCookie dragstart must elevate cookie depth to 30000 above TutorialOverlay depth 25000'
      );
    });

    test('Full step_cookie_to_oven execution cycle: drag start -> arrow moves to oven -> drop -> advances to step_oven_bake', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_cookie_to_oven');

      assert.equal(tm.getCurrentStep().id, 'step_cookie_to_oven');
      assert.equal(tm.isDragging, false);
      assert.equal(tm.overlay.currentSpotlight.x, 960);
      assert.equal(tm.overlay.currentSpotlight.y, 911);

      // 1. User starts dragging table_cookie
      const fakeCookie = new Cookie();
      fakeCookie.base = 'classic';
      fakeCookie.shape = 'star';

      let dragStartEmitted = false;
      mockGameScene.events.on('game:drag_start', (data) => {
        dragStartEmitted = true;
        assert.equal(data.item, 'table_cookie');
        assert.equal(data.cookie.shape, 'star');
      });

      mockGameScene.events.emit('game:drag_start', { item: 'table_cookie', cookie: fakeCookie, index: 0 });

      assert.ok(dragStartEmitted);
      assert.equal(tm.isDragging, true);
      assert.equal(tm.overlay.currentSpotlight.x, 1499, 'Spotlight must point to oven door');
      assert.equal(tm.overlay.currentSpotlight.y, 475);

      // 2. User successfully drops cookie in oven
      mockGameScene.events.emit('game:cookie_loaded_oven', { cookie: fakeCookie, count: 1 });
      mockGameScene.events.emit('game:drag_end', { item: 'table_cookie', cookie: fakeCookie, index: 0 });

      assert.equal(tm.getCurrentStep().id, 'step_oven_bake', 'Must advance to step_oven_bake');
      assert.equal(tm.overlay.currentSpotlight.x, 1434, 'Spotlight points to oven bake button');
      assert.equal(tm.overlay.currentSpotlight.y, 261.5);
    });
  });

  // =========================================================================
  // 10. NO NEXT-BUTTON AMBIGUITY ON PHYSICAL ACTION STEPS MATRIX
  // =========================================================================
  describe('10. No Next-Button Ambiguity on Physical Action Steps Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('TUTORIAL_STEPS guarantees showNextBtn: false on all physical action steps', () => {
      const physicalSteps = TUTORIAL_STEPS.filter(step => step.allowedAction !== 'DIALOG_ACK');
      assert.ok(physicalSteps.length >= 23, `Expected at least 23 physical steps, got ${physicalSteps.length}`);

      physicalSteps.forEach(step => {
        assert.strictEqual(
          step.showNextBtn,
          false,
          `Step '${step.id}' (action: ${step.allowedAction}) must have showNextBtn: false to eliminate player confusion`
        );
      });
    });

    test('TUTORIAL_STEPS sets showNextBtn: true exclusively on pure dialogue/ACK steps', () => {
      const ackSteps = TUTORIAL_STEPS.filter(step => step.allowedAction === 'DIALOG_ACK');
      assert.strictEqual(ackSteps.length, 5, 'Expected exactly 5 DIALOG_ACK steps');

      ackSteps.forEach(step => {
        assert.strictEqual(
          step.showNextBtn,
          true,
          `Dialogue step '${step.id}' must have showNextBtn: true`
        );
      });

      const ackIds = ackSteps.map(s => s.id);
      assert.deepStrictEqual(ackIds, ['step_welcome', 'step_stock_explanation', 'step_client1_farewell', 'step_client2_intro', 'step_tutorial_complete']);
    });

    test('TutorialManager._syncOverlayStep passes showNextBtn: false to TutorialOverlay on drag & click steps', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      const testStepIds = [
        'step_dough_classic',
        'step_shape_star',
        'step_oven_power',
        'step_cookie_to_oven',
        'step_oven_bake',
        'step_burnt_trash',
        'step_wrong_delivery_intro',
        'step_wrong_delivery_to_tray',
        'step_wrong_delivery_serve',
        'step_wrong_delivery_clean',
        'step_drink_to_tray',
        'step_perfect_cookie_to_tray',
        'step_patience_delivery',
        'step_client2_dough',
        'step_client2_shape',
        'step_client2_oven_load',
        'step_client2_oven_bake',
        'step_client2_oven_extract',
        'step_topping_sprinkles',
        'step_client2_cookie_to_tray',
        'step_client2_cup',
        'step_client2_coffee',
        'step_client2_milk_mix',
        'step_client2_drink_to_tray',
        'step_client2_delivery'
      ];

      testStepIds.forEach(stepId => {
        tm.goToStep(stepId);
        assert.strictEqual(
          tm.overlay.actionBtnContainer.visible,
          false,
          `Step '${stepId}' must NOT show NEXT button on overlay`
        );
      });
    });

    test('TutorialOverlay hides next button and displays pointer on action steps', () => {
      const overlay = new TutorialOverlay(mockGameScene);
      const stepConfig = getStepById('step_wrong_delivery_to_tray');
      assert.ok(stepConfig);

      overlay.setStep(stepConfig);
      assert.strictEqual(overlay.actionBtnContainer.visible, false, 'Action button must be hidden');
      assert.strictEqual(overlay.pointerContainer.visible, true, 'Action pointer must be visible');
    });

    test('step_stock_explanation illuminates dough stock without spawning contradictory action arrow', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_stock_explanation');

      const currentStep = tm.getCurrentStep();
      assert.strictEqual(currentStep.id, 'step_stock_explanation');
      assert.strictEqual(currentStep.allowedAction, 'DIALOG_ACK');
      assert.strictEqual(currentStep.showNextBtn, true);
      assert.strictEqual(currentStep.showPointer, false);

      const overlay = tm.overlay;
      assert.ok(overlay.currentSpotlight, 'Spotlight must be present to illuminate stock area');
      assert.strictEqual(overlay.currentSpotlight.x, 148, 'Spotlight must highlight classic dough stock');
      assert.strictEqual(overlay.currentSpotlight.y, 750);
      assert.strictEqual(overlay.actionBtnContainer.visible, true, 'NEXT button must be visible');
      assert.strictEqual(overlay.pointerContainer.visible, false, 'Animated arrow pointer must NEVER appear on step_stock_explanation');
    });

    test('all DIALOG_ACK steps show NEXT button and ZERO interactive action pointer arrows', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      const dialogStepIds = ['step_welcome', 'step_stock_explanation', 'step_client1_farewell', 'step_client2_intro', 'step_tutorial_complete'];

      dialogStepIds.forEach(stepId => {
        tm.goToStep(stepId);
        const step = tm.getCurrentStep();
        assert.strictEqual(step.showNextBtn, true, `Step ${stepId} must have showNextBtn: true`);
        assert.strictEqual(step.showPointer, false, `Step ${stepId} must have showPointer: false`);
        assert.strictEqual(tm.overlay.actionBtnContainer.visible, true, `Step ${stepId} must show NEXT button`);
        assert.strictEqual(tm.overlay.pointerContainer.visible, false, `Step ${stepId} must NOT show animated pointer arrow`);
      });
    });

    test('strict anti-contradiction invariant: across 100% of all 40 tutorial steps, next button and pointer arrow NEVER coexist', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      TUTORIAL_STEPS.forEach((step, idx) => {
        tm.goToStep(step.id);

        const nextVisible = tm.overlay.actionBtnContainer.visible;
        const pointerVisible = tm.overlay.pointerContainer.visible;

        assert.ok(
          !(nextVisible && pointerVisible),
          `Step #${idx + 1} (${step.id}) VIOLATION: NEXT button and pointer arrow are both visible at the same time!`
        );

        if (step.allowedAction === 'DIALOG_ACK') {
          assert.strictEqual(nextVisible, true, `Dialogue step ${step.id} must show next button`);
          assert.strictEqual(pointerVisible, false, `Dialogue step ${step.id} must NOT show pointer`);
        } else {
          assert.strictEqual(nextVisible, false, `Action step ${step.id} must NOT show next button`);
          assert.strictEqual(pointerVisible, true, `Action step ${step.id} must show pointer`);
        }
      });
    });

    test('setTarget on dialogue steps preserves spotlight cutout without revealing pointer arrow', () => {
      const overlay = new TutorialOverlay(mockGameScene);
      const stockStep = getStepById('step_stock_explanation');
      overlay.setStep(stockStep);

      assert.strictEqual(overlay.actionBtnContainer.visible, true);
      assert.strictEqual(overlay.pointerContainer.visible, false);
      assert.ok(overlay.currentSpotlight);

      // Re-invoking setTarget should preserve spotlight but still suppress pointer
      overlay.setTarget({ x: 148, y: 750, width: 140, height: 50 });

      assert.strictEqual(overlay.actionBtnContainer.visible, true);
      assert.strictEqual(overlay.pointerContainer.visible, false, 'Pointer must remain hidden after setTarget');
      assert.strictEqual(overlay.currentSpotlight.x, 148);
    });
  });

  // =========================================================================
  // 11. RAW DOUGH DELIVERY TO TRAY & CUSTOMER FEEDBACK FLOW MATRIX
  // =========================================================================
  describe('11. Raw Dough Delivery to Tray & Customer Feedback Flow Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('GameScene code allows raw unshaped dough to be dropped onto delivery tray', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');

      // 1. Check drawCookie dragend delivery tray branch: no cutShapeFirst restriction
      const drawCookieStartIndex = gameSceneCode.indexOf('drawCookie() {');
      const drawCookieEndIndex = gameSceneCode.indexOf('updateCookieVisuals() {', drawCookieStartIndex);
      const drawCookieSection = gameSceneCode.slice(drawCookieStartIndex, drawCookieEndIndex);

      const deliveryTrayBranch = drawCookieSection.slice(
        drawCookieSection.indexOf('// 2. Drop on Delivery Tray'),
        drawCookieSection.indexOf('// 3. Drop on Oven')
      );
      assert.ok(
        !deliveryTrayBranch.includes('cutShapeFirst'),
        'drawCookie delivery tray branch must NOT block delivery tray drops with cutShapeFirst'
      );

      // 2. Check createDoughButtons dragend: supports dropping directly onto delivery tray
      const doughStationStartIndex = gameSceneCode.indexOf('createDoughButtons() {');
      const doughStationEndIndex = gameSceneCode.indexOf('createShapeButtons(', doughStationStartIndex);
      const doughStationSection = gameSceneCode.slice(doughStationStartIndex, doughStationEndIndex);

      assert.ok(
        doughStationSection.includes('distDelivery < 188'),
        'createDoughButtons must check distance to delivery tray'
      );
      assert.ok(
        doughStationSection.includes("this.events.emit('game:cookie_to_tray'"),
        'createDoughButtons must emit game:cookie_to_tray when dropped on delivery tray'
      );
    });

    test('drawDeliveryTray properly renders unshaped raw dough with dough texture fallback', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      const drawDeliveryTrayStartIndex = gameSceneCode.indexOf('drawDeliveryTray() {');
      const drawDeliveryTrayEndIndex = gameSceneCode.indexOf('handleOvenImageClick() {', drawDeliveryTrayStartIndex);
      const drawDeliveryTraySection = gameSceneCode.slice(drawDeliveryTrayStartIndex, drawDeliveryTrayEndIndex);

      assert.ok(
        drawDeliveryTraySection.includes("key = `dough_${cookie.base || 'classic'}`"),
        'drawDeliveryTray must fallback to dough texture when cookie is unshaped'
      );
      assert.ok(
        drawDeliveryTraySection.includes('isShaped ? 75 : 65'),
        'drawDeliveryTray should adjust size for raw dough portions'
      );
    });

    test('Cookie similarity is 0 for unshaped raw dough and triggers raw cookie rejection', () => {
      const rawDoughCookie = new Cookie();
      rawDoughCookie.base = 'classic';
      rawDoughCookie.shape = null;
      rawDoughCookie.bakedState = 'raw';

      const targetRecipe = {
        name: 'Vainilla Estrella',
        base: 'classic',
        shape: 'star',
        toppings: []
      };

      assert.strictEqual(rawDoughCookie.isDeliverable(), false, 'Unshaped cookie is not deliverable as final recipe');
      const similarity = rawDoughCookie.getSimilarityPercentage(targetRecipe);
      assert.strictEqual(similarity, 0, 'Unshaped cookie similarity must be 0');
      assert.strictEqual(rawDoughCookie.bakedState, 'raw');
    });

    test('Tutorial state machine transitions through complete Block 4 forced error flow', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      // Go to Block 4 intro
      tm.goToStep('step_wrong_delivery_intro');
      assert.strictEqual(tm.getCurrentStep().id, 'step_wrong_delivery_intro');
      assert.strictEqual(tm.getCurrentStep().showNextBtn, false);

      // 1. Player drags dough to table
      mockGameScene.events.emit('game:dough_placed', { base: 'classic' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_wrong_delivery_to_tray');
      assert.strictEqual(tm.getCurrentStep().showNextBtn, false);

      // 2. Player drags raw unshaped dough to delivery tray
      const rawCookie = new Cookie();
      rawCookie.base = 'classic';
      rawCookie.shape = null;
      rawCookie.bakedState = 'raw';
      mockGameScene.events.emit('game:cookie_to_tray', { cookie: rawCookie });
      assert.strictEqual(tm.getCurrentStep().id, 'step_wrong_delivery_serve');
      assert.strictEqual(tm.getCurrentStep().showNextBtn, false);

      // 3. Player delivers raw dough -> Customer rejects with complaint -> advances to clean step
      mockGameScene.events.emit('game:tray_delivered', { rejected: true, success: false, reason: '¡Masa cruda!' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_wrong_delivery_clean');
      assert.strictEqual(tm.getCurrentStep().showNextBtn, false);

      // 4. Player dumps tray into trash bin -> advances to Block 5 drink step
      mockGameScene.events.emit('game:tray_trashed');
      assert.strictEqual(tm.getCurrentStep().id, 'step_drink_cup');
      assert.strictEqual(tm.getCurrentStep().block, 5);
    });

    test('deliveryDragZone supports direct tap/click and emits deliverCookie in GameScene', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      const createDeliveryTrayStartIndex = gameSceneCode.indexOf('createDeliveryTray() {');
      const createDeliveryTrayEndIndex = gameSceneCode.indexOf('drawDeliveryTrayBg(highlightColor', createDeliveryTrayStartIndex);
      const createDeliveryTraySection = gameSceneCode.slice(createDeliveryTrayStartIndex, createDeliveryTrayEndIndex);

      assert.ok(
        createDeliveryTraySection.includes("this.deliveryDragZone.on('pointerup'"),
        'deliveryDragZone must have pointerup listener for direct tap'
      );
      assert.ok(
        createDeliveryTraySection.includes('this.deliverCookie()'),
        'deliveryDragZone pointerup must call deliverCookie'
      );
    });
  });

  describe('12. Customer Scratch Protection & Pedagogical Guard Matrix', () => {
    test('customer.scratchWarningTutorial translation key is defined and non-empty in English and Spanish', () => {
      assert.ok(en.customer && en.customer.scratchWarningTutorial, 'en.js must define customer.scratchWarningTutorial');
      assert.ok(es.customer && es.customer.scratchWarningTutorial, 'es.js must define customer.scratchWarningTutorial');

      assert.ok(en.customer.scratchWarningTutorial.length > 15, 'English warning string must be descriptive');
      assert.ok(es.customer.scratchWarningTutorial.length > 15, 'Spanish warning string must be descriptive');

      assert.ok(en.customer.scratchWarningTutorial.includes('Careful!'), 'English warning must include "Careful!"');
      assert.ok(es.customer.scratchWarningTutorial.includes('¡Cuidado!'), 'Spanish warning must include "¡Cuidado!"');
      assert.ok(en.customer.scratchWarningTutorial.includes('🐾'), 'English warning must include paw emoji 🐾');
      assert.ok(es.customer.scratchWarningTutorial.includes('🐾'), 'Spanish warning must include paw emoji 🐾');

      const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
      assert.strictEqual(i18n.t('customer.scratchWarningTutorial'), en.customer.scratchWarningTutorial);

      i18n.setLanguage('es');
      assert.strictEqual(i18n.t('customer.scratchWarningTutorial'), es.customer.scratchWarningTutorial);
    });

    test('scratchCustomer source logic guards against customer destruction while tutorial is active', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      const scratchFnStart = gameSceneCode.indexOf('scratchCustomer() {');
      const scratchFnEnd = gameSceneCode.indexOf('showFeedbackText(text, x, y, color)', scratchFnStart);
      const scratchFnSection = gameSceneCode.slice(scratchFnStart, scratchFnEnd);

      // Check tutorial guard
      assert.ok(
        scratchFnSection.includes('this.tutorialManager?.isActive'),
        'scratchCustomer must check this.tutorialManager?.isActive'
      );
      assert.ok(
        scratchFnSection.includes('customer.scratchWarningTutorial'),
        'scratchCustomer must reference customer.scratchWarningTutorial translation key'
      );
      assert.ok(
        scratchFnSection.includes("'#ffb703'"),
        'scratchCustomer must display pedagogical warning text in amber #ffb703'
      );
      assert.ok(
        scratchFnSection.includes("playCatMeow('curious')"),
        'scratchCustomer must play curious cat meow in tutorial mode'
      );
      assert.ok(
        scratchFnSection.includes('this.scratchBlockedUntilPointerUp = true'),
        'scratchCustomer must set scratchBlockedUntilPointerUp = true to prevent frame spam'
      );
      assert.ok(
        scratchFnSection.includes('return;'),
        'scratchCustomer must return early in tutorial mode before setting isActive = false or calling spawnCustomer'
      );
    });

    test('spawnCustomer source logic enforces deterministic orders for Customer 1 and Customer 2 in Day 1', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      const spawnFnStart = gameSceneCode.indexOf('spawnCustomer() {');
      const spawnFnEnd = gameSceneCode.indexOf('deliverCookie() {', spawnFnStart);
      const spawnFnSection = gameSceneCode.slice(spawnFnStart, spawnFnEnd);

      assert.ok(
        spawnFnSection.includes("requestedDrink = 'coffee'"),
        'spawnCustomer Day 1 must force recipe 0 (Star + Coffee) for customerIndex === 0'
      );
      assert.ok(
        spawnFnSection.includes("requestedDrink = 'coffee_milk'"),
        'spawnCustomer Day 1 must force sprinkles + coffee_milk for customerIndex === 1'
      );
      assert.ok(
        spawnFnSection.includes("toppings: ['sprinkles']"),
        'spawnCustomer Day 1 must request sprinkles topping for customerIndex === 1'
      );
    });

    test('Simulated scratchCustomer behavior in Tutorial vs Normal mode', () => {
      // Create mock execution context replicating scratchCustomer logic
      function simulateScratch(scene) {
        if (!scene.currentCustomer || !scene.currentCustomer.isActive) return 'NOOP';

        if (scene.tutorialManager?.isActive) {
          scene.scratchBlockedUntilPointerUp = true;
          scene.playedSounds.push('scratch');
          scene.playedSounds.push('catMeow:curious');

          const cx = scene.currentCustomer.container.x;
          const cy = scene.currentCustomer.container.y + 75;

          const i18n = I18nManager.getInstance();
          scene.showFeedbackText(i18n.t('customer.scratchWarningTutorial'), cx, cy - 244, '#ffb703');

          scene.tweens.add({
            targets: scene.currentCustomer.container,
            type: 'micro_shake',
            onComplete: () => {
              scene.currentCustomer.container.x = 960;
              scene.currentCustomer.container.y = 300;
            }
          });
          return 'TUTORIAL_GUARDED';
        }

        scene.currentCustomer.isActive = false;
        scene.playedSounds.push('scratch');
        scene.playedSounds.push('customerAngry');

        const i18n = I18nManager.getInstance();
        scene.showFeedbackText('Angry Dialogue', scene.currentCustomer.container.x, scene.currentCustomer.container.y - 244, '#d90429');

        scene.tweens.add({
          targets: scene.currentCustomer.container,
          type: 'flee',
          onComplete: () => {
            scene.currentCustomer.destroyed = true;
            scene.currentCustomer = null;
            scene.spawnCustomer();
          }
        });
        return 'NORMAL_SCRATCHED';
      }

      // Case A: Tutorial is active
      const feedbackLogsA = [];
      const tutorialScene = {
        tutorialManager: { isActive: true },
        currentCustomer: {
          isActive: true,
          container: { x: 960, y: 300 },
          destroyed: false
        },
        playedSounds: [],
        scratchBlockedUntilPointerUp: false,
        spawnCustomerCalled: false,
        showFeedbackText: (text, x, y, color) => {
          feedbackLogsA.push({ text, x, y, color });
        },
        tweens: {
          add: (config) => {
            if (config.onComplete) config.onComplete();
          }
        },
        spawnCustomer: function() { this.spawnCustomerCalled = true; }
      };

      const resultA = simulateScratch(tutorialScene);
      assert.strictEqual(resultA, 'TUTORIAL_GUARDED');
      assert.strictEqual(tutorialScene.currentCustomer.isActive, true, 'Customer MUST stay active');
      assert.strictEqual(tutorialScene.currentCustomer.destroyed, false, 'Customer MUST NOT be destroyed');
      assert.strictEqual(tutorialScene.scratchBlockedUntilPointerUp, true, 'scratchBlockedUntilPointerUp MUST be set to true');
      assert.strictEqual(tutorialScene.spawnCustomerCalled, false, 'spawnCustomer MUST NOT be called');
      assert.deepStrictEqual(tutorialScene.playedSounds, ['scratch', 'catMeow:curious']);
      assert.strictEqual(feedbackLogsA.length, 1);
      assert.strictEqual(feedbackLogsA[0].color, '#ffb703');
      assert.ok(feedbackLogsA[0].text.includes('🐾'));
      assert.strictEqual(tutorialScene.currentCustomer.container.x, 960);

      // Case B: Tutorial is inactive (Normal service)
      const feedbackLogsB = [];
      const normalScene = {
        tutorialManager: { isActive: false },
        currentCustomer: {
          isActive: true,
          container: { x: 960, y: 300 },
          destroyed: false
        },
        playedSounds: [],
        scratchBlockedUntilPointerUp: false,
        spawnCustomerCalled: false,
        showFeedbackText: (text, x, y, color) => {
          feedbackLogsB.push({ text, x, y, color });
        },
        tweens: {
          add: (config) => {
            if (config.onComplete) config.onComplete();
          }
        },
        spawnCustomer: function() { this.spawnCustomerCalled = true; }
      };

      const resultB = simulateScratch(normalScene);
      assert.strictEqual(resultB, 'NORMAL_SCRATCHED');
      assert.strictEqual(normalScene.currentCustomer, null, 'Customer MUST be destroyed and set to null in normal service');
      assert.strictEqual(normalScene.spawnCustomerCalled, true, 'spawnCustomer MUST be called in normal service');
      assert.deepStrictEqual(normalScene.playedSounds, ['scratch', 'customerAngry']);
      assert.strictEqual(feedbackLogsB.length, 1);
      assert.strictEqual(feedbackLogsB[0].color, '#d90429');
    });

    test('updateCatPaw pointer check respects scratchBlockedUntilPointerUp', () => {
      const gameSceneCode = fs.readFileSync(path.join(process.cwd(), 'src', 'scenes', 'GameScene.js'), 'utf8');
      const updatePawStart = gameSceneCode.indexOf('// Check if scratching the active customer');
      const updatePawSection = gameSceneCode.slice(updatePawStart, updatePawStart + 400);

      assert.ok(
        updatePawSection.includes('!this.scratchBlockedUntilPointerUp'),
        'updateCatPaw must verify !this.scratchBlockedUntilPointerUp before invoking scratchCustomer'
      );
    });
  });

  describe('13. Block 6: Customer 2 Toppings & Coffee with Milk Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('Block 6 contains exactly 14 micropasos starting with step_client2_intro and ending with step_tutorial_complete', () => {
      const block6 = getStepsByBlock(6);
      assert.strictEqual(block6.length, 14, 'Block 6 must define exactly 14 micropasos');

      const expectedBlock6Ids = [
        'step_client2_intro',
        'step_client2_dough',
        'step_client2_shape',
        'step_client2_oven_load',
        'step_client2_oven_bake',
        'step_client2_oven_extract',
        'step_topping_sprinkles',
        'step_client2_cookie_to_tray',
        'step_client2_cup',
        'step_client2_coffee',
        'step_client2_milk_mix',
        'step_client2_drink_to_tray',
        'step_client2_delivery',
        'step_tutorial_complete'
      ];

      assert.deepStrictEqual(block6.map(s => s.id), expectedBlock6Ids);
    });

    test('resolveTargetBounds resolves topping jars and btn_milk accurately', () => {
      // Direct fallback resolution
      const sprinklesBounds = resolveTargetBounds('topping_sprinkles', null);
      assert.ok(sprinklesBounds);
      assert.strictEqual(sprinklesBounds.x, 1767);
      assert.strictEqual(sprinklesBounds.y, 660);
      assert.strictEqual(sprinklesBounds.width, 158);
      assert.strictEqual(sprinklesBounds.height, 158);

      const chocoBounds = resolveTargetBounds('topping_choco', null);
      assert.ok(chocoBounds);
      assert.strictEqual(chocoBounds.x, 1767);
      assert.strictEqual(chocoBounds.y, 810);

      const glazingBounds = resolveTargetBounds('topping_glazing', null);
      assert.ok(glazingBounds);
      assert.strictEqual(glazingBounds.x, 1767);
      assert.strictEqual(glazingBounds.y, 960);

      const btnMilkBounds = resolveTargetBounds('btn_milk', null);
      assert.ok(btnMilkBounds);
      assert.strictEqual(btnMilkBounds.x, 385);
      assert.strictEqual(btnMilkBounds.y, 422);

      // Resolution with GameScene getTutorialTarget fallback
      mockGameScene.getTutorialTarget = (key) => {
        if (key === 'topping_sprinkles') return { x: 1767, y: 660, displayWidth: 158, displayHeight: 158 };
        if (key === 'btn_milk') return { x: 385, y: 422, displayWidth: 83, displayHeight: 68 };
        return null;
      };

      const resolvedSprinkles = resolveTargetBounds('topping_sprinkles', mockGameScene);
      assert.strictEqual(resolvedSprinkles.x, 1767);
      assert.strictEqual(resolvedSprinkles.y, 660);

      const resolvedBtnMilk = resolveTargetBounds('btn_milk', mockGameScene);
      assert.strictEqual(resolvedBtnMilk.x, 385);
      assert.strictEqual(resolvedBtnMilk.y, 422);
    });

    test('step_topping_sprinkles advances ONLY on valid game:topping_applied payload', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_topping_sprinkles');

      assert.strictEqual(tm.getCurrentStep().id, 'step_topping_sprinkles');

      // Invalid topping event (e.g. choco) should not advance
      tm.handleGameEvent('game:topping_applied', { topping: 'choco' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_topping_sprinkles', 'Must not advance on wrong topping');

      // Valid sprinkles event advances to step_client2_cookie_to_tray
      tm.handleGameEvent('game:topping_applied', { topping: 'sprinkles' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_cookie_to_tray', 'Must advance to cookie to tray on sprinkles');
    });

    test('coffee machine combined brew progression: step_client2_coffee -> step_client2_milk_mix -> step_client2_drink_to_tray', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_client2_coffee');

      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_coffee');

      // Coffee brewed advances to milk mix
      tm.handleGameEvent('game:drink_brewed', { drink: 'coffee', type: 'coffee_beans' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_milk_mix', 'Must advance to milk mix after brewing coffee');

      // Mismatched drink does not advance milk mix step
      tm.handleGameEvent('game:drink_brewed', { drink: 'tea', type: 'tea' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_milk_mix', 'Must not advance on non-coffee_milk');

      // Milk combined brew event advances to drink to tray
      tm.handleGameEvent('game:drink_brewed', { drink: 'coffee_milk', type: 'coffee_milk' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_drink_to_tray', 'Must advance to drink to tray after coffee with milk');
    });

    test('full Block 6 end-to-end state machine flow: Client 1 farewell through Client 2 victory', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();

      // Start at end of Block 5
      tm.goToStep('step_client1_farewell');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client1_farewell');

      // 1. Client 1 farewell ack -> Client 2 Intro
      tm.handleGameEvent('game:dialog_acknowledged');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_intro');

      // 2. Client 2 intro ack -> Dough
      tm.handleGameEvent('game:dialog_acknowledged');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_dough');

      // 3. Dough placed -> Shape
      tm.handleGameEvent('game:dough_placed', { base: 'classic' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_shape');

      // 4. Shape applied -> Oven load
      tm.handleGameEvent('game:shape_applied', { shape: 'star' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_oven_load');

      // 5. Oven load -> Oven bake
      tm.handleGameEvent('game:cookie_loaded_oven');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_oven_bake');

      // 6. Oven bake start -> Extract
      tm.handleGameEvent('game:oven_bake_start');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_oven_extract');

      // 7. Cookie extracted -> Topping sprinkles
      tm.handleGameEvent('game:cookie_extracted', { cookies: [{ bakedState: 'baked' }] });
      assert.strictEqual(tm.getCurrentStep().id, 'step_topping_sprinkles');

      // 8. Topping sprinkles applied -> Cookie to tray
      tm.handleGameEvent('game:topping_applied', { topping: 'sprinkles' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_cookie_to_tray');

      // 9. Cookie to tray -> Cup placed
      tm.handleGameEvent('game:cookie_to_tray');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_cup');

      // 10. Cup placed -> Coffee brew button
      tm.handleGameEvent('game:cup_placed');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_coffee');

      // 11. Coffee brewed -> Milk mix button
      tm.handleGameEvent('game:drink_brewed', { drink: 'coffee', type: 'coffee_beans' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_milk_mix');

      // 12. Milk brewed (coffee_milk) -> Drink to tray
      tm.handleGameEvent('game:drink_brewed', { drink: 'coffee_milk', type: 'coffee_milk' });
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_drink_to_tray');

      // 13. Drink to tray -> Delivery
      tm.handleGameEvent('game:drink_to_tray');
      assert.strictEqual(tm.getCurrentStep().id, 'step_client2_delivery');

      // 14. Delivery success -> Tutorial Complete dialog
      tm.handleGameEvent('game:tray_delivered', { success: true });
      assert.strictEqual(tm.getCurrentStep().id, 'step_tutorial_complete');

      // 15. Complete dialog ack -> Completed
      let completedFired = false;
      tm.on('completed', () => { completedFired = true; });
      tm.handleGameEvent('game:dialog_acknowledged');

      assert.strictEqual(tm.isCompleted, true);
      assert.strictEqual(tm.isActive, false);
      assert.strictEqual(completedFired, true);
    });
  });

  describe('14. Block 2: Burnt Cookie Trash & step_burnt_trash Soft-Lock Prevention Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('step_burnt_trash validation accepts object cookie instances, string targets, and normalized payloads', () => {
      const step = getStepById('step_burnt_trash');
      assert.ok(step, 'step_burnt_trash must exist in TUTORIAL_STEPS');
      assert.strictEqual(typeof step.validation, 'function', 'validation must be a callable predicate');

      const mockCookie = { base: 'classic', shape: 'star', bakedState: 'burnt' };

      // 1. Valid cases
      assert.strictEqual(step.validation(undefined), true, 'No payload should be valid');
      assert.strictEqual(step.validation(null), true, 'Null payload should be valid');
      assert.strictEqual(step.validation({}), true, 'Empty payload should be valid');
      assert.strictEqual(step.validation({ item: 'table_cookie' }), true, 'item table_cookie should be valid');
      assert.strictEqual(step.validation({ item: 'prep_cookie' }), true, 'item prep_cookie should be valid');
      assert.strictEqual(step.validation({ destination: 'trash' }), true, 'destination trash should be valid');
      assert.strictEqual(step.validation({ destination: 'trash_bin' }), true, 'destination trash_bin should be valid');
      assert.strictEqual(step.validation({ item: 'table_cookie', destination: 'trash' }), true, 'table_cookie to trash should be valid');
      assert.strictEqual(step.validation({ item: mockCookie }), true, 'Object cookieInstance in item (runtime payload) MUST be valid');
      assert.strictEqual(step.validation({ item: 'table_cookie', cookie: mockCookie, destination: 'trash' }), true, 'Normalized payload MUST be valid');
      assert.strictEqual(step.validation({ destination: 'trash', cookie: mockCookie }), true, 'cookie property with destination trash MUST be valid');

      // 2. Invalid cases
      assert.strictEqual(step.validation({ item: 'table_cookie', destination: 'delivery_tray' }), false, 'Delivery tray destination must be rejected');
      assert.strictEqual(step.validation({ item: 'table_cookie', destination: 'oven' }), false, 'Oven destination must be rejected');
      assert.strictEqual(step.validation({ item: 'unknown_item', destination: 'trash' }), false, 'Unknown string item should be rejected');
    });

    test('TutorialManager advances from step_burnt_trash to step_stock_explanation with runtime cookie object payload', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_burnt_trash');

      assert.strictEqual(tm.getCurrentStep().id, 'step_burnt_trash');

      const burntCookieInstance = {
        base: 'classic',
        shape: 'star',
        bakedState: 'burnt',
        toppings: []
      };

      // Simular emisión directa con objeto (como ocurría en GameScene antes o ante objetos crudos)
      mockGameScene.events.emit('game:cookie_trashed', { item: burntCookieInstance });

      assert.strictEqual(
        tm.getCurrentStep().id,
        'step_stock_explanation',
        'State machine MUST advance to step_stock_explanation upon trashing burnt cookie object'
      );
    });

    test('TutorialManager advances from step_burnt_trash to step_stock_explanation with normalized event payload', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_burnt_trash');

      assert.strictEqual(tm.getCurrentStep().id, 'step_burnt_trash');

      const burntCookieInstance = {
        base: 'classic',
        shape: 'star',
        bakedState: 'burnt'
      };

      // Simular emisión normalizada
      mockGameScene.events.emit('game:cookie_trashed', {
        item: 'table_cookie',
        cookie: burntCookieInstance,
        destination: 'trash'
      });

      assert.strictEqual(
        tm.getCurrentStep().id,
        'step_stock_explanation',
        'State machine MUST advance to step_stock_explanation upon normalized cookie_trashed event'
      );
    });

    test('GameScene.js contains normalized game:cookie_trashed event emission', () => {
      const gameScenePath = path.resolve(process.cwd(), 'src/scenes/GameScene.js');
      const gameSceneCode = fs.readFileSync(gameScenePath, 'utf-8');

      assert.ok(
        gameSceneCode.includes("this.events.emit('game:cookie_trashed', { item: 'table_cookie', cookie: cookieInstance, destination: 'trash' });"),
        'GameScene.js must emit normalized game:cookie_trashed payload with item, cookie, and destination'
      );
    });
  });

  // ==========================================
  // MATRIZ 15: Z-Index Layering, Drag Target Filtering & Visual Focus Calibration
  // ==========================================
  describe('15. Z-Index Layering, Drag Target Filtering & Visual Focus Calibration Matrix', () => {
    let mockGameScene;

    beforeEach(() => {
      mockGameScene = createMockPhaserScene();
    });

    test('GameScene source code enforces prepTrayZone depth 2.5 and cookie sprites depth 4', () => {
      const gameScenePath = path.resolve(process.cwd(), 'src/scenes/GameScene.js');
      const gameSceneCode = fs.readFileSync(gameScenePath, 'utf-8');

      // 1. Initial depth of prepTrayZone must be 2.5
      assert.ok(
        gameSceneCode.includes('this.prepTrayZone = this.add.rectangle(trayX, trayY, 375, 169, 0x000000, 0)') &&
        gameSceneCode.includes('.setDepth(2.5);\n    this.input.setDraggable(this.prepTrayZone);') ||
        gameSceneCode.includes('.setDepth(2.5);\r\n    this.input.setDraggable(this.prepTrayZone);'),
        'prepTrayZone must have depth: 2.5 so it does not intercept cookies or cutters'
      );

      // 2. Dragend depth reset of prepTrayZone
      assert.ok(
        gameSceneCode.includes('this.prepTrayZone.setDepth(2.5);'),
        'prepTrayZone dragend must reset depth to 2.5'
      );

      // 3. Cookie sprites depth must be 4
      assert.ok(
        gameSceneCode.includes("const sprite = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(4);"),
        'Cookie sprites in drawCookie must have depth: 4'
      );
    });

    test('TutorialManager handleDragStart strictly filters drag payload against current step sourceTargetKey', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_dough_classic');

      const overlay = tm.overlay;

      // Fase 1: Spotlight inicial en masa clásica
      assert.strictEqual(overlay.currentSpotlight.x, 148);
      assert.strictEqual(overlay.currentSpotlight.y, 684);

      // Arrastre espurio de prep_tray durante step_dough_classic -> DEBE IGNORARSE
      mockGameScene.events.emit('game:drag_start', { item: 'prep_tray' });
      assert.strictEqual(tm.isDragging, false, 'isDragging must remain false for unrelated item drag');
      assert.strictEqual(overlay.currentSpotlight.x, 148, 'Spotlight must NOT shift to prep table on unrelated drag');
      assert.strictEqual(overlay.currentSpotlight.y, 684);

      // Arrastre espurio de cup_stack -> DEBE IGNORARSE
      mockGameScene.events.emit('game:drag_start', { item: 'cup_stack' });
      assert.strictEqual(tm.isDragging, false);
      assert.strictEqual(overlay.currentSpotlight.x, 148);

      // Arrastre legítimo de masa clásica -> DEBE CAMBIAR A DESTINO (prep_table)
      mockGameScene.events.emit('game:drag_start', { item: 'dough', base: 'classic' });
      assert.strictEqual(tm.isDragging, true, 'isDragging must become true for matching item drag');
      assert.strictEqual(overlay.currentSpotlight.x, 960, 'Spotlight must shift to prep table on matching dough drag');
      assert.strictEqual(overlay.currentSpotlight.y, 911);

      // Soltar -> Vuelve a masa clásica
      mockGameScene.events.emit('game:drag_end', { item: 'dough', base: 'classic' });
      assert.strictEqual(tm.isDragging, false);
      assert.strictEqual(overlay.currentSpotlight.x, 148);
    });

    test('TutorialManager ignores unrelated drag during step_burnt_trash and only responds to table_cookie', () => {
      const tm = new TutorialManager(mockGameScene);
      tm.start();
      tm.goToStep('step_burnt_trash');

      const overlay = tm.overlay;

      // Fase 1: Spotlight inicial en table_cookie (960, 911)
      assert.strictEqual(overlay.currentSpotlight.x, 960);
      assert.strictEqual(overlay.currentSpotlight.y, 911);

      // Arrastre espurio de delivery_tray durante step_burnt_trash -> DEBE IGNORARSE
      mockGameScene.events.emit('game:drag_start', { item: 'delivery_tray' });
      assert.strictEqual(tm.isDragging, false);
      assert.strictEqual(overlay.currentSpotlight.x, 960);
      assert.strictEqual(overlay.currentSpotlight.y, 911);

      // Arrastre legítimo de table_cookie -> Salta a trash_bin (619, 911)
      mockGameScene.events.emit('game:drag_start', { item: 'table_cookie' });
      assert.strictEqual(tm.isDragging, true);
      assert.strictEqual(overlay.currentSpotlight.x, 619);
      assert.strictEqual(overlay.currentSpotlight.y, 911);
      assert.strictEqual(overlay.currentSpotlight.isError, true);
    });

    test('Dynamic target bounds resolution and GameScene getTutorialTarget for prep_table, table_cookie, and delivery_tray', () => {
      // 1. DEFAULT_TARGET_BOUNDS check
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.prep_table.x, 960);
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.prep_table.y, 911);
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.table_cookie.x, 960);
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.table_cookie.y, 911);
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.delivery_tray.x, 1037);
      assert.strictEqual(DEFAULT_TARGET_BOUNDS.delivery_tray.y, 675);

      // 2. resolveTargetBounds with mock scene
      const customScene = {
        getTutorialTarget: (key) => {
          if (key === 'prep_table') return { x: 960, y: 911, displayWidth: 375, displayHeight: 169 };
          if (key === 'table_cookie') return { x: 960, y: 911, displayWidth: 84, displayHeight: 84 };
          if (key === 'delivery_tray') return { x: 1037, y: 675, displayWidth: 375, displayHeight: 94 };
          return null;
        }
      };

      const prepBounds = resolveTargetBounds('prep_table', customScene);
      assert.strictEqual(prepBounds.x, 960);
      assert.strictEqual(prepBounds.y, 911);
      assert.strictEqual(prepBounds.width, 375);
      assert.strictEqual(prepBounds.height, 169);

      const cookieBounds = resolveTargetBounds('table_cookie', customScene);
      assert.strictEqual(cookieBounds.x, 960);
      assert.strictEqual(cookieBounds.y, 911);
      assert.strictEqual(cookieBounds.width, 120);
      assert.strictEqual(cookieBounds.height, 120);

      const deliveryBounds = resolveTargetBounds('delivery_tray', customScene);
      assert.strictEqual(deliveryBounds.x, 1037);
      assert.strictEqual(deliveryBounds.y, 675);
      assert.strictEqual(deliveryBounds.width, 375);
      assert.strictEqual(deliveryBounds.height, 94);
    });

    test('GameScene.js calibrates trash detection distance to 95px across all drag handlers', () => {
      const gameScenePath = path.resolve(process.cwd(), 'src/scenes/GameScene.js');
      const gameSceneCode = fs.readFileSync(gameScenePath, 'utf-8');

      // Verify no remaining drag distance checks using old 131px threshold
      assert.ok(
        !gameSceneCode.includes('distToTrash < 131'),
        'No distToTrash < 131 should remain in GameScene.js'
      );
      assert.ok(
        !gameSceneCode.includes('distTrash < 131'),
        'No distTrash < 131 should remain in GameScene.js'
      );

      // Verify 95px calibrated threshold is used in drag & drop
      assert.ok(
        gameSceneCode.includes('if (distToTrash < 95)'),
        'distToTrash < 95 must be present in GameScene.js'
      );
      assert.ok(
        gameSceneCode.includes('if (distTrash < 95)'),
        'distTrash < 95 must be present in GameScene.js'
      );
    });
  });
});





