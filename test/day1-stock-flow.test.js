import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SaveManager from '../src/game/services/SaveManager.js';
import TutorialManager from '../src/game/tutorial/TutorialManager.js';
import I18nManager from '../src/game/services/I18nManager.js';

function createMockScene(initialStock = {}) {
  let stockTextsUpdated = 0;
  let drinkStockTextsUpdated = 0;

  const defaultStock = {
    dough: { classic: 10, chocolate: 0, oat: 0 },
    topping: { sprinkles: 5, choco: 0, glazing: 0 },
    drink: { coffee_beans: 5, milk: 5 }
  };

  const scene = {
    day: 1,
    customersSpawned: 0,
    customerSequence: [1, 2, 3, 4],
    stock: {
      dough: { ...defaultStock.dough, ...(initialStock.dough || {}) },
      topping: { ...defaultStock.topping, ...(initialStock.topping || {}) },
      drink: { ...defaultStock.drink, ...(initialStock.drink || {}) }
    },
    updateStockTexts: () => { stockTextsUpdated++; },
    updateDrinkStockTexts: () => { drinkStockTextsUpdated++; },
    get stockTextsCallCount() { return stockTextsUpdated; },
    get drinkStockTextsCallCount() { return drinkStockTextsUpdated; }
  };

  return scene;
}

describe('Day 1 Initial Stock Calibration Matrix', () => {
  let memory;
  let mockStorage;

  beforeEach(() => {
    memory = new Map();
    mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };
  });

  test('SaveManager.getDefaultState provides full 5-pack initial kits for Day 1', () => {
    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    const state = sm.getDefaultState();

    assert.equal(state.day, 1);
    assert.equal(state.stock.dough.classic, 10, 'Classic dough starts with 10 units (2 packs of 5)');
    assert.equal(state.stock.topping.sprinkles, 5, 'Sprinkles start with 5 units (1 pack)');
    assert.equal(state.stock.drink.coffee_beans, 5, 'Coffee beans start with 5 units (1 pack)');
    assert.equal(state.stock.drink.milk, 5, 'Milk starts with 5 units (1 pack)');
  });

  test('GameScene source code enforces calibrated 5-unit fallbacks on Day 1', () => {
    const gameScenePath = path.join(process.cwd(), 'src', 'scenes', 'GameScene.js');
    const source = fs.readFileSync(gameScenePath, 'utf8');

    assert.ok(source.includes('sprinkles: 5'), 'GameScene fallback must specify sprinkles: 5');
    assert.ok(source.includes('coffee_beans: 5, milk: 5'), 'GameScene fallback must specify coffee_beans: 5, milk: 5');
    assert.ok(source.includes('Math.max(5, (this.stock.topping.sprinkles || 0))'), 'GameScene Day 1 enforces sprinkles >= 5');
    assert.ok(source.includes('Math.max(5, (this.stock.drink.coffee_beans || 0))'), 'GameScene Day 1 enforces coffee_beans >= 5');
    assert.ok(source.includes('Math.max(5, (this.stock.drink.milk || 0))'), 'GameScene Day 1 enforces milk >= 5');
  });

  test('SummaryScene source code synchronizes stock fallback to 5-unit kit', () => {
    const summaryScenePath = path.join(process.cwd(), 'src', 'scenes', 'SummaryScene.js');
    const source = fs.readFileSync(summaryScenePath, 'utf8');

    assert.ok(source.includes('sprinkles: 5'), 'SummaryScene fallback must specify sprinkles: 5');
    assert.ok(source.includes('coffee_beans: 5, milk: 5'), 'SummaryScene fallback must specify coffee_beans: 5, milk: 5');
  });
});

describe('TutorialManager.skip() Safety Net Matrix', () => {
  let memory;
  let mockStorage;
  let sm;

  beforeEach(() => {
    memory = new Map();
    mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };
    sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
  });

  test('skip() with zeroed inventory restores minimum operational floor', () => {
    const scene = createMockScene({
      dough: { classic: 0 },
      topping: { sprinkles: 0 },
      drink: { coffee_beans: 0, milk: 0 }
    });

    const tm = new TutorialManager(scene, { saveManager: sm });
    tm.start();
    assert.equal(tm.isActive, true);

    // Re-drenar antes del skip (simulando error de jugador o drenado previo)
    scene.stock.dough.classic = 0;
    scene.stock.topping.sprinkles = 0;
    scene.stock.drink.coffee_beans = 0;
    scene.stock.drink.milk = 0;

    tm.skip();

    assert.equal(tm.isActive, false);
    assert.equal(tm.isCompleted, true);

    // Verificar pisos de seguridad
    assert.ok(scene.stock.dough.classic >= 5, `Dough classic should be >= 5, got ${scene.stock.dough.classic}`);
    assert.ok(scene.stock.topping.sprinkles >= 3, `Sprinkles should be >= 3, got ${scene.stock.topping.sprinkles}`);
    assert.ok(scene.stock.drink.coffee_beans >= 3, `Coffee beans should be >= 3, got ${scene.stock.drink.coffee_beans}`);
    assert.ok(scene.stock.drink.milk >= 3, `Milk should be >= 3, got ${scene.stock.drink.milk}`);

    // Verificar actualización del HUD
    assert.ok(scene.stockTextsCallCount >= 1, 'updateStockTexts must be called on skip');
    assert.ok(scene.drinkStockTextsCallCount >= 1, 'updateDrinkStockTexts must be called on skip');
  });

  test('skip() preserves inventory if existing stock is already above floor', () => {
    const scene = createMockScene({
      dough: { classic: 8 },
      topping: { sprinkles: 4 },
      drink: { coffee_beans: 5, milk: 4 }
    });

    const tm = new TutorialManager(scene, { saveManager: sm });
    tm.start();
    tm.skip();

    assert.equal(scene.stock.dough.classic, 8, 'Dough classic must not be reduced');
    assert.equal(scene.stock.topping.sprinkles, 4, 'Sprinkles must not be reduced');
    assert.equal(scene.stock.drink.coffee_beans, 5, 'Coffee beans must not be reduced');
    assert.equal(scene.stock.drink.milk, 4, 'Milk must not be reduced');
  });

  test('skip() persists tutorialCompleted: true in SaveManager', () => {
    const scene = createMockScene();
    const tm = new TutorialManager(scene, { saveManager: sm });
    tm.skip();

    const saved = sm.loadGame();
    assert.equal(saved.tutorialCompleted, true);
    assert.ok(saved.stock.drink.coffee_beans >= 3);
  });
});

describe('Day 1 Customer Orders & Anti-Softlock Mathematical Balance', () => {
  // Simular la lógica de spawnCustomer() del Día 1
  function simulateSpawnDay1Customer(stock, customerIndex) {
    const i18n = I18nManager.getInstance();
    const hasBeans = (Number(stock.drink?.coffee_beans) || 0) > 0;
    const hasMilk = (Number(stock.drink?.milk) || 0) > 0;
    const hasSprinkles = (Number(stock.topping?.sprinkles) || 0) > 0;

    let selectedRecipe = null;
    let qty = 1;
    let requestedDrink = null;

    if (customerIndex === 0) {
      selectedRecipe = { name: 'Vainilla Estrella', base: 'classic', shape: 'star', toppings: [] };
      qty = 1;
      requestedDrink = 'coffee';
      if (!hasBeans) {
        requestedDrink = hasMilk ? 'milk' : null;
      }
    } else if (customerIndex === 1) {
      const toppings = hasSprinkles ? ['sprinkles'] : [];
      selectedRecipe = { name: 'Vainilla Estrella Chispas', base: 'classic', shape: 'star', toppings: ['sprinkles'] };
      if (!hasSprinkles) {
        selectedRecipe.toppings = [];
      }
      qty = 1;
      requestedDrink = 'coffee_milk';
      if (!hasBeans || !hasMilk) {
        if (hasBeans) requestedDrink = 'coffee';
        else if (hasMilk) requestedDrink = 'milk';
        else requestedDrink = null;
      }
    } else {
      const toppings = hasSprinkles ? ['sprinkles'] : [];
      selectedRecipe = { name: 'Vainilla Estrella Chispas', base: 'classic', shape: 'star', toppings };
      qty = 1;
      if (hasMilk && hasBeans) {
        requestedDrink = 'milk';
      } else if (hasBeans) {
        requestedDrink = 'coffee';
      } else if (hasMilk) {
        requestedDrink = 'milk';
      } else {
        requestedDrink = null;
      }
    }

    return { selectedRecipe, qty, requestedDrink };
  }

  // Simular el consumo físico de stock por preparar una comanda
  function consumeIngredients(stock, order) {
    // Masa
    if (order.selectedRecipe && order.selectedRecipe.base) {
      stock.dough[order.selectedRecipe.base] -= order.qty;
    }
    // Toppings
    if (order.selectedRecipe && order.selectedRecipe.toppings) {
      order.selectedRecipe.toppings.forEach(t => {
        stock.topping[t] -= order.qty;
      });
    }
    // Bebidas
    if (order.requestedDrink === 'coffee') {
      stock.drink.coffee_beans -= 1;
    } else if (order.requestedDrink === 'milk') {
      stock.drink.milk -= 1;
    } else if (order.requestedDrink === 'coffee_milk') {
      stock.drink.coffee_beans -= 1;
      stock.drink.milk -= 1;
    }
  }

  test('Day 1 with skip-tutorial completes all 3 customers with healthy stock surplus', () => {
    // Stock base de partida nueva
    const stock = {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 5, choco: 0, glazing: 0 },
      drink: { coffee_beans: 5, milk: 5 }
    };

    // Cliente 1
    const c1 = simulateSpawnDay1Customer(stock, 0);
    assert.equal(c1.requestedDrink, 'coffee', 'Customer 1 requests coffee');
    assert.equal(c1.selectedRecipe.toppings.length, 0);
    consumeIngredients(stock, c1);
    assert.equal(stock.dough.classic, 9);
    assert.equal(stock.drink.coffee_beans, 4);
    assert.equal(stock.drink.milk, 5);

    // Cliente 2
    const c2 = simulateSpawnDay1Customer(stock, 1);
    assert.equal(c2.requestedDrink, 'coffee_milk', 'Customer 2 requests coffee with milk');
    assert.deepEqual(c2.selectedRecipe.toppings, ['sprinkles']);
    consumeIngredients(stock, c2);
    assert.equal(stock.dough.classic, 8);
    assert.equal(stock.topping.sprinkles, 4);
    assert.equal(stock.drink.coffee_beans, 3);
    assert.equal(stock.drink.milk, 4);

    // Cliente 3
    const c3 = simulateSpawnDay1Customer(stock, 2);
    assert.equal(c3.requestedDrink, 'milk', 'Customer 3 requests milk (balanced drink, completing variety)');
    assert.deepEqual(c3.selectedRecipe.toppings, ['sprinkles']);
    consumeIngredients(stock, c3);
    assert.equal(stock.dough.classic, 7);
    assert.equal(stock.topping.sprinkles, 3);
    assert.equal(stock.drink.coffee_beans, 3);
    assert.equal(stock.drink.milk, 3);

    // Saldo final: todos los insumos > 0, 100% de margen contra errores
    assert.ok(stock.dough.classic >= 5, 'Dough surplus >= 5');
    assert.ok(stock.topping.sprinkles >= 2, 'Sprinkles surplus >= 2');
    assert.ok(stock.drink.coffee_beans >= 2, 'Coffee beans surplus >= 2');
    assert.ok(stock.drink.milk >= 2, 'Milk surplus >= 2');
  });

  test('Anti-softlock guard degrades gracefully when beans are exhausted', () => {
    const stock = {
      dough: { classic: 5, chocolate: 0, oat: 0 },
      topping: { sprinkles: 3, choco: 0, glazing: 0 },
      drink: { coffee_beans: 0, milk: 2 }
    };

    // Cliente 1 con 0 café se degrada a leche
    const c1 = simulateSpawnDay1Customer(stock, 0);
    assert.equal(c1.requestedDrink, 'milk', 'Customer 1 degrades to milk if coffee beans are 0');

    // Cliente 2 con 0 café se degrada a leche (evita pedir café con leche imposible)
    const c2 = simulateSpawnDay1Customer(stock, 1);
    assert.equal(c2.requestedDrink, 'milk', 'Customer 2 degrades to milk if coffee beans are 0');

    // Cliente 3 con 0 café pide leche
    const c3 = simulateSpawnDay1Customer(stock, 2);
    assert.equal(c3.requestedDrink, 'milk', 'Customer 3 asks for milk when only milk is available');
  });

  test('Anti-softlock guard degrades to null when both drinks are exhausted', () => {
    const stock = {
      dough: { classic: 5, chocolate: 0, oat: 0 },
      topping: { sprinkles: 3, choco: 0, glazing: 0 },
      drink: { coffee_beans: 0, milk: 0 }
    };

    const c1 = simulateSpawnDay1Customer(stock, 0);
    assert.equal(c1.requestedDrink, null, 'Customer 1 asks for NO drink when inventory is 0');

    const c2 = simulateSpawnDay1Customer(stock, 1);
    assert.equal(c2.requestedDrink, null, 'Customer 2 asks for NO drink when inventory is 0');

    const c3 = simulateSpawnDay1Customer(stock, 2);
    assert.equal(c3.requestedDrink, null, 'Customer 3 asks for NO drink when inventory is 0');
  });

  test('Anti-softlock guard removes sprinkles requirement if sprinkles are exhausted', () => {
    const stock = {
      dough: { classic: 5, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 3, milk: 3 }
    };

    const c2 = simulateSpawnDay1Customer(stock, 1);
    assert.deepEqual(c2.selectedRecipe.toppings, [], 'Customer 2 drops sprinkles requirement if stock is 0');

    const c3 = simulateSpawnDay1Customer(stock, 2);
    assert.deepEqual(c3.selectedRecipe.toppings, [], 'Customer 3 drops sprinkles requirement if stock is 0');
  });
});
