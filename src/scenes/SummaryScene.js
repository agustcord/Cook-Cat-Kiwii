import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import { evaluateSolvency } from '../game/EconomyManager.js';
import {
  computeSubtitleLayout,
  computeDebtLayout,
  computeSaldoBadgeLayout
} from '../game/SummaryLayout.js';

export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.meta = safeData.meta || 100;
    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;

    // Preserved start-of-day state for re-tries
    this.coinsAtStart = safeData.coinsAtStart || 0;
    this.loanRemainingAtStart = safeData.loanRemainingAtStart !== undefined ? safeData.loanRemainingAtStart : 200;
    this.unlockedShapesAtStart = safeData.unlockedShapesAtStart || ['star'];
    this.stockAtStart = safeData.stockAtStart || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 2, milk: 2 }
    };

    // Current state to carry over
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 2, milk: 2 }
    };

    // Evaluacion integral de solvencia y rendimiento contable
    this.economy = evaluateSolvency({
      day: this.day,
      coins: this.coins,
      coinsAtStart: this.coinsAtStart,
      meta: this.meta,
      stock: this.stock,
      loanRemaining: this.loanRemaining
    });

    this.rent = this.economy.expenses.rent;
    this.maintenance = this.economy.expenses.maintenance;
    this.loanPayment = this.economy.expenses.loanPayment;
    this.totalExpenses = this.economy.expenses.total;
    this.netCoins = this.economy.netCoins;
    this.dayEarnings = this.economy.dayEarnings;
    this.performance = this.economy.performance;
    this.totalDoughStock = this.economy.totalDoughStock;
    this.updatedLoanRemaining = this.economy.updatedLoanRemaining;
    this.isBankrupt = this.economy.isBankrupt;
    this.bankruptcyReason = this.economy.bankruptcyReason;
  }

  create() {
    // Play appropriate sound when entering summary
    if (this.isBankrupt) {
      SoundManager.getInstance().playGameOverMelody();
    } else {
      SoundManager.getInstance().playCoinCascade();
    }
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // ============================================================
    // PASO 1: Fondo con gradiente vertical + patrón decorativo sutil
    // ============================================================
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0xfff1e6, 0xfff1e6, 0xffe5d9, 0xffe5d9, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Patrón decorativo sutil — círculos y mini-estrellas con opacidad 8%
    const patternGfx = this.add.graphics();
    const patternShapes = [
      { x: 80, y: 120, r: 18 }, { x: 220, y: 60, r: 12 },
      { x: 900, y: 80, r: 15 }, { x: 750, y: 930, r: 20 },
      { x: 150, y: 850, r: 14 }, { x: 950, y: 200, r: 16 },
      { x: 60, y: 500, r: 10 }, { x: 970, y: 550, r: 13 },
      { x: 300, y: 920, r: 11 }, { x: 820, y: 50, r: 17 },
      { x: 500, y: 950, r: 12 }, { x: 40, y: 300, r: 9 }
    ];
    patternGfx.fillStyle(0xddb892, 0.08);
    patternShapes.forEach(s => {
      patternGfx.fillCircle(s.x, s.y, s.r);
    });
    // Mini diamond decorations
    patternGfx.fillStyle(0xcaa689, 0.06);
    const diamondPositions = [
      { x: 400, y: 40 }, { x: 600, y: 960 },
      { x: 980, y: 400 }, { x: 30, y: 700 }
    ];
    diamondPositions.forEach(d => {
      patternGfx.fillTriangle(d.x, d.y - 8, d.x - 6, d.y, d.x + 6, d.y);
      patternGfx.fillTriangle(d.x, d.y + 8, d.x - 6, d.y, d.x + 6, d.y);
    });

    // ============================================================
    // PASO 2: Título con stroke blanco + sombra café (estilo MainMenu)
    // ============================================================
    const titleText = this.isBankrupt ? '¡CIERRE POR QUIEBRA!' : `DÍA ${this.day} COMPLETADO`;
    const titleColor = this.isBankrupt ? '#d90429' : '#38b000';

    const titleObj = this.add.text(width / 2, 58, titleText, {
      font: '60px "Outfit", sans-serif',
      fill: titleColor,
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 8,
      shadow: { color: '#4e3629', fill: false, offsetX: 3, offsetY: 3, blur: 5 }
    }).setOrigin(0.5);

    // ============================================================
    // PASO 3: Desempeño Comercial y Estrellas Vectoriales
    // Centrado armónico del bloque completo de rating
    // ============================================================
    const starsEarned = this.performance.stars;

    const performanceHeader = this.isBankrupt
      ? (this.bankruptcyReason === 'debt'
          ? 'Insolvencia Financiera: Fondos insuficientes para cubrir los gastos del día'
          : 'Desabastecimiento Operativo: Sin masa en despensa ni fondos para reponerla')
      : `Desempeño Comercial: (${this.performance.label})`;

    const performanceColor = this.isBankrupt ? '#d90429' : '#7f5539';

    const perfHeaderObj = this.add.text(width / 2, 118, performanceHeader, {
      font: '26px "Outfit", sans-serif',
      fill: performanceColor,
      fontWeight: '700'
    });

    const starObjs = [];
    if (!this.isBankrupt) {
      // Centrar el bloque unificado (Texto + Estrellas)
      const textW = perfHeaderObj.width;
      const starsW = 3 * 36;
      const gap = 16;
      const totalPerfW = textW + gap + starsW;
      const perfStartX = Math.round((width - totalPerfW) / 2);

      perfHeaderObj.setOrigin(0, 0.5).setPosition(perfStartX, 118);

      const starCenterY = 118;
      const starStartX = perfStartX + textW + gap;

      for (let i = 0; i < 3; i++) {
        const sx = starStartX + i * 36 + 14;
        const starGfx = this.add.graphics();
        const isEarned = i < starsEarned;

        if (isEarned) {
          starGfx.fillStyle(0xffb703, 1);
        }
        starGfx.lineStyle(2, isEarned ? 0xe09f00 : 0xddb892, 1);

        this._drawStar(starGfx, sx, starCenterY, 5, 14, 7, isEarned);
        starObjs.push({ gfx: starGfx, earned: isEarned });
      }
    } else {
      perfHeaderObj.setOrigin(0.5).setPosition(width / 2, 118);
    }

    // ============================================================
    // PASO 4: Subtítulo con métricas reales y monedas vectoriales
    // Cero aproximación mágica: layout desacoplado usando .width real
    // ============================================================
    const subStyle = {
      font: '20px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    };

    const tMeta = this.add.text(0, 0, `Meta: ${this.meta}`, subStyle).setOrigin(0, 0.5);
    const tEarnings = this.add.text(0, 0, `•   Ventas Hoy: ${this.dayEarnings}`, subStyle).setOrigin(0, 0.5);
    const tMessage = this.add.text(0, 0, `•   ${this.performance.message}`, subStyle).setOrigin(0, 0.5);

    const subLayout = computeSubtitleLayout({
      metaTextWidth: tMeta.width,
      earningsTextWidth: tEarnings.width,
      messageTextWidth: tMessage.width,
      screenWidth: width,
      y: 154,
      textHeight: Math.max(tMeta.height, tEarnings.height, tMessage.height)
    });

    tMeta.setPosition(subLayout.items[0].x, subLayout.items[0].y);

    const subCoin1 = this.add.graphics();
    this._drawCoinIcon(subCoin1, subLayout.items[1].x, subLayout.items[1].y);

    tEarnings.setPosition(subLayout.items[2].x, subLayout.items[2].y);

    const subCoin2 = this.add.graphics();
    this._drawCoinIcon(subCoin2, subLayout.items[3].x, subLayout.items[3].y);

    tMessage.setPosition(subLayout.items[4].x, subLayout.items[4].y);

    const subtitleGroup = [tMeta, subCoin1, tEarnings, subCoin2, tMessage];

    // ============================================================
    // PASO 5: Card de Facturación / Recibo (Paper Card)
    // ============================================================
    const cardW = 820;
    const cardH = 560;
    const cardX = width / 2 - cardW / 2;
    const cardY = 190;
    const cardRadius = 18;

    const receipt = this.add.graphics();

    // Fondo papel marfil
    receipt.fillStyle(0xfff1e6, 0.96);
    receipt.fillRoundedRect(cardX, cardY, cardW, cardH, cardRadius);

    // Banda cabecera: Café Tostado #7f5539 para óptimo contraste (5.5:1 con texto blanco)
    receipt.fillStyle(0x7f5539, 1);
    receipt.fillRoundedRect(cardX, cardY, cardW, 54, { tl: cardRadius, tr: cardRadius, bl: 0, br: 0 });

    // Bloque 1 - Ingresos: Verde Menta #d8f3dc (30% opacity)
    receipt.fillStyle(0xd8f3dc, 0.3);
    receipt.fillRect(cardX, cardY + 54, cardW, 128);

    // Bloque 2 - Gastos: Rosa Pastel #ffccd5 (30% opacity)
    receipt.fillStyle(0xffccd5, 0.3);
    receipt.fillRect(cardX, cardY + 182, cardW, 166);

    // Bloque 3 - Saldo Neto: Marrón Tostado #caa689 (25% opacity)
    receipt.fillStyle(0xcaa689, 0.25);
    receipt.fillRect(cardX, cardY + 348, cardW, 96);

    // Bloque 4 - Despensa: Lavanda #d6c7ff (20% opacity)
    receipt.fillStyle(0xd6c7ff, 0.2);
    receipt.fillRoundedRect(cardX, cardY + 444, cardW, cardH - 444, { tl: 0, tr: 0, bl: cardRadius, br: cardRadius });

    // Borde exterior del recibo
    receipt.lineStyle(3, 0xddb892, 1);
    receipt.strokeRoundedRect(cardX, cardY, cardW, cardH, cardRadius);

    // Líneas divisorias sutiles
    receipt.lineStyle(1, 0xddb892, 0.35);
    receipt.lineBetween(cardX + 20, cardY + 182, cardX + cardW - 20, cardY + 182);
    receipt.lineBetween(cardX + 20, cardY + 348, cardX + cardW - 20, cardY + 348);
    receipt.lineBetween(cardX + 20, cardY + 444, cardX + cardW - 20, cardY + 444);

    // Título de la cabecera del recibo
    const headerTextObj = this.add.text(width / 2, cardY + 27, 'DETALLE DE FACTURACIÓN Y BALANCE', {
      font: '23px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Estilos de líneas de facturación
    const textStyleLeft = { font: '23px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '600' };
    const textStyleRight = { font: '23px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '800' };

    // Configuración de filas del balance
    const tableRowsConfig = [
      // Bloque 1: Ingresos y Caja
      { id: 'ventas', label: 'Ventas de la Jornada (Hoy):', val: `+${this.dayEarnings}`, yOffset: 86, styleLeft: textStyleLeft, styleRight: textStyleRight },
      { id: 'saldoPrevio', label: 'Saldo Previo en Caja:', val: `+${this.coinsAtStart}`, yOffset: 122, styleLeft: textStyleLeft, styleRight: textStyleRight },
      {
        id: 'totalFondos',
        label: 'Total Fondos en Caja al Cierre:',
        val: `${this.coins}`,
        yOffset: 158,
        styleLeft: { font: '24px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '800' },
        styleRight: { font: '24px "Outfit", sans-serif', fill: '#d48c47', fontWeight: '800' }
      },
      // Bloque 2: Gastos Fijos
      { id: 'alquiler', label: 'Alquiler del Local (Fijo):', val: `-${this.rent}`, yOffset: 210, styleLeft: textStyleLeft, styleRight: textStyleRight },
      { id: 'servicios', label: 'Servicios de Luz / Agua / Gas:', val: `-${this.maintenance}`, yOffset: 244, styleLeft: textStyleLeft, styleRight: textStyleRight },
      { id: 'cuota', label: 'Cuota del Préstamo Bancario:', val: `-${this.loanPayment}`, yOffset: 278, styleLeft: textStyleLeft, styleRight: textStyleRight },
      {
        id: 'totalGastos',
        label: 'Total Gastos Deducidos:',
        val: `-${this.totalExpenses}`,
        yOffset: 316,
        styleLeft: { font: '24px "Outfit", sans-serif', fill: '#8c2f39', fontWeight: '800' },
        styleRight: { font: '24px "Outfit", sans-serif', fill: '#8c2f39', fontWeight: '800' }
      }
    ];

    const cardDataElements = [];
    tableRowsConfig.forEach(row => {
      const labelObj = this.add.text(cardX + 32, cardY + row.yOffset, row.label, row.styleLeft).setOrigin(0, 0.5);
      // Valor numérico alineado a la derecha con margen limpio antes de la moneda
      const valObj = this.add.text(cardX + cardW - 44, cardY + row.yOffset, row.val, row.styleRight).setOrigin(1, 0.5);
      const coinGfx = this.add.graphics();
      this._drawCoinIcon(coinGfx, cardX + cardW - 24, cardY + row.yOffset);
      cardDataElements.push(labelObj, valObj, coinGfx);
    });

    // ============================================================
    // PASO 6: Badge visual para Saldo Neto
    // Totalmente simétrico, contrastado y sin solapamiento
    // ============================================================
    const balanceIsPositive = this.netCoins >= 0;
    const badgeBgColor = balanceIsPositive ? 0xd8f3dc : 0xffccd5;
    const badgeBorderColor = balanceIsPositive ? 0x2b9348 : 0xd90429;
    const balanceColor = balanceIsPositive ? '#2b9348' : '#d90429';

    const saldoLabelObj = this.add.text(cardX + 32, cardY + 384, 'SALDO NETO RESTANTE:', {
      font: '29px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0, 0.5);

    const saldoValObj = this.add.text(0, 0, `${this.netCoins}`, {
      font: '34px "Outfit", sans-serif',
      fill: balanceColor,
      fontWeight: '800'
    }).setOrigin(1, 0.5);

    const badgeLayout = computeSaldoBadgeLayout({
      cardX,
      cardY,
      cardW,
      labelWidth: saldoLabelObj.width,
      valueWidth: saldoValObj.width,
      valueHeight: saldoValObj.height,
      yOffset: 384
    });

    saldoValObj.setPosition(badgeLayout.items[2].x, badgeLayout.y);

    const saldoCoinGfx = this.add.graphics();
    this._drawCoinIcon(saldoCoinGfx, badgeLayout.items[3].x, badgeLayout.y);

    // Contenedor visual del badge
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(badgeBgColor, 0.65);
    badgeGfx.fillRoundedRect(badgeLayout.badgeX, badgeLayout.badgeY, badgeLayout.badgeW, badgeLayout.badgeH, 12);
    badgeGfx.lineStyle(2, badgeBorderColor, 0.85);
    badgeGfx.strokeRoundedRect(badgeLayout.badgeX, badgeLayout.badgeY, badgeLayout.badgeW, badgeLayout.badgeH, 12);

    badgeGfx.setDepth(0);
    saldoValObj.setDepth(1);
    saldoCoinGfx.setDepth(1);

    // ============================================================
    // PASO 7: Bloque 4 — Despensa y Estado de Deuda
    // Sin sprites invasivos: espacio limpio conforme a feedback del Capitán
    // ============================================================
    let pantryStatus = '';
    let pantryColor = '#2b9348';

    if (this.totalDoughStock >= 1) {
      pantryStatus = `${this.totalDoughStock} u. disponibles para abrir mañana`;
      pantryColor = '#2b9348';
    } else if (this.netCoins >= 10) {
      pantryStatus = `0 u. (Saldo disponible para reponer en tienda)`;
      pantryColor = '#d48c47';
    } else {
      pantryStatus = `0 u. (Fondos insuficientes para masa básica: 10)`;
      pantryColor = '#d90429';
    }

    const pantryTitleObj = this.add.text(cardX + 32, cardY + 462, 'Despensa de Masa:', textStyleLeft).setOrigin(0, 0.5);
    const pantryValObj = this.add.text(cardX + cardW - 32, cardY + 462, pantryStatus, {
      font: '21px "Outfit", sans-serif',
      fill: pantryColor,
      fontWeight: '700'
    }).setOrigin(1, 0.5);

    // Línea de Deuda Bancaria: posicionamiento milimétrico sin tapar números
    const debtStyle = {
      font: '20px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '700'
    };

    const tDebt1 = this.add.text(0, 0, `Préstamo restante con el banco: ${this.updatedLoanRemaining}`, debtStyle).setOrigin(0, 0.5);
    const tDebt2 = this.add.text(0, 0, `(Inicial: 200)`, debtStyle).setOrigin(0, 0.5);

    const debtLayout = computeDebtLayout({
      debtTextWidth: tDebt1.width,
      initialTextWidth: tDebt2.width,
      screenWidth: width,
      y: cardY + 518,
      textHeight: Math.max(tDebt1.height, tDebt2.height)
    });

    tDebt1.setPosition(debtLayout.items[0].x, debtLayout.items[0].y);

    const debtCoin = this.add.graphics();
    this._drawCoinIcon(debtCoin, debtLayout.items[1].x, debtLayout.items[1].y);

    tDebt2.setPosition(debtLayout.items[2].x, debtLayout.items[2].y);

    // ============================================================
    // PASO 8: Botones de Acción (CTA principal + Reintentar)
    // ============================================================
    let btnTextString = '';
    let btnColor = 0x7f5539;
    let btnHoverColor = 0x9c6644;
    let nextSceneCallback = null;

    if (this.isBankrupt) {
      btnTextString = 'DECLARAR QUIEBRA';
      btnColor = 0xd90429;
      btnHoverColor = 0xef233c;
      nextSceneCallback = () => {
        this.scene.start('GameOverScene', { reason: this.bankruptcyReason });
      };
    } else if (this.updatedLoanRemaining <= 0) {
      btnTextString = 'VICTORIA FINANCIERA';
      btnColor = 0x38b000;
      btnHoverColor = 0x4cc9f0;
      nextSceneCallback = () => {
        this.scene.start('VictoryScene', { coins: this.netCoins });
      };
    } else {
      btnTextString = 'IR A LA TIENDA';
      btnColor = 0x7f5539;
      btnHoverColor = 0x9c6644;
      nextSceneCallback = () => {
        this.scene.start('ShopScene', {
          day: this.day,
          coins: this.netCoins,
          unlockedShapes: this.unlockedShapes,
          stock: this.stock,
          loanRemaining: this.updatedLoanRemaining
        });
      };
    }

    const btnW = 500;
    const btnH = 86;
    const btnX = width / 2 - btnW / 2;
    const btnY = 808;

    let warningObj = null;
    if (!this.isBankrupt && this.dayEarnings < this.meta) {
      warningObj = this.add.text(width / 2, btnY - 26, 'Rendimiento comercial por debajo de la meta. Puedes continuar a la tienda o reintentar.', {
        font: '20px "Outfit", sans-serif',
        fill: '#8c5847',
        fontWeight: '700'
      }).setOrigin(0.5);
      warningObj.setAlpha(0);
    }

    // Botón principal
    const btnShadowGfx = this.add.graphics();
    btnShadowGfx.fillStyle(0x4e3629, 0.3);
    btnShadowGfx.fillRoundedRect(btnX + 3, btnY + 3, btnW, btnH, 18);

    const actionBtnBg = this.add.graphics();
    actionBtnBg.fillStyle(btnColor, 1);
    actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 18);

    const btnText = this.add.text(width / 2, btnY + btnH / 2, btnTextString, {
      font: '29px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      nextSceneCallback();
    });

    actionZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      actionBtnBg.clear();
      actionBtnBg.fillStyle(btnHoverColor, 1);
      actionBtnBg.fillRoundedRect(btnX - 4, btnY - 2, btnW + 8, btnH + 4, 20);
      btnShadowGfx.clear();
      btnShadowGfx.fillStyle(0x4e3629, 0.4);
      btnShadowGfx.fillRoundedRect(btnX - 1, btnY + 1, btnW + 8, btnH + 4, 20);
      btnText.setScale(1.04);
    });

    actionZone.on('pointerout', () => {
      actionBtnBg.clear();
      actionBtnBg.fillStyle(btnColor, 1);
      actionBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 18);
      btnShadowGfx.clear();
      btnShadowGfx.fillStyle(0x4e3629, 0.3);
      btnShadowGfx.fillRoundedRect(btnX + 3, btnY + 3, btnW, btnH, 18);
      btnText.setScale(1);
    });

    const btnGroup = [btnShadowGfx, actionBtnBg, btnText, actionZone];

    // Botón secundario: Reintentar
    let retryGroup = [];
    if (!this.isBankrupt) {
      const retryBtnW = 340;
      const retryBtnH = 52;
      const retryBtnX = width / 2 - retryBtnW / 2;
      const retryBtnY = height - 100;

      const retryBg = this.add.graphics();
      retryBg.lineStyle(2, 0x7f5539, 1);
      retryBg.strokeRoundedRect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 14);

      const retryText = this.add.text(width / 2, retryBtnY + retryBtnH / 2, 'REINTENTAR EL DÍA', {
        font: '22px "Outfit", sans-serif',
        fill: '#7f5539',
        fontWeight: '800'
      }).setOrigin(0.5);

      const retryZone = this.add.rectangle(width / 2, retryBtnY + retryBtnH / 2, retryBtnW, retryBtnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      retryZone.on('pointerdown', () => {
        SoundManager.getInstance().playUiTap();
        this.scene.start('GameScene', {
          day: this.day,
          coins: this.coinsAtStart,
          loanRemaining: this.loanRemainingAtStart,
          unlockedShapes: this.unlockedShapesAtStart,
          stock: this.stockAtStart
        });
      });

      retryZone.on('pointerover', () => {
        SoundManager.getInstance().playUiHover();
        retryBg.clear();
        retryBg.fillStyle(0x7f5539, 0.1);
        retryBg.fillRoundedRect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 14);
        retryBg.lineStyle(2, 0x7f5539, 1);
        retryBg.strokeRoundedRect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 14);
        retryText.setColor('#582f0e');
      });

      retryZone.on('pointerout', () => {
        retryBg.clear();
        retryBg.lineStyle(2, 0x7f5539, 1);
        retryBg.strokeRoundedRect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 14);
        retryText.setColor('#7f5539');
      });

      retryGroup = [retryBg, retryText, retryZone];
    }

    // ============================================================
    // PASO 9: Animación de entrada suave, unificada y profesional
    // Sin saltos bruscos ni elementos flotando a medio armar.
    // Todos los elementos inician en alpha: 0.
    // ============================================================
    const cardContentGroup = [
      headerTextObj,
      ...cardDataElements,
      saldoLabelObj,
      badgeGfx,
      saldoValObj,
      saldoCoinGfx,
      pantryTitleObj,
      pantryValObj,
      tDebt1,
      debtCoin,
      tDebt2
    ];

    // 1. Estado inicial oculto — Cero elementos sueltos visibles
    titleObj.setAlpha(0);
    perfHeaderObj.setAlpha(0);
    starObjs.forEach(s => s.gfx.setAlpha(0));
    subtitleGroup.forEach(obj => { if (obj.setAlpha) obj.setAlpha(0); });

    receipt.setAlpha(0).setScale(0.99);
    cardContentGroup.forEach(obj => { if (obj.setAlpha) obj.setAlpha(0); });

    btnGroup.forEach(item => { if (item.setAlpha) item.setAlpha(0); });
    retryGroup.forEach(item => { if (item.setAlpha) item.setAlpha(0); });
    if (warningObj) warningObj.setAlpha(0);

    // 2. Cabecera y subtítulo: Fade-in suave (250ms)
    this.tweens.add({
      targets: [titleObj, perfHeaderObj, ...subtitleGroup],
      alpha: 1,
      duration: 250,
      ease: 'Sine.easeOut'
    });

    // 3. Estrellas de rating: Fade-in gentil con giro suave y pop sonoro para las ganadas
    starObjs.forEach((s, i) => {
      this.tweens.add({
        targets: s.gfx,
        alpha: 1,
        duration: 250,
        delay: 100 + i * 70,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (s.earned) {
            SoundManager.getInstance().playStarPop(i);
            this.tweens.add({
              targets: s.gfx,
              angle: 360,
              duration: 500,
              ease: 'Sine.easeInOut'
            });
          }
        }
      });
    });

    // 4. Recibo completo y todo su contenido: Fade-in simultáneo y micro-scale (300ms, delay 80ms)
    this.tweens.add({
      targets: receipt,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: 80,
      ease: 'Sine.easeOut'
    });

    this.tweens.add({
      targets: cardContentGroup,
      alpha: 1,
      duration: 300,
      delay: 80,
      ease: 'Sine.easeOut'
    });

    // 5. Botones de acción: Fade-in justo al asentarse el recibo (250ms, delay 260ms)
    const btnDelay = 260;
    btnGroup.forEach(item => {
      if (item.setAlpha) {
        this.tweens.add({
          targets: item,
          alpha: 1,
          duration: 250,
          delay: btnDelay,
          ease: 'Sine.easeOut'
        });
      }
    });

    if (warningObj) {
      this.tweens.add({
        targets: warningObj,
        alpha: 1,
        duration: 250,
        delay: btnDelay,
        ease: 'Sine.easeOut'
      });
    }

    retryGroup.forEach(item => {
      if (item.setAlpha) {
        this.tweens.add({
          targets: item,
          alpha: 1,
          duration: 250,
          delay: btnDelay + 80,
          ease: 'Sine.easeOut'
        });
      }
    });
  }

  // ============================================================
  // Helper: Dibuja estrella de 5 puntas vectorial
  // ============================================================
  _drawStar(graphics, cx, cy, points, outerR, innerR, fill) {
    const step = Math.PI / points;
    const path = [];

    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      path.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      });
    }

    if (fill) {
      graphics.beginPath();
      graphics.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        graphics.lineTo(path[i].x, path[i].y);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    } else {
      graphics.beginPath();
      graphics.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        graphics.lineTo(path[i].x, path[i].y);
      }
      graphics.closePath();
      graphics.strokePath();
    }
  }

  // ============================================================
  // Helper: Dibuja moneda dorada vectorial sin emoji
  // ============================================================
  _drawCoinIcon(graphics, x, y) {
    graphics.fillStyle(0xffb703, 1);
    graphics.fillCircle(x, y, 9);
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(x - 1, y - 1, 5);
    graphics.lineStyle(1.5, 0xe09f00, 1);
    graphics.strokeCircle(x, y, 9);
  }
}
