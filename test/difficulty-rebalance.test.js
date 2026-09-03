import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDayConfig, calculateExpenses, evaluateSolvency } from '../src/game/EconomyManager.js';

describe('Recalibración de Dificultad por Días & Curva de Progresión', () => {
  const projectRoot = process.cwd();
  const gameSceneCode = fs.readFileSync(path.join(projectRoot, 'src', 'scenes', 'GameScene.js'), 'utf8');
  const customerCode = fs.readFileSync(path.join(projectRoot, 'src', 'game', 'Customer.js'), 'utf8');
  const economyCode = fs.readFileSync(path.join(projectRoot, 'src', 'game', 'EconomyManager.js'), 'utf8');

  describe('1. Preservación Estricta de Día 1 (Tutorial Intacto)', () => {
    test('Día 1 mantiene configuración original intacta', () => {
      const cfg1 = getDayConfig(1);
      assert.deepEqual(cfg1, {
        meta: 100,
        patienceTime: 40,
        maxCustomers: 3,
        bakeMin: 5.5,
        bakeMax: 7.5
      });
    });

    test('Día 1 mantiene gastos fijos originales intactos', () => {
      assert.deepEqual(calculateExpenses(1), {
        rent: 20,
        maintenance: 15,
        loanPayment: 20,
        total: 55
      });
    });

    test('Pool de clientes en Día 1 excluye al Gamer (cliente 5)', () => {
      assert.ok(
        gameSceneCode.includes('this.day === 1') &&
        gameSceneCode.includes('availablePool = [1, 2, 3, 4]'),
        'Día 1 debe tener pool [1, 2, 3, 4]'
      );
    });
  });

  describe('2. Día 2: Muy Fácil (Consolidación Post-Tutorial)', () => {
    test('getDayConfig(2) tiene maxCustomers = 3, patienceTime = 48s, meta = 110', () => {
      const cfg2 = getDayConfig(2);
      assert.equal(cfg2.maxCustomers, 3);
      assert.equal(cfg2.patienceTime, 48);
      assert.equal(cfg2.meta, 110);
      assert.equal(cfg2.bakeMin, 6.0);
      assert.equal(cfg2.bakeMax, 7.5);
    });

    test('calculateExpenses(2) tiene cuota bancaria 25 y total 60', () => {
      const exp2 = calculateExpenses(2);
      assert.equal(exp2.loanPayment, 25);
      assert.equal(exp2.total, 60);
    });

    test('Pool de clientes en Día 2 solo contiene clientes dóciles [1, 3, 4]', () => {
      assert.ok(
        gameSceneCode.includes('this.day === 2') &&
        (gameSceneCode.includes('availablePool = [1, 3, 4]') || gameSceneCode.includes('[1, 3, 4]')),
        'Día 2 debe excluir al Oficinista (2) y al Gamer (5)'
      );
    });

    test('En Día 2 capD es 1 (órdenes unitarias exclusivamente)', () => {
      assert.ok(
        gameSceneCode.includes('this.day === 2') &&
        gameSceneCode.includes('capD = 1'),
        'Día 2 debe forzar capD = 1'
      );
    });

    test('En Día 2 las bebidas tienen ratio 20% y son exclusivamente simples', () => {
      assert.ok(
        gameSceneCode.includes('0.20') || gameSceneCode.includes('0.2'),
        'GameScene debe definir 20% de probabilidad de bebida en Día 2'
      );
      assert.ok(
        gameSceneCode.includes('this.day >= 3 && hasBeans && hasMilk') ||
        gameSceneCode.includes('this.day > 2 && hasBeans && hasMilk'),
        'Día 2 no debe ofrecer coffee_milk'
      );
    });

    test('Customer badDayChance en Día 2 es 5% (0.05)', () => {
      assert.ok(
        customerCode.includes('2: 0.05'),
        'Customer.js debe configurar badDayChance = 0.05 en Día 2'
      );
    });
  });

  describe('3. Día 3: Fácil (Doble Comanda dentro de Capacidad de Horno)', () => {
    test('getDayConfig(3) tiene maxCustomers = 4, patienceTime = 42s, meta = 150', () => {
      const cfg3 = getDayConfig(3);
      assert.equal(cfg3.maxCustomers, 4);
      assert.equal(cfg3.patienceTime, 42);
      assert.equal(cfg3.meta, 150);
      assert.equal(cfg3.bakeMin, 6.5);
    });

    test('calculateExpenses(3) tiene cuota bancaria 35 y total 75', () => {
      const exp3 = calculateExpenses(3);
      assert.equal(exp3.loanPayment, 35);
      assert.equal(exp3.total, 75);
    });

    test('Pool de clientes en Día 3 incorpora al Oficinista [1, 2, 3, 4] pero sin Gamer', () => {
      assert.ok(
        gameSceneCode.includes('this.day === 3') &&
        gameSceneCode.includes('[1, 2, 3, 4]'),
        'Día 3 debe tener pool [1, 2, 3, 4]'
      );
    });

    test('En Día 3 capD es 2 galletas (cabe en una sola tanda de horno de 3 slots)', () => {
      assert.ok(
        gameSceneCode.includes('capD = 2') || gameSceneCode.includes('3: 2'),
        'Día 3 debe limitar capD a 2'
      );
    });

    test('Customer badDayChance en Día 3 es 15% (0.15)', () => {
      assert.ok(
        customerCode.includes('3: 0.15'),
        'Customer.js debe configurar badDayChance = 0.15 en Día 3'
      );
    });
  });

  describe('4. Día 4: Medio (Tanda Completa de Horno y Entrada de Gamer)', () => {
    test('getDayConfig(4) tiene maxCustomers = 4, patienceTime = 36s, meta = 200', () => {
      const cfg4 = getDayConfig(4);
      assert.equal(cfg4.maxCustomers, 4);
      assert.equal(cfg4.patienceTime, 36);
      assert.equal(cfg4.meta, 200);
      assert.equal(cfg4.bakeMin, 7.0);
    });

    test('calculateExpenses(4) tiene cuota bancaria 50 y total 95', () => {
      const exp4 = calculateExpenses(4);
      assert.equal(exp4.loanPayment, 50);
      assert.equal(exp4.total, 95);
    });

    test('En Día 4 capD es 3 galletas (límite del horno)', () => {
      assert.ok(
        gameSceneCode.includes('capD = 3') || gameSceneCode.includes('4: 3'),
        'Día 4 debe limitar capD a 3'
      );
    });

    test('Customer badDayChance en Día 4 es 25% (0.25)', () => {
      assert.ok(
        customerCode.includes('4: 0.25'),
        'Customer.js debe configurar badDayChance = 0.25 en Día 4'
      );
    });
  });

  describe('5. Día 5+: Desafío Progresivo & Escalado', () => {
    test('capD escala con min(5, day - 1)', () => {
      assert.ok(
        gameSceneCode.includes('Math.min(5, this.day - 1)') ||
        gameSceneCode.includes('Math.min(5, Math.max(1, this.day - 1))'),
        'Día 5+ debe usar capD = min(5, day - 1)'
      );
    });

    test('getDayConfig escala suavemente a partir de Día 5', () => {
      const day5 = getDayConfig(5);
      assert.equal(day5.meta, 250);
      assert.equal(day5.patienceTime, 32);
      assert.equal(day5.maxCustomers, 5);

      const day6 = getDayConfig(6);
      assert.equal(day6.meta, 300);
      assert.equal(day6.patienceTime, 30.5);
      assert.equal(day6.maxCustomers, 5);
    });
  });

  describe('6. Balanceo de Personalidades y Paciencia en Customer.js', () => {
    test('Multiplicadores de paciencia por cantidad están mejorados', () => {
      assert.ok(
        customerCode.includes('1: 1.0, 2: 1.4, 3: 1.8, 4: 2.3, 5: 2.8'),
        'quantityMultipliers debe ser { 1: 1.0, 2: 1.4, 3: 1.8, 4: 2.3, 5: 2.8 }'
      );
    });

    test('Bonus de paciencia por bebida es +0.35', () => {
      assert.ok(
        customerCode.includes('qtyMult += 0.35'),
        'El bonus de bebida debe ser +0.35'
      );
    });

    test('Multiplicador de paciencia de Gamer (5) es 0.70 y Oficinista (2) es 0.80', () => {
      assert.ok(
        customerCode.includes('5: 0.70') || customerCode.includes('5: 0.7,'),
        'Gamer multiplier debe ser 0.70'
      );
      assert.ok(
        customerCode.includes('2: 0.80') || customerCode.includes('2: 0.8,'),
        'Oficinista multiplier debe ser 0.80'
      );
    });

    test('Tolerancia de Gamer (5) está calibrada en 95%', () => {
      assert.ok(
        customerCode.includes('5: 95'),
        'Gamer tolerancia debe ser 95'
      );
    });
  });

  describe('7. Stock Blindado en GameScene.js', () => {
    test('GameScene valida stock antes de asignar cantidad y no fuerza Math.max(1, qty) sobre stock 0', () => {
      assert.ok(
        !gameSceneCode.includes('qty = Math.min(rawQty, stockLimit);\n        qty = Math.max(1, qty);'),
        'No debe forzar qty = 1 sobre stockLimit 0 sin validar'
      );
    });
  });
});
