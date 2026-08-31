import Phaser from 'phaser';
import SoundManager from '../game/SoundManager.js';
import I18nManager from '../game/services/I18nManager.js';
import SaveManager from '../game/services/SaveManager.js';
import { hasSufficientDough } from '../game/EconomyManager.js';
import PillSwitcher from '../game/PillSwitcher.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
    if (typeof window !== 'undefined') window.Phaser = Phaser;
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.unlockedShapes = safeData.unlockedShapes ? [...safeData.unlockedShapes] : ['star'];

    // Safe stock initialization for all categories including drinks
    const defaultStock = {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 2, milk: 2 }
    };

    const incomingStock = safeData.stock || {};
    this.stock = {
      dough: { ...defaultStock.dough, ...(incomingStock.dough || {}) },
      topping: { ...defaultStock.topping, ...(incomingStock.topping || {}) },
      drink: { ...defaultStock.drink, ...(incomingStock.drink || {}) }
    };

    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const i18n = I18nManager.getInstance();

    // Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffe5d9, 1); // Cozy soft peach background
    bgGraphics.fillRect(0, 0, width, height);

    // =========================================================================
    // ZONA 1: HEADER FIJO (y: 0 - 330)
    // =========================================================================
    this.titleText = this.add.text(width / 2, 84, i18n.t('shop.title'), {
      font: '68px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, 155, i18n.t('shop.subtitle', { day: this.day + 1 }), {
      font: '30px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '600'
    }).setOrigin(0.5);

    this.coinBalanceText = this.add.text(width / 2, 225, i18n.t('shop.availableCoins', { coins: this.coins }), {
      font: '45px "Outfit", sans-serif',
      fill: '#d48c47',
      fontWeight: '800'
    }).setOrigin(0.5);

    // Pill Switcher Dual [ EN | ES ] (Top-Right: x: width - 190, y: 85, depth: 100)
    this.pillSwitcher = new PillSwitcher(this, {
      x: width - 190,
      y: 85,
      width: 320,
      height: 82,
      depth: 100,
      onLanguageChange: () => {
        this.refreshLocalizedTexts();
      }
    });

    // Column Headers (Fixed at y = 295)
    const columns = {
      mold: { title: i18n.t('shop.columns.molds'), x: 272 },
      dough: { title: i18n.t('shop.columns.dough'), x: 731 },
      topping: { title: i18n.t('shop.columns.toppings'), x: 1191 },
      drink: { title: i18n.t('shop.columns.drinks'), x: 1650 }
    };

    this.columnHeaderTexts = [];
    Object.keys(columns).forEach(key => {
      const col = columns[key];
      const hText = this.add.text(col.x, 295, col.title, {
        font: '28px "Outfit", sans-serif',
        fill: '#7f5539',
        fontWeight: '800'
      }).setOrigin(0.5);
      this.columnHeaderTexts.push(hText);
    });

    // =========================================================================
    // ZONA 2: VIEWPORT SCROLLEABLE (y: 330 - 900)
    // =========================================================================
    this.viewportTop = 330;
    this.viewportHeight = 570;
    this.viewportBottom = this.viewportTop + this.viewportHeight; // 900

    // Scrollable container for cards
    this.shopScrollContainer = this.add.container(0, 0);

    // Geometry Mask for Canvas renderer fallback
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, this.viewportTop, width, this.viewportHeight);
    const mask = maskShape.createGeometryMask();
    this.shopScrollContainer.setMask(mask);

    // Buyable Items Configuration
    const items = [
      // MOLDES (Unlock)
      { type: 'mold', id: 'heart', key: 'moldHeart', cost: 60 },
      { type: 'mold', id: 'cat', key: 'moldCat', cost: 90 },
      { type: 'mold', id: 'fish', key: 'moldFish', cost: 120 },

      // MASAS (Consumables x5)
      { type: 'dough', id: 'classic', key: 'doughClassic', cost: 10 },
      { type: 'dough', id: 'chocolate', key: 'doughChocolate', cost: 15 },
      { type: 'dough', id: 'oat', key: 'doughOat', cost: 20 },

      // TOPPINGS (Consumables x5)
      { type: 'topping', id: 'sprinkles', key: 'toppingSprinkles', cost: 10 },
      { type: 'topping', id: 'choco', key: 'toppingChoco', cost: 15 },
      { type: 'topping', id: 'glazing', key: 'toppingGlazing', cost: 20 },

      // BEBIDAS (Consumables x5)
      { type: 'drink', id: 'coffee_beans', key: 'drinkCoffee', cost: 8 },
      { type: 'drink', id: 'milk', key: 'drinkMilk', cost: 5 }
    ];

    this.buyButtons = [];
    this.cardTextUpdaters = [];
    const colCounters = { mold: 0, dough: 0, topping: 0, drink: 0 };
    const cardW = 435;
    const cardH = 156;
    const cardRadius = 18;
    const startY = 450;
    const rowSpacing = 215;

    let maxCardBottom = 0;

    items.forEach((item) => {
      const colKey = item.type;
      const col = columns[colKey];
      const index = colCounters[colKey]++;

      const x = col.x;
      const y = startY + index * rowSpacing;

      if (y + cardH / 2 > maxCardBottom) {
        maxCardBottom = y + cardH / 2;
      }

      const itemName = i18n.t(`shop.items.${item.key}`);
      const itemDesc = i18n.t(`shop.units.${item.type === 'mold' ? 'permanent' : 'pack5'}`);

      // Card Background
      const card = this.add.graphics();
      card.fillStyle(0xfff1e6, 0.98);
      card.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, cardRadius);
      card.lineStyle(2, 0xddb892, 1);
      card.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, cardRadius);
      this.shopScrollContainer.add(card);

      // Carril 1: Ícono (Izquierda: centro x - 156)
      const iconCircle = this.add.graphics();
      iconCircle.fillStyle(0xffffff, 1);
      iconCircle.fillCircle(x - 156, y, 38);
      iconCircle.lineStyle(1.5, 0xddb892, 1);
      iconCircle.strokeCircle(x - 156, y, 38);
      this.shopScrollContainer.add(iconCircle);

      let iconTexture = '';
      let targetW = 56;
      let targetH = 56;

      if (item.type === 'mold') {
        iconTexture = 'shape_' + item.id;
      } else if (item.type === 'dough') {
        iconTexture = 'dough_' + item.id;
        targetW = 60;
        targetH = 60;
      } else if (item.type === 'topping') {
        iconTexture = 'topping_' + item.id;
      } else if (item.type === 'drink') {
        iconTexture = 'drink_' + item.id;
      }

      const itemIcon = this.add.image(x - 156, y, iconTexture);
      itemIcon.setDisplaySize(targetW, targetH);
      this.shopScrollContainer.add(itemIcon);

      // Carril 2: Información (Centro: origen x - 104, ancho 185px)
      const nameTxt = this.add.text(x - 104, y - 46, itemName, {
        font: 'bold 25px "Outfit"',
        fill: '#582f0e',
        wordWrap: { width: 185 }
      });
      if (item.key === 'doughChocolate') {
        nameTxt.setLetterSpacing(-0.25);
      }
      this.shopScrollContainer.add(nameTxt);

      const descTxt = this.add.text(x - 104, y - 14, itemDesc, {
        font: '600 19px "Outfit"',
        fill: '#8c5847',
        wordWrap: { width: 185 }
      });
      this.shopScrollContainer.add(descTxt);

      const statusTxt = this.add.text(x - 104, y + 16, this.getStatusString(item), {
        font: 'bold 19px "Outfit"',
        fill: '#7f5539',
        wordWrap: { width: 185 }
      });
      this.shopScrollContainer.add(statusTxt);

      // Updater for hot language switching
      const updateCardTexts = () => {
        nameTxt.setText(i18n.t(`shop.items.${item.key}`));
        descTxt.setText(i18n.t(`shop.units.${item.type === 'mold' ? 'permanent' : 'pack5'}`));
        statusTxt.setText(this.getStatusString(item));
      };
      this.cardTextUpdaters.push(updateCardTexts);

      // Carril 3: Botón de Compra (Derecha: x + 88, ancho 118, alto 54)
      const btnW = 118;
      const btnH = 54;
      const btnX = x + 88;
      const btnY = y - 27;

      const btnBg = this.add.graphics();
      this.shopScrollContainer.add(btnBg);

      const btnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, `🪙 ${item.cost}`, {
        font: '800 27px "Outfit"',
        fill: '#fff1e6'
      }).setOrigin(0.5);
      this.shopScrollContainer.add(btnText);

      const hitZone = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0);
      this.shopScrollContainer.add(hitZone);

      const updateButtonVisuals = () => {
        btnBg.clear();
        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);

        if (isBoughtMold) {
          btnBg.fillStyle(0x3a86c8, 1);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
          btnText.setFont('800 24px "Outfit"');
          btnText.setText(i18n.t('shop.units.ready'));
          btnText.setColor('#ffffff');
          hitZone.disableInteractive();
        } else if (this.coins < item.cost) {
          btnBg.fillStyle(0xadb5bd, 0.45);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
          btnText.setFont('800 27px "Outfit"');
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#ffffff');
          hitZone.setInteractive({ useHandCursor: false });
        } else {
          btnBg.fillStyle(0x7f5539, 1);
          btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
          btnText.setFont('800 27px "Outfit"');
          btnText.setText(`🪙 ${item.cost}`);
          btnText.setColor('#fff1e6');
          hitZone.setInteractive({ useHandCursor: true });
        }
        statusTxt.setText(this.getStatusString(item));
      };

      // Button interaction guarded by anti-false-click and viewport bounds
      hitZone.on('pointerup', (pointer) => {
        if (this.dragDistance > 8 || this.isDraggingScroll) {
          return;
        }
        if (pointer.y < this.viewportTop || pointer.y > this.viewportBottom) {
          return;
        }
        this.handleBuyItem(item, x, y, nameTxt, statusTxt, itemIcon, itemName);
      });

      hitZone.on('pointerover', (pointer) => {
        if (pointer.y < this.viewportTop || pointer.y > this.viewportBottom) return;
        SoundManager.getInstance().playUiHover();
        const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
        if (!isBoughtMold && this.coins >= item.cost) {
          btnBg.clear();
          btnBg.fillStyle(0x9c6644, 1);
          btnBg.fillRoundedRect(btnX - 2, btnY - 2, btnW + 4, btnH + 4, 12);
          btnText.setScale(1.04);
        }
      });

      hitZone.on('pointerout', () => {
        updateButtonVisuals();
        btnText.setScale(1);
      });

      this.buyButtons.push(updateButtonVisuals);
      updateButtonVisuals();
    });

    // Dynamic scroll limits calculation
    const bottomPadding = 32;
    const totalContentHeight = (maxCardBottom + bottomPadding) - this.viewportTop;
    this.maxScroll = Math.max(0, totalContentHeight - this.viewportHeight); // e.g. ~90px
    this.targetScroll = 0;
    this.currentScroll = 0;

    // =========================================================================
    // ZONA 3: FOOTER FIJO (y: 910 - 1080)
    // =========================================================================
    const startBtnW = 488;
    const startBtnH = 82;
    const startBtnX = width / 2 - startBtnW / 2;
    const startBtnY = 955;

    // Warning container for insufficient dough
    this.doughWarningContainer = this.add.container(width / 2, 924).setDepth(60).setVisible(false);
    const warnBg = this.add.graphics();
    warnBg.fillStyle(0xd90429, 0.95);
    warnBg.fillRoundedRect(-520, -18, 1040, 36, 10);
    this.doughWarningContainer.add(warnBg);

    this.warnText = this.add.text(0, 0, i18n.t('shop.warningDough'), {
      font: 'bold 20px "Outfit", sans-serif',
      fill: '#ffffff'
    }).setOrigin(0.5);
    this.doughWarningContainer.add(this.warnText);

    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0x38b000, 1); // Lush green
    startBtnBg.fillRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 14);

    this.startBtnText = this.add.text(width / 2, startBtnY + startBtnH / 2, i18n.t('shop.startNextDay'), {
      font: '28px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);

    const startZone = this.add.rectangle(width / 2, startBtnY + startBtnH / 2, startBtnW, startBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    startZone.on('pointerdown', () => {
      if (!hasSufficientDough(this.stock)) {
        SoundManager.getInstance().playUiDenied();
        this.showDoughWarning();
        return;
      }

      SoundManager.getInstance().playUiTap();

      // Autosave updated inventory and state before starting next day
      const nextDay = this.day + 1;
      SaveManager.getInstance().saveGame({
        day: nextDay,
        coins: this.coins,
        unlockedShapes: this.unlockedShapes,
        stock: this.stock,
        loanRemaining: this.loanRemaining
      });

      this.scene.start('GameScene', {
        day: nextDay,
        coins: this.coins,
        unlockedShapes: this.unlockedShapes,
        stock: this.stock,
        loanRemaining: this.loanRemaining
      });
    });

    startZone.on('pointerover', () => {
      SoundManager.getInstance().playUiHover();
      startBtnBg.clear();
      startBtnBg.fillStyle(0x4ad611, 1);
      startBtnBg.fillRoundedRect(startBtnX - 3, startBtnY - 2, startBtnW + 6, startBtnH + 4, 16);
      this.startBtnText.setScale(1.04);
    });

    startZone.on('pointerout', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0x38b000, 1);
      startBtnBg.fillRoundedRect(startBtnX, startBtnY, startBtnW, startBtnH, 14);
      this.startBtnText.setScale(1);
    });

    // Scrollbar Track and Thumb (Fixed UI layer, depth 50)
    this.scrollbarTrack = this.add.graphics().setDepth(50);
    this.scrollbarTrack.fillStyle(0xddb892, 0.35);
    this.scrollbarTrack.fillRoundedRect(1888, 345, 6, 540, 3);

    this.scrollbarThumb = this.add.graphics().setDepth(51);
    this.updateScrollbar();

    // =========================================================================
    // CAMERAS SETUP (Dual Camera: Main fixed HUD + Viewport hardware scissor)
    // =========================================================================
    this.fixedUIElements = [
      bgGraphics,
      this.titleText,
      this.subtitleText,
      this.coinBalanceText,
      this.pillSwitcher.container,
      ...this.columnHeaderTexts,
      this.doughWarningContainer,
      startBtnBg,
      this.startBtnText,
      startZone,
      this.scrollbarTrack,
      this.scrollbarThumb
    ];

    // Main camera renders fixed HUD and ignores the scrollable cards
    this.cameras.main.ignore(this.shopScrollContainer);

    // Viewport camera hardware-clips everything between y=330 and y=900
    this.viewportCamera = this.cameras.add(0, this.viewportTop, width, this.viewportHeight);
    this.viewportCamera.transparent = true;
    this.viewportCamera.ignore(this.fixedUIElements);
    this.viewportCamera.scrollY = this.viewportTop;

    // =========================================================================
    // SCROLL INTERACTION (Drag + Wheel + Clamping + Anti-Click Filter)
    // =========================================================================
    this.isPointerDown = false;
    this.dragStartY = 0;
    this.dragStartScroll = 0;
    this.dragDistance = 0;
    this.isDraggingScroll = false;

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= this.viewportTop && pointer.y <= this.viewportBottom) {
        this.isPointerDown = true;
        this.dragStartY = pointer.y;
        this.dragStartScroll = this.targetScroll;
        this.dragDistance = 0;
        this.isDraggingScroll = false;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isPointerDown) {
        const deltaY = pointer.y - this.dragStartY;
        this.dragDistance = Math.abs(deltaY);
        if (this.dragDistance > 8) {
          this.isDraggingScroll = true;
        }
        if (this.isDraggingScroll) {
          const newScroll = this.dragStartScroll - deltaY;
          this.targetScroll = Phaser.Math.Clamp(newScroll, 0, this.maxScroll);
          this.currentScroll = this.targetScroll;
          this.viewportCamera.scrollY = this.viewportTop + this.currentScroll;
          this.updateScrollbar();
        }
      }
    });

    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      this.time.delayedCall(40, () => {
        this.isDraggingScroll = false;
        this.dragDistance = 0;
      });
    });

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.y >= this.viewportTop - 40 && pointer.y <= this.viewportBottom + 40) {
        const step = 50;
        const dir = deltaY > 0 ? 1 : -1;
        this.targetScroll = Phaser.Math.Clamp(this.targetScroll + dir * step, 0, this.maxScroll);
      }
    });
  }

  update() {
    if (!this.isPointerDown && Math.abs(this.currentScroll - this.targetScroll) > 0.1) {
      this.currentScroll = Phaser.Math.Linear(this.currentScroll, this.targetScroll, 0.2);
      if (Math.abs(this.currentScroll - this.targetScroll) <= 0.1) {
        this.currentScroll = this.targetScroll;
      }
      this.viewportCamera.scrollY = this.viewportTop + this.currentScroll;
      this.updateScrollbar();
    }
  }

  updateScrollbar() {
    if (!this.scrollbarThumb) return;
    this.scrollbarThumb.clear();

    const trackX = 1888;
    const trackY = 345;
    const trackW = 6;
    const trackH = 540;

    if (this.maxScroll <= 0) return;

    const viewportH = this.viewportHeight;
    const contentH = viewportH + this.maxScroll;
    const thumbH = Phaser.Math.Clamp((viewportH / contentH) * trackH, 40, trackH);
    const progress = Phaser.Math.Clamp(this.currentScroll / this.maxScroll, 0, 1);
    const thumbY = trackY + progress * (trackH - thumbH);

    this.scrollbarThumb.fillStyle(0x7f5539, 0.85);
    this.scrollbarThumb.fillRoundedRect(trackX, thumbY, trackW, thumbH, 3);
  }

  handleBuyItem(item, x, y, nameTxt, statusTxt, itemIcon, itemName) {
    const i18n = I18nManager.getInstance();

    if (this.coins < item.cost) {
      SoundManager.getInstance().playUiDenied();
      return;
    }

    const isBoughtMold = item.type === 'mold' && this.unlockedShapes.includes(item.id);
    if (isBoughtMold) return;

    this.coins -= item.cost;
    this.coinBalanceText.setText(i18n.t('shop.availableCoins', { coins: this.coins }));

    SoundManager.getInstance().playShopBuy();

    if (item.type === 'mold') {
      this.unlockedShapes.push(item.id);
      this.showFeedback(i18n.t('shop.feedback.unlocked'), x, y - 45, '#2b9348');
    } else {
      this.stock[item.type][item.id] += 5;
      this.showFeedback(i18n.t('shop.feedback.bought', { name: itemName }), x, y - 45, '#2b9348');
      if (item.type === 'dough' && hasSufficientDough(this.stock) && this.doughWarningContainer) {
        this.doughWarningContainer.setVisible(false);
      }
    }

    if (itemIcon) {
      const origScaleX = itemIcon.scaleX;
      const origScaleY = itemIcon.scaleY;
      this.tweens.add({
        targets: itemIcon,
        scaleX: origScaleX * 1.1,
        scaleY: origScaleY * 1.1,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          itemIcon.setScale(origScaleX, origScaleY);
        }
      });
    }

    if (nameTxt && statusTxt) {
      this.tweens.add({
        targets: [nameTxt, statusTxt],
        scale: 1.05,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut'
      });
    }

    this.buyButtons.forEach(btnUpdate => btnUpdate());
  }

  showDoughWarning() {
    if (!this.doughWarningContainer) return;
    this.doughWarningContainer.setVisible(true);
    this.doughWarningContainer.setAlpha(1);
    this.tweens.killTweensOf(this.doughWarningContainer);
    this.doughWarningContainer.setScale(1);
    this.tweens.add({
      targets: this.doughWarningContainer,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 100,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeInOut'
    });
  }

  getStatusString(item) {
    const i18n = I18nManager.getInstance();
    if (item.type === 'mold') {
      return this.unlockedShapes.includes(item.id)
        ? i18n.t('shop.units.unlocked')
        : i18n.t('shop.units.locked');
    } else {
      const qty = this.stock[item.type]?.[item.id] ?? 0;
      return i18n.t('shop.units.stock', { qty });
    }
  }

  showFeedback(text, x, y, color) {
    const feedback = this.add.text(x, y, text, {
      font: 'bold 26px "Outfit", sans-serif',
      fill: color,
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.shopScrollContainer.add(feedback);

    this.tweens.add({
      targets: feedback,
      y: y - 55,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.out',
      onComplete: () => {
        feedback.destroy();
      }
    });
  }

  refreshLocalizedTexts() {
    const i18n = I18nManager.getInstance();
    if (this.pillSwitcher) {
      this.pillSwitcher.updateVisuals();
    }
    if (this.titleText) {
      this.titleText.setText(i18n.t('shop.title'));
    }
    if (this.subtitleText) {
      this.subtitleText.setText(i18n.t('shop.subtitle', { day: this.day + 1 }));
    }
    if (this.coinBalanceText) {
      this.coinBalanceText.setText(i18n.t('shop.availableCoins', { coins: this.coins }));
    }
    if (this.columnHeaderTexts) {
      const colKeys = ['molds', 'dough', 'toppings', 'drinks'];
      this.columnHeaderTexts.forEach((hText, i) => {
        hText.setText(i18n.t(`shop.columns.${colKeys[i]}`));
      });
    }
    if (this.startBtnText) {
      this.startBtnText.setText(i18n.t('shop.startNextDay'));
    }
    if (this.warnText) {
      this.warnText.setText(i18n.t('shop.warningDough'));
    }
    if (this.cardTextUpdaters) {
      this.cardTextUpdaters.forEach(updater => updater());
    }
    if (this.buyButtons) {
      this.buyButtons.forEach(btnUpdate => btnUpdate());
    }
  }
}
