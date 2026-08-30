/**
 * SummaryLayout.js
 * Módulo puro de cálculo geométrico y layout para SummaryScene.
 * Garantiza métricas exactas, márgenes visuales consistentes y cero solapamiento.
 * Sin dependencias del DOM ni de Phaser para permitir testing automatizado puro.
 * Cook Gatos Kiwii
 */

export const COIN_RADIUS = 9;
export const COIN_DIAMETER = 18;

/**
 * Calcula el bounding box 2D (AABB) a partir de coordenadas y orígenes de anclaje.
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} originX (0 = izquierda, 0.5 = centro, 1 = derecha)
 * @param {number} originY (0 = arriba, 0.5 = centro, 1 = abajo)
 * @returns {{left: number, right: number, top: number, bottom: number, width: number, height: number, x: number, y: number}}
 */
export function createBounds(x, y, width, height, originX = 0, originY = 0) {
  const left = x - width * originX;
  const right = left + width;
  const top = y - height * originY;
  const bottom = top + height;
  return { left, right, top, bottom, width, height, x: left, y: top };
}

/**
 * Verifica si dos cajas AABB se solapan.
 * Si minMargin > 0, requiere que exista al menos esa separación en px.
 * @param {object} boxA
 * @param {object} boxB
 * @param {number} minMargin
 * @returns {boolean} true si se solapan o no cumplen el margen mínimo
 */
export function checkAABBOverlap(boxA, boxB, minMargin = 0) {
  return (
    boxA.left - minMargin < boxB.right &&
    boxA.right + minMargin > boxB.left &&
    boxA.top - minMargin < boxB.bottom &&
    boxA.bottom + minMargin > boxB.top
  );
}

/**
 * Valida una colección de elementos para comprobar que ningún par colisione visualmente.
 * @param {Array<{id: string, bounds: object}>} items
 * @param {number} minMargin
 * @returns {{valid: boolean, collisions: Array<{a: string, b: string, overlapX: number, overlapY: number}>}}
 */
export function validateLayoutCollisions(items, minMargin = 0) {
  const collisions = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (checkAABBOverlap(a.bounds, b.bounds, minMargin)) {
        const overlapX = Math.min(a.bounds.right, b.bounds.right) - Math.max(a.bounds.left, b.bounds.left);
        const overlapY = Math.min(a.bounds.bottom, b.bounds.bottom) - Math.max(a.bounds.top, b.bounds.top);
        collisions.push({
          a: a.id,
          b: b.id,
          overlapX,
          overlapY,
          aBounds: a.bounds,
          bBounds: b.bounds
        });
      }
    }
  }
  return {
    valid: collisions.length === 0,
    collisions
  };
}

/**
 * Estimador de ancho para tipografía Outfit en entornos sin Canvas/DOM (tests unitarios en Node).
 * Calibrado según métricas de Outfit sans-serif proporcional.
 */
export function estimateOutfitTextWidth(text, fontSize = 20, fontWeight = '600') {
  if (!text) return 0;
  const scale = fontSize / 20;
  const weightMult = fontWeight === '800' || fontWeight === '700' || fontWeight === 'bold' ? 1.05 : 1.0;

  let total = 0;
  for (const char of String(text)) {
    if ('ijl|!:,;.·•\'" '.includes(char)) {
      total += 5.5;
    } else if ('mwMW_@%#&'.includes(char)) {
      total += 15.0;
    } else if ('ABCDEFGHJKLNOPQRSTUVXYZ'.includes(char)) {
      total += 12.0;
    } else if ('0123456789'.includes(char)) {
      total += 10.5;
    } else {
      total += 9.5;
    }
  }
  return Math.round(total * scale * weightMult);
}

/**
 * Layout exacto para el subtítulo de desempeño comercial:
 * [Meta: XXX] [🪙]   •   [Ventas Hoy: YYY] [🪙]   •   [Mensaje de Rendimiento]
 * Se calcula con el ancho real de cada segmento y se centra como unidad.
 */
export function computeSubtitleLayout({
  metaTextWidth,
  earningsTextWidth,
  messageTextWidth,
  screenWidth = 1080,
  y = 154,
  textHeight = 24
}) {
  const coinMarginLeft = 6;
  const coinMarginRight = 14;
  const coinWidth = COIN_DIAMETER;

  const coinSlotWidth = coinMarginLeft + coinWidth + coinMarginRight;
  const totalWidth = metaTextWidth + coinSlotWidth + earningsTextWidth + coinSlotWidth + messageTextWidth;

  const startX = Math.round((screenWidth - totalWidth) / 2);
  let currentX = startX;

  // 1. Meta text (origin 0, 0.5)
  const metaItem = {
    id: 'metaText',
    x: currentX,
    y,
    width: metaTextWidth,
    height: textHeight,
    bounds: createBounds(currentX, y, metaTextWidth, textHeight, 0, 0.5)
  };
  currentX += metaTextWidth + coinMarginLeft;

  // 2. Coin 1 (icono vectorial centrado)
  const coin1CenterX = currentX + COIN_RADIUS;
  const coin1Item = {
    id: 'metaCoin',
    x: coin1CenterX,
    y,
    radius: COIN_RADIUS,
    width: coinWidth,
    height: coinWidth,
    bounds: createBounds(coin1CenterX, y, coinWidth, coinWidth, 0.5, 0.5)
  };
  currentX += coinWidth + coinMarginRight;

  // 3. Earnings text (origin 0, 0.5)
  const earningsItem = {
    id: 'earningsText',
    x: currentX,
    y,
    width: earningsTextWidth,
    height: textHeight,
    bounds: createBounds(currentX, y, earningsTextWidth, textHeight, 0, 0.5)
  };
  currentX += earningsTextWidth + coinMarginLeft;

  // 4. Coin 2 (icono vectorial centrado)
  const coin2CenterX = currentX + COIN_RADIUS;
  const coin2Item = {
    id: 'earningsCoin',
    x: coin2CenterX,
    y,
    radius: COIN_RADIUS,
    width: coinWidth,
    height: coinWidth,
    bounds: createBounds(coin2CenterX, y, coinWidth, coinWidth, 0.5, 0.5)
  };
  currentX += coinWidth + coinMarginRight;

  // 5. Message text (origin 0, 0.5)
  const messageItem = {
    id: 'messageText',
    x: currentX,
    y,
    width: messageTextWidth,
    height: textHeight,
    bounds: createBounds(currentX, y, messageTextWidth, textHeight, 0, 0.5)
  };

  return {
    totalWidth,
    startX,
    items: [metaItem, coin1Item, earningsItem, coin2Item, messageItem]
  };
}

/**
 * Layout exacto para la línea de deuda:
 * [Préstamo restante con el banco: XXX] [🪙]   [(Inicial: YYY)]
 * Centrado horizontalmente en la pantalla.
 */
export function computeDebtLayout({
  debtTextWidth,
  initialTextWidth,
  screenWidth = 1080,
  y = 708,
  textHeight = 22
}) {
  const coinMarginLeft = 6;
  const coinMarginRight = 10;
  const coinWidth = COIN_DIAMETER;

  const totalWidth = debtTextWidth + coinMarginLeft + coinWidth + coinMarginRight + initialTextWidth;
  const startX = Math.round((screenWidth - totalWidth) / 2);
  let currentX = startX;

  // 1. Debt text (origin 0, 0.5)
  const debtItem = {
    id: 'debtText',
    x: currentX,
    y,
    width: debtTextWidth,
    height: textHeight,
    bounds: createBounds(currentX, y, debtTextWidth, textHeight, 0, 0.5)
  };
  currentX += debtTextWidth + coinMarginLeft;

  // 2. Coin
  const coinCenterX = currentX + COIN_RADIUS;
  const coinItem = {
    id: 'debtCoin',
    x: coinCenterX,
    y,
    radius: COIN_RADIUS,
    width: coinWidth,
    height: coinWidth,
    bounds: createBounds(coinCenterX, y, coinWidth, coinWidth, 0.5, 0.5)
  };
  currentX += coinWidth + coinMarginRight;

  // 3. Initial text
  const initialItem = {
    id: 'initialText',
    x: currentX,
    y,
    width: initialTextWidth,
    height: textHeight,
    bounds: createBounds(currentX, y, initialTextWidth, textHeight, 0, 0.5)
  };

  return {
    totalWidth,
    startX,
    items: [debtItem, coinItem, initialItem]
  };
}

/**
 * Layout para las líneas de la tabla del recibo (Ingresos y Gastos):
 * Label a la izquierda, valor numérico a la derecha con margen garantizado antes del icono.
 */
export function computeTableRowLayout({
  id = 'row',
  cardX,
  cardY,
  cardW = 820,
  rowYOffset,
  labelWidth,
  valueWidth,
  textHeight = 24
}) {
  const y = cardY + rowYOffset;
  const labelX = cardX + 32;
  const coinCenterX = cardX + cardW - 24;
  const coinRadius = COIN_RADIUS;
  const coinLeft = coinCenterX - coinRadius;
  const gapValueCoin = 8;
  const valueRightX = coinLeft - gapValueCoin;

  const labelItem = {
    id: `${id}_label`,
    x: labelX,
    y,
    width: labelWidth,
    height: textHeight,
    bounds: createBounds(labelX, y, labelWidth, textHeight, 0, 0.5)
  };

  const valueItem = {
    id: `${id}_value`,
    x: valueRightX, // origin (1, 0.5)
    y,
    width: valueWidth,
    height: textHeight,
    bounds: createBounds(valueRightX, y, valueWidth, textHeight, 1, 0.5)
  };

  const coinItem = {
    id: `${id}_coin`,
    x: coinCenterX,
    y,
    radius: coinRadius,
    width: COIN_DIAMETER,
    height: COIN_DIAMETER,
    bounds: createBounds(coinCenterX, y, COIN_DIAMETER, COIN_DIAMETER, 0.5, 0.5)
  };

  return {
    y,
    items: [labelItem, valueItem, coinItem]
  };
}

/**
 * Layout para el badge de saldo neto restante:
 * Encierra armónicamente el valor numérico y el icono con paddings simétricos.
 */
export function computeSaldoBadgeLayout({
  cardX,
  cardY,
  cardW = 820,
  labelWidth,
  valueWidth,
  valueHeight = 36,
  yOffset = 384
}) {
  const y = cardY + yOffset;
  const labelX = cardX + 32;

  const labelItem = {
    id: 'saldoLabel',
    x: labelX,
    y,
    width: labelWidth,
    height: valueHeight,
    bounds: createBounds(labelX, y, labelWidth, valueHeight, 0, 0.5)
  };

  const badgePadX = 14;
  const badgePadY = 6;
  const gapValueCoin = 8;
  const coinWidth = COIN_DIAMETER;

  const innerContentWidth = valueWidth + gapValueCoin + coinWidth;
  const badgeW = innerContentWidth + badgePadX * 2;
  const badgeH = valueHeight + badgePadY * 2;

  const badgeRight = cardX + cardW - 24;
  const badgeX = badgeRight - badgeW;

  const valueRightX = badgeRight - badgePadX - coinWidth - gapValueCoin;
  const coinCenterX = badgeRight - badgePadX - COIN_RADIUS;

  const badgeItem = {
    id: 'saldoBadge',
    x: badgeX,
    y: y - badgeH / 2,
    width: badgeW,
    height: badgeH,
    bounds: {
      left: badgeX,
      right: badgeRight,
      top: y - badgeH / 2,
      bottom: y + badgeH / 2,
      width: badgeW,
      height: badgeH
    }
  };

  const valueItem = {
    id: 'saldoValue',
    x: valueRightX, // origin (1, 0.5)
    y,
    width: valueWidth,
    height: valueHeight,
    bounds: createBounds(valueRightX, y, valueWidth, valueHeight, 1, 0.5)
  };

  const coinItem = {
    id: 'saldoCoin',
    x: coinCenterX,
    y,
    radius: COIN_RADIUS,
    width: coinWidth,
    height: coinWidth,
    bounds: createBounds(coinCenterX, y, coinWidth, coinWidth, 0.5, 0.5)
  };

  return {
    y,
    badgeW,
    badgeH,
    badgeX,
    badgeY: y - badgeH / 2,
    badgeRight,
    items: [labelItem, badgeItem, valueItem, coinItem]
  };
}
