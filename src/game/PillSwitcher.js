/**
 * PillSwitcher.js
 * 
 * Componente interactivo dual [ EN | ES ] para cambio de idioma in-situ.
 * Renderiza banderas gráficas vectoriales procedurales (Phaser.GameObjects.Graphics)
 * y tipografía estructurada nativa de 38px/32px bold para máxima nitidez, contraste
 * y compatibilidad universal sin depender de fuentes emoji del sistema operativo.
 * Cook Gatos Kiwii
 */

import I18nManager from './services/I18nManager.js';
import SoundManager from './SoundManager.js';

export default class PillSwitcher {
  /**
   * Crea un selector de idioma de píldora dual interactivo.
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Object} [config]
   * @param {number} [config.x] - Posición X del centro del selector (default: width - 190)
   * @param {number} [config.y] - Posición Y del centro del selector (default: 90)
   * @param {number} [config.width=320] - Ancho del componente
   * @param {number} [config.height=82] - Alto del componente
   * @param {number} [config.depth=100] - Profundidad en la escena
   * @param {Function} [config.onLanguageChange] - Callback ejecutado al cambiar idioma
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    const width = scene.cameras?.main?.width || 1920;
    this.x = config.x !== undefined ? config.x : width - 190;
    this.y = config.y !== undefined ? config.y : 90;
    this.w = config.width || 320;
    this.h = config.height || 82;
    this.depth = config.depth !== undefined ? config.depth : 100;
    this.onLanguageChange = config.onLanguageChange || null;

    this.container = scene.add.container(this.x, this.y).setDepth(this.depth);

    this._createVisuals();
    this.updateVisuals();
  }

  /**
   * Renderiza proceduralmente una bandera vectorial nítida con Phaser Graphics.
   * @param {Phaser.GameObjects.Graphics} graphics - Objeto Graphics donde dibujar
   * @param {'en'|'es'|'US'|'ES'} type - Identificador de bandera
   * @param {number} x - Coordenada X superior izquierda
   * @param {number} y - Coordenada Y superior izquierda
   * @param {number} [w=42] - Ancho de la bandera
   * @param {number} [h=28] - Alto de la bandera
   */
  drawFlag(graphics, type, x, y, w = 42, h = 28) {
    const flagType = String(type).toLowerCase();

    if (flagType === 'en' || flagType === 'us') {
      // --- Bandera de EE.UU. (EN) ---
      // 1. Base de 7 franjas horizontales alternando Rojo (#B22234) y Blanco (#FFFFFF)
      const stripeH = h / 7;
      for (let i = 0; i < 7; i++) {
        graphics.fillStyle(i % 2 === 0 ? 0xB22234 : 0xFFFFFF, 1.0);
        graphics.fillRect(x, y + i * stripeH, w, Math.ceil(stripeH));
      }

      // 2. Cantón Azul Marino (#3C3B6E) en esquina superior izquierda (18x16 px)
      const cantonW = 18;
      const cantonH = 16;
      graphics.fillStyle(0x3C3B6E, 1.0);
      graphics.fillRect(x, y, cantonW, cantonH);

      // 3. Estrellas / Micro-puntos blancos (#FFFFFF) en el cantón
      graphics.fillStyle(0xFFFFFF, 1.0);
      const starMatrix = [
        [x + 4, x + 9, x + 14],
        [x + 6.5, x + 11.5],
        [x + 4, x + 9, x + 14]
      ];
      const rowY = [y + 4, y + 8, y + 12];
      for (let r = 0; r < starMatrix.length; r++) {
        for (const sx of starMatrix[r]) {
          graphics.fillRect(sx - 0.75, rowY[r] - 0.75, 1.5, 1.5);
        }
      }

      // 4. Borde perimetral nítido
      graphics.lineStyle(1.5, 0xFFFFFF, 0.45);
      graphics.strokeRect(x, y, w, h);
    } else if (flagType === 'es') {
      // --- Bandera de España (ES) ---
      // 1. Franja superior Roja (#AA151B, 7px)
      const redH = 7;
      const yellowH = 14;

      graphics.fillStyle(0xAA151B, 1.0);
      graphics.fillRect(x, y, w, redH);

      // 2. Franja central Amarilla Dorada (#F1BF00, 14px)
      graphics.fillStyle(0xF1BF00, 1.0);
      graphics.fillRect(x, y + redH, w, yellowH);

      // 3. Franja inferior Roja (#AA151B, 7px)
      graphics.fillStyle(0xAA151B, 1.0);
      graphics.fillRect(x, y + redH + yellowH, w, redH);

      // 4. Blasón heráldico estilizado en la franja amarilla
      // Escudo base
      graphics.fillStyle(0xAA151B, 1.0);
      graphics.fillRect(x + 10, y + 11, 6, 6);

      // Carga central
      graphics.fillStyle(0xFFFFFF, 0.9);
      graphics.fillRect(x + 11.5, y + 12.5, 3, 3);

      // Corona superior
      graphics.fillStyle(0xF1BF00, 1.0);
      graphics.fillRect(x + 10.5, y + 9.5, 5, 1.5);

      // Columnas heráldicas laterales
      graphics.fillStyle(0xAA151B, 0.7);
      graphics.fillRect(x + 8, y + 10.5, 1.5, 7);
      graphics.fillRect(x + 16.5, y + 10.5, 1.5, 7);

      // 5. Borde perimetral nítido
      graphics.lineStyle(1.5, 0xFFFFFF, 0.45);
      graphics.strokeRect(x, y, w, h);
    }
  }

  _createVisuals() {
    const halfW = this.w / 2;
    const halfH = this.h / 2;
    const pillRadius = 28;

    // 1. Sombra exterior proyectada de alto contraste
    this.shadowGfx = this.scene.add.graphics();
    this.shadowGfx.fillStyle(0x000000, 0.45);
    this.shadowGfx.fillRoundedRect(-halfW + 4, -halfH + 6, this.w, this.h, pillRadius);
    this.container.add(this.shadowGfx);

    // 2. Fondo de la cápsula contenedora cacao profundo con trazo perimetral blanco de 4px
    this.baseGfx = this.scene.add.graphics();
    this.baseGfx.fillStyle(0x432818, 0.96);
    this.baseGfx.fillRoundedRect(-halfW, -halfH, this.w, this.h, pillRadius);
    this.baseGfx.lineStyle(4, 0xffffff, 1.0);
    this.baseGfx.strokeRoundedRect(-halfW, -halfH, this.w, this.h, pillRadius);
    this.container.add(this.baseGfx);

    // 3. Divisor vertical central tenue
    this.dividerGfx = this.scene.add.graphics();
    this.dividerGfx.lineStyle(2, 0xffffff, 0.35);
    this.dividerGfx.lineBetween(0, -halfH + 12, 0, halfH - 12);
    this.container.add(this.dividerGfx);

    // Dimensiones de las sub-píldoras (145x70 px)
    const segW = 145;
    const segH = 70;
    const offsetEnX = -this.w / 4; // -80px
    const offsetEsX = this.w / 4;  // +80px
    const flagW = 42;
    const flagH = 28;

    // --- Badges Activos ---
    this.badgeEnGfx = this.scene.add.graphics();
    this.container.add(this.badgeEnGfx);

    this.badgeEsGfx = this.scene.add.graphics();
    this.container.add(this.badgeEsGfx);

    // --- Banderas Gráficas Vectoriales ---
    this.flagsGfx = this.scene.add.graphics();
    this.drawFlag(this.flagsGfx, 'en', offsetEnX - 32 - flagW / 2, -flagH / 2, flagW, flagH);
    this.drawFlag(this.flagsGfx, 'es', offsetEsX - 32 - flagW / 2, -flagH / 2, flagW, flagH);
    this.container.add(this.flagsGfx);

    // --- Textos Estructurados Nativos Phaser 3 ---
    this.textEn = this.scene.add.text(offsetEnX + 26, 0, 'EN', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.textEn);

    this.textEs = this.scene.add.text(offsetEsX + 26, 0, 'ES', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#eed7c5'
    }).setOrigin(0.5);
    this.container.add(this.textEs);

    // --- Zonas Interactivas de Clic ---
    this.zoneEn = this.scene.add.rectangle(offsetEnX, 0, segW, segH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.container.add(this.zoneEn);

    this.zoneEs = this.scene.add.rectangle(offsetEsX, 0, segW, segH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.container.add(this.zoneEs);

    // --- Interacciones y Sonido ---
    const sound = SoundManager.getInstance();
    const i18n = I18nManager.getInstance();

    this.zoneEn.on('pointerdown', () => {
      const current = i18n.getLanguage();
      if (current !== 'en') {
        sound.playUiTap();
        i18n.setLanguage('en');
        this.updateVisuals();
        if (this.onLanguageChange) {
          this.onLanguageChange('en');
        }
      }
    });

    this.zoneEn.on('pointerover', () => {
      if (i18n.getLanguage() !== 'en') {
        sound.playUiHover();
        this.textEn.setScale(1.06);
        this.textEn.setColor('#ffffff');
      }
    });

    this.zoneEn.on('pointerout', () => {
      this.textEn.setScale(1.0);
      if (i18n.getLanguage() !== 'en') {
        this.textEn.setColor('#eed7c5');
      }
    });

    this.zoneEs.on('pointerdown', () => {
      const current = i18n.getLanguage();
      if (current !== 'es') {
        sound.playUiTap();
        i18n.setLanguage('es');
        this.updateVisuals();
        if (this.onLanguageChange) {
          this.onLanguageChange('es');
        }
      }
    });

    this.zoneEs.on('pointerover', () => {
      if (i18n.getLanguage() !== 'es') {
        sound.playUiHover();
        this.textEs.setScale(1.06);
        this.textEs.setColor('#ffffff');
      }
    });

    this.zoneEs.on('pointerout', () => {
      this.textEs.setScale(1.0);
      if (i18n.getLanguage() !== 'es') {
        this.textEs.setColor('#eed7c5');
      }
    });
  }

  /**
   * Actualiza el renderizado visual de los badges según el idioma activo.
   */
  updateVisuals() {
    const i18n = I18nManager.getInstance();
    const lang = i18n.getLanguage();

    const segW = 145;
    const segH = 70;
    const segRadius = 22;
    const offsetEnX = -this.w / 4;
    const offsetEsX = this.w / 4;

    this.badgeEnGfx.clear();
    this.badgeEsGfx.clear();

    if (lang === 'en') {
      // EN Activo (Badge Verde Kiwipaw con borde interior blanco de 3px)
      this.badgeEnGfx.fillStyle(0x38b000, 1);
      this.badgeEnGfx.fillRoundedRect(offsetEnX - segW / 2, -segH / 2, segW, segH, segRadius);
      this.badgeEnGfx.lineStyle(3, 0xffffff, 0.95);
      this.badgeEnGfx.strokeRoundedRect(offsetEnX - segW / 2, -segH / 2, segW, segH, segRadius);

      this.textEn.setFontSize('38px');
      this.textEn.setFontStyle('bold');
      this.textEn.setColor('#ffffff');
      this.textEn.setScale(1.0);

      // ES Inactivo
      this.textEs.setFontSize('32px');
      this.textEs.setFontStyle('bold');
      this.textEs.setColor('#eed7c5');
      this.textEs.setScale(1.0);
    } else {
      // ES Activo (Badge Verde Kiwipaw con borde interior blanco de 3px)
      this.badgeEsGfx.fillStyle(0x38b000, 1);
      this.badgeEsGfx.fillRoundedRect(offsetEsX - segW / 2, -segH / 2, segW, segH, segRadius);
      this.badgeEsGfx.lineStyle(3, 0xffffff, 0.95);
      this.badgeEsGfx.strokeRoundedRect(offsetEsX - segW / 2, -segH / 2, segW, segH, segRadius);

      this.textEs.setFontSize('38px');
      this.textEs.setFontStyle('bold');
      this.textEs.setColor('#ffffff');
      this.textEs.setScale(1.0);

      // EN Inactivo
      this.textEn.setFontSize('32px');
      this.textEn.setFontStyle('bold');
      this.textEn.setColor('#eed7c5');
      this.textEn.setScale(1.0);
    }
  }

  /**
   * Destruye el contenedor y todos sus hijos.
   */
  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
