import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SaveManager from '../src/game/services/SaveManager.js';

describe('SaveManager - Game State Persistence & LocalStorage Matrix', () => {
  test('returns singleton instance', () => {
    const s1 = SaveManager.getInstance({ reset: true });
    const s2 = SaveManager.getInstance();
    assert.equal(s1, s2);
  });

  test('getDefaultState returns fresh Day 1 state', () => {
    const sm = SaveManager.getInstance({ reset: true });
    const def = sm.getDefaultState();
    assert.equal(def.day, 1);
    assert.equal(def.coins, 0);
    assert.equal(def.loanRemaining, 200);
    assert.deepEqual(def.unlockedShapes, ['star']);
    assert.equal(def.stock.dough.classic, 10);
    assert.equal(def.stock.topping.sprinkles, 5);
    assert.equal(def.stock.drink.coffee_beans, 5);
    assert.equal(def.stock.drink.milk, 5);
  });

  test('hasSavedGame returns false on fresh start', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    assert.equal(sm.hasSavedGame(), false);
    assert.equal(sm.loadGame(), null);
  });

  test('saveGame serializes game state and loadGame retrieves it intact', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    const stateToSave = {
      day: 3,
      coins: 145,
      loanRemaining: 140,
      unlockedShapes: ['star', 'heart'],
      stock: {
        dough: { classic: 4, chocolate: 5, oat: 0 },
        topping: { sprinkles: 3, choco: 5, glazing: 0 },
        drink: { coffee_beans: 4, milk: 1 }
      }
    };

    sm.saveGame(stateToSave);
    assert.equal(sm.hasSavedGame(), true);

    const loaded = sm.loadGame();
    assert.equal(loaded.day, 3);
    assert.equal(loaded.coins, 145);
    assert.equal(loaded.loanRemaining, 140);
    assert.deepEqual(loaded.unlockedShapes, ['star', 'heart']);
    assert.equal(loaded.stock.dough.chocolate, 5);
  });

  test('clearSave deletes saved state properly', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    sm.saveGame({ day: 2, coins: 50 });
    assert.equal(sm.hasSavedGame(), true);

    sm.clearSave();
    assert.equal(sm.hasSavedGame(), false);
    assert.equal(sm.loadGame(), null);
  });

  test('handles corrupted storage data gracefully', () => {
    const mockStorage = {
      getItem: () => 'INVALID_JSON_CORRUPT{{{',
      setItem: () => {},
      removeItem: () => {}
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    assert.equal(sm.hasSavedGame(), false);
    assert.equal(sm.loadGame(), null);
  });

  test('getDefaultState includes empty decorations array', () => {
    const sm = SaveManager.getInstance({ reset: true });
    const def = sm.getDefaultState();
    assert.ok(Array.isArray(def.decorations));
    assert.deepEqual(def.decorations, []);
  });

  test('saveGame persists decorations idempotently without duplicates', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    sm.saveGame({ day: 2, coins: 50, decorations: ['decor_window', 'decor_window'] });
    const loaded = sm.loadGame();
    assert.deepEqual(loaded.decorations, ['decor_window']);
  });

  test('retrocompatibility: loads legacy save without decorations as empty array', () => {
    const memory = new Map();
    // Simulate legacy save format without decorations key
    const legacyState = {
      day: 2,
      coins: 100,
      loanRemaining: 180,
      unlockedShapes: ['star'],
      stock: {
        dough: { classic: 5, chocolate: 0, oat: 0 },
        topping: { sprinkles: 1, choco: 0, glazing: 0 },
        drink: { coffee_beans: 2, milk: 2 }
      }
    };
    memory.set('kiwibakery_save_state', JSON.stringify(legacyState));

    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    const loaded = sm.loadGame();
    assert.ok(Array.isArray(loaded.decorations), 'decorations should be an array');
    assert.deepEqual(loaded.decorations, []);

    // Subsequent save preserves decorations
    sm.saveGame({ coins: 80 });
    const reloaded = sm.loadGame();
    assert.deepEqual(reloaded.decorations, []);
  });

  test('saveGame retains existing decorations when omitted in payload', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    sm.saveGame({ decorations: ['decor_window'] });
    assert.deepEqual(sm.loadGame().decorations, ['decor_window']);

    // Update only coins without passing decorations
    sm.saveGame({ coins: 200 });
    const updated = sm.loadGame();
    assert.equal(updated.coins, 200);
    assert.deepEqual(updated.decorations, ['decor_window']);
  });

  test('hasSavedGame returns true if player owns decorations even on day 1 with 0 coins', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k)
    };

    const sm = SaveManager.getInstance({ reset: true, storage: mockStorage });
    sm.saveGame({ day: 1, coins: 0, loanRemaining: 200, unlockedShapes: ['star'], decorations: ['decor_window'] });
    assert.equal(sm.hasSavedGame(), true);
  });
});
