/**
 * TutorialOverlay.js
 * 
 * Componente de interfaz de usuario para el sistema de tutorial pedagógico e interactivo.
 * Gestiona:
 * 1. Máscara de foco (Spotlight Cutout) con Phaser Graphics que oscurece la pantalla
 *    y permite interacción exclusivamente en el área activa sin capturar clics indebidos.
 * 2. Indicador / Flecha animada (Pointer) que señala con tween oscilante el objetivo.
 * 3. Globo de diálogo estilizado de Kiwii (Kiwii Dialogue Bubble) con avatar, badge y textos cálidos.
 * 4. Botón accesible "Skip Tutorial" y Modal de Confirmación de Salto.
 * 5. Profundidad fija depth: 25000 y soporte dinámico para I18n.
 * 
 * Kiwipaw Bakehouse - Cook Gatos Kiwii
 */

import I18nManager from '../services/I18nManager.js';
import SoundManager from '../SoundManager.js';

export default class TutorialOverlay {
  /**
   * Crea el componente de overlay para el tutorial.
   * @param {Phaser.Scene} scene - Escena de Phaser (GameScene)
   * @param {Object} [options] - Opciones de configuración
   * @param {number} [options.depth=25000] - Profundidad en el árbol de renderizado
   * @param {Function} [options.onSkip] - Callback al confirmar salto del tutorial
   * @param {Function} [options.onNext] - Callback al presionar botón Siguiente en diálogos
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.depth = options.depth !== undefined ? options.depth : 25000;
    this.onSkip = options.onSkip || null;
    this.onNext = options.onNext || null;

    this.screenWidth = scene?.cameras?.main?.width || 1920;
    this.screenHeight = scene?.cameras?.main?.height || 1080;

    // Estado interno
    this.isVisible = false;
    this.currentSpotlight = null; // { x, y, width, height, radius, isError }
    this.currentStepConfig = null;
    this.isSkipModalOpen = false;

    // Sistema de eventos interno para comunicación desacoplada
    this.listeners = new Map();
    this.events = this;

    // Si la escena tiene add.container (entorno Phaser)
    if (scene && scene.add && typeof scene.add.container === 'function') {
      this.container = scene.add.container(0, 0).setDepth(this.depth);

      // Inicializar sub-componentes gráficos
      this._createBackgroundAndBlockers();
      this._createSpotlightHighlight();
      this._createPointer();
      this._createDialogueBubble();
      this._createSkipButton();
      this._createSkipModal();

      // Oculto por defecto hasta llamar a show() o setStep()
      this.container.setVisible(false);
    }
  }

  // =========================================================================
  // 0. SISTEMA DE EVENTOS INTERNO
  // =========================================================================

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
    return this;
  }

  off(event, fn) {
    if (this.listeners.has(event)) {
      this.listeners.set(event, this.listeners.get(event).filter(cb => cb !== fn));
    }
    return this;
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(...args);
        } catch {
          // Proteger contra errores de callbacks externos
        }
      });
    }
    return this;
  }

  removeAllListeners() {
    this.listeners.clear();
    return this;
  }

  // =========================================================================
  // 1. CONSTRUCCIÓN DE COMPONENTES VISUALES
  // =========================================================================

  /**
   * Crea la capa gráfica oscura y los 4 bloqueadores de clic alrededor del spotlight.
   * @private
   */
  _createBackgroundAndBlockers() {
    // 1. Gráfico vectorial para dibujar la oscuridad con hueco recortado
    this.overlayGraphics = this.scene.add.graphics();
    this.container.add(this.overlayGraphics);

    // 2. Bloqueador a pantalla completa (usado cuando NO hay spotlight o durante modales)
    this.fullBlocker = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000,
      0
    );
    if (typeof this.fullBlocker.setInteractive === 'function') {
      if (typeof Phaser !== 'undefined' && Phaser?.Geom?.Rectangle) {
        this.fullBlocker.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.screenWidth, this.screenHeight), Phaser.Geom.Rectangle.Contains);
      } else {
        this.fullBlocker.setInteractive({ useHandCursor: false });
      }
    }
    this.container.add(this.fullBlocker);

    // 3. Cuatro bloqueadores de hit-testing perimetrales cuando hay spotlight activo:
    //    Top, Bottom, Left, Right (inicializados seguros en 1x1, ocultos y sin interactive preventivo)
    this.blockerTop = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setVisible(false);
    this.blockerBottom = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setVisible(false);
    this.blockerLeft = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setVisible(false);
    this.blockerRight = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setVisible(false);

    [this.blockerTop, this.blockerBottom, this.blockerLeft, this.blockerRight].forEach(blocker => {
      this.container.add(blocker);
    });
  }

  /**
   * Crea el borde brillante y pulsante del spotlight.
   * @private
   */
  _createSpotlightHighlight() {
    this.spotlightGlow = this.scene.add.graphics();
    this.container.add(this.spotlightGlow);

    if (this.scene.tweens && typeof this.scene.tweens.add === 'function') {
      // Tween de pulsación suave para la línea de foco
      this.glowTween = this.scene.tweens.add({
        targets: this.spotlightGlow,
        alpha: { from: 0.6, to: 1.0 },
        scaleX: { from: 0.99, to: 1.01 },
        scaleY: { from: 0.99, to: 1.01 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Crea la flecha/garrita animada indicadora (Pointer).
   * @private
   */
  _createPointer() {
    this.pointerContainer = this.scene.add.container(0, 0);
    this.pointerContainer.setVisible(false);

    // Gráfico de flecha estilizada en alta definición
    this.pointerGfx = this.scene.add.graphics();
    this._drawPointerArrow(this.pointerGfx, 'down');
    this.pointerContainer.add(this.pointerGfx);

    this.container.add(this.pointerContainer);
    this.pointerTween = null;
  }

  /**
   * Dibuja una flecha gráfica estilizada según la dirección usando primitivas de Graphics.
   * @private
   */
  _drawPointerArrow(gfx, direction = 'down') {
    if (!gfx || typeof gfx.clear !== 'function') return;
    gfx.clear();

    const arrowColor = 0xffb703; // Dorado cálido de alta visibilidad
    const strokeColor = 0x582f0e; // Cacao profundo
    const highlightColor = 0xffffff;

    gfx.lineStyle(5, strokeColor, 1.0);
    gfx.fillStyle(arrowColor, 1.0);

    if (typeof gfx.beginPath === 'function') {
      gfx.beginPath();
      if (direction === 'down') {
        gfx.moveTo(0, 30);
        gfx.lineTo(-24, -2);
        gfx.lineTo(-10, -2);
        gfx.lineTo(-10, -32);
        gfx.lineTo(10, -32);
        gfx.lineTo(10, -2);
        gfx.lineTo(24, -2);
      } else if (direction === 'up') {
        gfx.moveTo(0, -30);
        gfx.lineTo(-24, 2);
        gfx.lineTo(-10, 2);
        gfx.lineTo(-10, 32);
        gfx.lineTo(10, 32);
        gfx.lineTo(10, 2);
        gfx.lineTo(24, 2);
      } else if (direction === 'left') {
        gfx.moveTo(-30, 0);
        gfx.lineTo(2, -24);
        gfx.lineTo(2, -10);
        gfx.lineTo(32, -10);
        gfx.lineTo(32, 10);
        gfx.lineTo(2, 10);
        gfx.lineTo(2, 24);
      } else if (direction === 'right') {
        gfx.moveTo(30, 0);
        gfx.lineTo(-2, -24);
        gfx.lineTo(-2, -10);
        gfx.lineTo(-32, -10);
        gfx.lineTo(-32, 10);
        gfx.lineTo(-2, 10);
        gfx.lineTo(-2, 24);
      }
      gfx.closePath();
      if (typeof gfx.fillPath === 'function') gfx.fillPath();
      if (typeof gfx.strokePath === 'function') gfx.strokePath();

      if (direction === 'down' && typeof gfx.fillRoundedRect === 'function') {
        gfx.fillStyle(highlightColor, 0.4);
        gfx.fillRoundedRect(-6, -28, 12, 14, 3);
      }
    }
  }

  /**
   * Crea el globo de diálogo estilizado de Kiwii (Kiwii Dialogue Bubble).
   * @private
   */
  _createDialogueBubble() {
    this.bubbleContainer = this.scene.add.container(this.screenWidth / 2, 860);

    this.bubbleW = 1040;
    this.minBubbleH = 175;
    this.bubbleH = 175;
    this.bubbleHeight = 175;
    this.bubbleRadius = 24;
    this.bubblePaddingBottom = 24;
    this.bubblePaddingTop = 52;

    const halfW = this.bubbleW / 2;
    const halfH = this.bubbleH / 2;

    // 1. Sombra suave proyectada
    this.bubbleShadow = this.scene.add.graphics();
    this.bubbleContainer.add(this.bubbleShadow);

    // 2. Fondo crema acogedor con borde de cacao
    this.bubbleBg = this.scene.add.graphics();
    this.bubbleContainer.add(this.bubbleBg);

    // 3. Avatar de Kiwii (Badge circular en el lateral izquierdo)
    const avatarX = -halfW + 85;
    const avatarY = 0;

    this.avatarGfx = this.scene.add.graphics();
    this.bubbleContainer.add(this.avatarGfx);

    // Sprite de chef_cat si existe
    if (this.scene.textures && typeof this.scene.textures.exists === 'function' && this.scene.textures.exists('chef_cat')) {
      this.avatarSprite = this.scene.add.image(avatarX, avatarY - 4, 'chef_cat')
        .setDisplaySize(96, 96)
        .setOrigin(0.5);
      this.bubbleContainer.add(this.avatarSprite);
    }

    // 4. Etiqueta / Nombre del Mentor: "🐾 Kiwii (Mentor)"
    const tagX = -halfW + 160;
    const tagY = -halfH + 24;

    this.nameTagGfx = this.scene.add.graphics();
    this.bubbleContainer.add(this.nameTagGfx);

    const i18n = I18nManager.getInstance();
    const mentorName = i18n.t('tutorial.mentorName') || 'Kiwii';
    const mentorRole = i18n.t('tutorial.mentorRole') || 'Mentor';
    this.nameTagText = this.scene.add.text(tagX + 105, tagY + 1, `🐾 ${mentorName} (${mentorRole})`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fff1e6'
    }).setOrigin(0.5);
    this.bubbleContainer.add(this.nameTagText);

    // 5. Texto del Diálogo con word-wrap
    const textX = -halfW + 160;
    const textY = -halfH + 52;
    const textWidth = this.bubbleW - 340; // 700 con botón por defecto

    this.dialogueText = this.scene.add.text(textX, textY, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '22px',
      color: '#432818',
      fontWeight: '600',
      lineSpacing: 5,
      wordWrap: { width: textWidth }
    }).setOrigin(0, 0);
    this.bubbleContainer.add(this.dialogueText);

    // 6. Botón de Acción / Siguiente
    const btnX = halfW - 100;
    const btnY = 0;
    const btnW = 160;
    const btnH = 58;

    this.actionBtnContainer = this.scene.add.container(btnX, btnY);

    this.actionBtnBg = this.scene.add.graphics();
    this.actionBtnBg.fillStyle(0x2d6a4f, 1.0);
    this.actionBtnBg.lineStyle(3, 0xffffff, 1.0);
    this.actionBtnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    this.actionBtnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    this.actionBtnContainer.add(this.actionBtnBg);

    const nextBtnLabel = i18n.t('tutorial.nextButton') || 'NEXT ➡️';
    this.actionBtnText = this.scene.add.text(0, 0, nextBtnLabel, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.actionBtnContainer.add(this.actionBtnText);

    this.actionBtnZone = this.scene.add.rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.actionBtnContainer.add(this.actionBtnZone);

    this.actionBtnZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.emit('next');
      if (this.onNext) this.onNext();
    });

    this.actionBtnZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      this.actionBtnContainer.setScale(1.06);
    });

    this.actionBtnZone.on('pointerout', () => {
      this.actionBtnContainer.setScale(1.0);
    });

    this.bubbleContainer.add(this.actionBtnContainer);
    this.container.add(this.bubbleContainer);

    // Render inicial con fondo y posiciones calibradas
    this._updateBubbleLayout(false);
  }

  /**
   * Estima la altura en píxeles que ocupará el texto cuando el entorno no provee métricas DOM canvas.
   * @private
   */
  _estimateTextHeight(text, wrapWidth = 700) {
    if (!text || typeof text !== 'string') return 28;
    const lines = text.split('\n');
    let totalLines = 0;
    // ~12.5px promedio por carácter para tipografía Outfit 22px semi-bold
    const charsPerLine = Math.max(20, Math.floor(wrapWidth / 12.5));
    for (const line of lines) {
      if (line.length === 0) {
        totalLines += 1;
      } else {
        totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
      }
    }
    const lineHeight = 27; // 22px fontSize + 5px lineSpacing
    return totalLines * lineHeight;
  }

  /**
   * Recalcula la altura dinámica del globo de diálogo y redibuja fondos y elementos
   * garantizando que nunca haya desborde de texto ni se toque el borde de cacao (>= 24px padding inferior).
   * @private
   */
  _updateBubbleLayout(showNextBtn = false) {
    if (!this.bubbleContainer) return;

    const availableTextWidth = showNextBtn
      ? (this.bubbleW - 340)  // 700px con botón Siguiente visible
      : (this.bubbleW - 200); // 840px con ancho holgado cuando no hay botón

    if (this.dialogueText) {
      if (typeof this.dialogueText.setWordWrapWidth === 'function') {
        this.dialogueText.setWordWrapWidth(availableTextWidth);
      } else if (this.dialogueText.style) {
        if (!this.dialogueText.style.wordWrap) {
          this.dialogueText.style.wordWrap = { width: availableTextWidth };
        } else {
          this.dialogueText.style.wordWrap.width = availableTextWidth;
        }
      }
    }

    const rawHeight = (this.dialogueText && typeof this.dialogueText.height === 'number' && this.dialogueText.height > 0)
      ? this.dialogueText.height
      : 0;
    const estimatedHeight = this._estimateTextHeight(this.dialogueText?.text || '', availableTextWidth);
    const textHeight = Math.max(rawHeight, estimatedHeight);

    // Altura mínima segura (175px) o altura adaptativa con 52px top y 24px bottom padding (>=20px garantizado)
    const requiredBubbleH = Math.ceil(this.bubblePaddingTop + textHeight + this.bubblePaddingBottom);
    this.bubbleH = Math.max(this.minBubbleH, requiredBubbleH);
    this.bubbleHeight = this.bubbleH;

    const halfW = this.bubbleW / 2;
    const halfH = this.bubbleH / 2;
    const radius = this.bubbleRadius;

    // 1. Redibujar sombra suave
    if (this.bubbleShadow && typeof this.bubbleShadow.clear === 'function') {
      this.bubbleShadow.clear();
      this.bubbleShadow.fillStyle(0x000000, 0.4);
      this.bubbleShadow.fillRoundedRect(-halfW + 6, -halfH + 8, this.bubbleW, this.bubbleH, radius);
    }

    // 2. Redibujar fondo crema acogedor con borde de cacao
    if (this.bubbleBg && typeof this.bubbleBg.clear === 'function') {
      this.bubbleBg.clear();
      this.bubbleBg.fillStyle(0xfffaeb, 0.98);
      this.bubbleBg.lineStyle(6, 0x582f0e, 1.0);
      this.bubbleBg.fillRoundedRect(-halfW, -halfH, this.bubbleW, this.bubbleH, radius);
      this.bubbleBg.strokeRoundedRect(-halfW, -halfH, this.bubbleW, this.bubbleH, radius);
    }

    // 3. Avatar de Kiwii
    const avatarX = -halfW + 85;
    const avatarY = 0;
    if (this.avatarGfx && typeof this.avatarGfx.clear === 'function') {
      this.avatarGfx.clear();
      this.avatarGfx.fillStyle(0xffd6ba, 1.0);
      this.avatarGfx.lineStyle(4, 0x7f5539, 1.0);
      this.avatarGfx.fillCircle(avatarX, avatarY, 52);
      this.avatarGfx.strokeCircle(avatarX, avatarY, 52);
    }
    if (this.avatarSprite && typeof this.avatarSprite.setPosition === 'function') {
      this.avatarSprite.setPosition(avatarX, avatarY - 4);
    }

    // 4. Etiqueta / Nombre del Mentor
    const tagX = -halfW + 160;
    const tagY = -halfH + 24;
    if (this.nameTagGfx && typeof this.nameTagGfx.clear === 'function') {
      this.nameTagGfx.clear();
      this.nameTagGfx.fillStyle(0x7f5539, 1.0);
      this.nameTagGfx.fillRoundedRect(tagX, tagY - 14, 210, 30, 8);
    }
    if (this.nameTagText && typeof this.nameTagText.setPosition === 'function') {
      this.nameTagText.setPosition(tagX + 105, tagY + 1);
    }

    // 5. Posicionar texto de diálogo
    const textX = -halfW + 160;
    const textY = -halfH + 52;
    if (this.dialogueText && typeof this.dialogueText.setPosition === 'function') {
      this.dialogueText.setPosition(textX, textY);
    }

    // 6. Posicionar botón de acción
    const btnX = halfW - 100;
    const btnY = 0;
    if (this.actionBtnContainer && typeof this.actionBtnContainer.setPosition === 'function') {
      this.actionBtnContainer.setPosition(btnX, btnY);
    }
  }

  /**
   * Crea el botón de "Skip Tutorial" accesible en la esquina superior derecha.
   * @private
   */
  _createSkipButton() {
    const btnW = 175;
    const btnH = 50;
    const btnX = this.screenWidth - 115;
    const btnY = 55;

    this.skipBtnContainer = this.scene.add.container(btnX, btnY);

    this.skipBtnShadow = this.scene.add.graphics();
    this.skipBtnShadow.fillStyle(0x000000, 0.35);
    this.skipBtnShadow.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 3, btnW, btnH, 14);
    this.skipBtnContainer.add(this.skipBtnShadow);

    this.skipBtnBg = this.scene.add.graphics();
    this.skipBtnBg.fillStyle(0x582f0e, 0.95);
    this.skipBtnBg.lineStyle(2.5, 0xffffff, 0.9);
    this.skipBtnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
    this.skipBtnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
    this.skipBtnContainer.add(this.skipBtnBg);

    const i18n = I18nManager.getInstance();
    this.skipBtnText = this.scene.add.text(0, 0, i18n.t('tutorial.skipButton') || 'SKIP ⏭️', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.skipBtnContainer.add(this.skipBtnText);

    this.skipBtnZone = this.scene.add.rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.skipBtnContainer.add(this.skipBtnZone);

    this.skipBtnZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.showSkipModal();
    });

    this.skipBtnZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      this.skipBtnContainer.setScale(1.05);
    });

    this.skipBtnZone.on('pointerout', () => {
      this.skipBtnContainer.setScale(1.0);
    });

    this.container.add(this.skipBtnContainer);
  }

  /**
   * Crea el modal de confirmación para saltar el tutorial.
   * @private
   */
  _createSkipModal() {
    this.skipModalContainer = this.scene.add.container(0, 0);
    this.skipModalContainer.setVisible(false);

    const modalOverlay = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000,
      0.65
    ).setInteractive({ useHandCursor: false });
    this.skipModalContainer.add(modalOverlay);

    const cardW = 680;
    const cardH = 380;
    const cardX = this.screenWidth / 2;
    const cardY = this.screenHeight / 2;

    const cardShadow = this.scene.add.graphics();
    cardShadow.fillStyle(0x000000, 0.45);
    cardShadow.fillRoundedRect(cardX - cardW / 2 + 6, cardY - cardH / 2 + 8, cardW, cardH, 28);
    this.skipModalContainer.add(cardShadow);

    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(0xfffaeb, 1.0);
    cardBg.lineStyle(6, 0x582f0e, 1.0);
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 28);
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 28);
    this.skipModalContainer.add(cardBg);

    const i18n = I18nManager.getInstance();

    this.skipModalTitle = this.scene.add.text(cardX, cardY - 120, i18n.t('tutorial.skipModal.title'), {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#582f0e'
    }).setOrigin(0.5);
    this.skipModalContainer.add(this.skipModalTitle);

    this.skipModalDesc = this.scene.add.text(
      cardX,
      cardY - 30,
      i18n.t('tutorial.skipModal.description'),
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '22px',
        color: '#7f5539',
        fontWeight: '600',
        align: 'center',
        wordWrap: { width: cardW - 80 }
      }
    ).setOrigin(0.5);
    this.skipModalContainer.add(this.skipModalDesc);

    const btnW = 240;
    const btnH = 64;
    const btnGap = 40;
    const cancelX = cardX - btnW / 2 - btnGap / 2;
    const confirmX = cardX + btnW / 2 + btnGap / 2;
    const buttonsY = cardY + 110;

    // 1. Cancelar
    this.cancelBtnContainer = this.scene.add.container(cancelX, buttonsY);
    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(0x2d6a4f, 1.0);
    cancelBg.lineStyle(3, 0xffffff, 1.0);
    cancelBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 18);
    cancelBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 18);
    this.cancelBtnContainer.add(cancelBg);

    this.cancelBtnText = this.scene.add.text(0, 0, i18n.t('tutorial.skipModal.cancel'), {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.cancelBtnContainer.add(this.cancelBtnText);

    const cancelZone = this.scene.add.rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.cancelBtnContainer.add(cancelZone);

    cancelZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.hideSkipModal();
      this.emit('skip_cancel');
    });
    cancelZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      this.cancelBtnContainer.setScale(1.05);
    });
    cancelZone.on('pointerout', () => {
      this.cancelBtnContainer.setScale(1.0);
    });
    this.skipModalContainer.add(this.cancelBtnContainer);

    // 2. Confirmar
    this.confirmBtnContainer = this.scene.add.container(confirmX, buttonsY);
    const confirmBg = this.scene.add.graphics();
    confirmBg.fillStyle(0xd90429, 1.0);
    confirmBg.lineStyle(3, 0xffffff, 1.0);
    confirmBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 18);
    confirmBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 18);
    this.confirmBtnContainer.add(confirmBg);

    this.confirmBtnText = this.scene.add.text(0, 0, i18n.t('tutorial.skipModal.confirm'), {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.confirmBtnContainer.add(this.confirmBtnText);

    const confirmZone = this.scene.add.rectangle(0, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.confirmBtnContainer.add(confirmZone);

    confirmZone.on('pointerdown', () => {
      SoundManager.getInstance().playUiTap();
      this.hideSkipModal();
      this.emit('skip_confirm');
      if (this.onSkip) this.onSkip();
    });
    confirmZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      this.confirmBtnContainer.setScale(1.05);
    });
    confirmZone.on('pointerout', () => {
      this.confirmBtnContainer.setScale(1.0);
    });
    this.skipModalContainer.add(this.confirmBtnContainer);

    this.container.add(this.skipModalContainer);
  }

  // =========================================================================
  // 2. GESTIÓN DEL FOCO (SPOTLIGHT CUTOUT) & HIT TESTING
  // =========================================================================

  /**
   * Configura el área activa iluminada del spotlight.
   */
  setSpotlight(bounds) {
    if (!bounds || bounds.x === undefined || bounds.y === undefined) {
      this.clearSpotlight();
      return;
    }

    const {
      x,
      y,
      width = 140,
      height = 140,
      radius = 20,
      isErrorHighlight = false
    } = bounds;

    this.currentSpotlight = { x, y, width, height, radius, isError: isErrorHighlight };

    if (!this.overlayGraphics) return;

    const halfW = width / 2;
    const halfH = height / 2;
    const left = Math.max(0, x - halfW);
    const right = Math.min(this.screenWidth, x + halfW);
    const top = Math.max(0, y - halfH);
    const bottom = Math.min(this.screenHeight, y + halfH);

    // 1. Desactivar el bloqueador a pantalla completa
    if (this.fullBlocker) {
      if (typeof this.fullBlocker.disableInteractive === 'function') {
        this.fullBlocker.disableInteractive();
      }
      if (typeof this.fullBlocker.setVisible === 'function') {
        this.fullBlocker.setVisible(false);
      }
    }

    // 2. Reposicionar y redimensionar los 4 bloqueadores perimetrales (sin interceptar puntero durante drag/interacción)
    const updateBlocker = (blocker, bx, by, bw, bh) => {
      if (!blocker) return;
      if (bw > 0 && bh > 0) {
        if (typeof blocker.setPosition === 'function') blocker.setPosition(bx, by);
        if (typeof blocker.setSize === 'function') blocker.setSize(bw, bh);
        if (typeof blocker.setVisible === 'function') blocker.setVisible(true);
        if (typeof blocker.disableInteractive === 'function') blocker.disableInteractive();
      } else {
        if (typeof blocker.setVisible === 'function') blocker.setVisible(false);
        if (typeof blocker.disableInteractive === 'function') blocker.disableInteractive();
      }
    };

    updateBlocker(this.blockerTop, 0, 0, this.screenWidth, top);
    updateBlocker(this.blockerBottom, 0, bottom, this.screenWidth, Math.max(0, this.screenHeight - bottom));
    updateBlocker(this.blockerLeft, 0, top, left, Math.max(0, bottom - top));
    updateBlocker(this.blockerRight, right, top, Math.max(0, this.screenWidth - right), Math.max(0, bottom - top));

    // 3. Dibujar la máscara oscura alrededor del hueco (alpha ~0.72)
    this.overlayGraphics.clear();
    this.overlayGraphics.fillStyle(0x19100a, 0.72);

    if (top > 0) {
      this.overlayGraphics.fillRect(0, 0, this.screenWidth, top);
    }
    if (this.screenHeight - bottom > 0) {
      this.overlayGraphics.fillRect(0, bottom, this.screenWidth, this.screenHeight - bottom);
    }
    if (left > 0) {
      this.overlayGraphics.fillRect(0, top, left, bottom - top);
    }
    if (this.screenWidth - right > 0) {
      this.overlayGraphics.fillRect(right, top, this.screenWidth - right, bottom - top);
    }

    // 4. Dibujar anillo brillante alrededor del recorte
    const strokeColor = isErrorHighlight ? 0xd90429 : 0xffb703;
    const outerStrokeColor = isErrorHighlight ? 0xff4d6d : 0xffffff;

    if (this.spotlightGlow && typeof this.spotlightGlow.clear === 'function') {
      this.spotlightGlow.clear();
      this.spotlightGlow.setPosition(x, y);

      this.spotlightGlow.lineStyle(8, outerStrokeColor, 0.35);
      this.spotlightGlow.strokeRoundedRect(-halfW - 3, -halfH - 3, width + 6, height + 6, radius + 2);

      this.spotlightGlow.lineStyle(4, strokeColor, 1.0);
      this.spotlightGlow.strokeRoundedRect(-halfW, -halfH, width, height, radius);

      this.spotlightGlow.setVisible(true);
    }

    // 5. Ajustar automáticamente la posición del diálogo
    this._adjustDialoguePosition(y);
  }

  /**
   * Limpia el spotlight y vuelve al modo oscurecido general.
   */
  clearSpotlight() {
    this.currentSpotlight = null;

    [this.blockerTop, this.blockerBottom, this.blockerLeft, this.blockerRight].forEach(b => {
      if (!b) return;
      if (typeof b.disableInteractive === 'function') b.disableInteractive();
      if (typeof b.setVisible === 'function') b.setVisible(false);
    });

    if (this.fullBlocker) {
      if (typeof this.fullBlocker.setVisible === 'function') {
        this.fullBlocker.setVisible(true);
      }
      if (typeof this.fullBlocker.setInteractive === 'function') {
        if (typeof Phaser !== 'undefined' && Phaser?.Geom?.Rectangle) {
          this.fullBlocker.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.screenWidth, this.screenHeight), Phaser.Geom.Rectangle.Contains);
        } else {
          this.fullBlocker.setInteractive({ useHandCursor: false });
        }
      }
    }

    if (this.overlayGraphics && typeof this.overlayGraphics.clear === 'function') {
      this.overlayGraphics.clear();
      this.overlayGraphics.fillStyle(0x19100a, 0.72);
      this.overlayGraphics.fillRect(0, 0, this.screenWidth, this.screenHeight);
    }

    if (this.spotlightGlow && typeof this.spotlightGlow.clear === 'function') {
      this.spotlightGlow.clear();
      this.spotlightGlow.setVisible(false);
    }

    if (this.bubbleContainer && typeof this.bubbleContainer.setPosition === 'function') {
      const bubbleY = this.currentStepConfig?.bubblePosition === 'top' ? 140 : 860;
      this.bubbleContainer.setPosition(this.screenWidth / 2, bubbleY);
    }
  }

  /**
   * Ajusta la posición del diálogo para que no tape el elemento interactivo ni la mesa de trabajo.
   * @private
   */
  _adjustDialoguePosition(targetY) {
    if (!this.bubbleContainer || typeof this.bubbleContainer.setPosition !== 'function') return;

    if (this.currentStepConfig?.bubblePosition) {
      const pos = this.currentStepConfig.bubblePosition;
      const bubbleY = pos === 'top' ? 140 : 860;
      this.bubbleContainer.setPosition(this.screenWidth / 2, bubbleY);
      return;
    }

    if (targetY !== undefined && targetY > 520) {
      this.bubbleContainer.setPosition(this.screenWidth / 2, 140);
    } else {
      this.bubbleContainer.setPosition(this.screenWidth / 2, 860);
    }
  }

  // =========================================================================
  // 3. GESTIÓN DEL PUNTERO ANIMADO (POINTER)
  // =========================================================================

  /**
   * Muestra y anima el puntero indicando una coordenada en pantalla.
   */
  setPointer(targetX, targetY, direction = 'auto', offsetDistance = 70) {
    if (targetX === undefined || targetY === undefined) {
      this.clearPointer();
      return;
    }

    let actualDirection = direction;
    if (actualDirection === 'auto') {
      actualDirection = targetY > 500 ? 'down' : 'up';
    }

    this._drawPointerArrow(this.pointerGfx, actualDirection);

    let startX = targetX;
    let startY = targetY;
    let deltaX = 0;
    let deltaY = 0;

    if (actualDirection === 'down') {
      startY = targetY - offsetDistance;
      deltaY = -14;
    } else if (actualDirection === 'up') {
      startY = targetY + offsetDistance;
      deltaY = 14;
    } else if (actualDirection === 'left') {
      startX = targetX + offsetDistance;
      deltaX = 14;
    } else if (actualDirection === 'right') {
      startX = targetX - offsetDistance;
      deltaX = -14;
    }

    if (this.pointerContainer && typeof this.pointerContainer.setPosition === 'function') {
      this.pointerContainer.setPosition(startX, startY);
      this.pointerContainer.setVisible(true);

      if (this.pointerTween) {
        this.pointerTween.remove();
        this.pointerTween = null;
      }

      if (this.scene && this.scene.tweens && typeof this.scene.tweens.add === 'function') {
        this.pointerTween = this.scene.tweens.add({
          targets: this.pointerContainer,
          x: startX + deltaX,
          y: startY + deltaY,
          duration: 550,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  /**
   * Oculta el puntero animado.
   */
  clearPointer() {
    if (this.pointerTween) {
      this.pointerTween.remove();
      this.pointerTween = null;
    }
    if (this.pointerContainer && typeof this.pointerContainer.setVisible === 'function') {
      this.pointerContainer.setVisible(false);
    }
  }

  // =========================================================================
  // 4. CONFIGURACIÓN DEL DIÁLOGO & PASOS DEL TUTORIAL
  // =========================================================================

  /**
   * Configura un paso completo del tutorial (diálogo, spotlight y puntero).
   */
  setStep(stepConfig) {
    if (!stepConfig) return;
    this.currentStepConfig = stepConfig;

    const i18n = I18nManager.getInstance();

    let message = stepConfig.text || '';
    if (stepConfig.i18nKey) {
      message = i18n.t(stepConfig.i18nKey, stepConfig.textParams || {});
    } else if (i18n.hasKey(message)) {
      message = i18n.t(message, stepConfig.textParams || {});
    }

    const showNextBtn = stepConfig.showNextBtn !== undefined
      ? Boolean(stepConfig.showNextBtn)
      : stepConfig.allowedAction === 'DIALOG_ACK';

    const nextBtnText = stepConfig.nextBtnText || (stepConfig.id === 'step_tutorial_complete' ? (i18n.t('tutorial.continueButton') || 'CONTINUE 🐾') : undefined);

    this.setDialogue(message, {
      showNextBtn,
      nextBtnText,
      bubblePosition: stepConfig.bubblePosition
    });

    const target = stepConfig.targetCoords || stepConfig.target;
    if (target && target.x !== undefined && target.y !== undefined) {
      this.setSpotlight(target);
      this.setPointer(
        target.x,
        target.y,
        stepConfig.pointerDirection || 'auto',
        stepConfig.pointerOffset || (Math.max(target.width || 140, target.height || 140) / 2 + 35)
      );
    } else {
      this.clearSpotlight();
      this.clearPointer();
    }

    this.show();
  }

  /**
   * Actualiza el contenido, disposición adaptativa y visibilidad del diálogo de Kiwii.
   */
  setDialogue(text, options = {}) {
    const i18n = I18nManager.getInstance();

    if (this.dialogueText && typeof this.dialogueText.setText === 'function') {
      this.dialogueText.setText(text || '');
    }

    const showNext = Boolean(options.showNextBtn);
    if (this.actionBtnContainer && typeof this.actionBtnContainer.setVisible === 'function') {
      this.actionBtnContainer.setVisible(showNext);
    }

    if (showNext && this.actionBtnText && typeof this.actionBtnText.setText === 'function') {
      const btnLabel = options.nextBtnText || i18n.t('tutorial.nextButton') || 'NEXT ➡️';
      this.actionBtnText.setText(btnLabel);
    }

    // Recalcular layout y altura adaptativa del diálogo
    this._updateBubbleLayout(showNext);

    if (options.bubblePosition === 'top' && this.bubbleContainer && typeof this.bubbleContainer.setPosition === 'function') {
      this.bubbleContainer.setPosition(this.screenWidth / 2, 140);
    } else if (options.bubblePosition === 'bottom' && this.bubbleContainer && typeof this.bubbleContainer.setPosition === 'function') {
      this.bubbleContainer.setPosition(this.screenWidth / 2, 860);
    }

    if (this.bubbleContainer && typeof this.bubbleContainer.setScale === 'function' && this.scene && this.scene.tweens && typeof this.scene.tweens.add === 'function') {
      this.bubbleContainer.setScale(0.96);
      this.bubbleContainer.setAlpha(0);
      this.scene.tweens.add({
        targets: this.bubbleContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        duration: 200,
        ease: 'Back.easeOut'
      });
    }
  }

  // =========================================================================
  // 5. MODAL DE SALTO DEL TUTORIAL
  // =========================================================================

  /**
   * Muestra el modal de confirmación para saltar el tutorial.
   */
  showSkipModal() {
    this.isSkipModalOpen = true;
    if (this.skipModalContainer && typeof this.skipModalContainer.setVisible === 'function') {
      this.skipModalContainer.setVisible(true);
      if (this.scene && this.scene.tweens && typeof this.scene.tweens.add === 'function') {
        this.skipModalContainer.setScale(0.94);
        this.skipModalContainer.setAlpha(0);

        this.scene.tweens.add({
          targets: this.skipModalContainer,
          scaleX: 1.0,
          scaleY: 1.0,
          alpha: 1.0,
          duration: 220,
          ease: 'Back.easeOut'
        });
      }
    }
  }

  /**
   * Oculta el modal de confirmación.
   */
  hideSkipModal() {
    this.isSkipModalOpen = false;
    if (this.skipModalContainer && typeof this.skipModalContainer.setVisible === 'function') {
      this.skipModalContainer.setVisible(false);
    }
  }

  // =========================================================================
  // 6. CICLO DE VIDA, VISIBILIDAD & I18N
  // =========================================================================

  /**
   * Muestra el overlay en pantalla.
   */
  show() {
    this.isVisible = true;
    if (this.container && typeof this.container.setVisible === 'function') {
      this.container.setVisible(true);
    }
  }

  /**
   * Oculta el overlay.
   */
  hide() {
    this.isVisible = false;
    if (this.container && typeof this.container.setVisible === 'function') {
      this.container.setVisible(false);
    }
    this.clearPointer();
    this.hideSkipModal();
  }

  /**
   * Actualiza todos los textos ante un cambio de idioma reactivo (I18n).
   */
  refreshI18n() {
    const i18n = I18nManager.getInstance();

    if (this.nameTagText && typeof this.nameTagText.setText === 'function') {
      this.nameTagText.setText(`🐾 ${i18n.t('tutorial.mentorName') || 'Kiwii'} (${i18n.t('tutorial.mentorRole') || 'Mentor'})`);
    }

    if (this.skipBtnText && typeof this.skipBtnText.setText === 'function') {
      this.skipBtnText.setText(i18n.t('tutorial.skipButton') || 'SKIP ⏭️');
    }

    if (this.skipModalTitle && typeof this.skipModalTitle.setText === 'function') {
      this.skipModalTitle.setText(i18n.t('tutorial.skipModal.title') || 'Skip Tutorial?');
    }

    if (this.skipModalDesc && typeof this.skipModalDesc.setText === 'function') {
      this.skipModalDesc.setText(i18n.t('tutorial.skipModal.description') || '');
    }

    if (this.cancelBtnText && typeof this.cancelBtnText.setText === 'function') {
      this.cancelBtnText.setText(i18n.t('tutorial.skipModal.cancel') || 'KEEP PLAYING');
    }

    if (this.confirmBtnText && typeof this.confirmBtnText.setText === 'function') {
      this.confirmBtnText.setText(i18n.t('tutorial.skipModal.confirm') || 'YES, SKIP');
    }

    if (this.currentStepConfig) {
      if (this.currentStepConfig.i18nKey && this.dialogueText && typeof this.dialogueText.setText === 'function') {
        this.dialogueText.setText(i18n.t(this.currentStepConfig.i18nKey, this.currentStepConfig.textParams || {}));
      }
      if (this.currentStepConfig.showNextBtn && this.actionBtnText && typeof this.actionBtnText.setText === 'function') {
        this.actionBtnText.setText(this.currentStepConfig.nextBtnText || i18n.t('tutorial.nextButton') || 'NEXT ➡️');
      }
      const showNext = Boolean(this.currentStepConfig.showNextBtn || this.currentStepConfig.allowedAction === 'DIALOG_ACK');
      this._updateBubbleLayout(showNext);
    }
  }

  /**
   * Destruye el componente y libera todos los recursos y tweens.
   */
  destroy() {
    if (this.glowTween && typeof this.glowTween.remove === 'function') {
      this.glowTween.remove();
      this.glowTween = null;
    }

    if (this.pointerTween && typeof this.pointerTween.remove === 'function') {
      this.pointerTween.remove();
      this.pointerTween = null;
    }

    this.removeAllListeners();
    this.events = null;

    if (this.container && typeof this.container.destroy === 'function') {
      this.container.destroy();
      this.container = null;
    }
  }
}
