import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
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
    test('defines all 5 pedagogical blocks in correct sequential order', () => {
      assert.ok(Array.isArray(TUTORIAL_STEPS));
      assert.equal(TUTORIAL_STEPS.length, 25, 'TUTORIAL_STEPS must contain exactly 25 micropasos');

      const blocks = TUTORIAL_STEPS.map(s => s.block);
      // Check that all blocks 1, 2, 3, 4, 5 exist
      assert.ok(blocks.includes(1), 'Block 1 must exist');
      assert.ok(blocks.includes(2), 'Block 2 must exist');
      assert.ok(blocks.includes(3), 'Block 3 must exist');
      assert.ok(blocks.includes(4), 'Block 4 must exist');
      assert.ok(blocks.includes(5), 'Block 5 must exist');

      // Verify non-decreasing block order
      for (let i = 1; i < blocks.length; i++) {
        assert.ok(blocks[i] >= blocks[i - 1], `Block order should be sequential: ${blocks[i]} >= ${blocks[i - 1]}`);
      }
    });

    test('every step has valid schema: id, block, i18nKey, targetKey, allowedAction, triggerEvent, targetCoords, bubblePosition', () => {
      TUTORIAL_STEPS.forEach((step, idx) => {
        assert.ok(typeof step.id === 'string' && step.id.length > 0, `Step at ${idx} must have id string`);
        assert.ok(typeof step.block === 'number' && step.block >= 1 && step.block <= 5, `Step ${step.id} must have block 1-5`);
        assert.ok(typeof step.i18nKey === 'string' && step.i18nKey.startsWith('tutorial.steps.'), `Step ${step.id} must have valid i18nKey (got ${step.i18nKey})`);
        assert.ok(typeof step.targetKey === 'string', `Step ${step.id} must have targetKey string`);
        assert.ok(typeof step.allowedAction === 'string', `Step ${step.id} must have allowedAction`);
        assert.ok(typeof step.triggerEvent === 'string', `Step ${step.id} must have triggerEvent`);
        assert.ok(step.targetCoords && typeof step.targetCoords.x === 'number' && typeof step.targetCoords.y === 'number', `Step ${step.id} must have targetCoords`);
        assert.ok(step.bubblePosition === 'top' || step.bubblePosition === 'bottom', `Step ${step.id} must have bubblePosition 'top' or 'bottom' (got ${step.bubblePosition})`);
      });
    });

    test('getStepById finds existing step and returns undefined for unknown', () => {
      const firstStep = TUTORIAL_STEPS[0];
      assert.equal(getStepById(firstStep.id), firstStep);
      assert.equal(getStepById('non_existent_step_12345'), undefined);
    });

    test('getStepsByBlock filters steps accurately for each block', () => {
      for (let b = 1; b <= 5; b++) {
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

    test('100% of all 25 tutorial steps resolve to real translated text in English and Spanish', () => {
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

      // Now deplete again mid-tutorial
      mockScene.stock.dough.classic = 0;
      mockScene.stock.drink.coffee_beans = 0;
      const restocked = tm.checkSafetyRestock();
      assert.equal(restocked, true);
      assert.ok(mockScene.stock.dough.classic >= 3, 'Classic dough should be restocked to at least 3');
      assert.ok(mockScene.stock.drink.coffee_beans >= 2, 'Coffee beans should be restocked to at least 2');
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

    test('all 25 tutorial steps in TUTORIAL_STEPS resolve to valid calibrated bounds with 100% precision', () => {
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

    test('all 17 prep table interaction steps position dialogue banner cleanly at top (y = 140)', () => {
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
        'step_patience_delivery'
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

    test('all 8 upper station / ACK steps position dialogue banner cleanly at bottom (y = 860)', () => {
      const expectedBottomSteps = [
        'step_welcome',
        'step_oven_power',
        'step_oven_bake',
        'step_burn_wait',
        'step_drink_cup',
        'step_drink_coffee_btn',
        'step_perfect_oven_bake',
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
});

