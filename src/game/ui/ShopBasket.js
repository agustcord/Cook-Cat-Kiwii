import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';
import SoundManager from '../SoundManager.js';

/**
 * ShopBasket
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Panel lateral derecho con:
 * - Recuadro de la cesta con borde punteado (dashed line) estilo cozy.
 * - Lista interactiva de compras de la sesión con botón '✕' por fila para devolver ítems.
 * - Botón visible "Limpiar Cesta 🗑️" para devolver todo al estado inicial en 1 clic.
 * - Separador punteado y métricas: "Total gastado", "Masa para mañana" con barra de progreso verde/roja y píldora de apertura.
 * - Tendero Kiwi con sprite chef_cat.png y diálogo reactivo.
 * - Contraste WCAG AA garantizado con tonos marrón profundo (#582f0e, #42270f).
 */
export default class ShopBasket extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=420]
   * @param {number} [config.height=720]
   * @param {Object} config.stock
   * @param {number} config.day
   * @param {Function} [config.onRemoveItem]
   * @param {Function} [config.onClearCart]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.basketWidth = config.width || 420;
    this.basketHeight = config.height || 720;
    this.stock = config.stock || {};
    this.day = config.day || 1;
    this.onRemoveItem = config.onRemoveItem || (() => {});
    this.onClearCart = config.onClearCart || (() => {});

    this.spentCoins = 0;
    this.sessionCart = []; // [{ key, name, cost, qty, type, unitCost }]

    this.buildBasket();

    scene.add.existing(this);
  }

  buildBasket() {
    const i18n = I18nManager.getInstance();
    const w = this.basketWidth;
    const h = this.basketHeight;

    // 1. Tarjeta base acogedora
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xfff1e6, 0.98);
    bg.fillRoundedRect(0, 0, w, h, 20);
    bg.lineStyle(2, 0xddb892, 1);
    bg.strokeRoundedRect(0, 0, w, h, 20);
    this.add(bg);

    // Cabecera limpia de la Cesta (sin barra marrón sólida superior ni emojis rotos)
    const rawTitle = i18n.t('shop.basket.title') || 'CESTA DEL DÍA';
    const cleanBasketTitle = rawTitle.replace(/^[^\wÁÉÍÓÚáéíóúñÑ]+/i, '').trim();
    this.headerText = this.scene.add.text(24, 30, cleanBasketTitle, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      fill: '#582f0e',
      letterSpacing: 1.2
    }).setOrigin(0, 0.5);
    this.add(this.headerText);

    this.itemsCountText = this.scene.add.text(w - 24, 30, '', {
      font: '18px "Outfit", sans-serif',
      fontWeight: '700',
      fill: '#8c5847'
    }).setOrigin(1, 0.5);
    this.add(this.itemsCountText);

    // =========================================================================
    // SECCIÓN 1: CAJA CON BORDE PUNTEADO (DASHED) PARA COMPRAS DE LA SESIÓN
    // =========================================================================
    const boxX = 18;
    const boxY = 56;
    const boxW = w - 36;
    const boxH = 208;

    // Fondo y borde punteado
    this.dashedBoxBg = this.scene.add.graphics();
    this.add(this.dashedBoxBg);

    this.dashedBorderGfx = this.scene.add.graphics();
    this.add(this.dashedBorderGfx);
    this.drawDashedBox(boxX, boxY, boxW, boxH);

    // Mensaje de cesta vacía
    this.emptyMessage = this.scene.add.text(w / 2, boxY + boxH / 2, i18n.t('shop.basket.empty') || 'La cesta está vacía.\nElige masas para poder abrir mañana.', {
      font: '20px "Outfit", sans-serif',
      fontWeight: '600',
      fill: '#7f5539',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);
    this.add(this.emptyMessage);

    // Contenedor dinámico para filas de compras
    this.cartItemsContainer = this.scene.add.container(0, 0);
    this.add(this.cartItemsContainer);

    // Botón "Limpiar Cesta 🗑️"
    const clearBtnW = 180;
    const clearBtnH = 38;
    const clearBtnX = w / 2 - clearBtnW / 2;
    const clearBtnY = boxY + boxH - clearBtnH - 10;

    this.clearBtnContainer = this.scene.add.container(0, 0).setVisible(false);
    this.add(this.clearBtnContainer);

    const clearBtnBg = this.scene.add.graphics();
    clearBtnBg.fillStyle(0xfff1e6, 1);
    clearBtnBg.fillRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
    clearBtnBg.lineStyle(1.5, 0xddb892, 1);
    clearBtnBg.strokeRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
    this.clearBtnContainer.add(clearBtnBg);

    this.clearBtnText = this.scene.add.text(w / 2, clearBtnY + clearBtnH / 2, i18n.t('shop.basket.clear') || 'Limpiar Cesta 🗑️', {
      font: '16px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#8f3931'
    }).setOrigin(0.5);
    this.clearBtnContainer.add(this.clearBtnText);

    const clearHitZone = this.scene.add.rectangle(w / 2, clearBtnY + clearBtnH / 2, clearBtnW, clearBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.clearBtnContainer.add(clearHitZone);

    clearHitZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.onClearCart();
    });

    clearHitZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      clearBtnBg.clear();
      clearBtnBg.fillStyle(0xffe2dc, 1);
      clearBtnBg.fillRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
      clearBtnBg.lineStyle(1.5, 0xe5a99f, 1);
      clearBtnBg.strokeRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
    });

    clearHitZone.on('pointerout', () => {
      clearBtnBg.clear();
      clearBtnBg.fillStyle(0xfff1e6, 1);
      clearBtnBg.fillRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
      clearBtnBg.lineStyle(1.5, 0xddb892, 1);
      clearBtnBg.strokeRoundedRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 19);
    });

    // =========================================================================
    // SECCIÓN 2: SEPARADOR PUNTEADO & MÉTRICAS (Total gastado y Masa)
    // =========================================================================
    const metricsY = boxY + boxH + 16;

    // Separador punteado horizontal
    const divider = this.scene.add.graphics();
    divider.lineStyle(1.5, 0xddb892, 0.8);
    this.drawDashedHLine(divider, 16, w - 16, metricsY, 5, 4);
    this.add(divider);

    // Métrica 1: Total gastado
    const row1Y = metricsY + 16;
    this.totalSpentLabel = this.scene.add.text(24, row1Y, i18n.t('shop.basket.totalSpent') || 'Total gastado', {
      font: '20px "Outfit", sans-serif',
      fontWeight: '700',
      fill: '#7f5539'
    });
    this.add(this.totalSpentLabel);

    this.totalSpentDots = this.scene.add.graphics();
    this.add(this.totalSpentDots);

    this.totalSpentValue = this.scene.add.text(w - 24, row1Y - 2, '0 🪙', {
      font: '26px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#582f0e'
    }).setOrigin(1, 0);
    this.add(this.totalSpentValue);

    // Métrica 2: Masa para mañana
    const row2Y = row1Y + 36;
    this.doughTomorrowLabel = this.scene.add.text(24, row2Y, i18n.t('shop.basket.doughTomorrow') || 'Masa para mañana', {
      font: '20px "Outfit", sans-serif',
      fontWeight: '700',
      fill: '#7f5539'
    });
    this.add(this.doughTomorrowLabel);

    this.doughTomorrowValue = this.scene.add.text(w - 24, row2Y - 2, '0 u.', {
      font: '26px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#2b9348'
    }).setOrigin(1, 0);
    this.add(this.doughTomorrowValue);

    // Barra de progreso de masa
    const barY = row2Y + 38;
    const barW = w - 48;
    const barH = 18;

    this.progressBarBg = this.scene.add.graphics();
    this.progressBarBg.fillStyle(0xeddcd2, 1);
    this.progressBarBg.fillRoundedRect(24, barY, barW, barH, 9);
    this.progressBarBg.lineStyle(1.5, 0xddb892, 1);
    this.progressBarBg.strokeRoundedRect(24, barY, barW, barH, 9);
    this.add(this.progressBarBg);

    this.progressBarFill = this.scene.add.graphics();
    this.add(this.progressBarFill);

    // Píldora de estado de apertura
    const pillY = barY + 28;
    const pillW = w - 48;
    const pillH = 54;

    this.statusPillGfx = this.scene.add.graphics();
    this.add(this.statusPillGfx);

    this.statusPillText = this.scene.add.text(w / 2, pillY + pillH / 2, '', {
      font: '18px "Outfit", sans-serif',
      fontWeight: '800',
      align: 'center',
      wordWrap: { width: pillW - 24 }
    }).setOrigin(0.5);
    this.add(this.statusPillText);

    this.statusPillDimensions = { x: 24, y: pillY, w: pillW, h: pillH };

    // =========================================================================
    // SECCIÓN 3: TENDERO KIWI CON BOCADILLO DINÁMICO
    // =========================================================================
    const catSecY = pillY + pillH + 16;
    const bubbleW = w - 36;
    const bubbleH = 94;

    // Bocadillo de diálogo
    this.bubbleGfx = this.scene.add.graphics();
    this.bubbleGfx.fillStyle(0xfffdf9, 1);
    this.bubbleGfx.fillRoundedRect(18, catSecY, bubbleW, bubbleH, 16);
    this.bubbleGfx.lineStyle(2, 0x582f0e, 1);
    this.bubbleGfx.strokeRoundedRect(18, catSecY, bubbleW, bubbleH, 16);

    // Piquito hacia abajo donde está Kiwi
    const beakX = 76;
    this.bubbleGfx.fillTriangle(beakX - 10, catSecY + bubbleH, beakX, catSecY + bubbleH + 14, beakX + 10, catSecY + bubbleH);
    this.bubbleGfx.lineStyle(2, 0x582f0e, 1);
    this.bubbleGfx.beginPath();
    this.bubbleGfx.moveTo(beakX - 10, catSecY + bubbleH);
    this.bubbleGfx.lineTo(beakX, catSecY + bubbleH + 14);
    this.bubbleGfx.lineTo(beakX + 10, catSecY + bubbleH);
    this.bubbleGfx.strokePath();
    this.add(this.bubbleGfx);

    this.kiwiNameText = this.scene.add.text(30, catSecY + 10, i18n.t('shop.basket.kiwiName') || 'Tendero Kiwi 🐱', {
      font: '18px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#7f5539'
    });
    this.add(this.kiwiNameText);

    this.dialogueText = this.scene.add.text(30, catSecY + 34, this.getDefaultWelcomeText(), {
      font: '17px "Outfit", sans-serif',
      fontWeight: '600',
      fill: '#582f0e',
      wordWrap: { width: bubbleW - 24 },
      lineSpacing: 3
    });
    this.add(this.dialogueText);

    // Avatar de Kiwi Tendero (abajo)
    const catY = catSecY + bubbleH + 54;
    const catX = 76;

    const catShadow = this.scene.add.graphics();
    catShadow.fillStyle(0x4e3629, 0.14);
    catShadow.fillEllipse(catX, catY + 42, 80, 16);
    this.add(catShadow);

    this.catImage = this.scene.add.image(catX, catY, 'chef_cat');
    this.catImage.setDisplaySize(96, 102);
    this.add(this.catImage);

    // Animación suave de respiración
    if (this.scene.tweens && typeof this.scene.tweens.add === 'function' && this.catImage && this.catImage.scaleY !== undefined) {
      this.scene.tweens.add({
        targets: this.catImage,
        scaleY: this.catImage.scaleY * 1.03,
        y: catY - 2,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Pequeño letrero "¡Cocina Abierta! 🐾" junto a Kiwi
    const openSignW = w - catX - 58;
    const openSignX = catX + 50;
    const openSignY = catY - 14;

    const openSignGfx = this.scene.add.graphics();
    openSignGfx.fillStyle(0xfffdf9, 1);
    openSignGfx.fillRoundedRect(openSignX, openSignY, openSignW, 42, 12);
    openSignGfx.lineStyle(1.5, 0xddb892, 1);
    openSignGfx.strokeRoundedRect(openSignX, openSignY, openSignW, 42, 12);
    this.add(openSignGfx);

    this.openSignText = this.scene.add.text(openSignX + openSignW / 2, openSignY + 21, i18n.t('shop.basket.openSign') || '¡Cocina Abierta! 🐾', {
      font: '16px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#582f0e'
    }).setOrigin(0.5);
    this.add(this.openSignText);

    // Refrescar indicadores iniciales
    this.updateMetrics();
  }

  drawDashedBox(x, y, w, h) {
    this.dashedBoxBg.clear();
    this.dashedBoxBg.fillStyle(0xfffdf9, 0.95);
    this.dashedBoxBg.fillRoundedRect(x, y, w, h, 14);

    this.dashedBorderGfx.clear();
    this.dashedBorderGfx.lineStyle(2, 0xddb892, 1);

    const dash = 6;
    const gap = 5;

    // Lados rectos punteados
    this.drawDashedHLine(this.dashedBorderGfx, x + 12, x + w - 12, y, dash, gap);
    this.drawDashedHLine(this.dashedBorderGfx, x + 12, x + w - 12, y + h, dash, gap);
    this.drawDashedVLine(this.dashedBorderGfx, y + 12, y + h - 12, x, dash, gap);
    this.drawDashedVLine(this.dashedBorderGfx, y + 12, y + h - 12, x + w, dash, gap);
  }

  drawDashedHLine(gfx, x1, x2, y, dash, gap) {
    let currentX = x1;
    while (currentX < x2) {
      const endX = Math.min(currentX + dash, x2);
      gfx.beginPath();
      gfx.moveTo(currentX, y);
      gfx.lineTo(endX, y);
      gfx.strokePath();
      currentX += dash + gap;
    }
  }

  drawDashedVLine(gfx, y1, y2, x, dash, gap) {
    let currentY = y1;
    while (currentY < y2) {
      const endY = Math.min(currentY + dash, y2);
      gfx.beginPath();
      gfx.moveTo(x, currentY);
      gfx.lineTo(x, endY);
      gfx.strokePath();
      currentY += dash + gap;
    }
  }

  /**
   * Actualiza la lista transaccional de compras, el total gastado y el stock proyectado.
   * @param {Array<Object>} cart [{ key, name, cost, qty, type, unitCost }]
   * @param {number} spentCoins
   * @param {Object} stock
   */
  setSessionCart(cart, spentCoins, stock) {
    this.sessionCart = cart || [];
    this.spentCoins = spentCoins || 0;
    this.stock = stock || this.stock;

    this.refreshCartList();
    this.updateMetrics();
  }

  refreshCartList() {
    const i18n = I18nManager.getInstance();
    this.cartItemsContainer.removeAll(true);

    const totalCount = this.sessionCart.reduce((sum, item) => sum + (item.qty || 1), 0);
    this.itemsCountText.setText(totalCount > 0 ? `${totalCount} ítems` : '');

    if (this.sessionCart.length === 0) {
      this.emptyMessage.setVisible(true);
      this.clearBtnContainer.setVisible(false);
      return;
    }

    this.emptyMessage.setVisible(false);
    this.clearBtnContainer.setVisible(true);

    const boxX = 18;
    const boxY = 56;
    const rowH = 38;
    const startY = boxY + 14;

    // Renderizamos hasta 4 filas de compras
    const displayItems = this.sessionCart.slice(0, 4);

    displayItems.forEach((item, index) => {
      const rowY = startY + index * rowH;

      // Icono / viñeta decorativa
      const bullet = this.scene.add.text(boxX + 12, rowY + 3, '•', {
        font: '22px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#7f5539'
      });
      this.cartItemsContainer.add(bullet);

      // Nombre del artículo
      const nameText = this.scene.add.text(boxX + 28, rowY + 5, item.name, {
        font: '20px "Outfit", sans-serif',
        fontWeight: '700',
        fill: '#582f0e'
      });
      this.cartItemsContainer.add(nameText);

      // Subtotal de la fila
      const subtotal = item.cost * (item.qty || 1);
      const qtyPrefix = item.qty > 1 ? `${item.qty}× ` : '';
      const subtotalText = this.scene.add.text(this.basketWidth - 68, rowY + 5, `${qtyPrefix}${subtotal} 🪙`, {
        font: '22px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#7a4a12'
      }).setOrigin(1, 0);
      this.cartItemsContainer.add(subtotalText);

      // Botón interactivo '✕' para devolver ítem
      const btnSize = 28;
      const btnX = this.basketWidth - 48;
      const btnY = rowY + 3;

      const delBtnBg = this.scene.add.graphics();
      delBtnBg.fillStyle(0xffe2dc, 1);
      delBtnBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 8);
      delBtnBg.lineStyle(1.5, 0xe5a99f, 1);
      delBtnBg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 8);
      this.cartItemsContainer.add(delBtnBg);

      const delBtnText = this.scene.add.text(btnX + btnSize / 2, btnY + btnSize / 2, '✕', {
        font: '15px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#8f3931'
      }).setOrigin(0.5);
      this.cartItemsContainer.add(delBtnText);

      const hitZone = this.scene.add.rectangle(btnX + btnSize / 2, btnY + btnSize / 2, btnSize + 6, btnSize + 6, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      this.cartItemsContainer.add(hitZone);

      hitZone.on('pointerdown', () => {
        SoundManager.getInstance().playUiTap();
        this.onRemoveItem(index, item);
      });

      hitZone.on('pointerover', () => {
        delBtnBg.clear();
        delBtnBg.fillStyle(0xffccd5, 1);
        delBtnBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 8);
        delBtnBg.lineStyle(1.5, 0xc9584f, 1);
        delBtnBg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 8);
      });

      hitZone.on('pointerout', () => {
        delBtnBg.clear();
        delBtnBg.fillStyle(0xffe2dc, 1);
        delBtnBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 8);
        delBtnBg.lineStyle(1.5, 0xe5a99f, 1);
        delBtnBg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 8);
      });
    });
  }

  updateMetrics() {
    const i18n = I18nManager.getInstance();
    const w = this.basketWidth;

    // Total gastado
    this.totalSpentValue.setText(`${this.spentCoins} 🪙`);

    // Masa para mañana
    const totalDough = (this.stock.dough?.classic || 0) +
                       (this.stock.dough?.chocolate || 0) +
                       (this.stock.dough?.oat || 0);

    const hasEnough = totalDough >= 1;
    this.doughTomorrowValue.setText(`${totalDough} u.`);
    this.doughTomorrowValue.setColor(hasEnough ? '#2b9348' : '#d90429');

    // Barra de progreso horizontal de masa
    const barY = 370;
    const barW = w - 48;
    const barH = 18;

    this.progressBarFill.clear();
    const fillPercent = Phaser.Math.Clamp(totalDough / 10, 0, 1);
    const fillW = Math.max(10, barW * fillPercent);

    this.progressBarFill.fillStyle(hasEnough ? 0x4f9d6a : 0xd90429, 1);
    this.progressBarFill.fillRoundedRect(24, barY, fillW, barH, 9);

    // Píldora de estado de apertura
    const p = this.statusPillDimensions;
    this.statusPillGfx.clear();

    if (hasEnough) {
      this.statusPillGfx.fillStyle(0xd8f3dc, 1);
      this.statusPillGfx.lineStyle(1.5, 0xa9d5b8, 1);
      this.statusPillGfx.fillRoundedRect(p.x, p.y, p.w, p.h, 16);
      this.statusPillGfx.strokeRoundedRect(p.x, p.y, p.w, p.h, 16);

      const msg = i18n.t('shop.basket.pantryReady', { day: this.day + 1 }) ||
        `✓ Despensa lista para abrir el Día ${this.day + 1}.`;
      this.statusPillText.setText(msg);
      this.statusPillText.setColor('#33684a');
    } else {
      this.statusPillGfx.fillStyle(0xffe2dc, 1);
      this.statusPillGfx.lineStyle(1.5, 0xe5a99f, 1);
      this.statusPillGfx.fillRoundedRect(p.x, p.y, p.w, p.h, 16);
      this.statusPillGfx.strokeRoundedRect(p.x, p.y, p.w, p.h, 16);

      const msg = i18n.t('shop.basket.pantryWarning') ||
        '⚠️ Sin masa no podemos abrir. Compra al menos 1 pack de Masa Clásica.';
      this.statusPillText.setText(msg);
      this.statusPillText.setColor('#8f3931');
    }
  }

  /**
   * Actualiza y evalúa la suficiencia de masa para el día siguiente
   * @returns {boolean} hasEnough
   */
  updateDoughMeter() {
    const totalDough = (this.stock.dough?.classic || 0) +
                       (this.stock.dough?.chocolate || 0) +
                       (this.stock.dough?.oat || 0);
    const hasEnough = totalDough >= 1;
    this.updateMetrics();
    return hasEnough;
  }

  /**
   * Registra una compra en la cesta de la sesión
   * @param {string} itemName
   * @param {number} cost
   * @param {Object} [stock]
   */
  recordPurchase(itemName, cost, stock) {
    if (stock) this.stock = stock;
    this.spentCoins += cost;
    const existing = this.sessionCart.find(c => c.name === itemName);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.sessionCart.push({ key: itemName, name: itemName, cost, qty: 1, unitCost: cost });
    }
    this.setSessionCart(this.sessionCart, this.spentCoins, this.stock);
  }

  say(message) {
    if (this.dialogueText) {
      this.dialogueText.setText(message);
      if (this.scene.tweens && typeof this.scene.tweens.add === 'function') {
        this.scene.tweens.add({
          targets: this.dialogueText,
          scale: 1.04,
          duration: 80,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  getDefaultWelcomeText() {
    const i18n = I18nManager.getInstance();
    const totalDough = (this.stock.dough?.classic || 0) +
                       (this.stock.dough?.chocolate || 0) +
                       (this.stock.dough?.oat || 0);

    if (totalDough < 1) {
      return i18n.t('shop.dialogue.welcomeNoDough') ||
        '¡Bienvenido! No nos queda masa. ¡Recuerda comprar Masa Clásica antes de abrir!';
    }

    return i18n.t('shop.dialogue.welcome') ||
      '¡Bienvenido a mi almacén! Con buenos insumos las galletas son deliciosas. ¡Mira las novedades!';
  }

  /**
   * Refresco de textos ante cambio de idioma
   */
  updateTexts() {
    const i18n = I18nManager.getInstance();
    if (this.headerText) {
      const raw = i18n.t('shop.basket.title') || 'CESTA DEL DÍA';
      this.headerText.setText(raw.replace(/^[^\wÁÉÍÓÚáéíóúñÑ]+/i, '').trim());
    }
    if (this.kiwiNameText) {
      this.kiwiNameText.setText(i18n.t('shop.basket.kiwiName') || 'Tendero Kiwi 🐱');
    }
    if (this.openSignText) {
      this.openSignText.setText(i18n.t('shop.basket.openSign') || '¡Cocina Abierta! 🐾');
    }
    if (this.emptyMessage) {
      this.emptyMessage.setText(i18n.t('shop.basket.empty') || 'La cesta está vacía.\nElige masas para poder abrir mañana.');
    }
    if (this.clearBtnText) {
      this.clearBtnText.setText(i18n.t('shop.basket.clear') || 'Limpiar Cesta 🗑️');
    }
    if (this.totalSpentLabel) {
      this.totalSpentLabel.setText(i18n.t('shop.basket.totalSpent') || 'Total gastado');
    }
    if (this.doughTomorrowLabel) {
      this.doughTomorrowLabel.setText(i18n.t('shop.basket.doughTomorrow') || 'Masa para mañana');
    }

    this.refreshCartList();
    this.updateMetrics();

    if (this.sessionCart.length === 0) {
      this.dialogueText.setText(this.getDefaultWelcomeText());
    }
  }
}
