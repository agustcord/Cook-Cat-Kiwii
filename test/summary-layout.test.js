import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  COIN_RADIUS,
  COIN_DIAMETER,
  createBounds,
  checkAABBOverlap,
  validateLayoutCollisions,
  estimateOutfitTextWidth,
  computeSubtitleLayout,
  computeDebtLayout,
  computeTableRowLayout,
  computeSaldoBadgeLayout
} from '../src/game/SummaryLayout.js';

describe('SummaryLayout - Geometría, Bounding Boxes y No Solapamiento', () => {

  describe('createBounds y checkAABBOverlap', () => {
    test('calcula correctamente bordes para anclaje a la izquierda (originX = 0)', () => {
      const b = createBounds(100, 50, 200, 30, 0, 0);
      assert.equal(b.left, 100);
      assert.equal(b.right, 300);
      assert.equal(b.top, 50);
      assert.equal(b.bottom, 80);
    });

    test('calcula correctamente bordes para anclaje al centro (origin = 0.5)', () => {
      const b = createBounds(200, 100, 40, 40, 0.5, 0.5);
      assert.equal(b.left, 180);
      assert.equal(b.right, 220);
      assert.equal(b.top, 80);
      assert.equal(b.bottom, 120);
    });

    test('calcula correctamente bordes para anclaje a la derecha (originX = 1)', () => {
      const b = createBounds(500, 100, 80, 24, 1, 0.5);
      assert.equal(b.left, 420);
      assert.equal(b.right, 500);
      assert.equal(b.top, 88);
      assert.equal(b.bottom, 112);
    });

    test('detecta solapamiento real entre dos cajas', () => {
      const a = createBounds(100, 100, 50, 50, 0, 0);
      const b = createBounds(140, 120, 50, 50, 0, 0); // se superponen
      assert.equal(checkAABBOverlap(a, b), true);
    });

    test('no reporta solapamiento cuando hay separación horizontal', () => {
      const a = createBounds(100, 100, 50, 50, 0, 0); // 100..150
      const b = createBounds(160, 100, 50, 50, 0, 0); // 160..210
      assert.equal(checkAABBOverlap(a, b), false);
    });

    test('detecta violación de margen mínimo', () => {
      const a = createBounds(100, 100, 50, 50, 0, 0); // 100..150
      const b = createBounds(152, 100, 50, 50, 0, 0); // separación = 2px
      assert.equal(checkAABBOverlap(a, b, 0), false); // sin margen pasan
      assert.equal(checkAABBOverlap(a, b, 5), true);  // con margen 5px detecta invasión
    });
  });

  describe('Renglón de Subtítulo (Meta, Ventas, Mensaje y Monedas)', () => {
    const scenarios = [
      { name: 'Escenario Capitán (Día 1 Excelente)', meta: 100, earnings: 170, msg: '¡Récord de Ventas! Superaste la meta del día con creces.' },
      { name: 'Rendimiento Bueno', meta: 100, earnings: 75, msg: '¡Buen trabajo! Estuviste muy cerca de la meta comercial.' },
      { name: 'Rendimiento Ajustado', meta: 100, earnings: 40, msg: 'Día tranquilo. No se alcanzó la meta, pero el negocio sigue en pie y solvente.' },
      { name: 'Valores grandes (Día avanzado)', meta: 500, earnings: 1250, msg: '¡Récord de Ventas! Superaste la meta del día con creces.' },
      { name: 'Cero ventas', meta: 100, earnings: 0, msg: 'Día tranquilo. No se alcanzó la meta, pero el negocio sigue en pie y solvente.' }
    ];

    for (const sc of scenarios) {
      test(`Cero solapamiento en subtítulo: ${sc.name}`, () => {
        const metaStr = `Meta: ${sc.meta}`;
        const earningsStr = `•   Ventas Hoy: ${sc.earnings}`;
        const msgStr = `•   ${sc.msg}`;

        const metaW = estimateOutfitTextWidth(metaStr, 20, '600');
        const earningsW = estimateOutfitTextWidth(earningsStr, 20, '600');
        const msgW = estimateOutfitTextWidth(msgStr, 20, '600');

        const layout = computeSubtitleLayout({
          metaTextWidth: metaW,
          earningsTextWidth: earningsW,
          messageTextWidth: msgW,
          screenWidth: 1080,
          y: 154,
          textHeight: 24
        });

        // 1. Validar que no haya colisiones con margen de al menos 4px
        const collisionCheck = validateLayoutCollisions(layout.items, 4);
        assert.equal(
          collisionCheck.valid,
          true,
          `Colisiones detectadas en subtítulo: ${JSON.stringify(collisionCheck.collisions)}`
        );

        // 2. Validar orden estricto de izquierda a derecha
        for (let i = 0; i < layout.items.length - 1; i++) {
          const current = layout.items[i];
          const next = layout.items[i + 1];
          assert.ok(
            current.bounds.right < next.bounds.left,
            `Elemento ${current.id} (${current.bounds.right}px) invade o pisa a ${next.id} (${next.bounds.left}px)`
          );
        }

        // 3. Validar que la moneda de Meta no pise el texto de Meta
        const metaItem = layout.items.find(it => it.id === 'metaText');
        const metaCoin = layout.items.find(it => it.id === 'metaCoin');
        assert.ok(metaCoin.bounds.left >= metaItem.bounds.right + 4);

        // 4. Validar que la moneda de Ventas no pise el texto de Ventas
        const earningsItem = layout.items.find(it => it.id === 'earningsText');
        const earningsCoin = layout.items.find(it => it.id === 'earningsCoin');
        assert.ok(earningsCoin.bounds.left >= earningsItem.bounds.right + 4);
      });
    }
  });

  describe('Línea de Deuda Bancaria (Préstamo restante)', () => {
    const loanScenarios = [
      { remaining: 180, initial: 200, label: 'Caso del screenshot del Capitán (180)' },
      { remaining: 200, initial: 200, label: 'Deuda completa' },
      { remaining: 20, initial: 200, label: 'Deuda casi saldada' },
      { remaining: 0, initial: 200, label: 'Deuda en 0' },
      { remaining: 1500, initial: 2000, label: 'Cifras de 4 dígitos' }
    ];

    for (const sc of loanScenarios) {
      test(`Cero solapamiento en deuda: ${sc.label}`, () => {
        const text1Str = `Préstamo restante con el banco: ${sc.remaining}`;
        const text2Str = `(Inicial: ${sc.initial})`;

        const text1W = estimateOutfitTextWidth(text1Str, 20, '700');
        const text2W = estimateOutfitTextWidth(text2Str, 20, '700');

        const layout = computeDebtLayout({
          debtTextWidth: text1W,
          initialTextWidth: text2W,
          screenWidth: 1080,
          y: 708,
          textHeight: 22
        });

        // 1. Validar no colisión con margen >= 4px
        const collisionCheck = validateLayoutCollisions(layout.items, 4);
        assert.equal(
          collisionCheck.valid,
          true,
          `Colisión en línea de deuda: ${JSON.stringify(collisionCheck.collisions)}`
        );

        // 2. Comprobar que la moneda está entre text1 y text2 sin tocarlos
        const debtText = layout.items.find(it => it.id === 'debtText');
        const debtCoin = layout.items.find(it => it.id === 'debtCoin');
        const initialText = layout.items.find(it => it.id === 'initialText');

        assert.ok(
          debtCoin.bounds.left >= debtText.bounds.right + 4,
          `La moneda pisa los números de deuda: coin.left (${debtCoin.bounds.left}) <= text.right (${debtText.bounds.right})`
        );

        assert.ok(
          initialText.bounds.left >= debtCoin.bounds.right + 4,
          `El texto inicial pisa la moneda: initial.left (${initialText.bounds.left}) <= coin.right (${debtCoin.bounds.right})`
        );
      });
    }
  });

  describe('Líneas de la Tabla del Recibo (Ingresos y Gastos)', () => {
    const tableRows = [
      { id: 'ventas', label: 'Ventas de la Jornada (Hoy):', val: '+170', yOffset: 74 },
      { id: 'saldoPrevio', label: 'Saldo Previo en Caja:', val: '+0', yOffset: 110 },
      { id: 'totalFondos', label: 'Total Fondos en Caja al Cierre:', val: '170', yOffset: 146 },
      { id: 'alquiler', label: 'Alquiler del Local (Fijo):', val: '-20', yOffset: 198 },
      { id: 'servicios', label: 'Servicios de Luz / Agua / Gas:', val: '-15', yOffset: 232 },
      { id: 'cuota', label: 'Cuota del Préstamo Bancario:', val: '-20', yOffset: 266 },
      { id: 'totalGastos', label: 'Total Gastos Deducidos:', val: '-55', yOffset: 304 }
    ];

    test('Todas las filas de la tabla tienen separación limpia entre label, valor y moneda', () => {
      const cardX = 130;
      const cardY = 190;
      const cardW = 820;

      for (const row of tableRows) {
        const labelW = estimateOutfitTextWidth(row.label, 23, '700');
        const valW = estimateOutfitTextWidth(row.val, 23, '800');

        const layout = computeTableRowLayout({
          id: row.id,
          cardX,
          cardY,
          cardW,
          rowYOffset: row.yOffset,
          labelWidth: labelW,
          valueWidth: valW,
          textHeight: 26
        });

        // 1. No colisión en la fila con margen >= 4px
        const check = validateLayoutCollisions(layout.items, 4);
        assert.equal(check.valid, true, `Colisión en fila ${row.id}: ${JSON.stringify(check.collisions)}`);

        // 2. El label no llega al valor (amplio espacio central)
        const label = layout.items.find(it => it.id === `${row.id}_label`);
        const value = layout.items.find(it => it.id === `${row.id}_value`);
        const coin = layout.items.find(it => it.id === `${row.id}_coin`);

        assert.ok(
          label.bounds.right < value.bounds.left - 50,
          `Label muy cerca del valor en ${row.id}`
        );

        // 3. El valor numérico NUNCA pisa la moneda
        assert.ok(
          value.bounds.right <= coin.bounds.left - 6,
          `El valor pisa la moneda en ${row.id}: val.right=${value.bounds.right}, coin.left=${coin.bounds.left}`
        );

        // 4. La moneda no se desborda del recibo
        assert.ok(
          coin.bounds.right <= cardX + cardW - 10,
          `La moneda se sale del borde derecho del recibo en ${row.id}`
        );
      }
    });
  });

  describe('Badge de Saldo Neto Restante', () => {
    const balanceCases = [
      { val: 115, desc: 'Positivo normal (screenshot Capitán)' },
      { val: 0, desc: 'Cero exacto' },
      { val: -55, desc: 'Negativo (quiebra)' },
      { val: 9999, desc: 'Cuatro dígitos' }
    ];

    for (const bc of balanceCases) {
      test(`Badge simétrico y sin colisión para saldo: ${bc.val} (${bc.desc})`, () => {
        const cardX = 130;
        const cardY = 190;
        const cardW = 820;

        const labelW = estimateOutfitTextWidth('SALDO NETO RESTANTE:', 29, '800');
        const valW = estimateOutfitTextWidth(String(bc.val), 34, '800');

        const layout = computeSaldoBadgeLayout({
          cardX,
          cardY,
          cardW,
          labelWidth: labelW,
          valueWidth: valW,
          valueHeight: 36,
          yOffset: 384
        });

        // 1. Label no colisiona con el badge
        const label = layout.items.find(it => it.id === 'saldoLabel');
        const badge = layout.items.find(it => it.id === 'saldoBadge');
        assert.ok(
          label.bounds.right < badge.bounds.left - 20,
          `Label de saldo colisiona con el badge: label.right=${label.bounds.right}, badge.left=${badge.bounds.left}`
        );

        // 2. Valor y moneda están totalmente contenidos dentro del badge
        const val = layout.items.find(it => it.id === 'saldoValue');
        const coin = layout.items.find(it => it.id === 'saldoCoin');

        assert.ok(val.bounds.left >= badge.bounds.left + 10, 'Valor desborda izquierda del badge');
        assert.ok(coin.bounds.right <= badge.bounds.right - 10, 'Moneda desborda derecha del badge');

        // 3. Valor no pisa la moneda dentro del badge
        assert.ok(
          val.bounds.right <= coin.bounds.left - 6,
          `Valor pisa la moneda dentro del badge: val.right=${val.bounds.right}, coin.left=${coin.bounds.left}`
        );
      });
    }
  });

  describe('Validación de Bounding Boxes Global (Simulación Pantalla Completa)', () => {
    test('Toda la escena SummaryScene está 100% libre de solapamientos', () => {
      const cardX = 130;
      const cardY = 190;
      const cardW = 820;

      // 1. Subtítulo
      const subLayout = computeSubtitleLayout({
        metaTextWidth: estimateOutfitTextWidth('Meta: 100', 20, '600'),
        earningsTextWidth: estimateOutfitTextWidth('•   Ventas Hoy: 170', 20, '600'),
        messageTextWidth: estimateOutfitTextWidth('•   ¡Récord de Ventas! Superaste la meta del día con creces.', 20, '600'),
        screenWidth: 1080,
        y: 154,
        textHeight: 24
      });

      // 2. Filas de tabla
      const rows = [
        { id: 'ventas', label: 'Ventas de la Jornada (Hoy):', val: '+170', yOffset: 74 },
        { id: 'saldoPrevio', label: 'Saldo Previo en Caja:', val: '+0', yOffset: 110 },
        { id: 'totalFondos', label: 'Total Fondos en Caja al Cierre:', val: '170', yOffset: 146 },
        { id: 'alquiler', label: 'Alquiler del Local (Fijo):', val: '-20', yOffset: 198 },
        { id: 'servicios', label: 'Servicios de Luz / Agua / Gas:', val: '-15', yOffset: 232 },
        { id: 'cuota', label: 'Cuota del Préstamo Bancario:', val: '-20', yOffset: 266 },
        { id: 'totalGastos', label: 'Total Gastos Deducidos:', val: '-55', yOffset: 304 }
      ];

      const tableItems = [];
      for (const r of rows) {
        const rLayout = computeTableRowLayout({
          id: r.id,
          cardX,
          cardY,
          cardW,
          rowYOffset: r.yOffset,
          labelWidth: estimateOutfitTextWidth(r.label, 23, '700'),
          valueWidth: estimateOutfitTextWidth(r.val, 23, '800'),
          textHeight: 26
        });
        tableItems.push(...rLayout.items);
      }

      // 3. Saldo Badge
      const saldoLayout = computeSaldoBadgeLayout({
        cardX,
        cardY,
        cardW,
        labelWidth: estimateOutfitTextWidth('SALDO NETO RESTANTE:', 29, '800'),
        valueWidth: estimateOutfitTextWidth('115', 34, '800'),
        valueHeight: 36,
        yOffset: 384
      });

      // 4. Despensa
      const pantryLabelW = estimateOutfitTextWidth('Despensa de Masa:', 23, '600');
      const pantryValW = estimateOutfitTextWidth('7 u. disponibles para abrir mañana', 21, '700');
      const pantryY = cardY + 462;
      const pantryLabel = {
        id: 'pantryLabel',
        bounds: createBounds(cardX + 32, pantryY, pantryLabelW, 26, 0, 0.5)
      };
      const pantryVal = {
        id: 'pantryVal',
        bounds: createBounds(cardX + cardW - 32, pantryY, pantryValW, 26, 1, 0.5)
      };

      // 5. Deuda
      const debtLayout = computeDebtLayout({
        debtTextWidth: estimateOutfitTextWidth('Préstamo restante con el banco: 180', 20, '700'),
        initialTextWidth: estimateOutfitTextWidth('(Inicial: 200)', 20, '700'),
        screenWidth: 1080,
        y: cardY + 518,
        textHeight: 22
      });

      // Validar cada renglón / subsistema para garantizar 0 colisiones
      const subCheck = validateLayoutCollisions(subLayout.items, 4);
      assert.equal(subCheck.valid, true, `Colisión en subtítulo: ${JSON.stringify(subCheck.collisions)}`);

      for (const r of rows) {
        const rowItems = tableItems.filter(it => it.id.startsWith(r.id));
        const rowCheck = validateLayoutCollisions(rowItems, 4);
        assert.equal(rowCheck.valid, true, `Colisión en fila ${r.id}: ${JSON.stringify(rowCheck.collisions)}`);
      }

      // En saldo, badge es contenedor de valor y moneda (intencional),
      // pero label y badge no deben colisionar
      assert.ok(
        saldoLayout.items.find(it => it.id === 'saldoLabel').bounds.right <
        saldoLayout.items.find(it => it.id === 'saldoBadge').bounds.left
      );

      // Despensa: label y valor no colisionan
      assert.ok(pantryLabel.bounds.right < pantryVal.bounds.left - 50);

      // Deuda: cero colisiones entre texto y moneda
      const debtCheck = validateLayoutCollisions(debtLayout.items, 4);
      assert.equal(debtCheck.valid, true, `Colisión en deuda: ${JSON.stringify(debtCheck.collisions)}`);
    });
  });
});
