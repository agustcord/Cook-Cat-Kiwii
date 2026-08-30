import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_OPERATIONAL_DOUGH_REQUIRED,
  BASIC_DOUGH_PACK_COST,
  calculateExpenses,
  calculateDayEarnings,
  calculatePerformanceRating,
  calculateDoughStock,
  hasSufficientDough,
  evaluateSolvency
} from '../src/game/EconomyManager.js';

describe('EconomyManager - Pure Logic & TDD Matrix', () => {
  test('constants have correct operational values', () => {
    assert.equal(MIN_OPERATIONAL_DOUGH_REQUIRED, 1);
    assert.equal(BASIC_DOUGH_PACK_COST, 10);
  });

  test('calculateExpenses returns correct fixed amounts per day', () => {
    assert.deepEqual(calculateExpenses(1), { rent: 20, maintenance: 15, loanPayment: 20, total: 55 });
    assert.deepEqual(calculateExpenses(2), { rent: 20, maintenance: 20, loanPayment: 35, total: 75 });
    assert.deepEqual(calculateExpenses(3), { rent: 20, maintenance: 25, loanPayment: 60, total: 105 });
    assert.deepEqual(calculateExpenses(4), { rent: 20, maintenance: 30, loanPayment: 85, total: 135 });
  });

  test('calculateDayEarnings calculates only net sales from today', () => {
    assert.equal(calculateDayEarnings(120, 50), 70);
    assert.equal(calculateDayEarnings(40, 50), 0); // No negative earnings
  });

  test('calculatePerformanceRating calculates stars and feedback correctly', () => {
    const excellent = calculatePerformanceRating(100, 100);
    assert.equal(excellent.stars, 3);
    assert.equal(excellent.ratio, 1.0);

    const good = calculatePerformanceRating(75, 100);
    assert.equal(good.stars, 2);
    assert.equal(good.ratio, 0.75);

    const tight = calculatePerformanceRating(40, 100);
    assert.equal(tight.stars, 1);
    assert.equal(tight.ratio, 0.4);
  });

  test('calculateDoughStock sums classic, chocolate and oat correctly', () => {
    assert.equal(calculateDoughStock({ dough: { classic: 5, chocolate: 2, oat: 1 } }), 8);
    assert.equal(calculateDoughStock({ dough: { classic: 0, chocolate: 0, oat: 0 } }), 0);
    assert.equal(calculateDoughStock({}), 0);
  });

  test('hasSufficientDough returns true when stock has >= 1 dough, false otherwise', () => {
    assert.equal(hasSufficientDough({ dough: { classic: 1 } }), true);
    assert.equal(hasSufficientDough({ dough: { chocolate: 2 } }), true);
    assert.equal(hasSufficientDough({ dough: { oat: 3 } }), true);
    assert.equal(hasSufficientDough({ dough: { classic: 0, chocolate: 0, oat: 0 } }), false);
    assert.equal(hasSufficientDough({}), false);
  });

  test('Prueba 1: Meta no alcanzada (70%) pero solvente en gastos y con fondos para masa', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 70,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 0, chocolate: 0, oat: 0 } },
      loanRemaining: 200
    });

    assert.equal(result.isBankrupt, false);
    assert.equal(result.bankruptcyReason, null);
    assert.equal(result.netCoins, 15);
    assert.equal(result.performance.stars, 2);
    assert.equal(result.canAffordBasicDough, true);
    assert.equal(result.hasStockToOpen, false);
  });

  test('Prueba 1b: Rendimiento ajustado (< 70%) pero solvente en gastos y con fondos para masa', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 65,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 0, chocolate: 0, oat: 0 } },
      loanRemaining: 200
    });

    assert.equal(result.isBankrupt, false);
    assert.equal(result.bankruptcyReason, null);
    assert.equal(result.netCoins, 10);
    assert.equal(result.performance.stars, 1);
    assert.equal(result.canAffordBasicDough, true);
    assert.equal(result.hasStockToOpen, false);
  });

  test('Prueba 2: Fondos menores a gastos fijos (Quiebra Financiera)', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 40,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 10, chocolate: 0, oat: 0 } },
      loanRemaining: 200
    });

    assert.equal(result.isBankrupt, true);
    assert.equal(result.bankruptcyReason, 'debt');
    assert.equal(result.netCoins, -15);
    assert.equal(result.isFinanciallySolvent, false);
  });

  test('Prueba 3: Solvente en gastos pero sin masa ni fondos para comprarla (Quiebra Operativa)', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 58,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 0, chocolate: 0, oat: 0 } },
      loanRemaining: 200
    });

    assert.equal(result.isBankrupt, true);
    assert.equal(result.bankruptcyReason, 'supplies');
    assert.equal(result.netCoins, 3);
    assert.equal(result.isFinanciallySolvent, true);
    assert.equal(result.hasStockToOpen, false);
    assert.equal(result.canAffordBasicDough, false);
  });

  test('Prueba 4: Saldo bajo pero con masa en despensa (Solvente Operativo)', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 58,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 5, chocolate: 0, oat: 0 } },
      loanRemaining: 200
    });

    assert.equal(result.isBankrupt, false);
    assert.equal(result.bankruptcyReason, null);
    assert.equal(result.netCoins, 3);
    assert.equal(result.isFinanciallySolvent, true);
    assert.equal(result.hasStockToOpen, true);
  });

  test('Loan repayment updates remaining debt correctly and floors at 0', () => {
    const result = evaluateSolvency({
      day: 1,
      coins: 100,
      coinsAtStart: 0,
      meta: 100,
      stock: { dough: { classic: 5 } },
      loanRemaining: 15
    });

    assert.equal(result.updatedLoanRemaining, 0); // 15 - 20 floored at 0
  });
});
