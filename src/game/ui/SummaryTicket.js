import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';

/**
 * SummaryTicket
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Dibuja un ticket troquelado artesanal con muescas triangulares procedurales,
 * contorno café (#582f0e, 2px), líneas punteadas conductoras, desglose contable
 * de ingresos y gastos de EconomyManager.evaluateSolvency(), y badge de saldo neto destacado.
 * Libre de manchas de café sucias o cintas invasivas.
 */
export default class SummaryTicket extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=920]
   * @param {number} [config.height=660]
   * @param {Object} config.economy Datos contables calculados por EconomyManager.evaluateSolvency()
   * @param {number} [config.coinsAtStart=0]
   * @param {number} [config.coins=0]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.ticketWidth = config.width || 920;
    this.ticketHeight = config.height || 660;
    this.economy = config.economy || {};
    this.coinsAtStart = config.coinsAtStart !== undefined ? config.coinsAtStart : 0;
    this.coins = config.coins !== undefined ? config.coins : 0;

    this.dayEarnings = this.economy.dayEarnings || 0;
    this.rent = this.economy.expenses?.rent || 0;
    this.maintenance = this.economy.expenses?.maintenance || 0;
    this.loanPayment = this.economy.expenses?.loanPayment || 0;
    this.totalExpenses = this.economy.expenses?.total || 0;
    this.netCoins = this.economy.netCoins !== undefined ? this.economy.netCoins : 0;
    this.isBankrupt = !!this.economy.isBankrupt;

    this.textElements = [];
    this.buildTicket();

    scene.add.existing(this);
  }

  buildTicket() {
    const i18n = I18nManager.getInstance();
    const w = this.ticketWidth;
    const h = this.ticketHeight;

    // 1. Sombra suave y cálida detrás del ticket
    const shadowGfx = this.scene.add.graphics();
    shadowGfx.fillStyle(0x4e3629, 0.12);
    shadowGfx.fillRoundedRect(6, 8, w, h, 16);
    this.add(shadowGfx);

    // 2. Fondo de papel marfil con muescas troqueladas procedurales
    this.ticketPaperGfx = this.scene.add.graphics();
    this.drawPerforatedPaper(this.ticketPaperGfx, 0, 0, w, h, 14);
    this.add(this.ticketPaperGfx);

    // 3. Encabezado del ticket con estilo cálido
    const headerBannerGfx = this.scene.add.graphics();
    headerBannerGfx.fillStyle(0x7f5539, 1);
    headerBannerGfx.fillRoundedRect(18, 20, w - 36, 48, 10);
    this.add(headerBannerGfx);

    this.headerText = this.scene.add.text(w / 2, 44, i18n.t('summary.card.title') || 'DETALLE DE FACTURACIÓN Y BALANCE', {
      font: '21px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '700',
      letterSpacing: 2
    }).setOrigin(0.5);
    this.add(this.headerText);

    // 4. Bloques de contenido contable
    const contentStartY = 86;
    const paddingX = 40;
    const textStyleLeft = { font: '21px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '600' };

    // Bloque 1: Ingresos (verde suave 20% opacidad)
    const incomeBg = this.scene.add.graphics();
    incomeBg.fillStyle(0xd8f3dc, 0.28);
    incomeBg.fillRoundedRect(22, contentStartY - 6, w - 44, 130, 8);
    this.add(incomeBg);

    // Bloque 2: Gastos fijos (rosa suave 22% opacidad)
    const expensesBg = this.scene.add.graphics();
    expensesBg.fillStyle(0xffccd5, 0.28);
    expensesBg.fillRoundedRect(22, contentStartY + 132, w - 44, 172, 8);
    this.add(expensesBg);

    // Líneas contables configuradas
    this.rowsConfig = [
      // Ingresos
      {
        id: 'ventas',
        labelKey: 'summary.card.sales',
        fallbackLabel: 'Ventas de la Jornada (Hoy):',
        val: `+${this.dayEarnings}`,
        valColor: '#2b9348',
        y: contentStartY + 20,
        isBold: false
      },
      {
        id: 'saldoPrevio',
        labelKey: 'summary.card.startCoins',
        fallbackLabel: 'Saldo Previo en Caja:',
        val: `+${this.coinsAtStart}`,
        valColor: '#7f5539',
        y: contentStartY + 56,
        isBold: false
      },
      {
        id: 'totalFondos',
        labelKey: 'summary.card.totalCoins',
        fallbackLabel: 'Total Fondos en Caja al Cierre:',
        val: `${this.coins}`,
        valColor: '#d48c47',
        y: contentStartY + 96,
        isBold: true
      },
      // Gastos
      {
        id: 'alquiler',
        labelKey: 'summary.card.rent',
        fallbackLabel: 'Alquiler del Local (Fijo):',
        val: `-${this.rent}`,
        valColor: '#8c2f39',
        y: contentStartY + 154,
        isBold: false
      },
      {
        id: 'servicios',
        labelKey: 'summary.card.maintenance',
        fallbackLabel: 'Servicios de Luz / Agua / Gas:',
        val: `-${this.maintenance}`,
        valColor: '#8c2f39',
        y: contentStartY + 190,
        isBold: false
      },
      {
        id: 'cuota',
        labelKey: 'summary.card.loanPayment',
        fallbackLabel: 'Cuota del Préstamo Bancario:',
        val: `-${this.loanPayment}`,
        valColor: '#8c2f39',
        y: contentStartY + 226,
        isBold: false
      },
      {
        id: 'totalGastos',
        labelKey: 'summary.card.totalExpenses',
        fallbackLabel: 'Total Gastos Deducidos:',
        val: `-${this.totalExpenses}`,
        valColor: '#8c2f39',
        y: contentStartY + 268,
        isBold: true
      }
    ];

    this.rowObjects = [];

    this.rowsConfig.forEach(row => {
      const labelText = i18n.t(row.labelKey) || row.fallbackLabel;
      const lblStyle = row.isBold
        ? { font: '22px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '800' }
        : textStyleLeft;
      const valStyle = row.isBold
        ? { font: '22px "Outfit", sans-serif', fill: row.valColor, fontWeight: '800' }
        : { font: '21px "Outfit", sans-serif', fill: row.valColor, fontWeight: '700' };

      const labelObj = this.scene.add.text(paddingX, row.y, labelText, lblStyle).setOrigin(0, 0.5);
      const valObj = this.scene.add.text(w - paddingX - 28, row.y, row.val, valStyle).setOrigin(1, 0.5);

      // Línea punteada conductora entre label y valor
      const dottedLineGfx = this.scene.add.graphics();
      this.drawDottedLine(dottedLineGfx, labelObj.x + labelObj.width + 12, valObj.x - valObj.width - 12, row.y);

      // Icono de moneda
      const coinGfx = this.scene.add.graphics();
      this.drawCoinIcon(coinGfx, w - paddingX - 10, row.y, 8);

      this.add([dottedLineGfx, labelObj, valObj, coinGfx]);
      this.rowObjects.push({ row, labelObj, valObj, dottedLineGfx, coinGfx });
    });

    // 5. Badge de Saldo Neto Restante Destacado (Outfit 800)
    const isPositive = this.netCoins >= 0;
    const badgeBgColor = isPositive ? 0xd8f3dc : 0xffccd5;
    const badgeBorderColor = isPositive ? 0x2b9348 : 0xd90429;
    const balanceColor = isPositive ? '#2b9348' : '#d90429';

    const badgeY = contentStartY + 338;
    const badgeH = 80;
    const badgeW = w - 44;

    const badgeGfx = this.scene.add.graphics();
    badgeGfx.fillStyle(badgeBgColor, 0.85);
    badgeGfx.fillRoundedRect(22, badgeY, badgeW, badgeH, 14);
    badgeGfx.lineStyle(2, badgeBorderColor, 1);
    badgeGfx.strokeRoundedRect(22, badgeY, badgeW, badgeH, 14);
    this.add(badgeGfx);

    this.saldoLabelText = this.scene.add.text(paddingX + 8, badgeY + badgeH / 2, i18n.t('summary.card.netBalance') || 'SALDO NETO RESTANTE:', {
      font: '26px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0, 0.5);
    this.add(this.saldoLabelText);

    const signPrefix = this.netCoins > 0 ? '+' : '';
    this.saldoValueText = this.scene.add.text(w - paddingX - 44, badgeY + badgeH / 2, `${signPrefix}${this.netCoins}`, {
      font: '38px "Outfit", sans-serif',
      fill: balanceColor,
      fontWeight: '800'
    }).setOrigin(1, 0.5);
    this.add(this.saldoValueText);

    const saldoCoinGfx = this.scene.add.graphics();
    this.drawCoinIcon(saldoCoinGfx, w - paddingX - 18, badgeY + badgeH / 2, 13);
    this.add(saldoCoinGfx);

    // 6. Sección inferior: Nota o frase de balance
    const noteY = badgeY + badgeH + 40;
    const noteTextString = isPositive
      ? (i18n.t('summary.card.pantryAvailable', { count: this.economy.totalDoughStock || 0 }) || `¡Jornada solvente! Todo listo para la tienda.`)
      : (i18n.t('summary.performance.insolvencyDebt') || 'Insolvencia Financiera: Fondos insuficientes para cubrir los gastos del día');

    this.noteText = this.scene.add.text(w / 2, noteY, noteTextString, {
      font: '18px "Outfit", sans-serif',
      fill: isPositive ? '#7f5539' : '#d90429',
      fontWeight: '600',
      wordWrap: { width: w - 80 },
      align: 'center'
    }).setOrigin(0.5);
    this.add(this.noteText);
  }

  /**
   * Dibuja papel marfil con muescas triangulares troqueladas en borde superior e inferior
   */
  drawPerforatedPaper(gfx, x, y, width, height, notchSize = 12) {
    gfx.clear();

    // Fondo marfil
    gfx.fillStyle(0xfffdf9, 1);
    gfx.lineStyle(2, 0x582f0e, 1); // Contorno café 2px

    gfx.beginPath();
    // Borde izquierdo recto
    gfx.moveTo(x, y + notchSize);

    // Borde superior con muescas triangulares
    const numNotchesX = Math.floor(width / (notchSize * 2));
    const stepX = width / numNotchesX;

    for (let i = 0; i < numNotchesX; i++) {
      const curX = x + i * stepX;
      gfx.lineTo(curX + stepX * 0.25, y);
      gfx.lineTo(curX + stepX * 0.5, y + notchSize * 0.6);
      gfx.lineTo(curX + stepX * 0.75, y);
      gfx.lineTo(curX + stepX, y);
    }

    // Borde derecho
    gfx.lineTo(x + width, y + height);

    // Borde inferior con muescas troqueladas inversas
    for (let i = numNotchesX - 1; i >= 0; i--) {
      const curX = x + i * stepX;
      gfx.lineTo(curX + stepX * 0.75, y + height);
      gfx.lineTo(curX + stepX * 0.5, y + height - notchSize * 0.6);
      gfx.lineTo(curX + stepX * 0.25, y + height);
      gfx.lineTo(curX, y + height);
    }

    // Cierre
    gfx.lineTo(x, y + notchSize);
    gfx.closePath();

    gfx.fillPath();
    gfx.strokePath();

    // Líneas decorativas de corte sutiles
    gfx.lineStyle(1, 0xddb892, 0.4);
    gfx.lineBetween(x + 20, y + 16, x + width - 20, y + 16);
    gfx.lineBetween(x + 20, y + height - 16, x + width - 20, y + height - 16);
  }

  /**
   * Dibuja una línea punteada conductora horizontal
   */
  drawDottedLine(gfx, startX, endX, y) {
    if (endX <= startX) return;
    gfx.clear();
    gfx.fillStyle(0xcaa689, 0.45);
    const dotSpacing = 8;
    const dotRadius = 1.5;
    for (let curX = startX; curX <= endX; curX += dotSpacing) {
      gfx.fillCircle(curX, y, dotRadius);
    }
  }

  /**
   * Dibuja icono vectorial de moneda dorada sin emojis
   */
  drawCoinIcon(gfx, cx, cy, radius = 9) {
    gfx.fillStyle(0xffb703, 1);
    gfx.fillCircle(cx, cy, radius);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillCircle(cx - 1, cy - 1, radius * 0.55);
    gfx.lineStyle(1.5, 0xe09f00, 1);
    gfx.strokeCircle(cx, cy, radius);
  }

  /**
   * Actualiza los textos al cambiar de idioma
   */
  updateTexts() {
    const i18n = I18nManager.getInstance();
    if (this.headerText) {
      this.headerText.setText(i18n.t('summary.card.title') || 'DETALLE DE FACTURACIÓN Y BALANCE');
    }
    if (this.saldoLabelText) {
      this.saldoLabelText.setText(i18n.t('summary.card.netBalance') || 'SALDO NETO RESTANTE:');
    }

    this.rowObjects.forEach(item => {
      const newLabel = i18n.t(item.row.labelKey) || item.row.fallbackLabel;
      item.labelObj.setText(newLabel);
      this.drawDottedLine(
        item.dottedLineGfx,
        item.labelObj.x + item.labelObj.width + 12,
        item.valObj.x - item.valObj.width - 12,
        item.row.y
      );
    });

    const isPositive = this.netCoins >= 0;
    if (this.noteText) {
      const noteTextString = isPositive
        ? (i18n.t('summary.card.pantryAvailable', { count: this.economy.totalDoughStock || 0 }) || `¡Jornada solvente! Todo listo para la tienda.`)
        : (i18n.t('summary.performance.insolvencyDebt') || 'Insolvencia Financiera: Fondos insuficientes para cubrir los gastos del día');
      this.noteText.setText(noteTextString);
    }
  }
}
