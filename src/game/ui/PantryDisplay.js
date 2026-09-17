import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';

/**
 * PantryDisplay
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Muestra el estado de la despensa (harinas/masas con puntos indicadores, toppings y bebidas)
 * y la barra de amortización del préstamo bancario con marcador de huella.
 */
export default class PantryDisplay extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=760]
   * @param {number} [config.height=510]
   * @param {Object} config.stock Inventario de masas, toppings y bebidas
   * @param {number} [config.loanRemaining=180]
   * @param {number} [config.loanInitial=200]
   * @param {number} [config.netCoins=0]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.boxWidth = config.width || 760;
    this.boxHeight = config.height || 510;
    this.stock = config.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 5, choco: 0, glazing: 0 },
      drink: { coffee_beans: 5, milk: 5 }
    };
    this.loanRemaining = config.loanRemaining !== undefined ? config.loanRemaining : 180;
    this.loanInitial = config.loanInitial || 200;
    this.netCoins = config.netCoins !== undefined ? config.netCoins : 0;

    this.doughDots = [];
    this.textElements = [];

    this.buildDisplay();

    scene.add.existing(this);
  }

  buildDisplay() {
    const i18n = I18nManager.getInstance();
    const w = this.boxWidth;
    const h = this.boxHeight;

    // 1. Tarjeta base contenedor
    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(0xfff1e6, 0.98);
    cardBg.fillRoundedRect(0, 0, w, h, 20);
    cardBg.lineStyle(2, 0xddb892, 1);
    cardBg.strokeRoundedRect(0, 0, w, h, 20);
    this.add(cardBg);

    // Cabecera de la tarjeta
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(0xeddcd2, 1);
    headerBg.fillRoundedRect(16, 16, w - 32, 44, 10);
    headerBg.lineStyle(1.5, 0xddb892, 1);
    headerBg.strokeRoundedRect(16, 16, w - 32, 44, 10);
    this.add(headerBg);

    this.titleText = this.scene.add.text(w / 2, 38, i18n.t('summary.pantry.title') || 'ESTADO DE DESPENSA Y PRÉSTAMO', {
      font: '20px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800',
      letterSpacing: 1.5
    }).setOrigin(0.5);
    this.add(this.titleText);

    // =========================================================================
    // SECCIÓN 1: DESPENSA DE MASAS (HARINAS)
    // =========================================================================
    const doughSecY = 76;

    this.doughHeader = this.scene.add.text(28, doughSecY, i18n.t('summary.pantry.doughHeader') || '🥖 Existencias de Masa (Para Abrir):', {
      font: '19px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '700'
    });
    this.add(this.doughHeader);

    const doughTypes = [
      { key: 'classic', label: i18n.t('recipes.bases.classic') || 'Vainilla / Clásica', color: 0xe0a341, iconTexture: 'dough_classic' },
      { key: 'chocolate', label: i18n.t('recipes.bases.chocolate') || 'Chocolate', color: 0x654024, iconTexture: 'dough_chocolate' },
      { key: 'oat', label: i18n.t('recipes.bases.oat') || 'Avena', color: 0xb08968, iconTexture: 'dough_oat' }
    ];

    let rowY = doughSecY + 32;
    this.doughRowObjects = [];

    doughTypes.forEach(dtype => {
      const rowBox = this.scene.add.graphics();
      rowBox.fillStyle(0xfffdf9, 0.8);
      rowBox.fillRoundedRect(28, rowY, w - 56, 44, 10);
      rowBox.lineStyle(1, 0xddb892, 0.7);
      rowBox.strokeRoundedRect(28, rowY, w - 56, 44, 10);
      this.add(rowBox);

      // Icono de masa
      const icon = this.scene.add.image(52, rowY + 22, dtype.iconTexture);
      icon.setDisplaySize(32, 32);
      this.add(icon);

      // Nombre de la masa
      const nameTxt = this.scene.add.text(80, rowY + 22, dtype.label, {
        font: '18px "Outfit", sans-serif',
        fill: '#582f0e',
        fontWeight: '600'
      }).setOrigin(0, 0.5);
      this.add(nameTxt);

      // Puntos indicadores de stock (máximo 10 dots visibles)
      const currentQty = this.stock.dough?.[dtype.key] || 0;
      const dotsGfx = this.scene.add.graphics();
      this.drawStockDots(dotsGfx, 340, rowY + 22, currentQty, dtype.color);
      this.add(dotsGfx);

      // Cantidad numérica
      const qtyTxt = this.scene.add.text(w - 44, rowY + 22, `${currentQty} u.`, {
        font: '20px "Outfit", sans-serif',
        fill: currentQty > 0 ? '#2b9348' : '#8c5847',
        fontWeight: '800'
      }).setOrigin(1, 0.5);
      this.add(qtyTxt);

      this.doughRowObjects.push({ dtype, nameTxt, qtyTxt, dotsGfx, rowY });
      rowY += 50;
    });

    // Total de masa disponible y estado de apertura
    const totalDough = (this.stock.dough?.classic || 0) + (this.stock.dough?.chocolate || 0) + (this.stock.dough?.oat || 0);
    const hasEnough = totalDough >= 1;

    this.doughStatusGfx = this.scene.add.graphics();
    this.doughStatusGfx.fillStyle(hasEnough ? 0xd8f3dc : 0xffccd5, 0.85);
    this.doughStatusGfx.fillRoundedRect(28, rowY, w - 56, 36, 8);
    this.doughStatusGfx.lineStyle(1.5, hasEnough ? 0x2b9348 : 0xd90429, 1);
    this.doughStatusGfx.strokeRoundedRect(28, rowY, w - 56, 36, 8);
    this.add(this.doughStatusGfx);

    const doughStatusString = hasEnough
      ? (i18n.t('summary.pantry.doughReady', { count: totalDough }) || `✓ Listo para hornear mañana (${totalDough} masas en total)`)
      : (i18n.t('summary.pantry.doughWarning') || `⚠️ ¡Sin masa en despensa! Compra al menos 1 pack en la tienda`);

    this.doughStatusText = this.scene.add.text(w / 2, rowY + 18, doughStatusString, {
      font: '17px "Outfit", sans-serif',
      fill: hasEnough ? '#2b9348' : '#d90429',
      fontWeight: '700'
    }).setOrigin(0.5);
    this.add(this.doughStatusText);

    // =========================================================================
    // SECCIÓN 2: TOPPINGS Y BEBIDAS RÁPIDO
    // =========================================================================
    const suppliesSecY = rowY + 48;
    this.suppliesHeader = this.scene.add.text(28, suppliesSecY, i18n.t('summary.pantry.suppliesHeader') || '✨ Toppings y Bebidas en Stock:', {
      font: '19px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '700'
    });
    this.add(this.suppliesHeader);

    const otherSupplies = [
      { label: i18n.t('recipes.toppings.sprinkles') || 'Chispas', count: this.stock.topping?.sprinkles || 0, icon: 'topping_sprinkles' },
      { label: i18n.t('recipes.toppings.choco') || 'Chips', count: this.stock.topping?.choco || 0, icon: 'topping_choco' },
      { label: i18n.t('recipes.toppings.glazing') || 'Glaseado', count: this.stock.topping?.glazing || 0, icon: 'topping_glazing' },
      { label: i18n.t('recipes.drinks.coffee') || 'Café', count: this.stock.drink?.coffee_beans || 0, icon: 'drink_coffee_beans' },
      { label: i18n.t('recipes.drinks.milk') || 'Leche', count: this.stock.drink?.milk || 0, icon: 'drink_milk' }
    ];

    const chipsStartY = suppliesSecY + 28;
    const chipW = (w - 56 - 4 * 10) / 5;
    this.supplyChips = [];

    otherSupplies.forEach((item, idx) => {
      const chipX = 28 + idx * (chipW + 10);
      const chipBox = this.scene.add.graphics();
      chipBox.fillStyle(0xfffdf9, 0.9);
      chipBox.fillRoundedRect(chipX, chipsStartY, chipW, 52, 10);
      chipBox.lineStyle(1, 0xddb892, 0.8);
      chipBox.strokeRoundedRect(chipX, chipsStartY, chipW, 52, 10);
      this.add(chipBox);

      // Icono
      const sIcon = this.scene.add.image(chipX + 22, chipsStartY + 26, item.icon);
      sIcon.setDisplaySize(28, 28);
      this.add(sIcon);

      // Cantidad
      const sQty = this.scene.add.text(chipX + chipW - 12, chipsStartY + 26, `${item.count}u`, {
        font: '17px "Outfit", sans-serif',
        fill: item.count > 0 ? '#582f0e' : '#8c5847',
        fontWeight: '800'
      }).setOrigin(1, 0.5);
      this.add(sQty);

      this.supplyChips.push({ chipBox, sIcon, sQty });
    });

    // =========================================================================
    // SECCIÓN 3: AMORTIZACIÓN DEL PRÉSTAMO BANCARIO
    // =========================================================================
    const loanSecY = chipsStartY + 64;

    const loanBox = this.scene.add.graphics();
    loanBox.fillStyle(0xfffdf9, 0.9);
    loanBox.fillRoundedRect(28, loanSecY, w - 56, 88, 12);
    loanBox.lineStyle(1.5, 0xddb892, 0.9);
    loanBox.strokeRoundedRect(28, loanSecY, w - 56, 88, 12);
    this.add(loanBox);

    // Título de deuda
    this.loanTitleText = this.scene.add.text(44, loanSecY + 14, i18n.t('summary.pantry.loanHeader') || '🏦 Amortización del Préstamo Bancario', {
      font: '18px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '700'
    });
    this.add(this.loanTitleText);

    // Texto de monto restante e inicial
    const paidAmount = Math.max(0, this.loanInitial - this.loanRemaining);
    this.loanNumbersText = this.scene.add.text(w - 44, loanSecY + 14, `${this.loanRemaining} / ${this.loanInitial} 🪙`, {
      font: '18px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    }).setOrigin(1, 0);
    this.add(this.loanNumbersText);

    // Barra de progreso de pago de deuda
    const barX = 44;
    const barY = loanSecY + 46;
    const barW = w - 88;
    const barH = 22;
    const progressRatio = Phaser.Math.Clamp(paidAmount / this.loanInitial, 0, 1);

    // Fondo barra
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0xeddcd2, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 10);
    barBg.lineStyle(1.5, 0xddb892, 1);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 10);
    this.add(barBg);

    // Relleno barra (verde menta)
    const barFill = this.scene.add.graphics();
    if (progressRatio > 0) {
      barFill.fillStyle(0x5f9e76, 1);
      barFill.fillRoundedRect(barX, barY, barW * progressRatio, barH, 10);
    }
    this.add(barFill);

    // Marcador de huella gatuna en la punta del progreso
    const pawX = barX + barW * progressRatio;
    const pawMarker = this.scene.add.graphics();
    this.drawCatPawIcon(pawMarker, pawX, barY + barH / 2);
    this.add(pawMarker);

    // Porcentaje pagado
    const percentPaid = Math.round(progressRatio * 100);
    this.percentPaid = percentPaid;
    this.loanPercentText = this.scene.add.text(barX + barW / 2, barY + barH / 2, `${percentPaid}% ${i18n.t('summary.pantry.loanPaid') || 'Saldado'}`, {
      font: '14px "Outfit", sans-serif',
      fill: percentPaid > 50 ? '#ffffff' : '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.add(this.loanPercentText);
  }

  /**
   * Dibuja los puntos indicadores de stock
   */
  drawStockDots(gfx, startX, cy, qty, color) {
    gfx.clear();
    const maxDots = 8;
    const dotSpacing = 14;
    const dotR = 4.5;

    for (let i = 0; i < maxDots; i++) {
      const dotX = startX + i * dotSpacing;
      if (i < qty) {
        gfx.fillStyle(color, 1);
        gfx.fillCircle(dotX, cy, dotR);
      } else {
        gfx.fillStyle(0xddb892, 0.35);
        gfx.fillCircle(dotX, cy, dotR - 1);
      }
    }
  }

  /**
   * Dibuja huella de gato artesanal sobre la barra de progreso
   */
  drawCatPawIcon(gfx, cx, cy) {
    gfx.clear();
    // Almohadilla central
    gfx.fillStyle(0x42270f, 1);
    gfx.fillCircle(cx, cy, 7);
    // 3 deditos superiores
    gfx.fillCircle(cx - 5, cy - 8, 3);
    gfx.fillCircle(cx, cy - 10, 3.2);
    gfx.fillCircle(cx + 5, cy - 8, 3);
  }

  /**
   * Actualiza textos para reactividad de idiomas
   */
  updateTexts() {
    const i18n = I18nManager.getInstance();
    if (this.titleText) {
      this.titleText.setText(i18n.t('summary.pantry.title') || 'ESTADO DE DESPENSA Y PRÉSTAMO');
    }
    if (this.doughHeader) {
      this.doughHeader.setText(i18n.t('summary.pantry.doughHeader') || '🥖 Existencias de Masa (Para Abrir):');
    }
    if (this.suppliesHeader) {
      this.suppliesHeader.setText(i18n.t('summary.pantry.suppliesHeader') || '✨ Toppings y Bebidas en Stock:');
    }
    if (this.loanTitleText) {
      this.loanTitleText.setText(i18n.t('summary.pantry.loanHeader') || '🏦 Amortización del Préstamo Bancario');
    }

    const totalDough = (this.stock.dough?.classic || 0) + (this.stock.dough?.chocolate || 0) + (this.stock.dough?.oat || 0);
    const hasEnough = totalDough >= 1;
    if (this.doughStatusText) {
      const doughStatusString = hasEnough
        ? (i18n.t('summary.pantry.doughReady', { count: totalDough }) || `✓ Listo para hornear mañana (${totalDough} masas en total)`)
        : (i18n.t('summary.pantry.doughWarning') || `⚠️ ¡Sin masa en despensa! Compra al menos 1 pack en la tienda`);
      this.doughStatusText.setText(doughStatusString);
    }

    if (this.loanPercentText && this.percentPaid !== undefined) {
      this.loanPercentText.setText(`${this.percentPaid}% ${i18n.t('summary.pantry.loanPaid') || 'Saldado'}`);
    }

    if (this.doughRowObjects) {
      this.doughRowObjects.forEach(item => {
        item.nameTxt.setText(i18n.t(`recipes.bases.${item.dtype.key}`) || item.dtype.label);
      });
    }
  }
}
