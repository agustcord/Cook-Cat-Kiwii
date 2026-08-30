/**
 * EconomyManager.js
 * Módulo de funciones puras para el cálculo contable, evaluación de solvencia y rendimiento.
 * Cook Gatos Kiwii
 */

export const MIN_OPERATIONAL_DOUGH_REQUIRED = 1;
export const BASIC_DOUGH_PACK_COST = 10;

const EXPENSE_TABLE = {
  1: { rent: 20, maintenance: 15, loanPayment: 20 },
  2: { rent: 20, maintenance: 20, loanPayment: 35 },
  3: { rent: 20, maintenance: 25, loanPayment: 60 },
  4: { rent: 20, maintenance: 30, loanPayment: 85 }
};

/**
 * Calcula los gastos fijos del día (Alquiler, Mantenimiento/Servicios, Cuota del Banco).
 * @param {number} day - Número del día (1..4)
 * @returns {{rent: number, maintenance: number, loanPayment: number, total: number}}
 */
export function calculateExpenses(day) {
  const defaults = { rent: 20, maintenance: 20, loanPayment: 0 };
  const current = EXPENSE_TABLE[day] || defaults;
  const rent = current.rent;
  const maintenance = current.maintenance;
  const loanPayment = current.loanPayment;
  const total = rent + maintenance + loanPayment;
  return { rent, maintenance, loanPayment, total };
}

/**
 * Calcula las ventas netas de la jornada actual (descontando el saldo previo en caja).
 * @param {number} coins - Monedas totales en caja al cierre
 * @param {number} coinsAtStart - Monedas que ya tenía al iniciar el día
 * @returns {number}
 */
export function calculateDayEarnings(coins, coinsAtStart = 0) {
  return Math.max(0, (coins || 0) - (coinsAtStart || 0));
}

/**
 * Calcula el rendimiento comercial respecto a la meta (Performance Rating).
 * La meta es un indicador evaluativo y jamás provoca quiebra por sí misma.
 * @param {number} dayEarnings - Ventas obtenidas hoy
 * @param {number} meta - Meta comercial fijada
 * @returns {{stars: number, ratio: number, label: string, message: string}}
 */
export function calculatePerformanceRating(dayEarnings, meta = 100) {
  const safeMeta = meta > 0 ? meta : 100;
  const ratio = dayEarnings / safeMeta;

  if (ratio >= 1.0) {
    return {
      stars: 3,
      ratio,
      label: 'Excelente',
      message: '¡Récord de Ventas! Superaste la meta del día con creces.'
    };
  }

  if (ratio >= 0.7) {
    return {
      stars: 2,
      ratio,
      label: 'Bueno',
      message: '¡Buen trabajo! Estuviste muy cerca de la meta comercial.'
    };
  }

  return {
    stars: 1,
    ratio,
    label: 'Ajustado',
    message: 'Día tranquilo. No se alcanzó la meta, pero el negocio sigue en pie y solvente.'
  };
}

/**
 * Verifica si el stock de masa es suficiente para abrir la panadería al día siguiente.
 * @param {object} stock
 * @returns {boolean}
 */
export function hasSufficientDough(stock) {
  return calculateDoughStock(stock) >= MIN_OPERATIONAL_DOUGH_REQUIRED;
}

/**
 * Calcula el inventario total disponible de masa (harinas/bases de galleta).
 * @param {object} stock - Objeto de inventario
 * @returns {number}
 */
export function calculateDoughStock(stock) {
  const dough = stock?.dough || {};
  return (dough.classic || 0) + (dough.chocolate || 0) + (dough.oat || 0);
}

/**
 * Evalúa la solvencia integral (Financiera + Operativa) al cierre del día.
 *
 * Quiebra dual:
 * 1. Financiera: netCoins < 0 (fondos totales insuficientes para cubrir gastos devengados).
 * 2. Operativa: totalDoughStock == 0 Y netCoins < 10 (sin masa y sin fondos para comprar pack básico).
 *
 * @param {object} params
 * @param {number} params.day - Día actual
 * @param {number} params.coins - Monedas totales al cierre
 * @param {number} params.coinsAtStart - Monedas al inicio del día
 * @param {number} params.meta - Meta del día
 * @param {object} params.stock - Stock de insumos
 * @param {number} params.loanRemaining - Deuda bancaria restante
 * @returns {object} Estado contable y resolución de solvencia
 */
export function evaluateSolvency({
  day = 1,
  coins = 0,
  coinsAtStart = 0,
  meta = 100,
  stock = {},
  loanRemaining = 200
}) {
  const expenses = calculateExpenses(day);
  const dayEarnings = calculateDayEarnings(coins, coinsAtStart);
  const performance = calculatePerformanceRating(dayEarnings, meta);
  const netCoins = coins - expenses.total;
  const totalDoughStock = calculateDoughStock(stock);

  const isFinanciallySolvent = netCoins >= 0;
  const hasStockToOpen = totalDoughStock >= MIN_OPERATIONAL_DOUGH_REQUIRED;
  const canAffordBasicDough = netCoins >= BASIC_DOUGH_PACK_COST;
  const isOperationallyViable = hasStockToOpen || canAffordBasicDough;

  const isBankrupt = !(isFinanciallySolvent && isOperationallyViable);

  let bankruptcyReason = null;
  if (!isFinanciallySolvent) {
    bankruptcyReason = 'debt';
  } else if (!isOperationallyViable) {
    bankruptcyReason = 'supplies';
  }

  const updatedLoanRemaining = Math.max(0, loanRemaining - expenses.loanPayment);

  return {
    day,
    coins,
    coinsAtStart,
    meta,
    dayEarnings,
    performance,
    expenses,
    netCoins,
    totalDoughStock,
    isFinanciallySolvent,
    hasStockToOpen,
    canAffordBasicDough,
    isOperationallyViable,
    isBankrupt,
    bankruptcyReason,
    updatedLoanRemaining
  };
}
