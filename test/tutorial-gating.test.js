import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TUTORIAL_STEPS, getStepById, getStepsByBlock } from '../src/game/tutorial/TutorialSteps.js';
import TutorialManager from '../src/game/tutorial/TutorialManager.js';
import TutorialOverlay from '../src/game/tutorial/TutorialOverlay.js';
import SoundManager from '../src/game/SoundManager.js';

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

function createMockScene() {
  const eventHandlers = new Map();
  const addedTweens = [];

  return {
    day: 1,
    stock: {
      dough: { classic: 10, chocolate: 5, oat: 5 },
      topping: { sprinkles: 5, choco: 5, glazing: 5 },
      drink: { coffee_beans: 5, milk: 5 }
    },
    updateStockTexts: () => {},
    updateDrinkStockTexts: () => {},
    showFeedbackText: () => {},
    tweens: {
      add: (config) => {
        addedTweens.push(config);
        if (config.onComplete) {
          config.onComplete();
        }
        return { remove: () => {}, stop: () => {} };
      },
      killTweensOf: () => {}
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
    _addedTweens: addedTweens
  };
}

describe('Tutorial Input & Action Gating - Conditional Validation Suite', () => {

  describe('1. Inactivity & Completion Gating Bypass', () => {
    test('isActionAllowed returns true for any action when tutorial has not started (isActive=false)', () => {
      const scene = createMockScene();
      const manager = new TutorialManager(scene);

      assert.equal(manager.isActive, false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'chocolate' }), true);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'heart' }), true);
      assert.equal(manager.isActionAllowed('CLICK_POWER'), true);
      assert.equal(manager.isActionAllowed('DELIVER_ORDER'), true);
    });

    test('isActionAllowed returns true for any action when tutorial is completed', () => {
      const scene = createMockScene();
      const manager = new TutorialManager(scene);
      manager.start();
      manager.complete();

      assert.equal(manager.isActive, false);
      assert.equal(manager.isCompleted, true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'chocolate' }), true);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'fish' }), true);
    });

    test('isActionAllowed returns true for any action after skip', () => {
      const scene = createMockScene();
      const manager = new TutorialManager(scene);
      manager.start();
      manager.skip();

      assert.equal(manager.isActive, false);
      assert.equal(manager.isCompleted, true);
      assert.equal(manager.isActionAllowed('DRAG_TOPPING', { topping: 'glazing' }), true);
    });
  });

  describe('2. Block 1: Primeros Pasos & Corte de Masa (Cliente 1)', () => {
    let scene;
    let manager;

    beforeEach(() => {
      scene = createMockScene();
      manager = new TutorialManager(scene);
      manager.start();
    });

    test('step_welcome (DIALOG_ACK): blocks all physical kitchen actions', () => {
      assert.equal(manager.getCurrentStep().id, 'step_welcome');
      assert.equal(manager.isActionAllowed('DIALOG_ACK'), true);

      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), false);
      assert.equal(manager.isActionAllowed('CLICK_POWER'), false);
      assert.equal(manager.isActionAllowed('DRAG_CUP'), false);
      assert.equal(manager.isActionAllowed('DELIVER_ORDER'), false);
    });

    test('step_dough_classic (DRAG_DOUGH): allows ONLY classic dough to prep_table', () => {
      manager.goToStep('step_dough_classic');
      assert.equal(manager.getCurrentStep().id, 'step_dough_classic');

      // Allowed
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic', destination: 'prep_table' }), true);

      // Blocked: other dough types
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'chocolate' }), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'oat' }), false);

      // Blocked: wrong destination
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic', destination: 'delivery_tray' }), false);

      // Blocked: other actions
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), false);
      assert.equal(manager.isActionAllowed('CLICK_POWER'), false);
    });

    test('step_shape_star (DRAG_SHAPE): allows ONLY star cutter on table cookie', () => {
      manager.goToStep('step_shape_star');
      assert.equal(manager.getCurrentStep().id, 'step_shape_star');

      // Allowed
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), true);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star', target: 'table_cookie' }), true);

      // Blocked: other shape cutters
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'heart' }), false);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'cat' }), false);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'fish' }), false);

      // Blocked: dragging dough again or oven power
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
      assert.equal(manager.isActionAllowed('CLICK_POWER'), false);
    });
  });

  describe('3. Block 2: ERROR FORZADO #1 - Horno, Sobrecocción y Quemado', () => {
    let scene;
    let manager;

    beforeEach(() => {
      scene = createMockScene();
      manager = new TutorialManager(scene);
      manager.start();
    });

    test('step_oven_power: allows CLICK_POWER to turn on, blocks bake and dough', () => {
      manager.goToStep('step_oven_power');
      assert.equal(manager.isActionAllowed('CLICK_POWER', { isPreheated: true }), true);
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
      assert.equal(manager.isActionAllowed('LOAD_OVEN'), false);
    });

    test('step_cookie_to_oven: allows LOAD_OVEN to oven, blocks delivery tray and trash', () => {
      manager.goToStep('step_cookie_to_oven');
      assert.equal(manager.isActionAllowed('LOAD_OVEN', { destination: 'oven' }), true);
      assert.equal(manager.isActionAllowed('LOAD_OVEN', { destination: 'oven_door' }), true);

      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY', { destination: 'delivery_tray' }), false);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { destination: 'trash' }), false);
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), false);
    });

    test('step_oven_bake: allows CLICK_BAKE, blocks extraction and dough', () => {
      manager.goToStep('step_oven_bake');
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), true);
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT'), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
    });

    test('step_oven_baking & step_oven_bell: lock all player inputs while oven runs', () => {
      manager.goToStep('step_oven_baking');
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT'), false);
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);

      manager.goToStep('step_oven_bell');
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT'), false);
      assert.equal(manager.isActionAllowed('CLICK_POWER'), false);
    });

    test('step_burnt_extract: allows CLICK_EXTRACT, blocks trash and dough', () => {
      manager.goToStep('step_burnt_extract');
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT'), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { destination: 'trash' }), false);
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), false);
    });

    test('step_burnt_trash: allows DRAG_TRASH to trash_bin, blocks delivery tray', () => {
      manager.goToStep('step_burnt_trash');
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { item: 'table_cookie', destination: 'trash' }), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { item: 'table_cookie', destination: 'trash_bin' }), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { item: { base: 'classic', shape: 'star', bakedState: 'burnt' }, destination: 'trash' }), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { item: 'table_cookie', cookie: { base: 'classic' }, destination: 'trash' }), true);

      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY', { destination: 'delivery_tray' }), false);
      assert.equal(manager.isActionAllowed('LOAD_OVEN', { destination: 'oven' }), false);
    });
  });

  describe('4. Block 4: ERROR FORZADO #3 - Masa Cruda & Tolerancia (Captain Critical Test)', () => {
    let scene;
    let manager;

    beforeEach(() => {
      scene = createMockScene();
      manager = new TutorialManager(scene);
      manager.start();
    });

    test('step_wrong_delivery_intro: allows classic dough to prep table', () => {
      manager.goToStep('step_wrong_delivery_intro');
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'chocolate' }), false);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), false);
    });

    test('step_wrong_delivery_to_tray (CAPTAIN REQUIREMENT): shape cutters are 100% BLOCKED', () => {
      manager.goToStep('step_wrong_delivery_to_tray');
      assert.equal(manager.getCurrentStep().id, 'step_wrong_delivery_to_tray');

      // CRITICAL: Star, Heart, Cat, Fish cutters MUST BE BLOCKED
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), false, 'Star cutter must be blocked when dough must be delivered raw');
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'heart' }), false, 'Heart cutter must be blocked');
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'cat' }), false, 'Cat cutter must be blocked');
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'fish' }), false, 'Fish cutter must be blocked');

      // Loading oven or trashing is also blocked
      assert.equal(manager.isActionAllowed('LOAD_OVEN', { destination: 'oven' }), false, 'Loading oven must be blocked');
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { destination: 'trash' }), false, 'Trashing raw dough must be blocked');

      // ONLY dragging cookie to delivery tray is allowed
      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY', { destination: 'delivery_tray' }), true);
    });

    test('step_wrong_delivery_serve: allows delivering raw tray to customer for forced rejection', () => {
      manager.goToStep('step_wrong_delivery_serve');
      assert.equal(manager.isActionAllowed('DELIVER_ORDER', { destination: 'customer', rejected: true }), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { destination: 'trash' }), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
    });

    test('step_wrong_delivery_clean: allows emptying tray into trash, blocks dough kneading', () => {
      manager.goToStep('step_wrong_delivery_clean');
      assert.equal(manager.isActionAllowed('DRAG_TRASH', { item: 'delivery_tray', destination: 'trash' }), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
      assert.equal(manager.isActionAllowed('DELIVER_ORDER', { destination: 'customer' }), false);
    });
  });

  describe('5. Block 5: Preparación de Bebida & Horneado Perfecto (Cliente 1)', () => {
    let scene;
    let manager;

    beforeEach(() => {
      scene = createMockScene();
      manager = new TutorialManager(scene);
      manager.start();
    });

    test('step_drink_cup: allows cup to machine, blocks coffee/milk clicks without cup', () => {
      manager.goToStep('step_drink_cup');
      assert.equal(manager.isActionAllowed('DRAG_CUP', { destination: 'drink_machine' }), true);
      assert.equal(manager.isActionAllowed('CLICK_COFFEE'), false);
      assert.equal(manager.isActionAllowed('CLICK_MILK'), false);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
    });

    test('step_drink_coffee_btn: allows CLICK_COFFEE, BLOCKS CLICK_MILK (Client 1 only wants coffee)', () => {
      manager.goToStep('step_drink_coffee_btn');
      assert.equal(manager.isActionAllowed('CLICK_COFFEE', { drink: 'coffee', type: 'coffee_beans' }), true);
      assert.equal(manager.isActionAllowed('CLICK_MILK', { drink: 'milk', type: 'milk' }), false, 'Milk button must be blocked for Client 1');
      assert.equal(manager.isActionAllowed('DRAG_DRINK_TRAY'), false);
    });

    test('step_drink_to_tray: allows moving coffee cup to delivery tray', () => {
      manager.goToStep('step_drink_to_tray');
      assert.equal(manager.isActionAllowed('DRAG_DRINK_TRAY', { destination: 'delivery_tray' }), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), false);
      assert.equal(manager.isActionAllowed('DELIVER_ORDER'), false);
    });

    test('step_perfect_dough through step_perfect_oven_extract flow gating', () => {
      manager.goToStep('step_perfect_dough');
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'classic' }), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH', { base: 'chocolate' }), false);

      manager.goToStep('step_perfect_shape');
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'star' }), true);
      assert.equal(manager.isActionAllowed('DRAG_SHAPE', { shape: 'heart' }), false);

      manager.goToStep('step_perfect_oven_load');
      assert.equal(manager.isActionAllowed('LOAD_OVEN', { destination: 'oven' }), true);
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), false);

      manager.goToStep('step_perfect_oven_bake');
      assert.equal(manager.isActionAllowed('CLICK_BAKE'), true);
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT'), false);

      manager.goToStep('step_perfect_oven_extract');
      assert.equal(manager.isActionAllowed('CLICK_EXTRACT', { cookies: [{ bakedState: 'baked' }] }), true);
      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY'), false);

      manager.goToStep('step_perfect_cookie_to_tray');
      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY', { destination: 'delivery_tray' }), true);
      assert.equal(manager.isActionAllowed('DELIVER_ORDER'), false);

      manager.goToStep('step_patience_delivery');
      assert.equal(manager.isActionAllowed('DELIVER_ORDER', { destination: 'customer', success: true }), true);
    });
  });

  describe('6. Block 6: Toppings & Café con Leche (Cliente 2)', () => {
    let scene;
    let manager;

    beforeEach(() => {
      scene = createMockScene();
      manager = new TutorialManager(scene);
      manager.start();
    });

    test('step_topping_sprinkles: allows ONLY sprinkles jar, blocks chocolate and glazing', () => {
      manager.goToStep('step_topping_sprinkles');
      assert.equal(manager.getCurrentStep().id, 'step_topping_sprinkles');

      assert.equal(manager.isActionAllowed('DRAG_TOPPING', { topping: 'sprinkles' }), true);
      assert.equal(manager.isActionAllowed('DRAG_TOPPING', { topping: 'choco' }), false, 'Chocolate topping jar must be blocked');
      assert.equal(manager.isActionAllowed('DRAG_TOPPING', { topping: 'glazing' }), false, 'Glazing jar must be blocked');
      assert.equal(manager.isActionAllowed('DRAG_COOKIE_TRAY'), false);
    });

    test('step_client2_coffee and step_client2_milk_mix: allows precise combination brew sequence', () => {
      manager.goToStep('step_client2_coffee');
      assert.equal(manager.isActionAllowed('CLICK_COFFEE', { drink: 'coffee', type: 'coffee_beans' }), true);
      assert.equal(manager.isActionAllowed('CLICK_MILK'), false);

      manager.goToStep('step_client2_milk_mix');
      assert.equal(manager.isActionAllowed('CLICK_MILK', { drink: 'coffee_milk', type: 'milk' }), true);
      assert.equal(manager.isActionAllowed('CLICK_COFFEE'), false);
    });

    test('step_client2_delivery and step_tutorial_complete: validates perfect finale', () => {
      manager.goToStep('step_client2_delivery');
      assert.equal(manager.isActionAllowed('DELIVER_ORDER', { destination: 'customer', success: true }), true);
      assert.equal(manager.isActionAllowed('DRAG_TRASH'), false);

      manager.goToStep('step_tutorial_complete');
      assert.equal(manager.isActionAllowed('DIALOG_ACK'), true);
      assert.equal(manager.isActionAllowed('DRAG_DOUGH'), false);
    });
  });

  describe('7. DenyAction Non-Punitive Feedback Matrix', () => {
    test('denyAction triggers playUiDenied, shake tween on target object and pulses overlay', () => {
      let deniedSoundPlayed = false;
      let pulseAttentionCalled = false;

      const soundMgr = SoundManager.getInstance({ reset: true });
      soundMgr.playUiDenied = () => { deniedSoundPlayed = true; };

      const mockOverlay = {
        pulseAttention: () => { pulseAttentionCalled = true; },
        show: () => {},
        hide: () => {},
        setStep: () => {},
        destroy: () => {}
      };

      const scene = createMockScene();
      const manager = new TutorialManager(scene, { overlay: mockOverlay });
      manager.start();

      const mockTargetObj = {
        x: 300,
        y: 400,
        getData: (key) => key === 'origX' ? 300 : null
      };

      manager.denyAction(scene, mockTargetObj, 'action_denied');

      assert.equal(deniedSoundPlayed, true, 'playUiDenied must be called on denyAction');
      assert.equal(pulseAttentionCalled, true, 'overlay.pulseAttention must be called on denyAction');
      assert.ok(scene._addedTweens.length > 0, 'Shake tween must be registered on scene.tweens');

      const shakeTween = scene._addedTweens[0];
      assert.equal(shakeTween.targets, mockTargetObj);
      assert.equal(shakeTween.x, 308);
      assert.equal(shakeTween.duration, 50);
      assert.equal(shakeTween.yoyo, true);
    });

    test('denyAction gracefully handles null target or missing overlay', () => {
      const scene = createMockScene();
      const manager = new TutorialManager(scene, { overlay: null });
      manager.start();

      assert.doesNotThrow(() => {
        manager.denyAction(null, null);
      });
    });
  });

  describe('8. TutorialOverlay pulseAttention Implementation', () => {
    test('pulseAttention creates gentle scale pulse on bubbleContainer and glow on spotlightGlow', () => {
      let tweenAdded = false;
      const mockScene = {
        add: {
          container: (x, y) => ({
            x, y,
            setScale: function(s) { this.scaleX = s; this.scaleY = s; return this; },
            setDepth: function() { return this; },
            setVisible: function() { return this; },
            setAlpha: function() { return this; },
            setPosition: function() { return this; },
            add: function() { return this; },
            destroy: function() {}
          }),
          graphics: () => ({
            clear: function() { return this; },
            fillStyle: function() { return this; },
            fillRect: function() { return this; },
            fillRoundedRect: function() { return this; },
            fillCircle: function() { return this; },
            lineStyle: function() { return this; },
            strokeRoundedRect: function() { return this; },
            strokeCircle: function() { return this; },
            setPosition: function() { return this; },
            setVisible: function() { return this; },
            setDepth: function() { return this; }
          }),
          rectangle: (x, y, w, h) => ({
            x, y, width: w, height: h,
            setInteractive: function() { return this; },
            disableInteractive: function() { return this; },
            setPosition: function() { return this; },
            setSize: function() { return this; },
            setOrigin: function() { return this; },
            setVisible: function() { return this; },
            on: function() { return this; }
          }),
          text: (x, y, t) => ({
            x, y, text: t,
            setText: function() { return this; },
            setOrigin: function() { return this; },
            setVisible: function() { return this; }
          })
        },
        tweens: {
          add: (cfg) => {
            tweenAdded = true;
            return { remove: () => {} };
          },
          killTweensOf: () => {}
        },
        cameras: { main: { width: 1920, height: 1080 } }
      };

      const overlay = new TutorialOverlay(mockScene);
      overlay.show();

      assert.doesNotThrow(() => {
        overlay.pulseAttention();
      });

      assert.equal(tweenAdded, true, 'pulseAttention must schedule tweens on scene');
    });
  });

  describe('9. GameScene Handlers Source Audit & Integration Matrix', () => {
    test('GameScene.js contains isActionAllowed checks in all 7 critical interaction zones', () => {
      const gameScenePath = path.resolve(process.cwd(), 'src/scenes/GameScene.js');
      const content = fs.readFileSync(gameScenePath, 'utf8');

      // 1. Dough buttons
      assert.ok(content.includes("isActionAllowed('DRAG_DOUGH'"), 'GameScene must gate DRAG_DOUGH');
      // 2. Shape cutters
      assert.ok(content.includes("isActionAllowed('DRAG_SHAPE'"), 'GameScene must gate DRAG_SHAPE');
      // 3. Oven power, bake, extract
      assert.ok(content.includes("isActionAllowed('CLICK_POWER'"), 'GameScene must gate CLICK_POWER');
      assert.ok(content.includes("isActionAllowed('CLICK_BAKE'"), 'GameScene must gate CLICK_BAKE');
      assert.ok(content.includes("isActionAllowed('CLICK_EXTRACT'"), 'GameScene must gate CLICK_EXTRACT');
      // 4. Prep table cookie dragging (oven, tray, trash)
      assert.ok(content.includes("isActionAllowed('LOAD_OVEN'"), 'GameScene must gate LOAD_OVEN');
      assert.ok(content.includes("isActionAllowed('DRAG_COOKIE_TRAY'"), 'GameScene must gate DRAG_COOKIE_TRAY');
      assert.ok(content.includes("isActionAllowed('DRAG_TRASH'"), 'GameScene must gate DRAG_TRASH');
      // 5. Drink machine & cups
      assert.ok(content.includes("isActionAllowed('DRAG_CUP'"), 'GameScene must gate DRAG_CUP');
      assert.ok(content.includes("isActionAllowed('CLICK_COFFEE'"), 'GameScene must gate CLICK_COFFEE');
      assert.ok(content.includes("isActionAllowed('CLICK_MILK'"), 'GameScene must gate CLICK_MILK');
      assert.ok(content.includes("isActionAllowed('DRAG_DRINK_TRAY'"), 'GameScene must gate DRAG_DRINK_TRAY');
      // 6. Toppings
      assert.ok(content.includes("isActionAllowed('DRAG_TOPPING'"), 'GameScene must gate DRAG_TOPPING');
      // 7. Delivery tray delivery
      assert.ok(content.includes("isActionAllowed('DELIVER_ORDER'"), 'GameScene must gate DELIVER_ORDER');
    });

    test('GameScene.js invokes denyAction when actions are denied', () => {
      const gameScenePath = path.resolve(process.cwd(), 'src/scenes/GameScene.js');
      const content = fs.readFileSync(gameScenePath, 'utf8');

      const denyMatches = content.match(/this\.tutorialManager\.denyAction/g);
      assert.ok(denyMatches && denyMatches.length >= 10, `GameScene must invoke denyAction across all gated interaction points (found ${denyMatches ? denyMatches.length : 0})`);
    });
  });

});
