import Phaser from 'phaser';
import I18nManager from '../services/I18nManager.js';

/**
 * ChefDialogue
 * Componente modular de UI en Phaser 4 (Canvas/WebGL).
 * Muestra el avatar oficial de Kiwi (chef_cat.png) con animación suave de respiración
 * y un bocadillo de diálogo pastel diegético reactivo a la situación del jugador.
 */
export default class ChefDialogue extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config
   * @param {number} [config.width=760]
   * @param {number} [config.height=230]
   * @param {number} [config.stars=3]
   * @param {boolean} [config.isBankrupt=false]
   * @param {string} [config.bankruptcyReason='debt']
   * @param {number} [config.totalDoughStock=10]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.boxWidth = config.width || 760;
    this.boxHeight = config.height || 230;
    this.stars = config.stars !== undefined ? config.stars : 3;
    this.isBankrupt = !!config.isBankrupt;
    this.bankruptcyReason = config.bankruptcyReason || 'debt';
    this.totalDoughStock = config.totalDoughStock !== undefined ? config.totalDoughStock : 10;
    this.customMessage = config.customMessage || null;

    this.buildDialogue();

    scene.add.existing(this);
  }

  buildDialogue() {
    const w = this.boxWidth;
    const h = this.boxHeight;

    // 1. Tarjeta base contenedor general
    const containerBg = this.scene.add.graphics();
    containerBg.fillStyle(0xfff1e6, 0.95);
    containerBg.fillRoundedRect(0, 0, w, h, 18);
    containerBg.lineStyle(2, 0xddb892, 1);
    containerBg.strokeRoundedRect(0, 0, w, h, 18);
    this.add(containerBg);

    // 2. Avatar de Kiwi (Chef) con sombra y tween de respiración
    const catCenterX = 100;
    const catCenterY = h / 2 + 10;

    // Sombra ovalada bajo el gato
    const shadowGfx = this.scene.add.graphics();
    shadowGfx.fillStyle(0x4e3629, 0.18);
    shadowGfx.fillEllipse(catCenterX, catCenterY + 74, 110, 22);
    this.add(shadowGfx);

    // Avatar oficial chef_cat.png
    this.catAvatar = this.scene.add.image(catCenterX, catCenterY, 'chef_cat');
    this.catAvatar.setDisplaySize(140, 150);
    this.add(this.catAvatar);

    // Tween sutil de respiración en bucle
    this.scene.tweens.add({
      targets: this.catAvatar,
      scaleY: this.catAvatar.scaleY * 1.03,
      y: catCenterY - 3,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Bocadillo de diálogo pastel con pico vectorial hacia Kiwi
    const bubbleX = 200;
    const bubbleY = 24;
    const bubbleW = w - bubbleX - 26;
    const bubbleH = h - 48;
    const bubbleRadius = 16;

    this.bubbleGfx = this.scene.add.graphics();
    this.drawSpeechBubble(this.bubbleGfx, bubbleX, bubbleY, bubbleW, bubbleH, bubbleRadius);
    this.add(this.bubbleGfx);

    // Nombre del personaje
    const nameStyle = {
      font: '20px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    };
    const i18n = I18nManager.getInstance();
    this.nameText = this.scene.add.text(bubbleX + 22, bubbleY + 16, i18n.t('summary.chefDialogue.name') || 'Chef Kiwi 🐾', nameStyle);
    this.add(this.nameText);

    // Mensaje de diálogo reactivo
    const messageStyle = {
      font: '19px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '600',
      wordWrap: { width: bubbleW - 44 },
      lineSpacing: 4
    };

    const initialText = this.getDialogueText();
    this.dialogueText = this.scene.add.text(bubbleX + 22, bubbleY + 48, initialText, messageStyle);
    this.add(this.dialogueText);
  }

  /**
   * Dibuja un globo de diálogo con piquito apuntando a la izquierda (hacia el gato)
   */
  drawSpeechBubble(gfx, x, y, w, h, radius = 16) {
    gfx.clear();

    // Sombra del globo
    gfx.fillStyle(0x4e3629, 0.08);
    gfx.fillRoundedRect(x + 3, y + 4, w, h, radius);

    // Fondo del globo
    gfx.fillStyle(0xfffdf9, 1);
    gfx.lineStyle(2, 0x582f0e, 1);

    // Cuerpo principal con bordes redondeados
    gfx.fillRoundedRect(x, y, w, h, radius);
    gfx.strokeRoundedRect(x, y, w, h, radius);

    // Piquito apuntando al gato a la izquierda
    const beakY = y + h / 2;
    gfx.fillStyle(0xfffdf9, 1);
    gfx.fillTriangle(x + 2, beakY - 14, x - 18, beakY, x + 2, beakY + 14);

    gfx.lineStyle(2, 0x582f0e, 1);
    gfx.beginPath();
    gfx.moveTo(x + 1, beakY - 14);
    gfx.lineTo(x - 18, beakY);
    gfx.lineTo(x + 1, beakY + 14);
    gfx.strokePath();
  }

  /**
   * Obtiene el texto diegético reactivo según el resultado de la jornada
   */
  getDialogueText() {
    if (this.customMessage) return this.customMessage;

    const i18n = I18nManager.getInstance();

    if (this.isBankrupt) {
      if (this.bankruptcyReason === 'supplies' || this.totalDoughStock < 1) {
        return i18n.t('summary.chefDialogue.bankruptcySupplies');
      }
      return i18n.t('summary.chefDialogue.bankruptcyDebt');
    }

    if (this.stars === 3) {
      return i18n.t('summary.chefDialogue.stars3');
    }

    if (this.stars === 2) {
      return i18n.t('summary.chefDialogue.stars2');
    }

    return i18n.t('summary.chefDialogue.stars1');
  }

  /**
   * Cambia o refresca el texto del diálogo
   */
  setDialogue(text) {
    this.customMessage = text;
    if (this.dialogueText) {
      this.dialogueText.setText(text);
    }
  }

  /**
   * Actualiza el diálogo al cambiar de idioma
   */
  updateTexts() {
    const i18n = I18nManager.getInstance();
    if (this.nameText) {
      this.nameText.setText(i18n.t('summary.chefDialogue.name') || 'Chef Kiwi 🐾');
    }
    if (this.dialogueText) {
      this.dialogueText.setText(this.getDialogueText());
    }
  }
}
