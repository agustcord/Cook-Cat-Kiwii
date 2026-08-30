import Phaser from 'phaser';
import SoundEffects from '../game/SoundEffects.js';
import { evaluateSolvency } from '../game/EconomyManager.js';

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
      SoundEffects.playAngry();
    } else {
      SoundEffects.playCoin();
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
    // PASO 8: Estrellas de rating vectoriales (3 siempre visibles)
    // ============================================================
    const starsEarned = this.performance.stars;

    // Performance header text (without emoji stars)
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
    }).setOrigin(0.5);

    // Draw 3 vectorial stars — filled gold (earned) / outline (empty)
    const starObjs = [];
    if (!this.isBankrupt) {
      const starCenterY = 118;
      const perfBounds = perfHeaderObj.getBounds();
      const starStartX = perfBounds.right + 16;

      for (let i = 0; i < 3; i++) {
        const sx = starStartX + i * 36;
        const starGfx = this.add.graphics();
        const isEarned = i < starsEarned;

        if (isEarned) {
          starGfx.fillStyle(0xffb703, 1);
        }
        starGfx.lineStyle(2, isEarned ? 0xe09f00 : 0xddb892, 1);

        // Draw a 5-pointed star path
        this._drawStar(starGfx, sx, starCenterY, 5, 14, 7, isEarned);
        starGfx.setAlpha(0);
        starObjs.push({ gfx: starGfx, earned: isEarned });
      }
    }

    // Performance subtitle (replace coin emoji with text only)
    const performanceSub = `Meta: ${this.meta}  •  Ventas Hoy: ${this.dayEarnings}  •  ${this.performance.message}`;
    const perfSubObj = this.add.text(width / 2, 154, performanceSub, {
      font: '20px "Outfit", sans-serif',
      fill: '#8c5847',
      fontWeight: '600'
    }).setOrigin(0.5);

    // Draw coin icons next to "Meta" and "Ventas" values
    this._drawCoinIcon(this.add.graphics(), width / 2 - perfSubObj.width / 2 + this._measureTextOffset(performanceSub, `Meta: ${this.meta}`) + 8, 154);
    this._drawCoinIcon(this.add.graphics(), width / 2 - perfSubObj.width / 2 + this._measureTextOffset(performanceSub, `Meta: ${this.meta}  •  Ventas Hoy: ${this.dayEarnings}`) + 8, 154);

    // ============================================================
    // PASO 3: Card con secciones coloreadas por bloque
    // ============================================================
    const cardW = 820;
    const cardH = 560;
    const cardX = width / 2 - cardW / 2;
    const cardY = 190;
    const cardRadius = 18;

    const receipt = this.add.graphics();

    // Main card background (paper)
    receipt.fillStyle(0xfff1e6, 0.96);
    receipt.fillRoundedRect(cardX, cardY, cardW, cardH, cardRadius);

    // Section backgrounds with canonical palette colors
    // Header band: Madera #ddb892
    receipt.fillStyle(0xddb892, 1);
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

    // Board outline — 3px, Madera
    receipt.lineStyle(3, 0xddb892, 1);
    receipt.strokeRoundedRect(cardX, cardY, cardW, cardH, cardRadius);

    // Subtle section divider lines
    receipt.lineStyle(1, 0xddb892, 0.35);
    receipt.lineBetween(cardX + 20, cardY + 182, cardX + cardW - 20, cardY + 182);
    receipt.lineBetween(cardX + 20, cardY + 348, cardX + cardW - 20, cardY + 348);
    receipt.lineBetween(cardX + 20, cardY + 444, cardX + cardW - 20, cardY + 444);

    // Receipt header text (white on madera band)
    const headerTextObj = this.add.text(width / 2, cardY + 28, 'DETALLE DE FACTURACIÓN Y BALANCE', {
      font: '24px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Invoice items styles
    const textStyleLeft = { font: '23px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '600' };
    const textStyleRight = { font: '23px "Outfit", sans-serif', fill: '#582f0e', fontWeight: '800' };

    // Collect all data line objects for stagger animation
    const dataLines = [];

    // Bloque 1: Ingresos y Caja
    dataLines.push(this.add.text(cardX + 32, cardY + 74, 'Ventas de la Jornada (Hoy):', textStyleLeft));
    const earningsVal = this.add.text(cardX + cardW - 48, cardY + 74, `+${this.dayEarnings}`, textStyleRight).setOrigin(1, 0);
    dataLines.push(earningsVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 78);

    dataLines.push(this.add.text(cardX + 32, cardY + 110, 'Saldo Previo en Caja:', textStyleLeft));
    const prevVal = this.add.text(cardX + cardW - 48, cardY + 110, `+${this.coinsAtStart}`, textStyleRight).setOrigin(1, 0);
    dataLines.push(prevVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 114);

    dataLines.push(this.add.text(cardX + 32, cardY + 146, 'Total Fondos en Caja al Cierre:', {
      font: '24px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }));
    const totalVal = this.add.text(cardX + cardW - 48, cardY + 146, `${this.coins}`, {
      font: '24px "Outfit", sans-serif',
      fill: '#d48c47',
      fontWeight: '800'
    }).setOrigin(1, 0);
    dataLines.push(totalVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 150);

    // Bloque 2: Gastos Fijos
    dataLines.push(this.add.text(cardX + 32, cardY + 198, 'Alquiler del Local (Fijo):', textStyleLeft));
    const rentVal = this.add.text(cardX + cardW - 48, cardY + 198, `-${this.rent}`, textStyleRight).setOrigin(1, 0);
    dataLines.push(rentVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 202);

    dataLines.push(this.add.text(cardX + 32, cardY + 232, 'Servicios de Luz / Agua / Gas:', textStyleLeft));
    const maintVal = this.add.text(cardX + cardW - 48, cardY + 232, `-${this.maintenance}`, textStyleRight).setOrigin(1, 0);
    dataLines.push(maintVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 236);

    dataLines.push(this.add.text(cardX + 32, cardY + 266, 'Cuota del Préstamo Bancario:', textStyleLeft));
    const loanVal = this.add.text(cardX + cardW - 48, cardY + 266, `-${this.loanPayment}`, textStyleRight).setOrigin(1, 0);
    dataLines.push(loanVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 270);

    dataLines.push(this.add.text(cardX + 32, cardY + 304, 'Total Gastos Deducidos:', {
      font: '24px "Outfit", sans-serif',
      fill: '#8c2f39',
      fontWeight: '800'
    }));
    const totalExpVal = this.add.text(cardX + cardW - 48, cardY + 304, `-${this.totalExpenses}`, {
      font: '24px "Outfit", sans-serif',
      fill: '#8c2f39',
      fontWeight: '800'
    }).setOrigin(1, 0);
    dataLines.push(totalExpVal);
    this._drawCoinIcon(this.add.graphics(), cardX + cardW - 38, cardY + 308);

    // ============================================================
    // PASO 4: Badge visual para Saldo Neto
    // ============================================================
    const balanceIsPositive = this.netCoins >= 0;
    const badgeBgColor = balanceIsPositive ? 0xd8f3dc : 0xffccd5;
    const badgeBorderColor = balanceIsPositive ? 0x2b9348 : 0xd90429;
    const balanceColor = balanceIsPositive ? '#38b000' : '#d90429';

    const saldoLabelObj = this.add.text(cardX + 32, cardY + 372, 'SALDO NETO RESTANTE:', {
      font: '29px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    });

    const saldoValObj = this.add.text(cardX + cardW - 48, cardY + 368, `${this.netCoins}`, {
      font: '34px "Outfit", sans-serif',
      fill: balanceColor,
      fontWeight: '800'
    }).setOrigin(1, 0);

    // Draw coin icon next to saldo
    const saldoCoinGfx = this.add.graphics();
    this._drawCoinIcon(saldoCoinGfx, cardX + cardW - 38, cardY + 376);

    // Badge rectangle behind saldo value
    const badgeGfx = this.add.graphics();
    const saldoBounds = saldoValObj.getBounds();
    const badgePadX = 16;
    const badgePadY = 6;
    const badgeW = saldoBounds.width + 24 + badgePadX * 2; // +24 for coin icon space
    const badgeH = saldoBounds.height + badgePadY * 2;
    const badgeX = saldoBounds.x - badgePadX;
    const badgeY = saldoBounds.y - badgePadY;

    badgeGfx.fillStyle(badgeBgColor, 0.6);
    badgeGfx.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 10);
    badgeGfx.lineStyle(2, badgeBorderColor, 0.8);
    badgeGfx.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 10);

    // Move badge behind the text
    badgeGfx.setDepth(0);
    saldoValObj.setDepth(1);
    saldoCoinGfx.setDepth(1);

    // Bloque 4: Despensa / Diagnóstico Operativo
    let pantryStatus = '';
    let pantryColor = '#38b000';

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

    const pantryTitleObj = this.add.text(cardX + 32, cardY + 462, 'Despensa de Masa:', textStyleLeft);
    const pantryValObj = this.add.text(cardX + cardW - 32, cardY + 462, pantryStatus, {
      font: '21px "Outfit", sans-serif',
      fill: pantryColor,
      fontWeight: '700'
    }).setOrigin(1, 0);

    // Deuda status under card inside bottom edge
    const debtObj = this.add.text(width / 2, cardY + 518, `Préstamo restante con el banco: ${this.updatedLoanRemaining} (Inicial: 200)`, {
      font: '20px "Outfit", sans-serif',
      fill: '#b5838d',
      fontWeight: '700'
    }).setOrigin(0.5);

    // Draw coin icon in debt line
    const debtBounds = debtObj.getBounds();
    this._drawCoinIcon(this.add.graphics(), debtBounds.x + this._measureTextOffset(`Préstamo restante con el banco: `, `Préstamo restante con el banco: `) - 4, cardY + 522);

    // ============================================================
    // PASO 5: Kiwi cat decoration (sprite at reduced scale)
    // ============================================================
    let kiwiDecor = null;
    if (this.textures.exists('chef_cat')) {
      kiwiDecor = this.add.image(cardX + cardW - 48, cardY + cardH - 48, 'chef_cat');
      kiwiDecor.setDisplaySize(80, 80);
      kiwiDecor.setOrigin(0.5);
      kiwiDecor.setAlpha(0);
    }

    // ============================================================
    // PASO 7: Botones con sombra y profundidad
    // ============================================================

    // --- DECISION FLOW & ACTIONS ---
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
          coins: this.netCoins, // Fondos tras deducir gastos
          unlockedShapes: this.unlockedShapes,
          stock: this.stock,
          loanRemaining: this.updatedLoanRemaining
        });
      };
    }

    // Botón de Acción Principal
    const btnW = 500;
    const btnH = 86;
    const btnX = width / 2 - btnW / 2;
    const btnY = 808;

    // Aviso si el rendimiento no superó la meta pero sigue en pie
    let warningObj = null;
    if (!this.isBankrupt && this.dayEarnings < this.meta) {
      warningObj = this.add.text(width / 2, btnY - 26, 'Rendimiento comercial por debajo de la meta. Puedes continuar a la tienda o reintentar.', {
        font: '20px "Outfit", sans-serif',
        fill: '#8c5847',
        fontWeight: '700'
      }).setOrigin(0.5);
      warningObj.setAlpha(0);
    }

    // Shadow for CTA button
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
      SoundEffects.playClick();
      nextSceneCallback();
    });

    actionZone.on('pointerover', () => {
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

    // Wrap button group for animation
    const btnGroup = [btnShadowGfx, actionBtnBg, btnText, actionZone];

    // Optional retry button — now as outline button (PASO 7)
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
        SoundEffects.playClick();
        this.scene.start('GameScene', {
          day: this.day,
          coins: this.coinsAtStart,
          loanRemaining: this.loanRemainingAtStart,
          unlockedShapes: this.unlockedShapesAtStart,
          stock: this.stockAtStart
        });
      });

      retryZone.on('pointerover', () => {
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
    // PASO 6: Animaciones de entrada secuenciales
    // ============================================================

    // Prepare initial hidden states
    titleObj.setAlpha(0).setY(titleObj.y - 30);
    perfHeaderObj.setAlpha(0);
    perfSubObj.setAlpha(0);
    receipt.setAlpha(0).setScale(0.9);
    headerTextObj.setAlpha(0);
    saldoLabelObj.setAlpha(0);
    saldoValObj.setAlpha(0);
    badgeGfx.setAlpha(0);
    saldoCoinGfx.setAlpha(0);
    pantryTitleObj.setAlpha(0);
    pantryValObj.setAlpha(0);
    debtObj.setAlpha(0);

    dataLines.forEach(line => line.setAlpha(0));

    btnGroup.forEach(item => {
      if (item.setAlpha) item.setAlpha(0);
    });
    retryGroup.forEach(item => {
      if (item.setAlpha) item.setAlpha(0);
    });

    if (warningObj) warningObj.setAlpha(0);

    // Title: slide-down + fade (400ms, Back.easeOut)
    this.tweens.add({
      targets: titleObj,
      alpha: 1,
      y: 58,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Performance header + sub: fade in (300ms, delay 200ms)
    this.tweens.add({
      targets: perfHeaderObj,
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Sine.easeOut'
    });

    this.tweens.add({
      targets: perfSubObj,
      alpha: 1,
      duration: 300,
      delay: 350,
      ease: 'Sine.easeOut'
    });

    // Stars: fade + micro-rotation for earned (delay 400ms)
    starObjs.forEach((s, i) => {
      this.tweens.add({
        targets: s.gfx,
        alpha: 1,
        duration: 300,
        delay: 400 + i * 120,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (s.earned) {
            this.tweens.add({
              targets: s.gfx,
              angle: 360,
              duration: 600,
              ease: 'Sine.easeInOut'
            });
          }
        }
      });
    });

    // Card: scale-up 0.9 → 1.0 + fade (500ms, delay 200ms)
    this.tweens.add({
      targets: receipt,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut'
    });

    // Header text: fade with card
    this.tweens.add({
      targets: headerTextObj,
      alpha: 1,
      duration: 400,
      delay: 400,
      ease: 'Sine.easeOut'
    });

    // Data lines: stagger 80ms each (fade-in)
    dataLines.forEach((line, i) => {
      this.tweens.add({
        targets: line,
        alpha: 1,
        duration: 250,
        delay: 500 + i * 80,
        ease: 'Sine.easeOut'
      });
    });

    // Saldo neto: bounce-in (delay after data lines)
    const saldoDelay = 500 + dataLines.length * 80 + 100;
    [saldoLabelObj, saldoValObj, badgeGfx, saldoCoinGfx].forEach(obj => {
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 600,
        delay: saldoDelay,
        ease: 'Bounce.easeOut'
      });
    });

    // Pantry + debt: fade after saldo
    const pantryDelay = saldoDelay + 300;
    [pantryTitleObj, pantryValObj, debtObj].forEach(obj => {
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 300,
        delay: pantryDelay,
        ease: 'Sine.easeOut'
      });
    });

    // Kiwi cat decoration: fade-in with card
    if (kiwiDecor) {
      this.tweens.add({
        targets: kiwiDecor,
        alpha: 0.7,
        duration: 600,
        delay: 700,
        ease: 'Sine.easeOut'
      });
    }

    // Buttons: fade-up (800ms delay)
    const btnDelay = 800;
    btnGroup.forEach(item => {
      if (item.setAlpha) {
        this.tweens.add({
          targets: item,
          alpha: 1,
          duration: 400,
          delay: btnDelay,
          ease: 'Sine.easeOut'
        });
      }
    });

    if (warningObj) {
      this.tweens.add({
        targets: warningObj,
        alpha: 1,
        duration: 300,
        delay: btnDelay - 100,
        ease: 'Sine.easeOut'
      });
    }

    // Retry group: fade-up after main button
    retryGroup.forEach(item => {
      if (item.setAlpha) {
        this.tweens.add({
          targets: item,
          alpha: 1,
          duration: 400,
          delay: btnDelay + 200,
          ease: 'Sine.easeOut'
        });
      }
    });
  }

  // ============================================================
  // Helper: Draw a 5-pointed star using Graphics
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
  // Helper: Draw a small vectorial coin icon (golden circle)
  // PASO 5: Replace emoji 🪙 with vectorial gold coin
  // ============================================================
  _drawCoinIcon(graphics, x, y) {
    // Outer gold circle
    graphics.fillStyle(0xffb703, 1);
    graphics.fillCircle(x, y, 9);
    // Inner shine
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(x - 1, y - 1, 5);
    // Subtle border
    graphics.lineStyle(1.5, 0xe09f00, 1);
    graphics.strokeCircle(x, y, 9);
  }

  // ============================================================
  // Helper: Rough text offset measurement (character-based approx)
  // Used to position coin icons relative to text content
  // ============================================================
  _measureTextOffset(fullText, upToText) {
    // Approximate: 10px per character at ~20px font size
    const ratio = upToText.length / Math.max(fullText.length, 1);
    return ratio * fullText.length * 9.5;
  }
}
