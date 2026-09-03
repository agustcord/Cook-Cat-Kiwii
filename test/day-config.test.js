import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDayConfig,
  calculateExpenses,
  evaluateSolvency
} from '../src/game/EconomyManager.js';

describe('Procedural Day Configuration & Day 5+ Scaling', () => {
  describe('getDayConfig', () => {
    test('returns exact static values for Days 1 to 4', () => {
      assert.deepEqual(getDayConfig(1), {
        meta: 100,
        patienceTime: 40,
        maxCustomers: 3,
        bakeMin: 5.5,
        bakeMax: 7.5
      });

      assert.deepEqual(getDayConfig(2), {
        meta: 110,
        patienceTime: 48,
        maxCustomers: 3,
        bakeMin: 6.0,
        bakeMax: 7.5
      });

      assert.deepEqual(getDayConfig(3), {
        meta: 150,
        patienceTime: 42,
        maxCustomers: 4,
        bakeMin: 6.5,
        bakeMax: 7.5
      });

      assert.deepEqual(getDayConfig(4), {
        meta: 200,
        patienceTime: 36,
        maxCustomers: 4,
        bakeMin: 7.0,
        bakeMax: 7.5
      });
    });

    test('procedurally scales Day 5 onwards without crashing', () => {
      const day5 = getDayConfig(5);
      assert.equal(day5.meta, 250);
      assert.equal(day5.patienceTime, 32);
      assert.equal(day5.maxCustomers, 5);
      assert.equal(day5.bakeMax, 7.5);

      const day6 = getDayConfig(6);
      assert.equal(day6.meta, 300);
      assert.equal(day6.patienceTime, 30.5);
      assert.equal(day6.maxCustomers, 5);

      const day10 = getDayConfig(10);
      assert.equal(day10.meta, 500);
      assert.equal(day10.patienceTime, 24.5);
      assert.equal(day10.maxCustomers, 7);

      const day12 = getDayConfig(12);
      assert.equal(day12.patienceTime, 22); // Clamped at 22s min

      const day15 = getDayConfig(15);
      assert.equal(day15.maxCustomers, 8); // Clamped at 8 max
    });

    test('handles default / invalid values safely', () => {
      const defaultDay = getDayConfig();
      assert.equal(defaultDay.meta, 100);
      assert.equal(defaultDay.maxCustomers, 3);

      const negativeDay = getDayConfig(-5);
      assert.equal(negativeDay.meta, 100);
    });
  });

  describe('calculateExpenses scaling for Day 5+', () => {
    test('returns exact expenses for Day 1..4', () => {
      assert.deepEqual(calculateExpenses(1), { rent: 20, maintenance: 15, loanPayment: 20, total: 55 });
      assert.deepEqual(calculateExpenses(2), { rent: 20, maintenance: 15, loanPayment: 25, total: 60 });
      assert.deepEqual(calculateExpenses(3), { rent: 20, maintenance: 20, loanPayment: 35, total: 75 });
      assert.deepEqual(calculateExpenses(4), { rent: 20, maintenance: 25, loanPayment: 50, total: 95 });
    });

    test('calculates dynamic expenses for Day 5 and Day 6', () => {
      const exp5 = calculateExpenses(5);
      assert.equal(exp5.rent, 25);
      assert.equal(exp5.maintenance, 30);
      assert.equal(exp5.loanPayment, 65);
      assert.equal(exp5.total, 120);

      const exp6 = calculateExpenses(6);
      assert.equal(exp6.rent, 30);
      assert.equal(exp6.maintenance, 35);
      assert.equal(exp6.loanPayment, 80);
      assert.equal(exp6.total, 145);
    });
  });

  describe('evaluateSolvency on Day 5+', () => {
    test('evaluates solvency correctly on Day 5 with higher expenses and meta', () => {
      const config = getDayConfig(5);
      const result = evaluateSolvency({
        day: 5,
        coins: 200,
        coinsAtStart: 0,
        meta: config.meta,
        stock: { dough: { classic: 5, chocolate: 2, oat: 0 } },
        loanRemaining: 150
      });

      assert.equal(result.isBankrupt, false);
      assert.equal(result.netCoins, 80); // 200 - 120
      assert.equal(result.updatedLoanRemaining, 85); // 150 - 65
      assert.equal(result.hasStockToOpen, true);
    });
  });
});
