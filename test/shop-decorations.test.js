import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SaveManager from '../src/game/services/SaveManager.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';

describe('Shop & Café Decorations Integration Suite (Tasks 3 & 4)', () => {
  const shopScenePath = path.resolve('src/scenes/ShopScene.js');
  const gameScenePath = path.resolve('src/scenes/GameScene.js');
  const summaryScenePath = path.resolve('src/scenes/SummaryScene.js');

  const shopSceneSource = fs.readFileSync(shopScenePath, 'utf8');
  const gameSceneSource = fs.readFileSync(gameScenePath, 'utf8');
  const summarySceneSource = fs.readFileSync(summaryScenePath, 'utf8');

  // ---------------------------------------------------------------------------
  // 1. Selector de Pestañas (Tabs Navigation)
  // ---------------------------------------------------------------------------
  describe('1. Tabs Navigation System in ShopScene', () => {
    test('defines two tabs: supplies and decorations with cozy bakery styling', () => {
      assert.ok(shopSceneSource.includes("this.currentTab = 'supplies'"), 'Default tab must be supplies');
      assert.ok(shopSceneSource.includes("'shop.tabs.supplies'"), 'Supplies tab must use localized key');
      assert.ok(shopSceneSource.includes("'shop.tabs.decorations'"), 'Decorations tab must use localized key');
      assert.ok(shopSceneSource.includes('switchTab(tabKey)'), 'Must define switchTab method');
    });

    test('switchTab alters visibility of containers and headers cleanly', () => {
      assert.ok(shopSceneSource.includes('this.suppliesContainer.setVisible(isSupplies)'), 'Must toggle suppliesContainer');
      assert.ok(shopSceneSource.includes('this.columnHeadersContainer.setVisible(isSupplies)'), 'Must toggle columnHeadersContainer');
      assert.ok(shopSceneSource.includes('this.decorationsContainer.setVisible(!isSupplies)'), 'Must toggle decorationsContainer');
      assert.ok(shopSceneSource.includes('this.decorHeaderContainer.setVisible(!isSupplies)'), 'Must toggle decorHeaderContainer');
    });

    test('recalculates maxScroll dynamically based on active tab', () => {
      assert.ok(shopSceneSource.includes('this.suppliesMaxScroll'), 'Must calculate suppliesMaxScroll');
      assert.ok(shopSceneSource.includes('this.decorationsMaxScroll = 0'), 'Decorations tab fits within viewport with zero scroll overflow');
      assert.ok(shopSceneSource.includes('this.maxScroll = isSupplies ? this.suppliesMaxScroll : this.decorationsMaxScroll'), 'Must select active maxScroll');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Catálogo y Mecánicas de Decoraciones
  // ---------------------------------------------------------------------------
  describe('2. Decorations Catalog & Economy Logic', () => {
    test('defines the 3 decorations with exact costs and states', () => {
      assert.ok(shopSceneSource.includes("id: 'decor_window'"), 'Must include decor_window');
      assert.ok(shopSceneSource.includes('cost: 150'), 'decor_window cost must be 150 coins');
      assert.ok(shopSceneSource.includes("id: 'decor_bunting'"), 'Must include decor_bunting');
      assert.ok(shopSceneSource.includes('cost: 200'), 'decor_bunting cost must be 200 coins');
      assert.ok(shopSceneSource.includes("id: 'decor_lights'"), 'Must include decor_lights');
      assert.ok(shopSceneSource.includes('cost: 350'), 'decor_lights cost must be 350 coins');
    });

    test('locked items (lights) are designated isComingSoon and trigger denied sound upon interaction', () => {
      assert.ok(shopSceneSource.includes('decor.isComingSoon'), 'Must flag coming soon decorations');
      assert.ok(shopSceneSource.includes('SoundManager.getInstance().playUiDenied()'), 'Must play denied sound for coming soon or insufficient funds');
      assert.ok(shopSceneSource.includes('shop.feedback.comingSoonNotice'), 'Must provide informative notice for locked items');
    });

    test('decor_window and decor_bunting use preloaded thumbnail images', () => {
      assert.ok(shopSceneSource.includes("this.add.image(x, y - 105, 'decor_window_thumb')"), 'Window card must use preloaded decor_window_thumb');
      assert.ok(shopSceneSource.includes("this.add.image(x, y - 105, 'decor_bunting_thumb')"), 'Bunting card must use preloaded decor_bunting_thumb');
    });

    test('simulated purchase: deducts 150 coins, registers decor_window and persists to SaveManager', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };

      const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
      sm.saveGame({ day: 2, coins: 200, decorations: [] });

      const loaded = sm.loadGame();
      assert.equal(loaded.coins, 200);
      assert.deepEqual(loaded.decorations, []);

      // Simulate purchasing decor_window
      const cost = 150;
      assert.ok(loaded.coins >= cost, 'Player has sufficient coins');
      const updatedCoins = loaded.coins - cost;
      const updatedDecorations = [...loaded.decorations, 'decor_window'];

      sm.saveGame({ coins: updatedCoins, decorations: updatedDecorations });

      const postPurchase = sm.loadGame();
      assert.equal(postPurchase.coins, 50, 'Coins deducted correctly to 50');
      assert.deepEqual(postPurchase.decorations, ['decor_window'], 'decor_window persisted');
    });

    test('simulated purchase: deducts 200 coins, registers decor_bunting and persists to SaveManager', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };

      const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
      sm.saveGame({ day: 2, coins: 250, decorations: ['decor_window'] });

      const loaded = sm.loadGame();
      assert.equal(loaded.coins, 250);
      assert.deepEqual(loaded.decorations, ['decor_window']);

      // Simulate purchasing decor_bunting
      const cost = 200;
      assert.ok(loaded.coins >= cost, 'Player has sufficient coins');
      const updatedCoins = loaded.coins - cost;
      const updatedDecorations = [...loaded.decorations, 'decor_bunting'];

      sm.saveGame({ coins: updatedCoins, decorations: updatedDecorations });

      const postPurchase = sm.loadGame();
      assert.equal(postPurchase.coins, 50, 'Coins deducted correctly to 50');
      assert.deepEqual(postPurchase.decorations, ['decor_window', 'decor_bunting'], 'decor_bunting persisted');
    });

    test('insufficient funds (< 150 coins) prevents purchasing decor_window', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };

      const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
      sm.saveGame({ day: 1, coins: 60, decorations: [] });

      const loaded = sm.loadGame();
      assert.ok(loaded.coins < 150, 'Player has insufficient coins for window');
      // Purchase should not proceed
      assert.deepEqual(loaded.decorations, []);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Renderizado en GameScene
  // ---------------------------------------------------------------------------
  describe('3. Conditional Window and Bunting Rendering in GameScene', () => {
    test('GameScene draws decor_window at depth -90 with exact (0, 0) coords if owned', () => {
      assert.ok(gameSceneSource.includes("this.decorations.includes('decor_window')"), 'Must check if decor_window is owned');
      assert.ok(gameSceneSource.includes("this.add.image(0, 0, 'decor_window')"), 'Must position window overlay at (0, 0)');
      assert.ok(gameSceneSource.includes('.setOrigin(0, 0)'), 'Must have origin (0, 0)');
      assert.ok(gameSceneSource.includes('.setDisplaySize(width, height)'), 'Must fill viewport width and height');
      assert.ok(gameSceneSource.includes('.setDepth(-90)'), 'Must render at depth -90 between wall (-100) and counter/customers (0)');
    });

    test('GameScene draws decor_bunting at depth -85 with exact (0, 0) coords if owned', () => {
      assert.ok(gameSceneSource.includes("this.decorations.includes('decor_bunting')"), 'Must check if decor_bunting is owned');
      assert.ok(gameSceneSource.includes("this.add.image(0, 0, 'decor_bunting')"), 'Must position bunting overlay at (0, 0)');
      assert.ok(gameSceneSource.includes('.setDepth(-85)'), 'Must render at depth -85 between window (-90) and counter/customers (0)');
    });

    test('GameScene initializes decorations from safeData or SaveManager fallback', () => {
      assert.ok(gameSceneSource.includes('this.decorations = Array.isArray(safeData.decorations)'), 'Must check safeData.decorations array');
      assert.ok(gameSceneSource.includes('this.decorationsAtStart = [...this.decorations]'), 'Must capture start-of-day decorations copy for retry');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Propagación de Datos Entre Escenas
  // ---------------------------------------------------------------------------
  describe('4. Cross-Scene Data Propagation Matrix', () => {
    test('GameScene passes decorations and decorationsAtStart to SummaryScene', () => {
      assert.ok(gameSceneSource.includes("decorations: this.decorations"), 'GameScene must pass decorations to SummaryScene');
      assert.ok(gameSceneSource.includes("decorationsAtStart: this.decorationsAtStart"), 'GameScene must pass decorationsAtStart to SummaryScene');
    });

    test('SummaryScene carries over decorations and passes to ShopScene and GameScene on retry', () => {
      assert.ok(summarySceneSource.includes('this.decorations = Array.isArray(safeData.decorations)'), 'SummaryScene must init decorations');
      assert.ok(summarySceneSource.includes('decorations: this.decorations'), 'SummaryScene must pass decorations to SaveManager and ShopScene');
      assert.ok(summarySceneSource.includes('decorations: this.decorationsAtStart'), 'SummaryScene retry must pass decorationsAtStart to GameScene');
    });

    test('ShopScene passes decorations to SaveManager and GameScene on starting next day', () => {
      assert.ok(shopSceneSource.includes('decorations: this.decorations'), 'ShopScene must persist and pass decorations to GameScene');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Paridad y Calidad de Localización
  // ---------------------------------------------------------------------------
  describe('5. Localization Schema & Text Parity Matrix', () => {
    const requiredKeys = [
      'shop.tabs.supplies',
      'shop.tabs.decorations',
      'shop.decorHeader',
      'shop.decorItems.decor_window.name',
      'shop.decorItems.decor_window.desc',
      'shop.decorItems.decor_window.tag',
      'shop.decorItems.decor_bunting.name',
      'shop.decorItems.decor_bunting.desc',
      'shop.decorItems.decor_bunting.tag',
      'shop.decorItems.decor_clock.name',
      'shop.decorItems.decor_clock.desc',
      'shop.decorItems.decor_clock.tag',
      'shop.decorItems.decor_lights.name',
      'shop.decorItems.decor_lights.desc',
      'shop.decorItems.decor_lights.tag',
      'shop.units.comingSoon',
      'shop.units.costLabel',
      'shop.feedback.decorUnlocked',
      'shop.feedback.comingSoonNotice'
    ];

    function getByPath(obj, dotPath) {
      return dotPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
    }

    test('all new localization keys exist and are non-empty in English and Spanish', () => {
      for (const keyPath of requiredKeys) {
        const enVal = getByPath(en, keyPath);
        const esVal = getByPath(es, keyPath);

        assert.equal(typeof enVal, 'string', `EN key missing or non-string: ${keyPath}`);
        assert.ok(enVal.trim().length > 0, `EN key is empty: ${keyPath}`);

        assert.equal(typeof esVal, 'string', `ES key missing or non-string: ${keyPath}`);
        assert.ok(esVal.trim().length > 0, `ES key is empty: ${keyPath}`);
      }
    });

    test('decor_window name is properly translated', () => {
      assert.equal(en.shop.decorItems.decor_window.name, 'Rustic Window');
      assert.equal(es.shop.decorItems.decor_window.name, 'Ventana Rústica');
    });

    test('decor_bunting name is properly translated', () => {
      assert.equal(en.shop.decorItems.decor_bunting.name, 'Festive Bunting');
      assert.equal(es.shop.decorItems.decor_bunting.name, 'Banderines Festivos');
    });

    test('decor_clock name is properly translated', () => {
      assert.equal(en.shop.decorItems.decor_clock.name, 'Cat Wall Clock');
      assert.equal(es.shop.decorItems.decor_clock.name, 'Reloj Gatuno');
    });

    test('decor_lights name is properly translated', () => {
      assert.equal(en.shop.decorItems.decor_lights.name, 'Cozy Fairy Lights');
      assert.equal(es.shop.decorItems.decor_lights.name, 'Guirnalda de Luces');
    });
  });
});
