import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';
import SoundManager from '../SoundManager.js';

/**
 * ShopRail
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Riel vertical/lateral de categorías temáticas de la panadería:
 * Moldes, Masas, Toppings, Bebidas y Decoración.
 * Botones flotantes independientes sobre el fondo cálido sin marco blanco desbordante.
 * Incluye estados activo, hover, descansado y píldora flotante de total gastado hoy.
 */
export default class ShopRail extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=280]
   * @param {number} [config.height=720]
   * @param {string} [config.initialCategory='mold']
   * @param {Function} [config.onSelect]
   * @param {number} [config.spent=0]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.railWidth = config.width || 280;
    this.railHeight = config.height || 720;
    this.activeCategory = config.initialCategory || 'mold';
    this.onSelect = config.onSelect || (() => {});
    this.spentCoins = config.spent || 0;

    this.buttons = {};
    this.buildRail();

    scene.add.existing(this);
  }

  buildRail() {
    const i18n = I18nManager.getInstance();
    const w = this.railWidth;

    // NOTA: Se remueve deliberadamente el marco blanco 'railBg' y el rótulo 'railHeader'
    // ("CATEGORÍAS") para que los botones floten limpiamente sobre el fondo cálido crema/durazno,
    // eliminando cualquier desborde visual.

    // Definición de las 5 categorías temáticas
    this.categories = [
      {
        key: 'mold',
        tabGroup: 'supplies',
        titleKey: 'shop.columns.molds',
        fallbackTitle: 'Moldes',
        subtitleKey: 'shop.rail.subtitles.mold',
        fallbackSubtitle: 'Cortadores únicos',
        iconTexture: 'shape_star',
        iconIsImage: true
      },
      {
        key: 'dough',
        tabGroup: 'supplies',
        titleKey: 'shop.columns.dough',
        fallbackTitle: 'Masas',
        subtitleKey: 'shop.rail.subtitles.dough',
        fallbackSubtitle: 'Harinas y base',
        iconTexture: 'dough_classic',
        iconIsImage: true
      },
      {
        key: 'topping',
        tabGroup: 'supplies',
        titleKey: 'shop.columns.toppings',
        fallbackTitle: 'Toppings',
        subtitleKey: 'shop.rail.subtitles.topping',
        fallbackSubtitle: 'Chispas y glaseados',
        iconTexture: 'topping_sprinkles',
        iconIsImage: true
      },
      {
        key: 'drink',
        tabGroup: 'supplies',
        titleKey: 'shop.columns.drinks',
        fallbackTitle: 'Bebidas',
        subtitleKey: 'shop.rail.subtitles.drink',
        fallbackSubtitle: 'Cafetería y leche',
        iconTexture: 'drink_coffee_beans',
        iconIsImage: true
      },
      {
        key: 'decor',
        tabGroup: 'decorations',
        titleKey: 'shop.tabs.decorations',
        fallbackTitle: 'Decoración',
        subtitleKey: 'shop.rail.subtitles.decor',
        fallbackSubtitle: 'Mejoras del local',
        iconTexture: 'decor_bunting_thumb',
        iconIsImage: true
      }
    ];

    const btnW = w;
    const btnH = 92;
    const startY = 8;
    const gap = 16;

    this.categories.forEach((cat, index) => {
      const btnX = 0;
      const btnY = startY + index * (btnH + gap);

      const btnGfx = this.scene.add.graphics();
      this.add(btnGfx);

      // Icono de la categoría (48x48 px) centrado verticalmente
      const icon = this.scene.add.image(btnX + 38, btnY + btnH / 2, cat.iconTexture);
      icon.setDisplaySize(48, 48);
      this.add(icon);

      // Texto de título (Outfit 800 de 26px)
      const titleTxt = this.scene.add.text(btnX + 74, btnY + 20, i18n.t(cat.titleKey) || cat.fallbackTitle, {
        font: '26px "Outfit", sans-serif',
        fontWeight: '800',
        fill: '#582f0e'
      });
      this.add(titleTxt);

      // Texto de subtítulo descriptivo (Outfit 600 de 18px)
      const subTxt = this.scene.add.text(
        btnX + 74,
        btnY + 52,
        i18n.t(cat.subtitleKey) || cat.fallbackSubtitle,
        {
          font: '18px "Outfit", sans-serif',
          fontWeight: '600',
          fill: '#654024'
        }
      );
      this.add(subTxt);

      // Zona interactiva amplia
      const hitZone = this.scene.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      this.add(hitZone);

      const updateVisuals = () => {
        btnGfx.clear();
        const isActive = this.activeCategory === cat.key;
        if (isActive) {
          // Fondo café acento elegante
          btnGfx.fillStyle(0x7f5539, 1);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 18);
          btnGfx.lineStyle(2.5, 0x582f0e, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 18);

          titleTxt.setColor('#ffffff');
          titleTxt.setFont('26px "Outfit", sans-serif');
          titleTxt.setFontStyle('bold');
          subTxt.setColor('#ffe5d9');
        } else {
          // Fondo inactivo cálido flotante
          btnGfx.fillStyle(0xfffdf9, 0.98);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 18);
          btnGfx.lineStyle(1.5, 0xddb892, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 18);

          titleTxt.setColor('#582f0e');
          titleTxt.setFont('26px "Outfit", sans-serif');
          titleTxt.setFontStyle('normal');
          subTxt.setColor('#654024');
        }
      };

      hitZone.on('pointerdown', () => {
        if (this.activeCategory !== cat.key) {
          SoundManager.getInstance().playUiTap();
          this.setActiveCategory(cat.key);
          this.onSelect(cat.key, cat.tabGroup);
        }
      });

      hitZone.on('pointerover', () => {
        if (this.activeCategory !== cat.key) {
          SoundManager.getInstance().playUiHover();
          btnGfx.clear();
          btnGfx.fillStyle(0xddb892, 0.75);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 18);
          btnGfx.lineStyle(2, 0xb08968, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 18);
          titleTxt.setColor('#42270f');
        }
      });

      hitZone.on('pointerout', () => {
        updateVisuals();
      });

      this.buttons[cat.key] = {
        cat,
        btnGfx,
        icon,
        titleTxt,
        subTxt,
        hitZone,
        updateVisuals
      };

      updateVisuals();
    });

    // =========================================================================
    // PIE DEL RIEL: Píldora Flotante "✓ Gastado hoy: {spent} 🪙"
    // =========================================================================
    const footY = startY + this.categories.length * (btnH + gap) + 12;
    const footW = w;
    const footH = 54;

    this.footGfx = this.scene.add.graphics();
    this.footGfx.fillStyle(0xd8f3dc, 1);
    this.footGfx.fillRoundedRect(0, footY, footW, footH, 18);
    this.footGfx.lineStyle(1.5, 0xa9d5b8, 1);
    this.footGfx.strokeRoundedRect(0, footY, footW, footH, 18);
    this.add(this.footGfx);

    this.footText = this.scene.add.text(w / 2, footY + footH / 2, '', {
      font: '20px "Outfit", sans-serif',
      fontWeight: '800',
      fill: '#33684a'
    }).setOrigin(0.5);
    this.add(this.footText);

    this.setSpent(this.spentCoins);
  }

  /**
   * Actualiza la cifra de monedas gastadas en la jornada
   * @param {number} amount
   */
  setSpent(amount) {
    this.spentCoins = amount;
    const i18n = I18nManager.getInstance();
    const label = i18n.t('shop.rail.spentToday', { spent: this.spentCoins }) || `✓ Gastado hoy: ${this.spentCoins} 🪙`;
    if (this.footText) {
      this.footText.setText(label);
    }
  }

  /**
   * Cambia la categoría activa y actualiza los estilos visuales
   */
  setActiveCategory(categoryKey) {
    this.activeCategory = categoryKey;
    Object.values(this.buttons).forEach(btn => btn.updateVisuals());
  }

  /**
   * Refresco de textos ante cambio de idioma
   */
  updateTexts() {
    const i18n = I18nManager.getInstance();

    Object.values(this.buttons).forEach(btn => {
      btn.titleTxt.setText(i18n.t(btn.cat.titleKey) || btn.cat.fallbackTitle);
      btn.subTxt.setText(i18n.t(btn.cat.subtitleKey) || btn.cat.fallbackSubtitle);
      btn.updateVisuals();
    });

    this.setSpent(this.spentCoins);
  }
}
