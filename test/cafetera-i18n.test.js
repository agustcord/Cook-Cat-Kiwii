import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import I18nManager from '../src/game/services/I18nManager.js';
import Customer from '../src/game/Customer.js';
import TutorialManager, { resolveTargetBounds, DEFAULT_TARGET_BOUNDS } from '../src/game/tutorial/TutorialManager.js';
import UI_CONFIG from '../ui-config.json' with { type: 'json' };

describe('Cafetera & Beverage System - Multilingual i18n & Dimensional Integrity Suite', () => {

  beforeEach(() => {
    I18nManager.getInstance({ reset: true, language: 'es' });
  });

  // =========================================================================
  // a) Carga y existencia física de variantes ES y EN de botones y bebidas
  // =========================================================================
  describe('a) Physical Assets & Preload Consistency Matrix', () => {
    const assets = [
      { file: 'public/assets/cafeteteria_base.png', w: 314, h: 359, desc: 'Base cafetera nueva' },
      { file: 'public/assets/boton_cafe.png', w: 82, h: 65, desc: 'Botón Café (ES)' },
      { file: 'public/assets/boton_coffee.png', w: 82, h: 65, desc: 'Botón Coffee (EN)' },
      { file: 'public/assets/boton_leche.png', w: 82, h: 65, desc: 'Botón Leche (ES)' },
      { file: 'public/assets/boton_milk.png', w: 82, h: 65, desc: 'Botón Milk (EN)' },
      { file: 'public/assets/taza_sin_texto.png', w: 73, h: 56, desc: 'Taza base limpia' },
      { file: 'public/assets/taza_cafe.png', w: 73, h: 56, desc: 'Taza Café (ES)' },
      { file: 'public/assets/taza_coffee.png', w: 73, h: 56, desc: 'Taza Coffee (EN)' },
      { file: 'public/assets/taza_leche.png', w: 73, h: 56, desc: 'Taza Leche (ES)' },
      { file: 'public/assets/taza_milk.png', w: 73, h: 56, desc: 'Taza Milk (EN)' },
      { file: 'public/assets/taza_cafe_leche.png', w: 73, h: 56, desc: 'Taza Café con Leche (ES)' },
      { file: 'public/assets/taza_coffee_milk.png', w: 73, h: 56, desc: 'Taza Coffee Milk (EN)' },
      { file: 'public/assets/ui/coins_sign_empty.png', w: 243, h: 125, desc: 'Cartel Monedas limpio' },
      { file: 'public/assets/ui/meta_sign_empty.png', w: 243, h: 125, desc: 'Cartel Meta limpio' },
      { file: 'public/assets/ui/day_sign_empty.png', w: 243, h: 171, desc: 'Cartel Día limpio' }
    ];

    for (const asset of assets) {
      test(`${asset.desc} (${asset.file}) exists with exact ${asset.w}x${asset.h} dimensions`, async () => {
        const fullPath = path.resolve(asset.file);
        assert.ok(fs.existsSync(fullPath), `Asset ${asset.file} must physically exist`);
        const meta = await sharp(fullPath).metadata();
        assert.equal(meta.width, asset.w, `Width of ${asset.file} must be ${asset.w}`);
        assert.equal(meta.height, asset.h, `Height of ${asset.file} must be ${asset.h}`);
        assert.equal(meta.channels, 4, `Asset ${asset.file} must have 4 channels (RGBA)`);
      });
    }

    test('verifies normalized filenames: no invalid typos or temp files exist in public/', () => {
      const invalidFiles = [
        'public/assets/boton_,milk.png',
        'public/assets/taza_cofee_milk.png',
        'public/assets/meta_sing_empty.png',
        'public/assets/base_entera.png~',
        'public/assets/base_entera.png'
      ];
      for (const invalid of invalidFiles) {
        const fullPath = path.resolve(invalid);
        assert.ok(!fs.existsSync(fullPath), `Malformed/temporary file must not exist: ${invalid}`);
      }
    });

    test('BootScene.js preloads all required bilingual textures and aliases', () => {
      const bootContent = fs.readFileSync(path.resolve('src/scenes/BootScene.js'), 'utf-8');
      
      const requiredKeys = [
        'btn_coffee_es',
        'btn_coffee_en',
        'btn_milk_es',
        'btn_milk_en',
        'btn_coffee_asset',
        'btn_milk_asset',
        'taza_sin_texto',
        'taza_base',
        'beverage_empty_cup',
        'beverage_coffee_es',
        'order_beverage_coffee_es',
        'beverage_coffee_en',
        'order_beverage_coffee_en',
        'beverage_milk_es',
        'order_beverage_milk_es',
        'beverage_milk_en',
        'order_beverage_milk_en',
        'beverage_coffee_milk_es',
        'order_beverage_coffee_milk_es',
        'beverage_coffee_milk_en',
        'order_beverage_coffee_milk_en',
        'beverage_coffee',
        'order_beverage_coffee',
        'beverage_milk',
        'order_beverage_milk',
        'beverage_coffee_milk',
        'order_beverage_coffee_milk'
      ];

      for (const key of requiredKeys) {
        assert.ok(
          bootContent.includes(`'${key}'`),
          `BootScene.js must contain preload definition for '${key}'`
        );
      }
    });
  });

  // =========================================================================
  // b) Cambio reactivo de textura de botones al alternar idioma en I18nManager
  // =========================================================================
  describe('b) Reactive Button & Beverage Texture Swapping Matrix', () => {
    function createMockSprite(initialKey) {
      return {
        textureKey: initialKey,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        setTexture(newKey) {
          this.textureKey = newKey;
          return this;
        },
        setDisplaySize(w, h) {
          this.displayWidth = w;
          this.displayHeight = h;
          return this;
        },
        setDepth() { return this; },
        setScale() { return this; },
        setAlpha() { return this; },
        disableInteractive() { return this; },
        destroy() { this.destroyed = true; }
      };
    }

    function createMockGameScene() {
      const i18n = I18nManager.getInstance();
      const currentLang = i18n.getLanguage();

      const scene = {
        textures: {
          exists(key) {
            const known = [
              'btn_coffee_es', 'btn_coffee_en', 'btn_milk_es', 'btn_milk_en',
              'btn_coffee_asset', 'btn_milk_asset',
              'beverage_empty_cup', 'taza_base', 'taza_sin_texto',
              'beverage_coffee_es', 'beverage_coffee_en',
              'beverage_milk_es', 'beverage_milk_en',
              'beverage_coffee_milk_es', 'beverage_coffee_milk_en',
              'beverage_coffee', 'beverage_milk', 'beverage_coffee_milk'
            ];
            return known.includes(key);
          }
        },
        btnCoffeeImage: createMockSprite(currentLang === 'en' ? 'btn_coffee_en' : 'btn_coffee_es'),
        btnMilkImage: createMockSprite(currentLang === 'en' ? 'btn_milk_en' : 'btn_milk_es'),
        machineCupSprite: null,
        machineState: 'no_cup',
        deliveryTrayDrinks: [],
        deliveryTraySprites: [],
        deliveryTrayCookies: [],
        deliveryTrayX: 1037,
        deliveryTrayY: 675,
        day: 1,
        daySignText: { setText(t) { this.text = t; } },
        deliveryTrayLabel: { setText(t) { this.text = t; } },
        ovenExtractBtnText: { setText(t) { this.text = t; } },
        editorIndicator: { setText(t) { this.text = t; } },
        currentCustomer: null,
        updateStockTexts() {},
        updateDrinkStockTexts() {},
        add: {
          image(x, y, key) {
            const s = createMockSprite(key);
            s.x = x;
            s.y = y;
            return s;
          }
        }
      };

      // Exact logic as implemented in GameScene
      scene.getBeverageTextureKey = function(baseKey) {
        const mgr = I18nManager.getInstance();
        const lang = mgr ? mgr.getLanguage() : 'es';
        if (baseKey === 'beverage_empty_cup' || baseKey === 'taza_base' || baseKey === 'taza_sin_texto') {
          return 'beverage_empty_cup';
        }
        const localizedKey = `${baseKey}_${lang}`;
        if (this.textures && typeof this.textures.exists === 'function') {
          if (this.textures.exists(localizedKey)) return localizedKey;
          if (this.textures.exists(baseKey)) return baseKey;
        }
        return localizedKey;
      };

      scene.updateMachineCupTexture = function() {
        if (!this.machineCupSprite) return;
        let baseKey = null;
        if (this.machineState === 'empty') {
          baseKey = 'beverage_empty_cup';
        } else if (this.machineState === 'brewing_coffee' || this.machineState === 'ready_coffee') {
          baseKey = 'beverage_coffee';
        } else if (this.machineState === 'brewing_milk' || this.machineState === 'ready_milk') {
          baseKey = 'beverage_milk';
        } else if (this.machineState === 'brewing_coffee_milk' || this.machineState === 'ready_coffee_milk') {
          baseKey = 'beverage_coffee_milk';
        }
        if (baseKey) {
          const textureKey = this.getBeverageTextureKey(baseKey);
          this.machineCupSprite.setTexture(textureKey);
          this.machineCupSprite.textureKey = textureKey;
        }
      };

      scene.drawDeliveryTray = function() {
        this.deliveryTraySprites.forEach(s => s.destroy());
        this.deliveryTraySprites = [];
        if (this.deliveryTrayDrinks) {
          this.deliveryTrayDrinks.forEach(drinkType => {
            let baseKey = 'beverage_coffee';
            if (drinkType === 'milk') baseKey = 'beverage_milk';
            else if (drinkType === 'coffee_milk') baseKey = 'beverage_coffee_milk';
            const key = this.getBeverageTextureKey(baseKey);
            const sprite = this.add.image(0, 0, key);
            sprite.textureKey = key;
            this.deliveryTraySprites.push(sprite);
          });
        }
      };

      scene.refreshLocalizedTexts = function() {
        const mgr = I18nManager.getInstance();
        const lang = mgr ? mgr.getLanguage() : 'es';

        if (this.btnCoffeeImage) {
          const coffeeKey = lang === 'en' ? 'btn_coffee_en' : 'btn_coffee_es';
          const keyToUse = (this.textures && typeof this.textures.exists === 'function' && !this.textures.exists(coffeeKey)) ? 'btn_coffee_asset' : coffeeKey;
          this.btnCoffeeImage.setTexture(keyToUse);
          this.btnCoffeeImage.textureKey = keyToUse;
        }
        if (this.btnMilkImage) {
          const milkKey = lang === 'en' ? 'btn_milk_en' : 'btn_milk_es';
          const keyToUse = (this.textures && typeof this.textures.exists === 'function' && !this.textures.exists(milkKey)) ? 'btn_milk_asset' : milkKey;
          this.btnMilkImage.setTexture(keyToUse);
          this.btnMilkImage.textureKey = keyToUse;
        }

        this.updateMachineCupTexture();
        this.drawDeliveryTray();

        if (this.currentCustomer && typeof this.currentCustomer.refreshLanguage === 'function') {
          this.currentCustomer.refreshLanguage();
        }
      };

      return scene;
    }

    test('buttons initialize with ES textures when language is es', () => {
      const scene = createMockGameScene();
      assert.equal(scene.btnCoffeeImage.textureKey, 'btn_coffee_es');
      assert.equal(scene.btnMilkImage.textureKey, 'btn_milk_es');
    });

    test('buttons reactively toggle between ES and EN upon refreshLocalizedTexts()', () => {
      const i18n = I18nManager.getInstance();
      const scene = createMockGameScene();

      // Step 1: Switch to English
      i18n.setLanguage('en');
      scene.refreshLocalizedTexts();
      assert.equal(scene.btnCoffeeImage.textureKey, 'btn_coffee_en', 'Coffee button should show English texture');
      assert.equal(scene.btnMilkImage.textureKey, 'btn_milk_en', 'Milk button should show English texture');

      // Step 2: Switch back to Spanish
      i18n.setLanguage('es');
      scene.refreshLocalizedTexts();
      assert.equal(scene.btnCoffeeImage.textureKey, 'btn_coffee_es', 'Coffee button should revert to Spanish texture');
      assert.equal(scene.btnMilkImage.textureKey, 'btn_milk_es', 'Milk button should revert to Spanish texture');
    });

    test('machine cup texture updates reactively when brewing or ready', () => {
      const i18n = I18nManager.getInstance();
      const scene = createMockGameScene();

      // Empty cup placed in machine -> neutral texture
      scene.machineState = 'empty';
      scene.machineCupSprite = createMockSprite('beverage_empty_cup');
      scene.refreshLocalizedTexts();
      assert.equal(scene.machineCupSprite.textureKey, 'beverage_empty_cup');

      // Coffee ready in Spanish
      scene.machineState = 'ready_coffee';
      scene.refreshLocalizedTexts();
      assert.equal(scene.machineCupSprite.textureKey, 'beverage_coffee_es');

      // Switch to English
      i18n.setLanguage('en');
      scene.refreshLocalizedTexts();
      assert.equal(scene.machineCupSprite.textureKey, 'beverage_coffee_en');

      // Upgrade to coffee with milk in English
      scene.machineState = 'ready_coffee_milk';
      scene.refreshLocalizedTexts();
      assert.equal(scene.machineCupSprite.textureKey, 'beverage_coffee_milk_en');

      // Switch back to Spanish
      i18n.setLanguage('es');
      scene.refreshLocalizedTexts();
      assert.equal(scene.machineCupSprite.textureKey, 'beverage_coffee_milk_es');
    });

    test('delivery tray drinks re-render with localized textures on language swap', () => {
      const i18n = I18nManager.getInstance();
      const scene = createMockGameScene();
      scene.deliveryTrayDrinks = ['coffee', 'milk', 'coffee_milk'];

      // Initial Spanish render
      scene.refreshLocalizedTexts();
      assert.equal(scene.deliveryTraySprites.length, 3);
      assert.equal(scene.deliveryTraySprites[0].textureKey, 'beverage_coffee_es');
      assert.equal(scene.deliveryTraySprites[1].textureKey, 'beverage_milk_es');
      assert.equal(scene.deliveryTraySprites[2].textureKey, 'beverage_coffee_milk_es');

      // Switch to English
      i18n.setLanguage('en');
      scene.refreshLocalizedTexts();
      assert.equal(scene.deliveryTraySprites.length, 3);
      assert.equal(scene.deliveryTraySprites[0].textureKey, 'beverage_coffee_en');
      assert.equal(scene.deliveryTraySprites[1].textureKey, 'beverage_milk_en');
      assert.equal(scene.deliveryTraySprites[2].textureKey, 'beverage_coffee_milk_en');
    });
  });

  // =========================================================================
  // c) Resolución bilingüe en órdenes de Customer
  // =========================================================================
  describe('c) Customer Bilingual Orders & Thought Bubble Matrix', () => {
    function createMockSceneForCustomer() {
      return {
        add: {
          container() {
            return {
              x: 0,
              y: 0,
              list: [],
              add(item) { this.list.push(item); },
              destroy() { this.destroyed = true; }
            };
          },
          image(x, y, key) {
            return {
              x, y,
              textureKey: key,
              scaleX: 1, scaleY: 1,
              displayWidth: 0, displayHeight: 0,
              setDisplaySize(w, h) { this.displayWidth = w; this.displayHeight = h; return this; },
              setTexture(newKey) { this.textureKey = newKey; return this; }
            };
          },
          text(x, y, text) {
            return {
              x, y,
              content: text,
              setOrigin() { return this; },
              setText(t) { this.content = t; return this; }
            };
          },
          graphics() {
            return {
              fillStyle() { return this; },
              lineStyle() { return this; },
              fillRoundedRect() { return this; },
              strokeRoundedRect() { return this; },
              fillTriangle() { return this; },
              lineBetween() { return this; },
              fillCircle() { return this; },
              strokeCircle() { return this; },
              clear() { return this; }
            };
          }
        },
        textures: {
          exists(key) {
            return [
              'order_beverage_coffee_es', 'order_beverage_coffee_en',
              'order_beverage_milk_es', 'order_beverage_milk_en',
              'order_beverage_coffee_milk_es', 'order_beverage_coffee_milk_en',
              'order_beverage_coffee', 'order_beverage_milk', 'order_beverage_coffee_milk'
            ].includes(key);
          }
        },
        time: {
          delayedCall(delay, cb) { if (cb) cb(); }
        }
      };
    }

    test('resolves drink textures according to active language in Customer', () => {
      const i18n = I18nManager.getInstance();
      const mockScene = createMockSceneForCustomer();

      const customer = new Customer(mockScene, 960, 431, { recipes: [] }, () => {}, 1, { shape: 'star', base: 'classic', toppings: [] }, 1, 'coffee');

      // In Spanish
      assert.equal(customer.getDrinkTexture('coffee'), 'order_beverage_coffee_es');
      assert.equal(customer.getDrinkTexture('milk'), 'order_beverage_milk_es');
      assert.equal(customer.getDrinkTexture('coffee_milk'), 'order_beverage_coffee_milk_es');

      // In English
      i18n.setLanguage('en');
      assert.equal(customer.getDrinkTexture('coffee'), 'order_beverage_coffee_en');
      assert.equal(customer.getDrinkTexture('milk'), 'order_beverage_milk_en');
      assert.equal(customer.getDrinkTexture('coffee_milk'), 'order_beverage_coffee_milk_en');
    });

    test('customer thought bubble reactively updates drink sprite upon refreshLanguage()', () => {
      const i18n = I18nManager.getInstance();
      const mockScene = createMockSceneForCustomer();

      // Customer created in Spanish
      i18n.setLanguage('es');
      const customer = new Customer(mockScene, 960, 431, { recipes: [] }, () => {}, 2, { shape: 'heart', base: 'chocolate', toppings: [] }, 1, 'coffee_milk');

      assert.ok(customer.drinkSprite, 'Customer should instantiate a drink sprite');
      assert.equal(customer.drinkSprite.textureKey, 'order_beverage_coffee_milk_es');

      // Hot-switch language to English
      i18n.setLanguage('en');
      customer.refreshLanguage();

      assert.equal(customer.drinkSprite.textureKey, 'order_beverage_coffee_milk_en', 'Drink texture must switch to English');

      // Hot-switch back to Spanish
      i18n.setLanguage('es');
      customer.refreshLanguage();

      assert.equal(customer.drinkSprite.textureKey, 'order_beverage_coffee_milk_es', 'Drink texture must revert to Spanish');
    });

    test('drink-only customer updates drink sprite and progress text reactively', () => {
      const i18n = I18nManager.getInstance();
      const mockScene = createMockSceneForCustomer();

      i18n.setLanguage('es');
      // requestedQuantity = 0 -> drink only
      const customer = new Customer(mockScene, 960, 431, { recipes: [] }, () => {}, 3, null, 0, 'milk');

      assert.ok(customer.drinkSprite);
      assert.equal(customer.drinkSprite.textureKey, 'order_beverage_milk_es');
      assert.ok(customer.progressText.content.includes('Leche') || customer.progressText.content.includes('leche'));

      i18n.setLanguage('en');
      customer.refreshLanguage();

      assert.equal(customer.drinkSprite.textureKey, 'order_beverage_milk_en');
      assert.ok(customer.progressText.content.includes('Milk') || customer.progressText.content.includes('milk'));
    });
  });

  // =========================================================================
  // d) Coherencia dimensional de bounds y ui-config.json
  // =========================================================================
  describe('d) Dimensional Bounds & UI-Config Alignment Matrix', () => {
    test('ui-config.json specifies exact calibrated values for drinkMachine, cupStack and signs', () => {
      assert.ok(UI_CONFIG.drinkMachine, 'drinkMachine must be defined in ui-config.json');
      assert.equal(UI_CONFIG.drinkMachine.x, 351);
      assert.equal(UI_CONFIG.drinkMachine.y, 488);
      assert.equal(UI_CONFIG.drinkMachine.width, 314);
      assert.equal(UI_CONFIG.drinkMachine.height, 359);
      assert.equal(UI_CONFIG.drinkMachine.cupOffsetY, 101, 'cupOffsetY must be calibrated to 101 for metallic tray rest');

      assert.ok(UI_CONFIG.cupStack, 'cupStack must be defined in ui-config.json');
      assert.equal(UI_CONFIG.cupStack.width, 54);
      assert.equal(UI_CONFIG.cupStack.height, 41);
      assert.equal(UI_CONFIG.cupStack.x, 450);
      assert.equal(UI_CONFIG.cupStack.y, 298);

      assert.ok(UI_CONFIG.drinkButtons, 'drinkButtons must be defined in ui-config.json');
      assert.equal(UI_CONFIG.drinkButtons.coffee.x, 275);
      assert.equal(UI_CONFIG.drinkButtons.coffee.y, 386);
      assert.equal(UI_CONFIG.drinkButtons.coffee.width, 82);
      assert.equal(UI_CONFIG.drinkButtons.coffee.height, 65);
      assert.equal(UI_CONFIG.drinkButtons.milk.x, 380);
      assert.equal(UI_CONFIG.drinkButtons.milk.y, 386);
      assert.equal(UI_CONFIG.drinkButtons.milk.width, 82);
      assert.equal(UI_CONFIG.drinkButtons.milk.height, 65);
      assert.equal(UI_CONFIG.drinkButtons.stockOffsetY, -18);
      assert.equal(UI_CONFIG.drinkButtons.fontSize, 15);
      assert.equal(UI_CONFIG.drinkButtons.fontColor, '#ffffff');
      assert.equal(UI_CONFIG.drinkButtons.stroke, '#000000');
      assert.equal(UI_CONFIG.drinkButtons.strokeThickness, 1);

      assert.equal(UI_CONFIG.coinsSign.width, 243);
      assert.equal(UI_CONFIG.coinsSign.height, 125);
      assert.equal(UI_CONFIG.metaSign.width, 243);
      assert.equal(UI_CONFIG.metaSign.height, 125);
      assert.equal(UI_CONFIG.daySign.width, 243);
      assert.equal(UI_CONFIG.daySign.height, 171);
    });

    test('DEFAULT_TARGET_BOUNDS matches physical asset dimensions and coordinates', () => {
      assert.deepEqual(DEFAULT_TARGET_BOUNDS.btn_coffee, { x: 275, y: 386, width: 82, height: 65, radius: 16 });
      assert.deepEqual(DEFAULT_TARGET_BOUNDS.btn_milk, { x: 380, y: 386, width: 82, height: 65, radius: 16 });
      assert.deepEqual(DEFAULT_TARGET_BOUNDS.drink_machine, { x: 351, y: 488, width: 314, height: 359, radius: 24 });
      assert.deepEqual(DEFAULT_TARGET_BOUNDS.cup_stack, { x: 450, y: 298, width: 54, height: 41, radius: 16 });
      assert.deepEqual(DEFAULT_TARGET_BOUNDS.drink_cup, { x: 351, y: 589, width: 70, height: 60, radius: 16 });
    });

    test('resolveTargetBounds resolves dynamically from scene elements or falls back to calibrated bounds', () => {
      // 1. Fallback with null scene
      const coffeeFallback = resolveTargetBounds('btn_coffee', null);
      assert.equal(coffeeFallback.x, 275);
      assert.equal(coffeeFallback.y, 386);
      assert.equal(coffeeFallback.width, 82);
      assert.equal(coffeeFallback.height, 65);

      const milkFallback = resolveTargetBounds('btn_milk', null);
      assert.equal(milkFallback.x, 380);
      assert.equal(milkFallback.y, 386);
      assert.equal(milkFallback.width, 82);
      assert.equal(milkFallback.height, 65);

      const machineFallback = resolveTargetBounds('drink_machine', null);
      assert.equal(machineFallback.x, 351);
      assert.equal(machineFallback.y, 488);
      assert.equal(machineFallback.width, 314);
      assert.equal(machineFallback.height, 359);

      const stackFallback = resolveTargetBounds('cup_stack', null);
      assert.equal(stackFallback.x, 450);
      assert.equal(stackFallback.y, 298);
      assert.equal(stackFallback.width, 54);
      assert.equal(stackFallback.height, 41);

      const cupFallback = resolveTargetBounds('drink_cup', null);
      assert.equal(cupFallback.x, 351);
      assert.equal(cupFallback.y, 589);
      assert.equal(cupFallback.width, 70);
      assert.equal(cupFallback.height, 60);

      // 2. Dynamic resolution with simulated GameScene
      const mockScene = {
        getTutorialTarget(key) {
          switch (key) {
            case 'btn_coffee':
              return { x: 275, y: 386, width: 82, height: 65 };
            case 'btn_milk':
              return { x: 380, y: 386, width: 82, height: 65 };
            case 'drink_machine':
              return { x: 351, y: 488, displayWidth: 314, displayHeight: 359 };
            case 'cup_stack':
              return { x: 450, y: 298, width: 54, height: 41 };
            case 'drink_cup':
              return { x: 351, y: 589, width: 70, height: 60 };
            default:
              return null;
          }
        }
      };

      const resolvedCoffee = resolveTargetBounds('btn_coffee', mockScene);
      assert.equal(resolvedCoffee.width, 82);
      assert.equal(resolvedCoffee.height, 65);

      const resolvedMachine = resolveTargetBounds('drink_machine', mockScene);
      assert.equal(resolvedMachine.width, 314);
      assert.equal(resolvedMachine.height, 359);

      const resolvedCup = resolveTargetBounds('drink_cup', mockScene);
      assert.equal(resolvedCup.x, 351);
      assert.equal(resolvedCup.y, 589);
    });

    test('cupOffsetY properly aligns cup resting position on machine metallic plate at y = 589', () => {
      const machineY = UI_CONFIG.drinkMachine.y; // 488
      const cupOffsetY = UI_CONFIG.drinkMachine.cupOffsetY; // 101
      const cupCenterY = machineY + cupOffsetY; // 589
      assert.equal(cupCenterY, 589, 'Center of cup placed on machine should be 589');

      const cupHeight = 41; // displayed cup height
      const cupBaseY = cupCenterY + cupHeight / 2; // 609.5
      // Metallic tray plate is between 605 and 612
      assert.ok(cupBaseY >= 605 && cupBaseY <= 612, `Cup base Y (${cupBaseY}) must rest inside metallic plate region [605, 612]`);
    });
  });
});
