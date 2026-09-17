import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import CrazyGamesSDK from '../game/services/CrazyGamesSDK.js';
import I18nManager from '../game/services/I18nManager.js';
import SaveManager from '../game/services/SaveManager.js';
import { evaluateSolvency } from '../game/EconomyManager.js';
import PillSwitcher from '../game/PillSwitcher.js';
import { computeSubtitleLayout } from '../game/SummaryLayout.js';
import SummaryTicket from '../game/ui/SummaryTicket.js';
import ChefDialogue from '../game/ui/ChefDialogue.js';
import PantryDisplay from '../game/ui/PantryDisplay.js';

/**
 * SummaryScene
 * Pantalla de Cierre de Jornada y Balance Contable (1920x1080 - 16:9).
 * Integra los componentes modulares SummaryTicket, ChefDialogue y PantryDisplay.
 * Diseñado en dos columnas armónicas con jerarquía tipográfica calibrada en Outfit.
 */
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

    // Preserved start-of-day state for retries
    this.coinsAtStart = safeData.coinsAtStart || 0;
    this.loanRemainingAtStart = safeData.loanRemainingAtStart !== undefined ? safeData.loanRemainingAtStart : 200;
    this.unlockedShapesAtStart = safeData.unlockedShapesAtStart || ['star'];
    this.stockAtStart = safeData.stockAtStart || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 5, choco: 0, glazing: 0 },
      drink: { coffee_beans: 5, milk: 5 }
    };

    // Current state to carry over
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.decorations = Array.isArray(safeData.decorations)
      ? [...safeData.decorations]
      : (SaveManager.getInstance().loadGame()?.decorations || []);
    this.decorationsAtStart = safeData.decorationsAtStart ? [...safeData.decorationsAtStart] : [...this.decorations];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 5, choco: 0, glazing: 0 },
      drink: { coffee_beans: 5, milk: 5 }
    };

    // Evaluación integral de solvencia y rendimiento contable
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
    const i18n = I18nManager.getInstance();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Guardado automático si no hay quiebra
    if (!this.isBankrupt) {
      SaveManager.getInstance().saveGame({
        day: this.day,
        coins: this.netCoins,
        loanRemaining: this.updatedLoanRemaining,
        unlockedShapes: this.unlockedShapes,
        stock: this.stock,
        decorations: this.decorations
      });
    }

    // 2. Audio y SDK de CrazyGames
    if (this.isBankrupt) {
      SoundManager.getInstance().playGameOverMelody();
    } else {
      SoundManager.getInstance().playCoinCascade();
      if (this.performance?.stars === 3) {
        CrazyGamesSDK.getInstance().happytime();
      }
    }

    // =========================================================================
    // FONDO: Atmósfera cálida de panadería (Pared durazno + mostrador inferior)
    // =========================================================================
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Mostrador de madera inferior
    const counterGfx = this.add.graphics();
    counterGfx.fillStyle(0x7f5539, 0.25);
    counterGfx.fillRect(0, 920, width, 160);
    counterGfx.lineStyle(2, 0x582f0e, 0.4);
    counterGfx.lineBetween(0, 920, width, 920);

    // Patrón decorativo sutil en la pared
    const patternGfx = this.add.graphics();
    patternGfx.fillStyle(0xddb892, 0.08);
    const dots = [
      { x: 120, y: 80, r: 16 }, { x: 340, y: 140, r: 12 }, { x: 800, y: 90, r: 15 },
      { x: 1300, y: 70, r: 14 }, { x: 1750, y: 120, r: 18 }, { x: 1840, y: 400, r: 16 },
      { x: 60, y: 500, r: 14 }, { x: 1040, y: 900, r: 15 }
    ];
    dots.forEach(d => patternGfx.fillCircle(d.x, d.y, d.r));

    // =========================================================================
    // CABECERA: Rótulo de madera colgante y selector de idioma
    // =========================================================================
    const headerTitle = this.isBankrupt
      ? (i18n.t('summary.bankruptcyClosure') || '¡CIERRE POR QUIEBRA!')
      : (i18n.t('summary.dayCompleted', { day: this.day }) || `DÍA ${this.day} COMPLETADO`);

    const titleColor = this.isBankrupt ? '#d90429' : '#582f0e';

    // Rótulo colgante central
    const signW = 540;
    const signH = 68;
    const signX = width / 2 - signW / 2;
    const signY = 22;

    const signGfx = this.add.graphics();
    signGfx.fillStyle(0xfff1e6, 0.96);
    signGfx.fillRoundedRect(signX, signY, signW, signH, 16);
    signGfx.lineStyle(2.5, 0x582f0e, 1);
    signGfx.strokeRoundedRect(signX, signY, signW, signH, 16);

    // Orejitas de gato decorativas en la parte superior del cartel
    signGfx.fillStyle(0x7f5539, 1);
    signGfx.fillTriangle(signX + 60, signY, signX + 80, signY - 14, signX + 100, signY);
    signGfx.fillTriangle(signX + signW - 100, signY, signX + signW - 80, signY - 14, signX + signW - 60, signY);

    this.titleTextObj = this.add.text(width / 2, signY + signH / 2, headerTitle, {
      font: '34px "Outfit", sans-serif',
      fill: titleColor,
      fontWeight: '800',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Selector de idioma [ EN | ES ] en la esquina superior derecha
    this.pillSwitcher = new PillSwitcher(this, {
      x: width - 190,
      y: 80,
      width: 320,
      height: 82,
      depth: 100,
      onLanguageChange: () => {
        this.refreshLocalizedTexts();
      }
    });

    // =========================================================================
    // COLUMNA IZQUIERDA (x: 70 a 1030): Banner de Desempeño + SummaryTicket
    // =========================================================================
    const colLeftX = 70;
    const colLeftW = 960;

    // 1. Banner de Desempeño Comercial
    const bannerY = 100;
    const bannerH = 110;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0xfff1e6, 0.95);
    bannerBg.fillRoundedRect(colLeftX, bannerY, colLeftW, bannerH, 16);
    bannerBg.lineStyle(2, 0xddb892, 1);
    bannerBg.strokeRoundedRect(colLeftX, bannerY, colLeftW, bannerH, 16);

    // Estrellas animadas
    const starsEarned = this.performance.stars;
    const perfKey = this.performance.key || (starsEarned === 3 ? 'excellent' : starsEarned === 2 ? 'good' : 'tight');
    const localizedRatingLabel = i18n.t(`summary.performance.${perfKey}`) || (starsEarned === 3 ? 'Excelente' : starsEarned === 2 ? 'Bueno' : 'Ajustado');

    const performanceHeader = this.isBankrupt
      ? (this.bankruptcyReason === 'debt'
          ? i18n.t('summary.performance.insolvencyDebt')
          : i18n.t('summary.performance.insolvencySupplies'))
      : (i18n.t('summary.performance.header', { label: localizedRatingLabel }) || `Desempeño Comercial: (${localizedRatingLabel})`);

    this.perfHeaderObj = this.add.text(colLeftX + 28, bannerY + 24, performanceHeader, {
      font: '24px "Outfit", sans-serif',
      fill: this.isBankrupt ? '#d90429' : '#7f5539',
      fontWeight: '700'
    });

    // Estrellas de rating
    this.starObjs = [];
    if (!this.isBankrupt) {
      const starStartX = colLeftX + colLeftW - 140;
      const starCenterY = bannerY + 28;
      for (let i = 0; i < 3; i++) {
        const sx = starStartX + i * 40;
        const starGfx = this.add.graphics();
        const isEarned = i < starsEarned;

        if (isEarned) {
          starGfx.fillStyle(0xffb703, 1);
        }
        starGfx.lineStyle(2, isEarned ? 0xe09f00 : 0xddb892, 1);
        this._drawStar(starGfx, sx, starCenterY, 5, 15, 7, isEarned);
        this.starObjs.push({ gfx: starGfx, earned: isEarned });
      }
    }

    // Subtítulo con métricas del día (usando computeSubtitleLayout para no solapamiento)
    const subStyle = {
      font: '19px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '600'
    };

    this.tMeta = this.add.text(colLeftX + 28, bannerY + 68, i18n.t('summary.sub.goal', { meta: this.meta }) || `Meta: ${this.meta}`, subStyle);
    this.metaCoin = this.add.graphics();
    this._drawCoinIcon(this.metaCoin, this.tMeta.x + this.tMeta.width + 12, bannerY + 77);

    const earnX = this.tMeta.x + this.tMeta.width + 36;
    this.tEarnings = this.add.text(earnX, bannerY + 68, i18n.t('summary.sub.earnings', { earnings: this.dayEarnings }) || `•   Ventas Hoy: ${this.dayEarnings}`, subStyle);
    this.earnCoin = this.add.graphics();
    this._drawCoinIcon(this.earnCoin, this.tEarnings.x + this.tEarnings.width + 12, bannerY + 77);

    const msgX = this.tEarnings.x + this.tEarnings.width + 36;
    const ratingMsg = i18n.t(`summary.performance.msg${perfKey.charAt(0).toUpperCase() + perfKey.slice(1)}`) || '';
    this.tMessage = this.add.text(msgX, bannerY + 68, `•   ${ratingMsg}`, subStyle);

    // 2. Componente Modular SummaryTicket
    this.summaryTicket = new SummaryTicket(this, colLeftX, 225, {
      width: colLeftW,
      height: 670,
      economy: this.economy,
      coinsAtStart: this.coinsAtStart,
      coins: this.coins
    });

    // =========================================================================
    // COLUMNA DERECHA (x: 1060 a 1840): ChefDialogue + PantryDisplay
    // =========================================================================
    const colRightX = 1060;
    const colRightW = 790;

    // 1. Chef Kiwi con respiración y bocadillo reactivo
    this.chefDialogue = new ChefDialogue(this, colRightX, bannerY, {
      width: colRightW,
      height: 230,
      stars: starsEarned,
      isBankrupt: this.isBankrupt,
      bankruptcyReason: this.bankruptcyReason,
      totalDoughStock: this.totalDoughStock
    });

    // 2. Despensa de Masa y Amortización del Préstamo Bancario
    this.pantryDisplay = new PantryDisplay(this, colRightX, bannerY + 250, {
      width: colRightW,
      height: 545,
      stock: this.stock,
      loanRemaining: this.updatedLoanRemaining,
      loanInitial: 200,
      netCoins: this.netCoins
    });

    // =========================================================================
    // BARRA INFERIOR DE ACCIÓN (y: 935 a 1045)
    // =========================================================================
    this.buildBottomActionBar(width, height);

    // Animación de entrada suave
    this.playEntryTweens();
  }

  buildBottomActionBar(width, height) {
    const i18n = I18nManager.getInstance();
    const barY = 945;

    // Botón secundario: Reintentar el Día (si no hay quiebra)
    if (!this.isBankrupt) {
      const retryW = 320;
      const retryH = 74;
      const retryX = 70;

      const retryBg = this.add.graphics();
      retryBg.fillStyle(0xfff1e6, 0.9);
      retryBg.fillRoundedRect(retryX, barY, retryW, retryH, 16);
      retryBg.lineStyle(2, 0x7f5539, 1);
      retryBg.strokeRoundedRect(retryX, barY, retryW, retryH, 16);

      this.retryText = this.add.text(retryX + retryW / 2, barY + retryH / 2, i18n.t('summary.buttons.retry') || 'REINTENTAR EL DÍA', {
        font: '21px "Outfit", sans-serif',
        fill: '#7f5539',
        fontWeight: '800'
      }).setOrigin(0.5);

      const retryZone = this.add.rectangle(retryX + retryW / 2, barY + retryH / 2, retryW, retryH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      retryZone.on('pointerdown', () => {
        SoundManager.getInstance().playUiTap();
        this.scene.start('GameScene', {
          day: this.day,
          coins: this.coinsAtStart,
          loanRemaining: this.loanRemainingAtStart,
          unlockedShapes: this.unlockedShapesAtStart,
          stock: this.stockAtStart,
          decorations: this.decorationsAtStart
        });
      });

      retryZone.on('pointerover', () => {
        SoundManager.getInstance().playUiHover();
        retryBg.clear();
        retryBg.fillStyle(0xeddcd2, 1);
        retryBg.fillRoundedRect(retryX - 2, barY - 2, retryW + 4, retryH + 4, 18);
        retryBg.lineStyle(2.5, 0x582f0e, 1);
        retryBg.strokeRoundedRect(retryX - 2, barY - 2, retryW + 4, retryH + 4, 18);
        this.retryText.setColor('#42270f');
      });

      retryZone.on('pointerout', () => {
        retryBg.clear();
        retryBg.fillStyle(0xfff1e6, 0.9);
        retryBg.fillRoundedRect(retryX, barY, retryW, retryH, 16);
        retryBg.lineStyle(2, 0x7f5539, 1);
        retryBg.strokeRoundedRect(retryX, barY, retryW, retryH, 16);
        this.retryText.setColor('#7f5539');
      });
    }

    // Botón de Acción Principal (Ir a la Tienda / Declarar Quiebra / Victoria)
    let btnTextString = '';
    let btnColor = 0x5f9e76; // Verde menta acogedor
    let btnHoverColor = 0x4f9d6a;
    let nextSceneCallback = null;

    if (this.isBankrupt) {
      btnTextString = i18n.t('summary.buttons.declareBankruptcy') || 'DECLARAR QUIEBRA';
      btnColor = 0xd90429;
      btnHoverColor = 0xef233c;
      nextSceneCallback = () => {
        this.scene.start('GameOverScene', { reason: this.bankruptcyReason });
      };
    } else if (this.updatedLoanRemaining <= 0) {
      btnTextString = i18n.t('summary.buttons.victory') || 'VICTORIA FINANCIERA';
      btnColor = 0x6d597a;
      btnHoverColor = 0x856d94;
      nextSceneCallback = () => {
        this.scene.start('VictoryScene', { coins: this.netCoins });
      };
    } else {
      btnTextString = i18n.t('summary.buttons.shop') || 'IR A LA TIENDA 🛒';
      btnColor = 0x5f9e76;
      btnHoverColor = 0x4f9d6a;
      nextSceneCallback = () => {
        this.scene.start('ShopScene', {
          day: this.day,
          coins: this.netCoins,
          unlockedShapes: this.unlockedShapes,
          stock: this.stock,
          loanRemaining: this.updatedLoanRemaining,
          decorations: this.decorations
        });
      };
    }

    const actionBtnW = this.isBankrupt ? 500 : 540;
    const actionBtnH = 74;
    const actionBtnX = this.isBankrupt ? width / 2 - actionBtnW / 2 : width - actionBtnW - 70;

    const actionShadow = this.add.graphics();
    actionShadow.fillStyle(0x4e3629, 0.2);
    actionShadow.fillRoundedRect(actionBtnX + 3, barY + 4, actionBtnW, actionBtnH, 18);

    const actionBg = this.add.graphics();
    actionBg.fillStyle(btnColor, 1);
    actionBg.fillRoundedRect(actionBtnX, barY, actionBtnW, actionBtnH, 18);
    actionBg.lineStyle(2, 0xffffff, 0.4);
    actionBg.strokeRoundedRect(actionBtnX, barY, actionBtnW, actionBtnH, 18);

    this.actionBtnText = this.add.text(actionBtnX + actionBtnW / 2, barY + actionBtnH / 2, btnTextString, {
      font: '26px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const actionZone = this.add.rectangle(actionBtnX + actionBtnW / 2, barY + actionBtnH / 2, actionBtnW, actionBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    actionZone.on('pointerdown', async () => {
      SoundManager.getInstance().playUiTap();
      if (!this.isBankrupt && this.updatedLoanRemaining > 0) {
        await CrazyGamesSDK.getInstance().requestMidgameAd();
      }
      nextSceneCallback();
    });

    actionZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      actionBg.clear();
      actionBg.fillStyle(btnHoverColor, 1);
      actionBg.fillRoundedRect(actionBtnX - 3, barY - 2, actionBtnW + 6, actionBtnH + 4, 20);
      this.actionBtnText.setScale(1.03);
    });

    actionZone.on('pointerout', () => {
      actionBg.clear();
      actionBg.fillStyle(btnColor, 1);
      actionBg.fillRoundedRect(actionBtnX, barY, actionBtnW, actionBtnH, 18);
      actionBg.lineStyle(2, 0xffffff, 0.4);
      actionBg.strokeRoundedRect(actionBtnX, barY, actionBtnW, actionBtnH, 18);
      this.actionBtnText.setScale(1);
    });
  }

  playEntryTweens() {
    this.starObjs.forEach((s, i) => {
      this.tweens.add({
        targets: s.gfx,
        scaleX: { from: 0, to: 1 },
        scaleY: { from: 0, to: 1 },
        duration: 300,
        delay: 150 + i * 90,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (s.earned) {
            SoundManager.getInstance().playStarPop(i);
          }
        }
      });
    });
  }

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

    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      graphics.lineTo(path[i].x, path[i].y);
    }
    graphics.closePath();

    if (fill) {
      graphics.fillPath();
    }
    graphics.strokePath();
  }

  _drawCoinIcon(graphics, x, y) {
    graphics.fillStyle(0xffb703, 1);
    graphics.fillCircle(x, y, 9);
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(x - 1, y - 1, 5);
    graphics.lineStyle(1.5, 0xe09f00, 1);
    graphics.strokeCircle(x, y, 9);
  }

  refreshLocalizedTexts() {
    const i18n = I18nManager.getInstance();
    if (this.pillSwitcher) {
      this.pillSwitcher.updateVisuals();
    }
    if (this.titleTextObj) {
      const headerTitle = this.isBankrupt
        ? (i18n.t('summary.bankruptcyClosure') || '¡CIERRE POR QUIEBRA!')
        : (i18n.t('summary.dayCompleted', { day: this.day }) || `DÍA ${this.day} COMPLETADO`);
      this.titleTextObj.setText(headerTitle);
    }
    if (this.perfHeaderObj) {
      const starsEarned = this.performance.stars;
      const perfKey = this.performance.key || (starsEarned === 3 ? 'excellent' : starsEarned === 2 ? 'good' : 'tight');
      const localizedRatingLabel = i18n.t(`summary.performance.${perfKey}`) || 'Rendimiento';
      const performanceHeader = this.isBankrupt
        ? (this.bankruptcyReason === 'debt'
            ? i18n.t('summary.performance.insolvencyDebt')
            : i18n.t('summary.performance.insolvencySupplies'))
        : (i18n.t('summary.performance.header', { label: localizedRatingLabel }) || `Desempeño: ${localizedRatingLabel}`);
      this.perfHeaderObj.setText(performanceHeader);
    }
    if (this.tMeta) {
      this.tMeta.setText(i18n.t('summary.sub.goal', { meta: this.meta }) || `Meta: ${this.meta}`);
    }
    if (this.tEarnings) {
      this.tEarnings.setText(i18n.t('summary.sub.earnings', { earnings: this.dayEarnings }) || `• Ventas Hoy: ${this.dayEarnings}`);
    }
    if (this.retryText) {
      this.retryText.setText(i18n.t('summary.buttons.retry') || 'REINTENTAR EL DÍA');
    }
    if (this.actionBtnText && !this.isBankrupt && this.updatedLoanRemaining > 0) {
      this.actionBtnText.setText(i18n.t('summary.buttons.shop') || 'IR A LA TIENDA 🛒');
    }

    if (this.summaryTicket) this.summaryTicket.updateTexts();
    if (this.chefDialogue) this.chefDialogue.updateTexts();
    if (this.pantryDisplay) this.pantryDisplay.updateTexts();
  }
}
