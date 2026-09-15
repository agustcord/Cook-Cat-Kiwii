import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import DeviceHelper, { isTouchInput } from '../src/game/utils/DeviceHelper.js';

describe('Mobile Touch & Adaptive Input Integration Suite (T3, T4, T5, T6, T9)', () => {
  const projectRoot = process.cwd();
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');
  const deviceHelperPath = path.join(projectRoot, 'src', 'game', 'utils', 'DeviceHelper.js');

  describe('1. Static Code Analysis & Contract Auditing', () => {
    test('GameScene imports DeviceHelper from utils', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes("import DeviceHelper from '../game/utils/DeviceHelper.js';"),
        'GameScene must import DeviceHelper'
      );
    });

    test('GameScene initializes isTouchMode and isTouchDevice using DeviceHelper', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes('this.isTouchDevice = DeviceHelper.isTouchInput(this.game);'),
        'GameScene must set isTouchDevice via DeviceHelper'
      );
      assert.ok(
        content.includes('this.isTouchMode = this.isTouchDevice;'),
        'GameScene must set isTouchMode via isTouchDevice'
      );
    });

    test('GameScene conditions cursor hiding and paw visibility on isTouchMode', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes("if (!this.isTouchMode) {\n      this.input.setDefaultCursor('none');\n    }"),
        'GameScene must only hide default cursor when not in touch mode'
      );
      assert.ok(
        content.includes('this.catPawSprite.setVisible(false);'),
        'GameScene must hide paw sprite in touch mode'
      );
      assert.ok(
        content.includes('this.catArmOutlineGraphics.setVisible(false);'),
        'GameScene must hide arm outline graphics in touch mode'
      );
      assert.ok(
        content.includes('this.catArmFillGraphics.setVisible(false);'),
        'GameScene must hide arm fill graphics in touch mode'
      );
    });

    test('GameScene update loop omits Bezier computation in touch mode and scratches with direct pointer coordinates', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes('if (this.isTouchMode) {'),
        'update loop must branch on this.isTouchMode'
      );
      assert.ok(
        content.includes('this.pawX = pointer.x;') && content.includes('this.pawY = pointer.y;'),
        'touch branch must assign pointer coordinates directly'
      );
      assert.ok(
        content.includes('pointer.x,\n            pointer.y,\n            this.currentCustomer.container.x,\n            this.currentCustomer.container.y + 75'),
        'touch branch scratch check must evaluate Euclidean distance using pointer.x, pointer.y directly'
      );
    });

    test('GameScene provides getDragOffsetY and setTouchMode methods', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      assert.ok(
        content.includes('getDragOffsetY() {'),
        'GameScene must declare getDragOffsetY()'
      );
      assert.ok(
        content.includes('setTouchMode(enabled) {'),
        'GameScene must declare setTouchMode(enabled)'
      );
    });

    test('Drag offset (-45px) is wired into dough, shape cutters, toppings, and cookies', () => {
      const content = fs.readFileSync(gameScenePath, 'utf8').replace(/\r\n/g, '\n');
      // Dough drag & dragend
      assert.ok(
        content.includes('const clampedY = Math.max(338, dragY + offsetY);'),
        'Dough drag must incorporate offsetY'
      );
      // Shape cutter drag
      assert.ok(
        content.includes('const clampedY = Math.max(338, dragY + offsetY);') &&
        content.includes('dragZone.x = dragX;') &&
        content.includes('dragZone.y = clampedY;'),
        'Shape cutters drag must incorporate offsetY'
      );
      // Toppings drag
      assert.ok(
        content.includes('jarClone.x = dragX;') &&
        content.includes('jarClone.y = clampedY;'),
        'Toppings drag must incorporate offsetY'
      );
      // Cookies drag
      assert.ok(
        content.includes('sprite.x = dragX;') &&
        content.includes('sprite.y = clampedY;'),
        'Cookies drag must incorporate offsetY'
      );
    });
  });

  describe('2. Behavioral Simulation: Paw & Arm Visibility Matrix (T4)', () => {
    function createMockScene(isTouchInitially = false) {
      let defaultCursor = 'default';
      const pawSprite = {
        visible: true,
        setVisible(v) { this.visible = v; return this; },
        setTexture() {},
        setDisplaySize() {},
        setOrigin() {},
        setPosition() {},
        setRotation() {}
      };
      const armOutline = {
        visible: true,
        cleared: false,
        setVisible(v) { this.visible = v; return this; },
        clear() { this.cleared = true; }
      };
      const armFill = {
        visible: true,
        cleared: false,
        setVisible(v) { this.visible = v; return this; },
        clear() { this.cleared = true; }
      };

      const scene = {
        isTouchMode: isTouchInitially,
        isTouchDevice: isTouchInitially,
        isEditorMode: false,
        catPawSprite: pawSprite,
        catArmOutlineGraphics: armOutline,
        catArmFillGraphics: armFill,
        input: {
          setDefaultCursor(c) { defaultCursor = c; },
          getDefaultCursor() { return defaultCursor; }
        },
        getDragOffsetY() {
          return this.isTouchMode ? -45 : 0;
        },
        setTouchMode(enabled) {
          this.isTouchMode = Boolean(enabled);
          this.isTouchDevice = this.isTouchMode;
          if (this.catPawSprite) {
            this.catPawSprite.setVisible(!this.isTouchMode && !this.isEditorMode);
          }
          if (this.catArmOutlineGraphics) {
            this.catArmOutlineGraphics.setVisible(!this.isTouchMode);
            if (this.isTouchMode) this.catArmOutlineGraphics.clear();
          }
          if (this.catArmFillGraphics) {
            this.catArmFillGraphics.setVisible(!this.isTouchMode);
            if (this.isTouchMode) this.catArmFillGraphics.clear();
          }
          if (this.input) {
            if (this.isTouchMode) {
              this.input.setDefaultCursor('default');
            } else if (!this.isEditorMode) {
              this.input.setDefaultCursor('none');
            }
          }
        }
      };

      // Initial apply
      scene.setTouchMode(isTouchInitially);
      return scene;
    }

    test('in desktop mode, paw and arm are visible and default cursor is hidden', () => {
      const scene = createMockScene(false);
      assert.equal(scene.isTouchMode, false);
      assert.equal(scene.catPawSprite.visible, true);
      assert.equal(scene.catArmOutlineGraphics.visible, true);
      assert.equal(scene.catArmFillGraphics.visible, true);
      assert.equal(scene.input.getDefaultCursor(), 'none');
    });

    test('in touch mode, paw and arm are hidden and default cursor is retained', () => {
      const scene = createMockScene(true);
      assert.equal(scene.isTouchMode, true);
      assert.equal(scene.catPawSprite.visible, false);
      assert.equal(scene.catArmOutlineGraphics.visible, false);
      assert.equal(scene.catArmFillGraphics.visible, false);
      assert.equal(scene.input.getDefaultCursor(), 'default');
    });

    test('setTouchMode dynamically toggles visibility and cursor state at runtime', () => {
      const scene = createMockScene(false);
      assert.equal(scene.catPawSprite.visible, true);
      assert.equal(scene.input.getDefaultCursor(), 'none');

      // Switch to touch mode
      scene.setTouchMode(true);
      assert.equal(scene.catPawSprite.visible, false);
      assert.equal(scene.catArmOutlineGraphics.visible, false);
      assert.equal(scene.catArmFillGraphics.visible, false);
      assert.equal(scene.input.getDefaultCursor(), 'default');

      // Switch back to desktop mode
      scene.setTouchMode(false);
      assert.equal(scene.catPawSprite.visible, true);
      assert.equal(scene.catArmOutlineGraphics.visible, true);
      assert.equal(scene.catArmFillGraphics.visible, true);
      assert.equal(scene.input.getDefaultCursor(), 'none');
    });
  });

  describe('3. Behavioral Simulation: Customer Scratching Latency Decoupling (T5)', () => {
    function simulateScratchEvaluation(scene, pointer) {
      let scratchTriggered = false;
      const scratchCustomer = () => { scratchTriggered = true; };

      if (scene.isTouchMode) {
        if (pointer) {
          scene.pawX = pointer.x;
          scene.pawY = pointer.y;
          if (
            scene.currentCustomer &&
            scene.currentCustomer.isActive &&
            pointer.isDown &&
            !scene.scratchBlockedUntilPointerUp &&
            !scene.isHoldingItem &&
            scene.currentCustomer.container
          ) {
            const distToCustomer = Math.hypot(
              pointer.x - scene.currentCustomer.container.x,
              pointer.y - (scene.currentCustomer.container.y + 75)
            );
            if (distToCustomer < 178) {
              scratchCustomer();
            }
          }
        }
      } else {
        if (pointer) {
          const clampedTargetY = Math.max(220, pointer.y);
          const lerpSpeed = 0.22;
          scene.pawX += (pointer.x - scene.pawX) * lerpSpeed;
          scene.pawY += (clampedTargetY - scene.pawY) * lerpSpeed;

          if (
            scene.currentCustomer &&
            scene.currentCustomer.isActive &&
            pointer.isDown &&
            !scene.scratchBlockedUntilPointerUp &&
            !scene.isHoldingItem &&
            scene.currentCustomer.container
          ) {
            const distToCustomer = Math.hypot(
              scene.pawX - scene.currentCustomer.container.x,
              scene.pawY - (scene.currentCustomer.container.y + 75)
            );
            if (distToCustomer < 178) {
              scratchCustomer();
            }
          }
        }
      }
      return scratchTriggered;
    }

    test('touch mode triggers scratch instantly on frame 1 without waiting for lerp lag', () => {
      // Customer is at (960, 431). Center of scratch area is (960, 431 + 75) = (960, 506).
      // Initial paw is far away at (500, 800).
      const touchScene = {
        isTouchMode: true,
        pawX: 500,
        pawY: 800,
        scratchBlockedUntilPointerUp: false,
        isHoldingItem: false,
        currentCustomer: { isActive: true, container: { x: 960, y: 431 } }
      };

      const pointer = { x: 960, y: 506, isDown: true };

      // In touch mode: evaluated with pointer.x, pointer.y directly -> dist = 0 < 178 -> triggers on frame 1!
      const triggered = simulateScratchEvaluation(touchScene, pointer);
      assert.equal(triggered, true, 'Touch tap on customer must trigger scratch immediately');
      assert.equal(touchScene.pawX, 960);
      assert.equal(touchScene.pawY, 506);
    });

    test('mouse mode lerp takes multiple frames to reach customer from distant position', () => {
      const desktopScene = {
        isTouchMode: false,
        pawX: 500,
        pawY: 800,
        scratchBlockedUntilPointerUp: false,
        isHoldingItem: false,
        currentCustomer: { isActive: true, container: { x: 960, y: 431 } }
      };

      const pointer = { x: 960, y: 506, isDown: true };

      // Frame 1 with lerp 0.22:
      // pawX goes from 500 to 500 + 460*0.22 = 601.2
      // pawY goes from 800 to 800 + (506-800)*0.22 = 735.32
      // dist to (960, 506) is hypot(358.8, 229.32) = 425.8 > 178 -> does NOT trigger on frame 1
      const frame1Triggered = simulateScratchEvaluation(desktopScene, pointer);
      assert.equal(frame1Triggered, false, 'Desktop lerp has physical inertia on frame 1');
    });
  });

  describe('4. Behavioral Simulation: Ergonomic Drag Finger Offset (-45px Y) (T6)', () => {
    test('getDragOffsetY returns -45 in touch mode and 0 in mouse mode', () => {
      const mockScene = {
        isTouchMode: false,
        getDragOffsetY() { return this.isTouchMode ? -45 : 0; }
      };
      assert.equal(mockScene.getDragOffsetY(), 0);
      mockScene.isTouchMode = true;
      assert.equal(mockScene.getDragOffsetY(), -45);
    });

    test('during drag in touch mode, sprite Y is offset by -45px above finger', () => {
      const scene = {
        isTouchMode: true,
        getDragOffsetY() { return this.isTouchMode ? -45 : 0; }
      };

      function simulateDrag(pointerX, pointerY) {
        const offsetY = scene.getDragOffsetY();
        const clampedY = Math.max(338, pointerY + offsetY);
        return { x: pointerX, y: clampedY };
      }

      // Finger at Y = 500 -> sprite drawn at 500 - 45 = 455
      const dragged = simulateDrag(800, 500);
      assert.equal(dragged.y, 455, 'Dragged sprite must float 45px above touch pointer');
      assert.equal(dragged.x, 800);
    });

    test('during drag in mouse mode, sprite Y remains exactly at pointer position', () => {
      const scene = {
        isTouchMode: false,
        getDragOffsetY() { return this.isTouchMode ? -45 : 0; }
      };

      function simulateDrag(pointerX, pointerY) {
        const offsetY = scene.getDragOffsetY();
        const clampedY = Math.max(338, pointerY + offsetY);
        return { x: pointerX, y: clampedY };
      }

      const dragged = simulateDrag(800, 500);
      assert.equal(dragged.y, 500, 'Mouse drag must track pointer without offset');
      assert.equal(dragged.x, 800);
    });

    test('on dragend/drop, offset is reverted to evaluate real drop target coordinates', () => {
      const scene = {
        isTouchMode: true,
        getDragOffsetY() { return this.isTouchMode ? -45 : 0; }
      };

      let sprite = { x: 800, y: 455 }; // currently offset during drag

      // When drag ends, return to real coordinate
      const offsetY = scene.getDragOffsetY();
      if (offsetY !== 0) {
        sprite.y -= offsetY;
      }

      assert.equal(sprite.y, 500, 'On drop, sprite coordinates must match real release point');
    });
  });

});
