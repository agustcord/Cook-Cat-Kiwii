import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';
import SoundManager from '../SoundManager.js';

/**
 * ShopShelf
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Estantería amplia en cuadrícula 2x2 por categoría temática.
 * Cada tarjeta incluye:
 * - Recuadro pastel suave temático (rosa, lavanda, menta, crema).
 * - Sprite PNG real nítido (75x75 px) centrado en su recuadro.
 * - Badges superiores: PERMANENTE / PACK ×5 y POR DESBLOQUEAR / TIENES {stock} U.
 * - Título en Outfit 800 (#582f0e) y descripción diegética narrativa clara en 2 líneas (#654024).
 * - Botón de compra ancho abajo con todos los estados de interacción.
 */
export default class ShopShelf extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=1080]
   * @param {number} [config.height=720]
   * @param {number} config.coins
   * @param {Array<string>} config.unlockedShapes
   * @param {Object} config.stock
   * @param {Array<string>} config.decorations
   * @param {Function} config.onBuyItem
   * @param {Function} config.onBuyDecor
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.shelfWidth = config.width || 1080;
    this.shelfHeight = config.height || 720;
    this.coins = config.coins || 0;
    this.unlockedShapes = config.unlockedShapes ? [...config.unlockedShapes] : ['star'];
    this.stock = config.stock || {};
    this.decorations = config.decorations ? [...config.decorations] : [];
    this.onBuyItem = config.onBuyItem || (() => {});
    this.onBuyDecor = config.onBuyDecor || (() => {});

    this.currentCategory = 'mold'; // 'mold' | 'dough' | 'topping' | 'drink' | 'decor'
    this.cards = [];
    this.updaters = [];

    this.buildCatalog();
    this.buildShelf();

    scene.add.existing(this);
  }

  buildCatalog() {
    this.catalog = [
      // MOLDES
      {
        type: 'mold',
        id: 'heart',
        key: 'moldHeart',
        cost: 60,
        icon: 'shape_heart',
        tint: 0xffe5ec,
        category: 'mold',
        unitType: 'permanent'
      },
      {
        type: 'mold',
        id: 'cat',
        key: 'moldCat',
        cost: 90,
        icon: 'shape_cat',
        tint: 0xe8e0ff,
        category: 'mold',
        unitType: 'permanent'
      },
      {
        type: 'mold',
        id: 'fish',
        key: 'moldFish',
        cost: 120,
        icon: 'shape_fish',
        tint: 0xe2f7ed,
        category: 'mold',
        unitType: 'permanent'
      },

      // MASAS
      {
        type: 'dough',
        id: 'classic',
        key: 'doughClassic',
        cost: 10,
        icon: 'dough_classic',
        tint: 0xf7ead6,
        category: 'dough',
        unitType: 'pack5'
      },
      {
        type: 'dough',
        id: 'chocolate',
        key: 'doughChocolate',
        cost: 15,
        icon: 'dough_chocolate',
        tint: 0xeadfd3,
        category: 'dough',
        unitType: 'pack5'
      },
      {
        type: 'dough',
        id: 'oat',
        key: 'doughOat',
        cost: 20,
        icon: 'dough_oat',
        tint: 0xf0e8d2,
        category: 'dough',
        unitType: 'pack5'
      },

      // TOPPINGS
      {
        type: 'topping',
        id: 'sprinkles',
        key: 'toppingSprinkles',
        cost: 10,
        icon: 'topping_sprinkles',
        tint: 0xfde6ec,
        category: 'topping',
        unitType: 'pack5'
      },
      {
        type: 'topping',
        id: 'choco',
        key: 'toppingChoco',
        cost: 15,
        icon: 'topping_choco',
        tint: 0xefe1d7,
        category: 'topping',
        unitType: 'pack5'
      },
      {
        type: 'topping',
        id: 'glazing',
        key: 'toppingGlazing',
        cost: 20,
        icon: 'topping_glazing',
        tint: 0xfbeede,
        category: 'topping',
        unitType: 'pack5'
      },

      // BEBIDAS
      {
        type: 'drink',
        id: 'coffee_beans',
        key: 'drinkCoffee',
        cost: 8,
        icon: 'drink_coffee_beans',
        tint: 0xe8ddd2,
        category: 'drink',
        unitType: 'pack5'
      },
      {
        type: 'drink',
        id: 'milk',
        key: 'drinkMilk',
        cost: 5,
        icon: 'drink_milk',
        tint: 0xe6f5ea,
        category: 'drink',
        unitType: 'pack5'
      },

      // DECORACIÓN
      {
        type: 'decor',
        id: 'decor_window',
        key: 'decor_window',
        cost: 150,
        icon: 'decor_window_thumb',
        tint: 0xfbefd8,
        category: 'decor',
        unitType: 'permanent',
        isComingSoon: false
      },
      {
        type: 'decor',
        id: 'decor_bunting',
        key: 'decor_bunting',
        cost: 200,
        icon: 'decor_bunting_thumb',
        tint: 0xfde6ec,
        category: 'decor',
        unitType: 'permanent',
        isComingSoon: false
      },
      {
        type: 'decor',
        id: 'decor_lights',
        key: 'decor_lights',
        cost: 350,
        icon: 'decor_lights',
        tint: 0xfbefd8,
        category: 'decor',
        unitType: 'permanent',
        isComingSoon: true
      }
    ];
  }

  buildShelf() {
    this.itemsContainer = this.scene.add.container(0, 0);
    this.add(this.itemsContainer);

    this.renderCategory(this.currentCategory);
  }

  /**
   * Renderiza las tarjetas de la categoría seleccionada en 3 filas horizontales
   * de ancho completo (~1040px de ancho x 190px de alto) con botón de compra lateral.
   * @param {string} catKey
   */
  renderCategory(catKey) {
    this.currentCategory = catKey;
    this.itemsContainer.removeAll(true);
    this.cards = [];
    this.updaters = [];

    const i18n = I18nManager.getInstance();
    const items = this.catalog.filter(item => item.category === catKey);

    const cardW = this.shelfWidth || 1040;
    const cardH = 190;
    const gapY = 16;
    const startX = 0;
    const startY = 8;

    items.forEach((item, index) => {
      const cardX = startX;
      const cardY = startY + index * (cardH + gapY);

      const cardContainer = this.scene.add.container(cardX, cardY);

      // 1. Fondo de la tarjeta horizontal (crema cálido con borde caramelo)
      const cardBg = this.scene.add.graphics();
      cardBg.fillStyle(0xfffdf9, 0.98);
      cardBg.fillRoundedRect(0, 0, cardW, cardH, 20);
      cardBg.lineStyle(2, 0xddb892, 1);
      cardBg.strokeRoundedRect(0, 0, cardW, cardH, 20);
      cardContainer.add(cardBg);

      // Sombra interior sutil blanca
      const innerLine = this.scene.add.graphics();
      innerLine.lineStyle(1.5, 0xffffff, 0.8);
      innerLine.strokeRoundedRect(2, 2, cardW - 4, cardH - 4, 18);
      cardContainer.add(innerLine);

      // 2. IZQUIERDA: Recuadro Pastel Cuadrado (140x140 px, radio 16px)
      const thumbBoxW = 140;
      const thumbBoxH = 140;
      const thumbBoxX = 24;
      const thumbBoxY = Math.round((cardH - thumbBoxH) / 2); // 25px

      const thumbBox = this.scene.add.graphics();
      thumbBox.fillStyle(item.tint, 1);
      thumbBox.fillRoundedRect(thumbBoxX, thumbBoxY, thumbBoxW, thumbBoxH, 16);
      thumbBox.lineStyle(1.5, 0x582f0e, 0.18);
      thumbBox.strokeRoundedRect(thumbBoxX, thumbBoxY, thumbBoxW, thumbBoxH, 16);
      cardContainer.add(thumbBox);

      // Sombra suave de la ilustración
      const spriteShadow = this.scene.add.graphics();
      spriteShadow.fillStyle(0x582f0e, 0.12);
      spriteShadow.fillEllipse(thumbBoxX + thumbBoxW / 2, thumbBoxY + thumbBoxH - 14, 90, 18);
      cardContainer.add(spriteShadow);

      // Sprite PNG real centrado (grande 110x110 px)
      let itemSprite = null;
      if (item.type === 'decor' && item.id === 'decor_lights') {
        // Renderizado procedural para luces de hadas acogedoras
        const lightsGfx = this.scene.add.graphics();
        const lCenterX = thumbBoxX + thumbBoxW / 2;
        const lCenterY = thumbBoxY + thumbBoxH / 2;

        lightsGfx.lineStyle(3, 0x582f0e, 0.9);
        lightsGfx.beginPath();
        lightsGfx.moveTo(lCenterX - 52, lCenterY - 10);
        lightsGfx.lineTo(lCenterX - 18, lCenterY + 4);
        lightsGfx.lineTo(lCenterX + 18, lCenterY - 8);
        lightsGfx.lineTo(lCenterX + 52, lCenterY + 4);
        lightsGfx.strokePath();

        const bulbColors = [0xffd166, 0xffb703, 0xfb8500, 0xffe8a1];
        [-42, -14, 16, 44].forEach((bx, bIdx) => {
          lightsGfx.fillStyle(bulbColors[bIdx], 1);
          lightsGfx.fillCircle(lCenterX + bx, lCenterY + (bIdx % 2 === 0 ? 0 : -4), 10);
          lightsGfx.lineStyle(1.5, 0x582f0e, 1);
          lightsGfx.strokeCircle(lCenterX + bx, lCenterY + (bIdx % 2 === 0 ? 0 : -4), 10);
        });
        cardContainer.add(lightsGfx);
        itemSprite = lightsGfx;
      } else if (this.scene.textures.exists(item.icon)) {
        itemSprite = this.scene.add.image(thumbBoxX + thumbBoxW / 2, thumbBoxY + thumbBoxH / 2, item.icon);
        itemSprite.setDisplaySize(110, 110);
        cardContainer.add(itemSprite);
      }

      // 3. CENTRO: Columna vertical de información
      const infoX = thumbBoxX + thumbBoxW + 24; // 188px
      const badgeY = 24;

      // Badge izquierdo: PERMANENTE / PACK ×5
      const leftBadgeBg = this.scene.add.graphics();
      leftBadgeBg.fillStyle(0xeddcd2, 1);
      leftBadgeBg.fillRoundedRect(infoX, badgeY, 134, 30, 15);
      cardContainer.add(leftBadgeBg);

      const leftBadgeLabel = item.unitType === 'permanent'
        ? (i18n.t('shop.units.permanent') || 'PERMANENTE')
        : (i18n.t('shop.units.pack5') || 'PACK ×5');

      const leftBadgeText = this.scene.add.text(infoX + 67, badgeY + 15, leftBadgeLabel, {
        font: '16px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#7f5539'
      }).setOrigin(0.5);
      cardContainer.add(leftBadgeText);

      // Badge derecho: ESTADO / STOCK
      const rightBadgeGfx = this.scene.add.graphics();
      cardContainer.add(rightBadgeGfx);

      const rightBadgeX = infoX + 144;
      const rightBadgeText = this.scene.add.text(rightBadgeX + 14, badgeY + 15, '', {
        font: '16px "Outfit", sans-serif',
        fontWeight: '800'
      }).setOrigin(0, 0.5);
      cardContainer.add(rightBadgeText);

      // Título en Outfit 800 de 28px (#582f0e)
      const nameKey = item.type === 'decor'
        ? `shop.decorItems.${item.id}.name`
        : `shop.items.${item.key}`;
      const itemName = i18n.t(nameKey) || item.key;

      const titleText = this.scene.add.text(infoX, 64, itemName, {
        font: '28px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#582f0e'
      });
      cardContainer.add(titleText);

      // Descripción diegética en Outfit 600 de 20px (#654024) con interlineado holgado
      const descKey = item.type === 'decor'
        ? `shop.decorItems.${item.id}.desc`
        : `shop.itemDescs.${item.key}`;
      const itemDesc = i18n.t(descKey) || i18n.t(`shop.itemDescs.${item.id}`) || '';

      const descText = this.scene.add.text(infoX, 104, itemDesc, {
        font: '20px "Outfit", sans-serif',
        fontWeight: '600',
        fill: '#654024',
        wordWrap: { width: 600 },
        lineSpacing: 4
      });
      cardContainer.add(descText);

      // 4. DERECHA: Botón de Compra Lateral (~190x64 px, radio 16px)
      const btnW = 190;
      const btnH = 64;
      const btnX = cardW - btnW - 24; // 826px
      const btnY = Math.round((cardH - btnH) / 2); // 63px

      const btnBg = this.scene.add.graphics();
      cardContainer.add(btnBg);

      const btnText = this.scene.add.text(btnX + btnW / 2, btnY + btnH / 2, '', {
        fontFamily: '"Outfit", "Segoe UI Emoji", sans-serif',
        fontSize: '26px',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      cardContainer.add(btnText);

      const hitZone = this.scene.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      cardContainer.add(hitZone);

      // Lógica de actualización de estados de la tarjeta
      const updateCardState = () => {
        // Actualizar Badge Derecho
        rightBadgeGfx.clear();
        let isOwned = false;

        if (item.type === 'mold') {
          isOwned = this.unlockedShapes.includes(item.id);
          if (isOwned) {
            rightBadgeGfx.fillStyle(0xd8f3dc, 1);
            rightBadgeGfx.lineStyle(1.5, 0xa9d5b8, 1);
            rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
            rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
            rightBadgeText.setText(i18n.t('shop.units.unlocked') || 'EN EL LOCAL');
            rightBadgeText.setColor('#33684a');
          } else {
            rightBadgeGfx.fillStyle(0xeddcd2, 0.9);
            rightBadgeGfx.lineStyle(1.5, 0xddb892, 1);
            rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 180, 30, 15);
            rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 180, 30, 15);
            rightBadgeText.setText(i18n.t('shop.units.locked') || 'POR DESBLOQUEAR');
            rightBadgeText.setColor('#7f5539');
          }
        } else if (item.type === 'decor') {
          isOwned = this.decorations.includes(item.id);
          if (item.isComingSoon) {
            rightBadgeGfx.fillStyle(0xeddcd2, 1);
            rightBadgeGfx.lineStyle(1.5, 0xddb892, 1);
            rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 140, 30, 15);
            rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 140, 30, 15);
            rightBadgeText.setText('BLOQUEADO');
            rightBadgeText.setColor('#8c5847');
          } else if (isOwned) {
            rightBadgeGfx.fillStyle(0xd8f3dc, 1);
            rightBadgeGfx.lineStyle(1.5, 0xa9d5b8, 1);
            rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
            rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
            rightBadgeText.setText(i18n.t('shop.units.unlocked') || 'EN EL LOCAL');
            rightBadgeText.setColor('#33684a');
          } else {
            rightBadgeGfx.fillStyle(0xeddcd2, 0.9);
            rightBadgeGfx.lineStyle(1.5, 0xddb892, 1);
            rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 180, 30, 15);
            rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 180, 30, 15);
            rightBadgeText.setText(i18n.t('shop.units.locked') || 'POR DESBLOQUEAR');
            rightBadgeText.setColor('#7f5539');
          }
        } else {
          // Ingredientes (dough, topping, drink)
          const qty = this.getItemStock(item);
          rightBadgeGfx.fillStyle(0xffffff, 1);
          rightBadgeGfx.lineStyle(1.5, 0xe0be86, 1);
          rightBadgeGfx.fillRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
          rightBadgeGfx.strokeRoundedRect(rightBadgeX, badgeY, 150, 30, 15);
          rightBadgeText.setText(i18n.t('shop.units.stock', { qty }) || `TIENES ${qty} U.`);
          rightBadgeText.setColor('#7a4a12');
        }

        // Actualizar Botón de Compra Lateral
        btnBg.clear();
        const canAfford = this.coins >= item.cost;

        if (item.isComingSoon) {
          // Próximamente
          btnBg.fillStyle(0xeddcd2, 0.85);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnBg.lineStyle(2, 0xddb892, 1);
          btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnText.setFontSize('20px');
          btnText.setText(i18n.t('shop.units.comingSoon') || '🔒 PRÓXIMAMENTE');
          btnText.setColor('#8c5847');
          hitZone.setInteractive({ useHandCursor: true });
        } else if (isOwned) {
          // Ya adquirido / en el local
          btnBg.fillStyle(0xd8f3dc, 1);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnBg.lineStyle(2, 0xa9d5b8, 1);
          btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnText.setFontSize('22px');
          btnText.setText(i18n.t('shop.units.ready') || '✓ LISTO');
          btnText.setColor('#33684a');
          hitZone.disableInteractive();
        } else if (!canAfford) {
          // Sin fondos suficientes
          btnBg.fillStyle(0xecd9cb, 0.9);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnBg.lineStyle(2, 0xcbb29f, 1);
          btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnText.setFontSize('26px');
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#8a6b5a');
          hitZone.setInteractive({ useHandCursor: true });
        } else {
          // Disponible para comprar
          btnBg.fillStyle(0x7f5539, 1);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnBg.lineStyle(2.5, 0x582f0e, 1);
          btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 16);
          btnText.setFontSize('26px');
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#ffffff');
          hitZone.setInteractive({ useHandCursor: true });
        }
      };

      hitZone.on('pointerdown', () => {
        if (item.isComingSoon) {
          SoundManager.getInstance().playUiDenied();
          if (this.onBuyDecor) {
            this.onBuyDecor(item, cardX + cardW / 2, cardY + cardH / 2);
          }
          return;
        }

        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
        const isBoughtDecor = item.type === 'decor' && this.decorations.includes(item.id);
        if (isBoughtMold || isBoughtDecor) return;

        if (this.coins < item.cost) {
          SoundManager.getInstance().playUiDenied();
          if (this.onBuyItem) {
            this.onBuyItem(item, cardX + cardW / 2, cardY + cardH / 2, true);
          }
          return;
        }

        if (item.type === 'decor') {
          this.onBuyDecor(item, cardX + cardW / 2, cardY + cardH / 2);
        } else {
          this.onBuyItem(item, cardX + cardW / 2, cardY + cardH / 2);
        }

        if (itemSprite && itemSprite.scaleX !== undefined) {
          this.scene.tweens.add({
            targets: itemSprite,
            scaleX: itemSprite.scaleX * 1.15,
            scaleY: itemSprite.scaleY * 1.15,
            duration: 90,
            yoyo: true
          });
        }
      });

      hitZone.on('pointerover', () => {
        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
        const isBoughtDecor = item.type === 'decor' && this.decorations.includes(item.id);
        if (!item.isComingSoon && !isBoughtMold && !isBoughtDecor && this.coins >= item.cost) {
          SoundManager.getInstance().playUiHover();
          btnBg.clear();
          btnBg.fillStyle(0x9c6644, 1);
          btnBg.fillRoundedRect(btnX - 2, btnY - 2, btnW + 4, btnH + 4, 18);
          btnBg.lineStyle(2.5, 0x582f0e, 1);
          btnBg.strokeRoundedRect(btnX - 2, btnY - 2, btnW + 4, btnH + 4, 18);
          btnText.setScale(1.04);
        }
      });

      hitZone.on('pointerout', () => {
        updateCardState();
        btnText.setScale(1);
      });

      updateCardState();
      this.updaters.push(updateCardState);
      this.itemsContainer.add(cardContainer);
      this.cards.push(cardContainer);
    });
  }

  getItemStock(item) {
    if (item.type === 'dough') return this.stock.dough?.[item.id] || 0;
    if (item.type === 'topping') return this.stock.topping?.[item.id] || 0;
    if (item.type === 'drink') {
      return item.id === 'coffee_beans'
        ? (this.stock.drink?.coffee_beans || 0)
        : (this.stock.drink?.milk || 0);
    }
    return 0;
  }

  /**
   * Actualiza el estado de saldo, stock y desbloqueos, refrescando las tarjetas activas
   */
  updateState({ coins, unlockedShapes, stock, decorations }) {
    if (coins !== undefined) this.coins = coins;
    if (unlockedShapes) this.unlockedShapes = [...unlockedShapes];
    if (stock) this.stock = stock;
    if (decorations) this.decorations = [...decorations];

    this.updaters.forEach(updater => updater());
  }

  /**
   * Refresca la categoría ante cambio de idioma
   */
  updateTexts() {
    this.renderCategory(this.currentCategory);
  }
}
