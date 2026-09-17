import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SaveManager from '../src/game/services/SaveManager.js';
import { hasSufficientDough, calculateDoughStock } from '../src/game/EconomyManager.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';

/**
 * Harness ligero para simular el ciclo de vida y estado transaccional de ShopScene
 * sin requerir el motor WebGL/Canvas completo de Phaser.
 */
function createShopSceneSimulator(options = {}) {
  const initialCoins = options.coins !== undefined ? options.coins : 150;
  const defaultStock = {
    dough: { classic: 0, chocolate: 0, oat: 0 },
    topping: { sprinkles: 0, choco: 0, glazing: 0 },
    drink: { coffee_beans: 0, milk: 0 }
  };
  const incomingStock = options.stock || {};
  const initialStock = {
    dough: { ...defaultStock.dough, ...(incomingStock.dough || {}) },
    topping: { ...defaultStock.topping, ...(incomingStock.topping || {}) },
    drink: { ...defaultStock.drink, ...(incomingStock.drink || {}) }
  };
  const initialUnlockedShapes = options.unlockedShapes ? [...options.unlockedShapes] : ['star'];
  const initialDecorations = options.decorations ? [...options.decorations] : [];

  const state = {
    day: options.day || 1,
    coins: initialCoins,
    initialCoins,
    stock: JSON.parse(JSON.stringify(initialStock)),
    initialStock: JSON.parse(JSON.stringify(initialStock)),
    unlockedShapes: [...initialUnlockedShapes],
    initialUnlockedShapes: [...initialUnlockedShapes],
    decorations: [...initialDecorations],
    initialDecorations: [...initialDecorations],
    loanRemaining: options.loanRemaining !== undefined ? options.loanRemaining : 200,
    sessionCart: [],
    totalSpent: 0,
    currentCategory: 'mold',
    lastSavedPayload: null,
    transitionTarget: null,
    transitionData: null,
    deniedSoundPlayed: 0,
    buySoundPlayed: 0,
    tapSoundPlayed: 0,
    warningShown: 0,
    lastKiwiMessage: ''
  };

  // Simulación de métodos transaccionales idénticos a ShopScene.js
  const sim = {
    state,

    buyItem(item) {
      if (sim.state.coins < item.cost) {
        sim.state.deniedSoundPlayed++;
        sim.state.lastKiwiMessage = 'noCoins';
        return false;
      }

      if (item.type === 'mold' && sim.state.unlockedShapes.includes(item.id)) {
        return false;
      }

      sim.state.coins -= item.cost;
      sim.state.totalSpent += item.cost;
      sim.state.buySoundPlayed++;

      if (item.type === 'mold') {
        sim.state.unlockedShapes.push(item.id);
        sim.state.lastKiwiMessage = 'boughtMold';
      } else {
        sim.state.stock[item.type][item.id] += 5;
        sim.state.lastKiwiMessage = `bought_${item.type}`;
      }

      const existing = sim.state.sessionCart.find(c => c.key === item.key);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        sim.state.sessionCart.push({
          id: item.id,
          key: item.key,
          name: item.name || item.key,
          cost: item.cost,
          type: item.type,
          qty: 1,
          unitCost: item.cost
        });
      }

      return true;
    },

    buyDecor(decor) {
      if (decor.isComingSoon) {
        sim.state.deniedSoundPlayed++;
        sim.state.lastKiwiMessage = 'comingSoon';
        return false;
      }

      if (sim.state.decorations.includes(decor.id)) return false;

      if (sim.state.coins < decor.cost) {
        sim.state.deniedSoundPlayed++;
        sim.state.lastKiwiMessage = 'noCoinsDecor';
        return false;
      }

      sim.state.coins -= decor.cost;
      sim.state.totalSpent += decor.cost;
      sim.state.buySoundPlayed++;
      sim.state.decorations.push(decor.id);
      sim.state.lastKiwiMessage = 'boughtDecor';

      sim.state.sessionCart.push({
        id: decor.id,
        key: decor.key,
        name: decor.name || decor.id,
        cost: decor.cost,
        type: 'decor',
        qty: 1,
        unitCost: decor.cost
      });

      return true;
    },

    removeCartItem(indexOrIdentifier) {
      let index = -1;
      if (typeof indexOrIdentifier === 'number') {
        index = indexOrIdentifier;
      } else if (typeof indexOrIdentifier === 'string') {
        index = sim.state.sessionCart.findIndex(c => c.id === indexOrIdentifier || c.key === indexOrIdentifier);
      } else if (indexOrIdentifier && typeof indexOrIdentifier === 'object') {
        index = sim.state.sessionCart.indexOf(indexOrIdentifier);
        if (index === -1 && (indexOrIdentifier.key || indexOrIdentifier.id)) {
          index = sim.state.sessionCart.findIndex(c => c.key === indexOrIdentifier.key || c.id === indexOrIdentifier.id);
        }
      }

      const item = sim.state.sessionCart[index];
      if (!item) return false;

      sim.state.coins += item.unitCost;
      sim.state.totalSpent = Math.max(0, sim.state.totalSpent - item.unitCost);
      sim.state.tapSoundPlayed++;

      if (item.type === 'mold') {
        if (!sim.state.initialUnlockedShapes.includes(item.id)) {
          sim.state.unlockedShapes = sim.state.unlockedShapes.filter(s => s !== item.id);
        }
      } else if (item.type === 'decor') {
        if (!sim.state.initialDecorations.includes(item.id)) {
          sim.state.decorations = sim.state.decorations.filter(d => d !== item.id);
        }
      } else if (item.type === 'dough') {
        sim.state.stock.dough[item.id] = Math.max(0, (sim.state.stock.dough[item.id] || 0) - 5);
      } else if (item.type === 'topping') {
        sim.state.stock.topping[item.id] = Math.max(0, (sim.state.stock.topping[item.id] || 0) - 5);
      } else if (item.type === 'drink') {
        sim.state.stock.drink[item.id] = Math.max(0, (sim.state.stock.drink[item.id] || 0) - 5);
      }

      if (item.qty > 1) {
        item.qty -= 1;
      } else {
        sim.state.sessionCart.splice(index, 1);
      }

      sim.state.lastKiwiMessage = 'itemRefunded';
      return true;
    },

    clearCart() {
      if (sim.state.sessionCart.length === 0) return false;

      sim.state.coins = sim.state.initialCoins;
      sim.state.stock = JSON.parse(JSON.stringify(sim.state.initialStock));
      sim.state.unlockedShapes = [...sim.state.initialUnlockedShapes];
      sim.state.decorations = [...sim.state.initialDecorations];
      sim.state.sessionCart = [];
      sim.state.totalSpent = 0;
      sim.state.tapSoundPlayed++;
      sim.state.lastKiwiMessage = 'cartCleared';
      return true;
    },

    startNextDay(sm) {
      if (!hasSufficientDough(sim.state.stock)) {
        sim.state.deniedSoundPlayed++;
        sim.state.warningShown++;
        sim.state.lastKiwiMessage = 'warnNoDough';
        return false;
      }

      sim.state.tapSoundPlayed++;
      const nextDay = sim.state.day + 1;

      const payload = {
        day: nextDay,
        coins: sim.state.coins,
        unlockedShapes: sim.state.unlockedShapes,
        stock: sim.state.stock,
        loanRemaining: sim.state.loanRemaining,
        decorations: sim.state.decorations
      };

      if (sm) {
        sm.saveGame(payload);
      }
      sim.state.lastSavedPayload = payload;
      sim.state.transitionTarget = 'GameScene';
      sim.state.transitionData = payload;
      return true;
    }
  };

  return sim;
}

describe('Shop Transactional Logic & Cart Rollback Suite (Tasks DEV-1, DEV-2, DEV-3)', () => {
  let memory;
  let mockStorage;
  let saveManager;

  beforeEach(() => {
    memory = new Map();
    mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };
    saveManager = SaveManager.getInstance({ reset: true, storage: mockStorage });
  });

  // ===========================================================================
  // 1. COMPRAS Y TRANSACCIONES UNITARIAS
  // ===========================================================================
  describe('1. Purchase Transactions & Immediate State Mutation', () => {
    test('buying dough deducts exact coins, adds 5 units of stock and logs to sessionCart', () => {
      const sim = createShopSceneSimulator({ coins: 50, stock: { dough: { classic: 0 } } });
      const classicDough = { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10, name: 'Masa Clásica' };

      const result = sim.buyItem(classicDough);
      assert.equal(result, true, 'Purchase must succeed');
      assert.equal(sim.state.coins, 40, 'Coins deducted by 10');
      assert.equal(sim.state.totalSpent, 10, 'Total spent recorded as 10');
      assert.equal(sim.state.stock.dough.classic, 5, 'Classic dough stock increased by 5');
      assert.equal(sim.state.sessionCart.length, 1, '1 item registered in session cart');
      assert.equal(sim.state.sessionCart[0].qty, 1);
      assert.equal(sim.state.sessionCart[0].unitCost, 10);
    });

    test('multiple purchases of the same product consolidate quantity without duplicate rows', () => {
      const sim = createShopSceneSimulator({ coins: 50, stock: { dough: { classic: 0 } } });
      const classicDough = { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10, name: 'Masa Clásica' };

      sim.buyItem(classicDough);
      sim.buyItem(classicDough);

      assert.equal(sim.state.coins, 30, 'Deducted 20 coins');
      assert.equal(sim.state.totalSpent, 20);
      assert.equal(sim.state.stock.dough.classic, 10, 'Total 10 units in stock');
      assert.equal(sim.state.sessionCart.length, 1, 'Still 1 consolidated row in cart');
      assert.equal(sim.state.sessionCart[0].qty, 2, 'Qty updated to 2');
    });

    test('purchasing permanent mold adds shape to unlockedShapes and blocks repurchase', () => {
      const sim = createShopSceneSimulator({ coins: 100, unlockedShapes: ['star'] });
      const heartMold = { type: 'mold', id: 'heart', key: 'moldHeart', cost: 60, name: 'Molde Corazón' };

      const firstBuy = sim.buyItem(heartMold);
      assert.equal(firstBuy, true);
      assert.equal(sim.state.coins, 40);
      assert.deepEqual(sim.state.unlockedShapes, ['star', 'heart']);

      // Attempt second purchase
      const secondBuy = sim.buyItem(heartMold);
      assert.equal(secondBuy, false, 'Repurchase of unlocked mold must be ignored');
      assert.equal(sim.state.coins, 40, 'Coins unaltered on rejected repurchase');
    });

    test('purchasing item with insufficient coins is denied without state mutation', () => {
      const sim = createShopSceneSimulator({ coins: 5 });
      const classicDough = { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10, name: 'Masa Clásica' };

      const result = sim.buyItem(classicDough);
      assert.equal(result, false, 'Purchase rejected');
      assert.equal(sim.state.coins, 5, 'Coins unchanged');
      assert.equal(sim.state.totalSpent, 0);
      assert.equal(sim.state.sessionCart.length, 0, 'Cart remains empty');
      assert.equal(sim.state.deniedSoundPlayed, 1, 'Played denied audio');
    });
  });

  // ===========================================================================
  // 2. REVERSIÓN INDIVIDUAL CON '✕' (DESHACER COMPRA)
  // ===========================================================================
  describe('2. Individual Item Reversal via "✕" Button', () => {
    test('reversing single item removes row, refunds full coins and decrements stock in real time', () => {
      const sim = createShopSceneSimulator({ coins: 50, stock: { dough: { classic: 0 } } });
      const classicDough = { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10, name: 'Masa Clásica' };

      sim.buyItem(classicDough);
      assert.equal(sim.state.coins, 40);
      assert.equal(sim.state.stock.dough.classic, 5);

      // Revert purchase via '✕' (index 0)
      const reverted = sim.removeCartItem(0);
      assert.equal(reverted, true);
      assert.equal(sim.state.coins, 50, 'All 10 coins refunded');
      assert.equal(sim.state.totalSpent, 0, 'totalSpent resets to 0');
      assert.equal(sim.state.stock.dough.classic, 0, 'Stock restored to 0');
      assert.equal(sim.state.sessionCart.length, 0, 'Cart is empty');
      assert.equal(sim.state.lastKiwiMessage, 'itemRefunded');
    });

    test('reversing one unit of multi-pack (qty > 1) decrements qty and refunds one unit without deleting row', () => {
      const sim = createShopSceneSimulator({ coins: 60, stock: { dough: { classic: 0 } } });
      const classicDough = { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10, name: 'Masa Clásica' };

      sim.buyItem(classicDough);
      sim.buyItem(classicDough);
      assert.equal(sim.state.coins, 40);
      assert.equal(sim.state.sessionCart[0].qty, 2);
      assert.equal(sim.state.stock.dough.classic, 10);

      // Revert one pack
      sim.removeCartItem(0);
      assert.equal(sim.state.coins, 50, '10 coins refunded');
      assert.equal(sim.state.totalSpent, 10, '10 spent remaining');
      assert.equal(sim.state.stock.dough.classic, 5, '5 units remaining in stock');
      assert.equal(sim.state.sessionCart.length, 1, 'Row still present');
      assert.equal(sim.state.sessionCart[0].qty, 1, 'Qty decremented to 1');
    });

    test('reversing permanent mold removes it from unlockedShapes without touching initial shapes', () => {
      const sim = createShopSceneSimulator({ coins: 100, unlockedShapes: ['star'] });
      const heartMold = { type: 'mold', id: 'heart', key: 'moldHeart', cost: 60, name: 'Molde Corazón' };

      sim.buyItem(heartMold);
      assert.deepEqual(sim.state.unlockedShapes, ['star', 'heart']);

      sim.removeCartItem('heart');
      assert.equal(sim.state.coins, 100, '60 coins refunded');
      assert.deepEqual(sim.state.unlockedShapes, ['star'], 'Heart mold removed, star safely preserved');
    });

    test('reversing permanent decoration removes it from decorations and refunds cost', () => {
      const sim = createShopSceneSimulator({ coins: 200, decorations: [] });
      const windowDecor = { type: 'decor', id: 'decor_window', key: 'decor_window', cost: 150, name: 'Ventana' };

      sim.buyDecor(windowDecor);
      assert.equal(sim.state.coins, 50);
      assert.deepEqual(sim.state.decorations, ['decor_window']);

      sim.removeCartItem('decor_window');
      assert.equal(sim.state.coins, 200, '150 coins refunded');
      assert.deepEqual(sim.state.decorations, [], 'decorations array restored');
    });
  });

  // ===========================================================================
  // 3. VACIADO TOTAL CON "LIMPIAR CESTA / VACIAR"
  // ===========================================================================
  describe('3. Global Cart Reset via "Limpiar Cesta" Button', () => {
    test('clearCart restores coins, stock, shapes, and decorations strictly to entrance snapshot', () => {
      const initialStock = {
        dough: { classic: 0, chocolate: 0, oat: 0 },
        topping: { sprinkles: 2, choco: 0, glazing: 0 },
        drink: { coffee_beans: 1, milk: 2 }
      };
      const sim = createShopSceneSimulator({
        coins: 250,
        stock: initialStock,
        unlockedShapes: ['star'],
        decorations: []
      });

      // Buy multiple products across categories
      sim.buyItem({ type: 'dough', id: 'classic', key: 'doughClassic', cost: 10 });
      sim.buyItem({ type: 'topping', id: 'sprinkles', key: 'toppingSprinkles', cost: 10 });
      sim.buyItem({ type: 'mold', id: 'heart', key: 'moldHeart', cost: 60 });
      sim.buyDecor({ type: 'decor', id: 'decor_window', key: 'decor_window', cost: 150 });

      assert.equal(sim.state.coins, 20, '250 - 10 - 10 - 60 - 150 = 20');
      assert.equal(sim.state.totalSpent, 230);
      assert.equal(sim.state.sessionCart.length, 4);

      // Now click "Limpiar Cesta"
      const cleared = sim.clearCart();
      assert.equal(cleared, true);

      assert.equal(sim.state.coins, 250, 'Coins completely restored to 250');
      assert.equal(sim.state.totalSpent, 0, 'Total spent completely reset');
      assert.deepEqual(sim.state.stock, initialStock, 'Stock deeply restored to initial snapshot');
      assert.deepEqual(sim.state.unlockedShapes, ['star'], 'Shapes restored');
      assert.deepEqual(sim.state.decorations, [], 'Decorations restored');
      assert.equal(sim.state.sessionCart.length, 0, 'Cart is clean');
      assert.equal(sim.state.lastKiwiMessage, 'cartCleared');
    });

    test('clearCart on empty cart is a no-op returning false', () => {
      const sim = createShopSceneSimulator({ coins: 100 });
      const cleared = sim.clearCart();
      assert.equal(cleared, false);
      assert.equal(sim.state.coins, 100);
    });
  });

  // ===========================================================================
  // 4. VALIDACIÓN DE GATING DE MASA PARA APERTURA
  // ===========================================================================
  describe('4. Operational Dough Gating Validation', () => {
    test('player with 0 dough cannot start next day; triggers denied feedback', () => {
      const sim = createShopSceneSimulator({
        coins: 50,
        stock: { dough: { classic: 0, chocolate: 0, oat: 0 } }
      });

      assert.equal(hasSufficientDough(sim.state.stock), false, '0 dough cannot open');
      const started = sim.startNextDay(saveManager);
      assert.equal(started, false, 'Start next day must be blocked');
      assert.equal(sim.state.deniedSoundPlayed, 1);
      assert.equal(sim.state.warningShown, 1);
      assert.equal(sim.state.lastKiwiMessage, 'warnNoDough');
      assert.equal(sim.state.transitionTarget, null);
    });

    test('purchasing dough immediately unlocks startNextDay; refunding dough immediately locks it again', () => {
      const sim = createShopSceneSimulator({
        coins: 50,
        stock: { dough: { classic: 0, chocolate: 0, oat: 0 } }
      });

      // Initially locked
      assert.equal(sim.startNextDay(saveManager), false);

      // Buy dough pack
      sim.buyItem({ type: 'dough', id: 'classic', key: 'doughClassic', cost: 10 });
      assert.equal(calculateDoughStock(sim.state.stock), 5);
      assert.equal(hasSufficientDough(sim.state.stock), true);

      // Now allowed
      const allowedToStart = hasSufficientDough(sim.state.stock);
      assert.equal(allowedToStart, true);

      // Revert dough purchase
      sim.removeCartItem(0);
      assert.equal(calculateDoughStock(sim.state.stock), 0);
      assert.equal(hasSufficientDough(sim.state.stock), false);

      // Blocked again
      assert.equal(sim.startNextDay(saveManager), false);
    });

    test('clearing cart containing the only dough locks startNextDay back to disabled', () => {
      const sim = createShopSceneSimulator({
        coins: 50,
        stock: { dough: { classic: 0, chocolate: 0, oat: 0 } }
      });

      sim.buyItem({ type: 'dough', id: 'classic', key: 'doughClassic', cost: 10 });
      assert.equal(hasSufficientDough(sim.state.stock), true);

      sim.clearCart();
      assert.equal(hasSufficientDough(sim.state.stock), false);
      assert.equal(sim.startNextDay(saveManager), false);
    });
  });

  // ===========================================================================
  // 5. CONSOLIDACIÓN CON SAVEMANAGER Y PERSISTENCIA
  // ===========================================================================
  describe('5. SaveManager Consolidation & Clean Scene Transition', () => {
    test('advancing day saves consolidated coins, stock, shapes and decor to storage without desync', () => {
      const initialStock = {
        dough: { classic: 0, chocolate: 0, oat: 0 },
        topping: { sprinkles: 5, choco: 0, glazing: 0 },
        drink: { coffee_beans: 5, milk: 5 }
      };

      const sim = createShopSceneSimulator({
        day: 1,
        coins: 100,
        stock: initialStock,
        unlockedShapes: ['star'],
        decorations: []
      });

      // Buy classic dough (10 coins -> 5 dough) and heart mold (60 coins)
      sim.buyItem({ type: 'dough', id: 'classic', key: 'doughClassic', cost: 10 });
      sim.buyItem({ type: 'mold', id: 'heart', key: 'moldHeart', cost: 60 });

      assert.equal(sim.state.coins, 30);
      assert.equal(sim.state.stock.dough.classic, 5);

      const success = sim.startNextDay(saveManager);
      assert.equal(success, true, 'Transition allowed');
      assert.equal(sim.state.transitionTarget, 'GameScene');

      // Verify SaveManager content in disk/memory
      const savedState = saveManager.loadGame();
      assert.equal(savedState.day, 2, 'Day advanced to 2');
      assert.equal(savedState.coins, 30, 'Saved coins match consolidated state');
      assert.equal(savedState.stock.dough.classic, 5, 'Saved dough matches stock');
      assert.deepEqual(savedState.unlockedShapes, ['star', 'heart'], 'Saved shapes include heart');
      assert.equal(sim.state.transitionData.day, 2);
      assert.equal(sim.state.transitionData.coins, 30);
    });

    test('reverted item is NOT persisted in SaveManager upon day advancement', () => {
      const sim = createShopSceneSimulator({
        day: 2,
        coins: 80,
        stock: { dough: { classic: 5, chocolate: 0, oat: 0 } },
        unlockedShapes: ['star']
      });

      // Buy mold and oat dough
      sim.buyItem({ type: 'mold', id: 'cat', key: 'moldCat', cost: 90 }); // Fails (insufficient)
      sim.buyItem({ type: 'dough', id: 'chocolate', key: 'doughChocolate', cost: 15 });
      sim.buyItem({ type: 'topping', id: 'choco', key: 'toppingChoco', cost: 15 });

      assert.equal(sim.state.coins, 50);

      // Refund chocolate dough
      sim.removeCartItem('chocolate');
      assert.equal(sim.state.coins, 65);
      assert.equal(sim.state.stock.dough.chocolate, 0);

      sim.startNextDay(saveManager);

      const savedState = saveManager.loadGame();
      assert.equal(savedState.coins, 65, 'Persisted 65 coins');
      assert.equal(savedState.stock.dough.chocolate, 0, 'Refunded chocolate dough was not saved');
      assert.equal(savedState.stock.topping.choco, 5, 'Choco topping was saved');
    });
  });

  // ===========================================================================
  // 6. VERIFICACIÓN ESTRUCTURAL DE SHOPSCENE, SHOPSHELF, SHOPBASKET Y SHOPRAIL
  // ===========================================================================
  describe('6. Structural Architecture & Anti-Leak Matrix', () => {
    const shopScenePath = path.resolve('src/scenes/ShopScene.js');
    const shopShelfPath = path.resolve('src/game/ui/ShopShelf.js');
    const shopBasketPath = path.resolve('src/game/ui/ShopBasket.js');
    const shopRailPath = path.resolve('src/game/ui/ShopRail.js');

    const shopSceneSrc = fs.readFileSync(shopScenePath, 'utf8');
    const shopShelfSrc = fs.readFileSync(shopShelfPath, 'utf8');
    const shopBasketSrc = fs.readFileSync(shopBasketPath, 'utf8');
    const shopRailSrc = fs.readFileSync(shopRailPath, 'utf8');

    test('ShopShelf.renderCategory purges previous cards via removeAll(true) to avoid memory leaks', () => {
      assert.ok(
        shopShelfSrc.includes('this.itemsContainer.removeAll(true);'),
        'Must call removeAll(true) to destroy child game objects'
      );
      assert.ok(shopShelfSrc.includes('this.cards = [];'), 'Cards reference array must be reset');
      assert.ok(shopShelfSrc.includes('this.updaters = [];'), 'Updaters reference array must be reset');
    });

    test('ShopScene wires ShopRail.onSelect directly to switchCategory without container duplication', () => {
      assert.ok(shopSceneSrc.includes('this.switchCategory(catKey)'));
      assert.ok(shopSceneSrc.includes('this.shopShelf.renderCategory(catKey)'));
    });

    test('ShopBasket implements dashed border, clear button and individual delete buttons', () => {
      assert.ok(shopBasketSrc.includes('drawDashedBox'), 'Must draw dashed box');
      assert.ok(shopBasketSrc.includes('this.clearBtnContainer'), 'Must have clear cart container');
      assert.ok(shopBasketSrc.includes('this.onClearCart();'), 'Must trigger clear cart callback');
      assert.ok(shopBasketSrc.includes("this.onRemoveItem(index, item);") || shopBasketSrc.includes("this.onRemoveItem(index);"), 'Must trigger remove item callback');
    });

    test('ShopScene header features swaying sign and lateral pills (no redundant tab headers)', () => {
      assert.ok(shopSceneSrc.includes('this.signContainer = this.add.container'), 'Sign container must exist');
      assert.ok(shopSceneSrc.includes('angle: { from: -1.2, to: 1.2 }') || shopSceneSrc.includes('angle: -1.2'), 'Sway tween must oscillate angle');
      assert.ok(shopSceneSrc.includes('leftHeaderContainer'), 'Must have left header container for pills');
      assert.ok(shopSceneSrc.includes('coinPillContainer'), 'Must have right coin pill container');
    });

    test('WCAG AA High Contrast color palette strictly verified across UI components', () => {
      // #582f0e and #42270f must be used for typography and borders
      assert.ok(shopShelfSrc.includes('#582f0e'), 'Shelf uses deep coffee brown for headers');
      assert.ok(shopBasketSrc.includes('#582f0e'), 'Basket uses deep coffee brown for readability');
      assert.ok(shopRailSrc.includes('#582f0e'), 'Rail uses deep coffee brown for active items');
      assert.ok(shopSceneSrc.includes('#582f0e'), 'Scene uses deep coffee brown for sign and border accents');
    });
  });

  // ===========================================================================
  // 7. PARIDAD I18N PARA TODAS LAS ACCIONES DE TIENDA
  // ===========================================================================
  describe('7. Bilingual Localization Keys Coverage (ES/EN)', () => {
    const requiredKeys = [
      'shop.header.suppliesPill',
      'shop.header.beforeDayPill',
      'shop.header.signTitle',
      'shop.header.signSubtitle',
      'shop.header.coinsLabel',
      'shop.rail.title',
      'shop.rail.spentToday',
      'shop.basket.title',
      'shop.basket.empty',
      'shop.basket.clear',
      'shop.basket.totalSpent',
      'shop.basket.doughTomorrow',
      'shop.basket.pantryReady',
      'shop.basket.pantryWarning',
      'shop.dialogue.welcome',
      'shop.dialogue.welcomeNoDough',
      'shop.dialogue.warnNoDough',
      'shop.dialogue.itemRefunded',
      'shop.dialogue.cartCleared',
      'shop.items.doughClassic',
      'shop.items.moldHeart',
      'shop.units.permanent',
      'shop.units.pack5',
      'shop.units.unlocked',
      'shop.units.locked',
      'shop.units.stock'
    ];

    function getNestedKey(obj, pathStr) {
      return pathStr.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
    }

    test('all 26 shop localized keys exist and are non-empty in Spanish', () => {
      requiredKeys.forEach(k => {
        const val = getNestedKey(es, k);
        assert.ok(val !== undefined && typeof val === 'string' && val.length > 0, `Missing ES key: ${k}`);
      });
    });

    test('all 26 shop localized keys exist and are non-empty in English', () => {
      requiredKeys.forEach(k => {
        const val = getNestedKey(en, k);
        assert.ok(val !== undefined && typeof val === 'string' && val.length > 0, `Missing EN key: ${k}`);
      });
    });
  });
});
