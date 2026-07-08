import Phaser from 'phaser';
import Cookie from '../game/Cookie.js';
import Customer from '../game/Customer.js';
import UI_CONFIG from '../../ui-config.json';

const DAY_CONFIGS = {
  1: {
    meta: 100,
    patienceTime: 40,
    maxCustomers: 3,
    bakeMin: 5.5,
    bakeMax: 7.5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón Clásico', base: 'classic', shape: 'heart', toppings: ['sprinkles'] }
    ]
  },
  2: {
    meta: 150,
    patienceTime: 35,
    maxCustomers: 4,
    bakeMin: 6.0,
    bakeMax: 7.5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón Clásico', base: 'classic', shape: 'heart', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['sprinkles'] },
      { name: 'Galleta Gato Choco', base: 'classic', shape: 'cat', toppings: ['choco'] },
      { name: 'Estrella de Choco', base: 'classic', shape: 'star', toppings: ['choco'] }
    ]
  },
  3: {
    meta: 200,
    patienceTime: 30,
    maxCustomers: 4,
    bakeMin: 6.5,
    bakeMax: 7.5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['choco'] },
      { name: 'Galleta Gato Choco', base: 'classic', shape: 'cat', toppings: ['choco'] },
      { name: 'Estrella de Choco', base: 'classic', shape: 'star', toppings: ['choco'] },
      { name: 'Corazón Avena Choco', base: 'oat', shape: 'heart', toppings: ['choco'] },
      { name: 'Estrella Avena', base: 'oat', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Gato de Avena', base: 'oat', shape: 'cat', toppings: ['choco'] },
      { name: 'Pez Clásico', base: 'classic', shape: 'fish', toppings: ['sprinkles'] }
    ]
  },
  4: {
    meta: 300,
    patienceTime: 28,
    maxCustomers: 5,
    bakeMin: 7.0,
    bakeMax: 7.5,
    recipes: [
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: ['sprinkles'] },
      { name: 'Corazón de Chocolate', base: 'chocolate', shape: 'heart', toppings: ['glazing'] },
      { name: 'Galleta Gato Choco', base: 'classic', shape: 'cat', toppings: ['choco'] },
      { name: 'Gato Glaseado', base: 'classic', shape: 'cat', toppings: ['glazing'] },
      { name: 'Estrella de Choco', base: 'classic', shape: 'star', toppings: ['choco'] },
      { name: 'Corazón Avena Choco', base: 'oat', shape: 'heart', toppings: ['choco'] },
      { name: 'Gato Choco-Fusión', base: 'chocolate', shape: 'cat', toppings: ['glazing'] },
      { name: 'Pez de Avena Glaseado', base: 'oat', shape: 'fish', toppings: ['glazing'] },
      { name: 'Pez de Chocolate', base: 'chocolate', shape: 'fish', toppings: ['choco'] }
    ]
  }
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.config = DAY_CONFIGS[this.day];
    
    // Core game state variables
    this.customersSpawned = 0;
    this.currentCustomer = null;
    this.currentCookie = new Cookie();
    
    // Generate unique, non-repeating customer sequence for the day
    let availablePool = [1, 2, 3, 4, 5];
    if (this.day === 1) {
      // Day 1: Exclude customer 5 (Gamer) to keep it introductory
      availablePool = [1, 2, 3, 4];
    }
    
    let sequence = [];
    while (sequence.length < this.config.maxCustomers) {
      let tempPool = [...availablePool];
      // Shuffling algorithm
      for (let i = tempPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempPool[i], tempPool[j]] = [tempPool[j], tempPool[i]];
      }
      sequence = sequence.concat(tempPool);
    }
    this.customerSequence = sequence.slice(0, this.config.maxCustomers);
    
    // Generate non-repeating recipe sequence for the day
    // Uses Fisher-Yates shuffle with anti-repeat protection at pool boundaries
    const recipes = this.config.recipes || [];
    let recipeSeq = [];
    while (recipeSeq.length < this.config.maxCustomers) {
      let recipePool = [...recipes];
      // Fisher-Yates shuffle
      for (let i = recipePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recipePool[i], recipePool[j]] = [recipePool[j], recipePool[i]];
      }
      // Anti-repeat: if the first recipe of this batch matches the last of the previous batch, swap it
      if (recipeSeq.length > 0 && recipePool.length > 1 && recipePool[0] === recipeSeq[recipeSeq.length - 1]) {
        // Swap first with a random other position
        const swapIdx = 1 + Math.floor(Math.random() * (recipePool.length - 1));
        [recipePool[0], recipePool[swapIdx]] = [recipePool[swapIdx], recipePool[0]];
      }
      recipeSeq = recipeSeq.concat(recipePool);
    }
    this.recipeSequence = recipeSeq.slice(0, this.config.maxCustomers);
    
    // Time-based oven state
    this.isBaking = false;
    this.cookiesInOven = []; // Holds Cookie instances currently in the oven
    this.deliveryTrayCookies = []; // Holds Cookie instances currently on the delivery tray
    this.ovenTimeElapsed = 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw primary background (cream wall)
    this.drawBackground(width, height);

    // Create the customer layer container (behind the counter)
    this.customerContainer = this.add.container(0, 0);

    // Draw the Wooden Counter and Floor (in front of the customer, behind UI)
    const counterBg = this.add.graphics();
    
    // Wooden Counter Base Image (from Y=230 to Y=576)
    this.add.image(0, 230, 'bakery_counter').setOrigin(0, 0).setDisplaySize(1024, 346);

    // Station dividers (X: 170, 410, 710, 860 starting at Y=295)
    counterBg.lineStyle(2, 0xddb892, 0.5);
    counterBg.lineBetween(170, 295, 170, height);
    counterBg.lineBetween(410, 295, 410, height);
    counterBg.lineBetween(710, 295, 710, height);
    counterBg.lineBetween(860, 295, 860, height);

    // Setup HUD (Day, Meta, Coins)
    this.setupHUD(width);

    // Create the interactive kitchen stations
    this.createStations(width, height);

    // Create Cookie Tray (Preparation Area)
    this.createCookieTray(width, height);

    // Create Delivery Tray (Serving Area)
    this.createDeliveryTray();

    // Spawn first customer
    this.time.delayedCall(1000, () => {
      this.spawnCustomer();
    });

    // Custom Cat Paw Cursor Initialization
    this.input.setDefaultCursor('none');
    this.shoulderX = width / 2;
    this.shoulderY = height + 50;
    this.pawX = width / 2;
    this.pawY = height / 2;

    this.catArmGraphics = this.add.graphics().setDepth(10000);
    this.catPawSprite = this.add.image(this.pawX, this.pawY, 'cat_paw_open').setDepth(10000).setOrigin(0.5, 0.55);

    // Track pointerdown/pointerup to trigger grab animation (texture swap)
    this.input.on('pointerdown', () => {
      if (this.catPawSprite) {
        this.catPawSprite.setTexture('cat_paw_closed');
      }
    });
    this.input.on('pointerup', () => {
      if (this.catPawSprite) {
        this.catPawSprite.setTexture('cat_paw_open');
      }
    });

    // --- UI EDITOR MODE INITIALIZATION ---
    this.isEditorMode = false;
    this.selectedEditorElement = null;

    // Create editor status text (hidden by default)
    this.editorIndicator = this.add.text(width / 2, 20, '🛠️ MODO EDITOR DE UI ACTIVO\n[Arrastra letreros / ⬆️⬇️⬅️➡️ para Redimensionar / S para Guardar / E para Salir]', {
      font: '16px "Outfit", sans-serif',
      fill: '#ffffff',
      backgroundColor: '#d90429',
      padding: { x: 15, y: 10 },
      align: 'center',
      fontWeight: '800'
    }).setOrigin(0.5, 0).setDepth(20000).setVisible(false);

    // Keyboard inputs
    this.input.keyboard.on('keydown-E', () => {
      this.toggleEditorMode();
    });

    this.input.keyboard.on('keydown-S', () => {
      if (this.isEditorMode) {
        this.saveUIConfig();
      }
    });

    // Arrow keys for resizing
    this.input.keyboard.on('keydown-UP', () => {
      this.resizeSelectedElement(0, 2);
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      this.resizeSelectedElement(0, -2);
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      this.resizeSelectedElement(2, 0);
    });
    this.input.keyboard.on('keydown-LEFT', () => {
      this.resizeSelectedElement(-2, 0);
    });

    // List of editable UI elements
    const { daySign, coinsSign, metaSign } = UI_CONFIG;
    this.editableUIElements = [
      { key: 'daySign', bg: this.daySignImage, text: this.daySignText, textOffsetX: daySign.width / 2, textOffsetY: daySign.textOffsetY },
      { key: 'coinsSign', bg: this.coinsSignImage, text: this.coinsText, textOffsetX: 0, textOffsetY: coinsSign.textOffsetY },
      { key: 'metaSign', bg: this.metaSignImage, text: this.metaText, textOffsetX: -metaSign.width / 2, textOffsetY: metaSign.textOffsetY },
      { key: 'masaLabel', bg: this.masaLabelImage, text: null },
      { key: 'formaLabel', bg: this.formaLabelImage, text: null },
      { key: 'toppingLabel', bg: this.toppingLabelImage, text: null }
    ];

    // Setup drag events for UI elements (only active in editor mode)
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (!this.isEditorMode) return;

      const element = this.editableUIElements.find(el => el.bg === gameObject);
      if (element) {
        // Select it
        this.selectElement(element);

        // Update background position
        gameObject.x = dragX;
        gameObject.y = dragY;

        // If there's associated text, update it using its offset
        if (element.text) {
          element.text.x = dragX + element.textOffsetX;
          element.text.y = dragY + element.textOffsetY;
        }
      }
    });

    // Setup click selection
    this.editableUIElements.forEach(element => {
      element.bg.on('pointerdown', () => {
        if (this.isEditorMode) {
          this.selectElement(element);
        }
      });
    });

    // Clean up: Restore default browser cursor when leaving the scene
    this.events.on('shutdown', () => {
      this.input.setDefaultCursor('default');
    });
  }

  drawBackground(width, height) {
    // Render the blurred storefront background to cover the entire canvas
    this.add.image(0, 0, 'bakery_background').setOrigin(0, 0).setDisplaySize(width, height);
  }

  setupHUD(width) {
    // Day indicator WITH DECORATIVE SIGN!
    const { daySign } = UI_CONFIG;
    this.daySignImage = this.add.image(daySign.x, daySign.y, 'day_sign_empty')
      .setDisplaySize(daySign.width, daySign.height)
      .setOrigin(0, 0.5)
      .setDepth(1);
    
    this.daySignText = this.add.text(daySign.x + daySign.width / 2, daySign.y + daySign.textOffsetY, `DÍA ${this.day}`, {
      font: `${daySign.textFontSize}px "Outfit", sans-serif`,
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5, 0.5).setDepth(1);

    // Coins counter WITH DECORATIVE SIGN!
    const { coinsSign } = UI_CONFIG;
    this.coinsSignImage = this.add.image(coinsSign.x, coinsSign.y, 'coins_sign_empty')
      .setDisplaySize(coinsSign.width, coinsSign.height)
      .setOrigin(0.5, 0.5)
      .setDepth(1);
    
    this.coinsText = this.add.text(coinsSign.x, coinsSign.y + coinsSign.textOffsetY, `Monedas: ${this.coins}`, {
      font: `${coinsSign.textFontSize}px "Outfit", sans-serif`,
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5, 0.5).setDepth(1);

    // Meta target indicator WITH DECORATIVE SIGN!
    let { metaSign } = UI_CONFIG;
    const finalX = metaSign.x === "width" ? width : metaSign.x;
    
    this.metaSignImage = this.add.image(finalX, metaSign.y, 'meta_sign_empty')
      .setDisplaySize(metaSign.width, metaSign.height)
      .setOrigin(1, 0.5)
      .setDepth(1);
    
    const textX = finalX - metaSign.width / 2;
    this.metaText = this.add.text(textX, metaSign.y + metaSign.textOffsetY, `Meta: ${this.config.meta}`, {
      font: `${metaSign.textFontSize}px "Outfit", sans-serif`,
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5, 0.5).setDepth(1);
  }

  createStations(width, height) {
    // Column 1: Estación de Masa (Masa)
    this.createDoughButtons(45, 310);

    // Column 2: Estación de Forma (Cortadores)
    this.createShapeButtons(185, 310);

    // Column 3: Horno (Oven minigame)
    this.createOvenStation(725, 310);

    // Column 4: Decoración (Toppings)
    this.createToppingButtons(890, 310);
  }

  createDoughButtons(startX, startY) {
    const { masaLabel } = UI_CONFIG;
    this.masaLabelImage = this.add.image(masaLabel.x, masaLabel.y, 'masa_label')
      .setDisplaySize(masaLabel.width, masaLabel.height)
      .setOrigin(0.5)
      .setDepth(1);

    const bases = [
      { id: 'classic', label: 'Clásica', color: 0xf5ebe0, unlocked: true },
      { id: 'chocolate', label: 'Choco', color: 0x4f1200, unlocked: this.day >= 2 },
      { id: 'oat', label: 'Avena', color: 0xd5bdaf, unlocked: this.day >= 3 }
    ];

    // 50% larger dough images (70 -> 105)
    const doughSize = 105;
    const doughHoverSize = 115;
    const portionSize = 55; // smaller "portion" that follows the cursor

    bases.forEach((b, index) => {
      // Center the dough balls horizontally in the left column
      const x = startX + 35;
      const y = startY + 45 + index * 80;

      // Dough source image (stays in place, always visible)
      const doughImg = this.add.image(x, y, 'dough_' + b.id)
        .setDisplaySize(doughSize, doughSize)
        .setDepth(2);
      if (!b.unlocked) {
        doughImg.setTint(0x777777);
        doughImg.setAlpha(0.4);
      }

      if (b.unlocked) {
        // Create an invisible drag zone on top of the dough image
        const dragZone = this.add.rectangle(x, y, doughSize, doughSize, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);

        // The "portion" sprite — starts invisible, appears when dragging
        let portionSprite = null;

        dragZone.on('pointerover', () => {
          doughImg.setDisplaySize(doughHoverSize, doughHoverSize);
        });
        dragZone.on('pointerout', () => {
          doughImg.setDisplaySize(doughSize, doughSize);
        });

        dragZone.on('dragstart', () => {
          // Create a small portion sprite that follows the cursor
          portionSprite = this.add.image(dragZone.x, dragZone.y, 'dough_' + b.id);
          portionSprite.setDisplaySize(portionSize, portionSize);
          portionSprite.setDepth(1000);
          portionSprite.setAlpha(0.9);
          // Slight shrink on the source to give "tearing off" feel
          doughImg.setDisplaySize(doughSize - 10, doughSize - 10);
        });

        dragZone.on('drag', (pointer, dragX, dragY) => {
          if (portionSprite) {
            portionSprite.x = dragX;
            portionSprite.y = Math.max(180, dragY);
          }
        });

        dragZone.on('dragend', () => {
          // Check distance to cookie tray
          const dist = Phaser.Math.Distance.Between(
            portionSprite ? portionSprite.x : dragZone.x,
            portionSprite ? portionSprite.y : dragZone.y,
            this.trayX, this.trayY
          );

          if (dist < 120) {
            this.currentCookie.base = b.id;
            this.updateCookieVisuals();
          }

          // Destroy the portion sprite
          if (portionSprite) {
            portionSprite.destroy();
            portionSprite = null;
          }

          // Restore dough source size and reset drag zone position
          doughImg.setDisplaySize(doughSize, doughSize);
          dragZone.x = x;
          dragZone.y = y;
        });
      }
    });
  }

  createShapeButtons(startX, startY) {
    const { formaLabel } = UI_CONFIG;
    this.formaLabelImage = this.add.image(formaLabel.x, formaLabel.y, 'forma_label')
      .setDisplaySize(formaLabel.width, formaLabel.height)
      .setOrigin(0.5)
      .setDepth(1);

    const shapes = [
      { id: 'star', label: 'Estrella', unlocked: true },
      { id: 'heart', label: 'Corazón', unlocked: true },
      { id: 'cat', label: 'Gato', unlocked: this.day >= 2 },
      { id: 'fish', label: 'Pez', unlocked: this.day >= 3 }
    ];

    shapes.forEach((s, index) => {
      // Horizontal layout (X spacing: 60, starting at startX - 5, Y is startY + 45)
      const x = startX - 5 + index * 60;
      const y = startY + 45;

      const container = this.add.container(x, y).setDepth(2);
      container.setData('origX', x);
      container.setData('origY', y);

      // Cutter Image (116x116 texture displayed at 58x58 — 2x downscale for HiDPI)
      const shapeSprite = this.add.image(29, 29, 'shape_' + s.id).setDisplaySize(58, 58);
      if (!s.unlocked) {
        shapeSprite.setTint(0x777777);
        shapeSprite.setAlpha(0.4);
      }
      container.add(shapeSprite);

      if (s.unlocked) {
        // Create a flat transparent rectangle as the interactive drag zone
        const dragZone = this.add.rectangle(x + 29, y + 29, 58, 58, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);

        dragZone.on('pointerover', () => {
          shapeSprite.setDisplaySize(64, 64);
        });
        dragZone.on('pointerout', () => {
          shapeSprite.setDisplaySize(58, 58);
        });

        // Drag handlers
        dragZone.on('dragstart', () => {
          container.setDepth(1000);
          dragZone.setDepth(1000);
        });

        dragZone.on('drag', (pointer, dragX, dragY) => {
          dragZone.x = dragX;
          dragZone.y = Math.max(180, dragY);
          // Shift visual container to follow the drag zone
          container.x = dragX - 29;
          container.y = Math.max(180, dragY) - 29;
        });

        dragZone.on('dragend', () => {
          // Check distance to cookie tray (x: trayX, y: trayY)
          const dist = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, this.trayX, this.trayY);
          if (dist < 100) {
            if (this.currentCookie.base) {
              this.currentCookie.shape = s.id;
              this.updateCookieVisuals();
              this.showFeedbackText(`¡Forma de ${s.label}!`, this.trayX, 200, '#38b000');
            } else {
              this.showFeedbackText('¡Primero selecciona la masa!', this.trayX, 200, '#d90429');
            }
          }

          // Return transition for both the interactive dragZone and the visual container
          this.tweens.add({
            targets: [dragZone, container],
            x: {
              getStart: (target) => target.x,
              getEnd: (target) => (target === dragZone ? x + 29 : x)
            },
            y: {
              getStart: (target) => target.y,
              getEnd: (target) => (target === dragZone ? y + 29 : y)
            },
            duration: 250,
            ease: 'Back.out',
            onComplete: () => {
              container.setDepth(2);
              dragZone.setDepth(2);
            }
          });
        });
      }
    });
  }

  createOvenStation(startX, startY) {
    this.ovenX = startX + 55;
    this.ovenY = startY - 40;
    this.ovenStartX = startX;
    this.ovenStartY = startY;

    // Oven Image placed higher (startY - 40, which is Y = 295). Starts with oven OFF
    this.ovenImage = this.add.image(this.ovenX, this.ovenY, 'oven_off')
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
    
    this.ovenImage.on('pointerdown', () => {
      this.handleOvenImageClick();
    });
 
    // ENCENDER Button (placed below the oven at startY + 45)
    const btnBg = this.add.graphics().setDepth(10);
    btnBg.fillStyle(0x7f5539, 1);
    btnBg.fillRoundedRect(startX, startY + 45, 110, 35, 8);
    this.ovenBtnText = this.add.text(startX + 55, startY + 62, 'ENCENDER', {
      font: '13px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(11);
 
    this.ovenZone = this.add.rectangle(startX + 55, startY + 62, 110, 35, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(12);
    this.ovenZone.on('pointerdown', () => {
      this.handleOvenClick();
    });
 
    // Timing Bar (placed below the button at startY + 95)
    this.ovenBarX = startX - 20;
    this.ovenBarY = startY + 95;
 
    this.ovenBarBg = this.add.graphics().setDepth(2);
    this.ovenBarFill = this.add.graphics().setDepth(2);
    this.drawOvenBarBackground();

    // SACAR Button (placed below the Timing Bar at startY + 125)
    this.ovenExtractBtnBg = this.add.graphics().setDepth(10);
    this.ovenExtractBtnText = this.add.text(startX + 55, startY + 140, 'SACAR GALLETAS', {
      font: '11px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(11);

    this.ovenExtractZone = this.add.rectangle(startX + 55, startY + 140, 110, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);

    this.ovenExtractZone.on('pointerdown', () => {
      this.handleOvenImageClick();
    });

    this.updateExtractButtonState();
  }
 
  handleOvenClick() {
    if (!this.isBaking) {
      if (this.cookiesInOven.length === 0) {
        this.showFeedbackText('¡El horno está vacío!', this.trayX, 200, '#d90429');
        return;
      }
      // Start baking
      this.isBaking = true;
      this.ovenTimeElapsed = 0;
      this.ovenBtnText.setText('RETIRAR');
      this.ovenBarFill.clear();
      this.ovenImage.setTexture('oven_on'); // Switch to lit oven
      this.updateCookieVisuals();
      this.updateExtractButtonState();
    } else {
      // Stop baking and evaluate time
      this.isBaking = false;
      this.ovenBtnText.setText('ENCENDER');
      this.ovenImage.setTexture('oven_off'); // Switch back to unlit oven
      
      const bakeMin = this.config.bakeMin || 4.0;
      const bakeMax = this.config.bakeMax || 8.0;
 
      let state = 'raw';
      let feedback = '¡Sigue cruda! 🥣';
      let color = '#ffb703';
 
      if (this.ovenTimeElapsed >= bakeMin && this.ovenTimeElapsed <= bakeMax) {
        state = 'baked';
        feedback = '¡Horneado Perfecto! 🍪✨';
        color = '#38b000';
      } else if (this.ovenTimeElapsed > bakeMax) {
        state = 'burnt';
        feedback = '¡Se ha quemado! 😭🔥';
        color = '#d90429';
      }
 
      // Update state for all cookies currently in the oven
      this.cookiesInOven.forEach(cookie => {
        cookie.bakedState = state;
      });
 
      this.showFeedbackText(feedback, this.trayX, 200, color);
      this.ovenBarFill.clear();
      this.updateCookieVisuals();
      this.updateExtractButtonState();
    }
  }

  drawOvenBarBackground() {
    this.ovenBarBg.clear();

    const bakeMin = this.config.bakeMin || 4.0;
    const bakeMax = this.config.bakeMax || 8.0;
    const pxPerSec = 15; // 150px / 10s

    // 1. Raw zone (Gray background rounded)
    this.ovenBarBg.fillStyle(0xe0e0e0, 1);
    this.ovenBarBg.fillRoundedRect(this.ovenBarX, this.ovenBarY, 150, 15, 5);

    // 2. Baked zone (Green perfect area)
    const greenStartX = this.ovenBarX + (bakeMin * pxPerSec);
    const greenWidth = (bakeMax - bakeMin) * pxPerSec;
    this.ovenBarBg.fillStyle(0x38b000, 1);
    this.ovenBarBg.fillRect(greenStartX, this.ovenBarY, greenWidth, 15);

    // 3. Burnt zone (Red danger area)
    const redStartX = this.ovenBarX + (bakeMax * pxPerSec);
    const redWidth = (10 - bakeMax) * pxPerSec;
    if (redWidth > 0) {
      this.ovenBarBg.fillStyle(0xd90429, 1);
      this.ovenBarBg.fillRect(redStartX, this.ovenBarY, redWidth, 15);
    }
  }

  updateOvenBar() {
    this.ovenBarFill.clear();
    if (this.isBaking) {
      const pxPerSec = 15;
      const progressX = Math.min(10, this.ovenTimeElapsed) * pxPerSec;
      
      // Draw a vertical black indicator needle
      this.ovenBarFill.fillStyle(0x2b2b2b, 1); // Dark charcoal needle
      this.ovenBarFill.fillRect(this.ovenBarX + progressX - 2, this.ovenBarY - 3, 4, 21);
    }
  }

  updateOvenVisualEffects() {
    // No color effects on the oven while baking
  }

  createToppingButtons(startX, startY) {
    const { toppingLabel } = UI_CONFIG;
    this.toppingLabelImage = this.add.image(toppingLabel.x, toppingLabel.y, 'topping_label')
      .setDisplaySize(toppingLabel.width, toppingLabel.height)
      .setOrigin(0.5)
      .setDepth(1);

    const toppings = [
      { id: 'sprinkles', label: 'Chispas', color: 0xff70a6, unlocked: true },
      { id: 'choco', label: 'Choco', color: 0x3d0c00, unlocked: this.day >= 2 },
      { id: 'glazing', label: 'Glaseado', color: 0xff0a54, unlocked: this.day >= 4 }
    ];

    const jarSize = 84;
    const jarHoverSize = 92;

    toppings.forEach((t, index) => {
      const x = startX + 10 + 42; // center of jar
      const y = startY + index * 80 + 42;

      // Topping Jar sprite (stays in place as reference)
      const jarSource = this.add.image(x, y, 'topping_' + t.id).setDisplaySize(jarSize, jarSize).setDepth(2);
      if (!t.unlocked) {
        jarSource.setTint(0x777777);
        jarSource.setAlpha(0.4);
      }

      if (t.unlocked) {
        // Invisible drag zone
        const dragZone = this.add.rectangle(x, y, jarSize, jarSize, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);

        // Draggable jar clone — created on dragstart
        let jarClone = null;
        let initialDist = 0; // distance from home position to tray

        dragZone.on('pointerover', () => {
          jarSource.setDisplaySize(jarHoverSize, jarHoverSize);
        });
        dragZone.on('pointerout', () => {
          jarSource.setDisplaySize(jarSize, jarSize);
        });

        dragZone.on('dragstart', () => {
          // Create a clone of the jar that follows the cursor
          jarClone = this.add.image(x, y, 'topping_' + t.id);
          jarClone.setDisplaySize(jarSize, jarSize);
          jarClone.setDepth(1000);
          // Dim the source jar to show it's been "picked up"
          jarSource.setAlpha(0.35);
          // Store the initial distance from home to tray for ratio calculation
          initialDist = Phaser.Math.Distance.Between(x, y, this.trayX, this.trayY);
        });

        dragZone.on('drag', (pointer, dragX, dragY) => {
          if (!jarClone) return;
          const clampedY = Math.max(180, dragY);
          jarClone.x = dragX;
          jarClone.y = clampedY;

          // Distance-based rotation: upright (0°) when far, fully inverted (π) when at tray
          const currentDist = Phaser.Math.Distance.Between(dragX, clampedY, this.trayX, this.trayY);
          // ratio: 0 = at home (far), 1 = at tray (close)
          const ratio = Phaser.Math.Clamp(1 - (currentDist / initialDist), 0, 1);
          // Determine tilt direction: tilt left (-) if jar is to the right of tray, right (+) if to the left
          const direction = (dragX >= this.trayX) ? -1 : 1;
          // Full pour = π radians (180°), scaled by proximity ratio
          jarClone.setRotation(direction * ratio * Math.PI);
        });

        dragZone.on('dragend', () => {
          if (!jarClone) return;

          // Check distance to cookie tray
          const dist = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, this.trayX, this.trayY);

          if (dist < 120) {
        // Apply validations (allow toppings on all cookie states)
        if (!this.currentCookie.base) {
          this.showFeedbackText('¡Primero selecciona la masa!', this.trayX, 200, '#d90429');
        } else {
          this.currentCookie.toppings = [t.id];
          this.updateCookieVisuals();
        }
      }

          // Destroy the clone and restore source
          jarClone.destroy();
          jarClone = null;
          jarSource.setAlpha(1);
          jarSource.setDisplaySize(jarSize, jarSize);
          dragZone.x = x;
          dragZone.y = y;
        });
      }
    });
  }

  createCookieTray(width, height) {
    this.trayX = width / 2;
    this.trayY = height - 90;

    const trayX = this.trayX;
    const trayY = this.trayY;

    // Draw tray plate placeholder
    const trayBg = this.add.graphics().setDepth(2);
    trayBg.fillStyle(0xcccccc, 1); // Metallic tray
    trayBg.fillRoundedRect(trayX - 100, trayY - 45, 200, 90, 10);
    trayBg.lineStyle(3, 0x999999, 1);
    trayBg.strokeRoundedRect(trayX - 100, trayY - 45, 200, 90, 10);



    // Placeholders for cookie graphics (initialized with a dummy valid texture to set correct bounds)
    this.cookieSprite = this.add.image(trayX, trayY, 'cookie_star_classic_baked').setVisible(false).setDepth(3);
    this.doughSprite = this.add.image(trayX, trayY, 'dough_classic').setVisible(false).setDepth(2);
    
    // Make the cookie interactive and draggable
    this.cookieSprite.setInteractive({ useHandCursor: true });
    this.input.setDraggable(this.cookieSprite);

    this.cookieSprite.on('dragstart', () => {
      // Bring cookie to top depth while dragging
      this.cookieSprite.setDepth(1000);
    });

    this.cookieSprite.on('drag', (pointer, dragX, dragY) => {
      const clampedY = Math.max(180, dragY);
      this.cookieSprite.x = dragX;
      this.cookieSprite.y = clampedY;

      // Check distance to oven to apply drop-target highlight
      const dist = Phaser.Math.Distance.Between(dragX, clampedY, this.ovenX, this.ovenY);
      if (dist < 120 && !this.isBaking && this.cookiesInOven.length < 3 && this.currentCookie.shape) {
        this.ovenImage.setScale(1.04);
        this.ovenImage.setTint(0xfff2e6);
      } else {
        this.ovenImage.setScale(1.0);
        this.ovenImage.clearTint();
      }
    });

    this.cookieSprite.on('dragend', () => {
      // Restore oven default visual state
      this.ovenImage.setScale(1.0);
      this.ovenImage.clearTint();

      // Check distance from cookie to oven center (this.ovenX, this.ovenY)
      const dist = Phaser.Math.Distance.Between(this.cookieSprite.x, this.cookieSprite.y, this.ovenX, this.ovenY);
      
      if (dist < 120 && !this.isBaking && this.cookiesInOven.length < 3 && this.currentCookie.shape) {
        // Drop successfully into oven!
        // Clone cookie
        const cookieToOven = new Cookie();
        cookieToOven.base = this.currentCookie.base;
        cookieToOven.shape = this.currentCookie.shape;
        cookieToOven.bakedState = this.currentCookie.bakedState;
        cookieToOven.toppings = [...this.currentCookie.toppings];
        this.cookiesInOven.push(cookieToOven);
        this.updateExtractButtonState();
        
        this.currentCookie.reset();

        this.showFeedbackText(`Galleta introducida (${this.cookiesInOven.length}/3)`, this.trayX, 200, '#38b000');

        // Play shrink and fade animation into the oven center
        this.tweens.add({
          targets: this.cookieSprite,
          x: this.ovenX,
          y: this.ovenY,
          scale: 0.1,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.cookieSprite.setScale(1.0);
            this.cookieSprite.setAlpha(1);
            this.cookieSprite.setVisible(false);
            this.cookieSprite.x = this.trayX;
            this.cookieSprite.y = this.trayY;
            this.updateCookieVisuals();
          }
        });
      } else {
        // Did not drop or failed: tween back to tray normally
        if (dist < 120) {
          if (this.isBaking) {
            this.showFeedbackText('¡El horno está encendido!', this.trayX, 200, '#d90429');
          } else if (this.cookiesInOven.length >= 3) {
            this.showFeedbackText('¡El horno está lleno! (Máx 3)', this.trayX, 200, '#d90429');
          } else if (!this.currentCookie.shape) {
            this.showFeedbackText('¡Primero corta la forma!', this.trayX, 200, '#d90429');
          }
        }
        
        this.tweens.add({
          targets: this.cookieSprite,
          x: this.trayX,
          y: this.trayY,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            this.cookieSprite.setDepth(3);
            this.updateCookieVisuals();
          }
        });
      }
    });

    this.updateCookieVisuals();

    // Reset button
    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x7f5539, 1);
    resetBg.fillRoundedRect(this.trayX - 180, trayY - 15, 60, 30, 8);
    this.add.text(this.trayX - 150, trayY, 'TIRAR', {
      font: '11px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5);

    const resetZone = this.add.rectangle(this.trayX - 150, trayY, 60, 30, 0x000000, 0).setInteractive({ useHandCursor: true });
    resetZone.on('pointerdown', () => {
      if (this.currentCookie.base || this.currentCookie.shape) {
        this.coins = Math.max(0, this.coins - 5);
        this.coinsText.setText(`Monedas: ${this.coins}`);
        this.currentCookie.reset();
        this.updateCookieVisuals();
        this.showFeedbackText('-5 Monedas (Desperdicio) 🗑️', this.trayX, 200, '#d90429');
      } else {
        this.showFeedbackText('¡Bandeja ya limpia!', this.trayX, 200, '#d90429');
      }
    });
  }

  drawCookie() {
    if (this.doughSprite) {
      this.doughSprite.setVisible(false);
    }
    if (this.cookieSprite) {
      this.cookieSprite.setVisible(false);
    }

    const cookie = this.currentCookie;

    // If there is no base selected, show nothing
    if (!cookie.base) {
      return;
    }

    // If there is a base selected but no shape has been cut yet
    if (!cookie.shape) {
      if (this.doughSprite) {
        this.doughSprite.setTexture('dough_' + cookie.base);
        this.doughSprite.setDisplaySize(60, 60);
        this.doughSprite.setVisible(true);
      }
      return;
    }

    // If a shape has been cut, display the correct cookie sprite
    if (this.cookieSprite) {
      // Construct asset key based on shape, base, state, and toppings (for all states)
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      // Verify the texture exists before setting it (safety check)
      if (this.textures.exists(key)) {
        this.cookieSprite.setTexture(key);
        this.cookieSprite.setDisplaySize(70, 70);
        this.cookieSprite.setVisible(true);
      }
    }
  }

  updateCookieVisuals() {
    this.drawCookie();
  }

  spawnCustomer() {
    if (this.customersSpawned >= this.config.maxCustomers) {
      // Day ended, check progression
      this.time.delayedCall(1000, () => {
        this.scene.start('SummaryScene', { day: this.day, coins: this.coins, meta: this.config.meta });
      });
      return;
    }

    // Get the pre-calculated unique customer ID and recipe for this step
    const customerId = this.customerSequence[this.customersSpawned];
    const assignedRecipe = this.recipeSequence[this.customersSpawned];
    this.customersSpawned++;

    // Spawn customer in the counter area (centered at 512, 230)
    this.currentCustomer = new Customer(
      this, 
      512, 
      230, 
      this.config,
      () => this.handleCustomerTimeout(), // callback when patience runs out
      customerId,
      assignedRecipe
    );
  }

  deliverCookie() {
    if (!this.currentCustomer) return;

    if (this.deliveryTrayCookies.length === 0) {
      this.showFeedbackText('¡La bandeja de entrega está vacía!', this.trayX, 200, '#d90429');
      return;
    }

    const recipe = this.currentCustomer.recipe;
    const requested = this.currentCustomer.requestedQuantity;
    const accumulated = this.currentCustomer.acceptedCookies || [];
    const newDelivered = this.deliveryTrayCookies;
    const totalCount = accumulated.length + newDelivered.length;

    // Check if we delivered fewer cookies than requested
    if (totalCount < requested) {
      // Roll for tolerance based on customer personality
      const ACCEPTANCE_PROBS = {
        1: 0.80, // Dormilón
        2: 0.20, // Oficinista
        3: 0.90, // Abuelita
        4: 0.70, // Estudiante
        5: 0.00  // Gamer
      };
      const acceptProb = ACCEPTANCE_PROBS[this.currentCustomer.customerId] || 0.70;
      const isAccepted = Math.random() < acceptProb;

      if (isAccepted) {
        // Customer accepts the partial delivery and leaves early.
        let totalReward = 0;
        let anyPerfect = false;
        const allCookies = accumulated.concat(newDelivered);
        
        allCookies.forEach(cookie => {
          const sim = cookie.getSimilarityPercentage(recipe);
          if (sim === 100) anyPerfect = true;
          totalReward += Math.round(60 * (sim / 100));
        });

        this.coins += totalReward;
        this.coinsText.setText(`Monedas: ${this.coins}`);
        this.showFeedbackText(`¡Aceptado parcialmente! 👍 +${totalReward} Monedas`, this.trayX, 200, '#38b000');

        if (anyPerfect) {
          this.triggerConfetti();
        }

        // Clean up
        this.deliveryTrayCookies = [];
        this.drawDeliveryTray();
        this.currentCustomer.destroy();
        this.currentCustomer = null;

        this.time.delayedCall(1500, () => {
          this.spawnCustomer();
        });
      } else {
        // Customer rejects the partial delivery and stays
        // Transfer new cookies to customer's accumulated list
        this.currentCustomer.acceptedCookies = accumulated.concat(newDelivered);
        this.currentCustomer.updateProgress(this.currentCustomer.acceptedCookies.length);
        this.deliveryTrayCookies = [];
        this.drawDeliveryTray();

        this.showFeedbackText(`¡Incompleto! Faltan ${requested - totalCount} galletas 😟`, this.trayX, 200, '#d90429');
      }
    } else {
      // Delivered quantity is equal or greater than requested (totalCount >= requested)
      const allCookies = accumulated.concat(newDelivered);

      // Sort all cookies by similarity percentage descending, to evaluate the best ones
      allCookies.sort((a, b) => b.getSimilarityPercentage(recipe) - a.getSimilarityPercentage(recipe));

      // Calculate coins for the best 'requested' cookies
      let totalReward = 0;
      let anyPerfect = false;
      for (let i = 0; i < requested; i++) {
        const sim = allCookies[i].getSimilarityPercentage(recipe);
        if (sim === 100) anyPerfect = true;
        totalReward += Math.round(60 * (sim / 100));
      }

      // Calculate penalty for excess cookies
      const excessCount = totalCount - requested;
      const wastePenalty = excessCount * 15;

      this.coins = Math.max(0, this.coins + totalReward - wastePenalty);
      this.coinsText.setText(`Monedas: ${this.coins}`);

      if (excessCount > 0) {
        this.showFeedbackText(`¡Pedido completo! +${totalReward} (Exceso: -${wastePenalty}) 🗑️`, this.trayX, 200, '#ffb703');
      } else {
        const avgSim = totalReward / (requested * 60);
        let feedback = '¡Pedido completado! 👍';
        let color = '#38b000';
        if (anyPerfect && avgSim >= 0.95) {
          feedback = '¡ENTREGA PERFECTA! 🍪✨';
          this.triggerConfetti();
        } else if (avgSim < 0.6) {
          feedback = '¡Aceptable! 😐';
          color = '#ffb703';
        }
        this.showFeedbackText(`${feedback} +${totalReward} Monedas`, this.trayX, 200, color);
      }

      // Clean up and spawn next
      this.deliveryTrayCookies = [];
      this.drawDeliveryTray();
      this.currentCustomer.destroy();
      this.currentCustomer = null;

      this.time.delayedCall(1500, () => {
        this.spawnCustomer();
      });
    }
  }

  handleCustomerTimeout() {
    this.showFeedbackText('¡Me cansé de esperar! 😡', this.trayX, 200, '#d90429');
    
    // Do NOT reset the cookie or oven state — the player may still want to
    // retrieve the cookie from the oven and reuse it for the next customer.

    if (this.currentCustomer) {
      this.currentCustomer.destroy();
      this.currentCustomer = null;
    }

    this.time.delayedCall(1500, () => {
      this.spawnCustomer();
    });
  }

  showFeedbackText(text, x, y, color) {
    // Lower the Y coordinate to be right above the preparation table (Y ~ 366)
    const targetY = (y === 200) ? (this.trayY - 120) : y;

    const feedbackText = this.add.text(x, targetY, text, {
      font: '26px "Outfit", sans-serif',
      fill: color,
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Simple tween animation (fly up and fade out)
    this.tweens.add({
      targets: feedbackText,
      y: targetY - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  triggerConfetti() {
    const particles = this.add.particles(this.trayX, 200, '__WHITE', {
      x: { min: this.trayX - 200, max: this.trayX + 200 },
      y: 100,
      speedY: { min: 100, max: 300 },
      speedX: { min: -50, max: 50 },
      gravityY: 150,
      scale: { start: 8, end: 0 },
      tint: [ 0xff70a6, 0xff0a54, 0x38b000, 0xffb703 ], // Pastel pinks, green, yellow
      lifespan: 2000,
      maxParticles: 35
    });

    this.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  getClampedY(x, targetY) {
    const centerX = 512;
    const centerMaxY = 215; // Highest reach in the middle (lowest Y)
    const edgeMaxY = 330;   // Lowest reach at the edges (highest Y)
    const deltaY = edgeMaxY - centerMaxY;
    const dx = x - centerX;
    const limitY = centerMaxY + deltaY * (dx * dx) / (centerX * centerX);
    return Math.max(limitY, targetY);
  }

  update(time, delta) {
    // Time-based oven baking calculation (speed up by 15% as requested)
    if (this.isBaking) {
      this.ovenTimeElapsed += (delta / 1000) * 1.15;
      this.updateOvenVisualEffects();
      this.updateOvenBar();
    }

    // Call update on active customer to decrease patience
    if (this.currentCustomer) {
      this.currentCustomer.update(time, delta);
    }

    // Custom Cat Paw Cursor Update
    const pointer = this.input.activePointer;
    if (pointer && this.catPawSprite && this.catArmGraphics) {
      // Lerp paw position to pointer position with a Y clamp limit at Y=180 (top of oven)
      const clampedTargetY = Math.max(180, pointer.y);
      const lerpSpeed = 0.22;
      this.pawX += (pointer.x - this.pawX) * lerpSpeed;
      this.pawY += (clampedTargetY - this.pawY) * lerpSpeed;

      // Position the paw sprite
      this.catPawSprite.setPosition(this.pawX, this.pawY);

      // Bezier curve calculations
      const midX = (this.shoulderX + this.pawX) / 2;
      const midY = (this.shoulderY + this.pawY) / 2;
      const dist = Phaser.Math.Distance.Between(this.shoulderX, this.shoulderY, this.pawX, this.pawY);

      // Control point sags down proportionally to the distance
      const controlX = midX;
      const controlY = midY + dist * 0.15;

      // Calculate tangent angle at the end (from control point to paw position)
      const angle = Phaser.Math.Angle.Between(controlX, controlY, this.pawX, this.pawY);
      this.catPawSprite.setRotation(angle - Math.PI / 2);

      // Redraw the arm graphics
      this.catArmGraphics.clear();

      // Generate Bezier Curve points
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(this.shoulderX, this.shoulderY),
        new Phaser.Math.Vector2(controlX, controlY),
        new Phaser.Math.Vector2(this.pawX, this.pawY)
      );
      const points = curve.getPoints(24);

      // Outer outline (brown)
      this.catArmGraphics.lineStyle(42, 0x582f0e);
      this.catArmGraphics.strokePoints(points);

      // Inner fill (cream fur matching the paw asset)
      this.catArmGraphics.lineStyle(34, 0xf5ebe0);
      this.catArmGraphics.strokePoints(points);
    }
  }

  toggleEditorMode() {
    this.isEditorMode = !this.isEditorMode;
    
    // Toggle visual indicator
    this.editorIndicator.setVisible(this.isEditorMode);

    // Disable standard cursor hiding if in editor mode, so we see normal cursor
    if (this.isEditorMode) {
      this.input.setDefaultCursor('default');
      if (this.catPawSprite) this.catPawSprite.setVisible(false);
    } else {
      this.input.setDefaultCursor('none');
      if (this.catPawSprite) this.catPawSprite.setVisible(true);
      this.selectElement(null);
    }

    // Toggle interactiveness and draggable state for editable UI elements
    this.editableUIElements.forEach(element => {
      if (this.isEditorMode) {
        element.bg.setInteractive({ useHandCursor: true });
        this.input.setDraggable(element.bg);
        // Highlight elements slightly in editor mode so user knows they are editable
        element.bg.setTint(0xffcccc);
      } else {
        element.bg.disableInteractive();
        this.input.setDraggable(element.bg, false);
        element.bg.clearTint();
      }
    });

    this.showFeedbackText(
      this.isEditorMode ? 'Modo Editor Activo 🛠️' : 'Modo Juego Activo 🎮',
      this.cameras.main.width / 2,
      100,
      this.isEditorMode ? '#d90429' : '#38b000'
    );
  }

  selectElement(element) {
    // Clear previous selection tint
    if (this.selectedEditorElement) {
      this.selectedEditorElement.bg.setTint(0xffcccc);
    }

    this.selectedEditorElement = element;
    if (element) {
      element.bg.setTint(0x38b000); // Green tint for selected element
      this.showFeedbackText(`Seleccionado: ${element.key}`, this.cameras.main.width / 2, 100, '#38b000');
    }
  }

  resizeSelectedElement(dw, dh) {
    if (!this.isEditorMode || !this.selectedEditorElement) return;

    const el = this.selectedEditorElement;
    const bg = el.bg;

    // Calculate new size
    const newWidth = Math.max(10, bg.displayWidth + dw);
    const newHeight = Math.max(10, bg.displayHeight + dh);

    bg.setDisplaySize(newWidth, newHeight);

    // Update text offsets if needed
    if (el.key === 'daySign') {
      el.textOffsetX = newWidth / 2;
    } else if (el.key === 'metaSign') {
      el.textOffsetX = -newWidth / 2;
    }

    // Reposition text if present
    if (el.text) {
      el.text.x = bg.x + el.textOffsetX;
      el.text.y = bg.y + el.textOffsetY;
    }
  }

  saveUIConfig() {
    // Generate config matching ui-config.json format
    const newConfig = {};

    // Get current values from active sprites
    this.editableUIElements.forEach(element => {
      // Find original config values to preserve textFontSize, textOffsetY, etc.
      const originalKey = element.key;
      const original = UI_CONFIG[originalKey];

      newConfig[originalKey] = {
        width: Math.round(element.bg.displayWidth),
        height: Math.round(element.bg.displayHeight),
        x: Math.round(element.bg.x),
        y: Math.round(element.bg.y)
      };

      // Preserve special text properties if they exist
      if (original.textFontSize !== undefined) newConfig[originalKey].textFontSize = original.textFontSize;
      if (original.textOffsetY !== undefined) newConfig[originalKey].textOffsetY = original.textOffsetY;
    });

    const jsonStr = JSON.stringify(newConfig, null, 2);

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        this.showFeedbackText('¡Configuración copiada al portapapeles! 📋', this.cameras.main.width / 2, 100, '#38b000');
        console.log('--- NUEVO UI CONFIG (COPIADO) ---');
        console.log(jsonStr);
      }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        this.showFeedbackText('Error al copiar. Mira la consola (F12). ⚠️', this.cameras.main.width / 2, 100, '#d90429');
        console.log('--- NUEVO UI CONFIG (Copia manual) ---');
        console.log(jsonStr);
      });
    } else {
      this.showFeedbackText('Copiado fallido. Mira la consola (F12). ⚠️', this.cameras.main.width / 2, 100, '#d90429');
      console.log('--- NUEVO UI CONFIG ---');
      console.log(jsonStr);
    }
  }

  createDeliveryTray() {
    this.deliveryTrayX = 512;
    this.deliveryTrayY = 370;

    // Draw the wooden tray background
    this.deliveryTrayBg = this.add.graphics();
    
    // Draw a nice rounded rectangle tray with a brown border
    this.deliveryTrayBg.fillStyle(0xe6ccb2, 1);
    this.deliveryTrayBg.lineStyle(3, 0x7f5539, 1);
    this.deliveryTrayBg.fillRoundedRect(this.deliveryTrayX - 100, this.deliveryTrayY - 25, 200, 50, 8);
    this.deliveryTrayBg.strokeRoundedRect(this.deliveryTrayX - 100, this.deliveryTrayY - 25, 200, 50, 8);
    this.deliveryTrayBg.setDepth(1);

    // Text label on the tray
    this.deliveryTrayLabel = this.add.text(this.deliveryTrayX, this.deliveryTrayY - 33, 'BANDEJA DE ENTREGA', {
      font: '9px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(2);

    // Group or list to hold the rendered cookie sprites on the tray
    this.deliveryTraySprites = [];
    
    // Trash button to the left (X = 380, Y = 370)
    const trashBg = this.add.graphics().setDepth(2);
    trashBg.fillStyle(0xd90429, 1);
    trashBg.fillRoundedRect(this.deliveryTrayX - 145, this.deliveryTrayY - 15, 35, 30, 8);
    this.deliveryTrashText = this.add.text(this.deliveryTrayX - 127, this.deliveryTrayY, '🗑️', {
      font: '14px "Outfit", sans-serif',
      fill: '#ffffff'
    }).setOrigin(0.5).setDepth(2);
    
    this.deliveryTrashZone = this.add.rectangle(this.deliveryTrayX - 127, this.deliveryTrayY, 35, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.deliveryTrashZone.on('pointerdown', () => {
      this.trashDeliveryTray();
    });

    // Deliver button to the right (X = 644, Y = 370)
    const deliverBg = this.add.graphics().setDepth(2);
    deliverBg.fillStyle(0x38b000, 1);
    deliverBg.fillRoundedRect(this.deliveryTrayX + 110, this.deliveryTrayY - 15, 75, 30, 8);
    this.add.text(this.deliveryTrayX + 147, this.deliveryTrayY, 'ENTREGAR', {
      font: '11px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(2);

    this.deliveryDeliverZone = this.add.rectangle(this.deliveryTrayX + 147, this.deliveryTrayY, 75, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.deliveryDeliverZone.on('pointerdown', () => {
      this.deliverCookie();
    });
  }

  drawDeliveryTray() {
    // Clear old sprites
    this.deliveryTraySprites.forEach(sprite => sprite.destroy());
    this.deliveryTraySprites = [];

    // Draw cookies in a horizontal row on the tray
    const count = this.deliveryTrayCookies.length;
    if (count === 0) return;

    const spacing = 35;
    const startX = this.deliveryTrayX - ((count - 1) * spacing) / 2;

    this.deliveryTrayCookies.forEach((cookie, index) => {
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      const x = startX + index * spacing;
      const y = this.deliveryTrayY;

      const sprite = this.add.image(x, y, key).setDisplaySize(40, 40).setDepth(2);
      this.deliveryTraySprites.push(sprite);
    });
  }

  trashDeliveryTray() {
    const count = this.deliveryTrayCookies.length;
    if (count === 0) return;

    // Cost: -5 coins per cookie
    const penalty = count * 5;
    this.coins = Math.max(0, this.coins - penalty);
    this.coinsText.setText(`Monedas: ${this.coins}`);

    this.deliveryTrayCookies = [];
    this.drawDeliveryTray();
    
    this.showFeedbackText(`-${penalty} Monedas (Desperdicio) 🗑️`, this.deliveryTrayX, 200, '#d90429');
  }

  handleOvenImageClick() {
    if (this.isBaking) {
      this.showFeedbackText('¡El horno está encendido!', this.ovenX, 200, '#d90429');
      return;
    }
    if (this.cookiesInOven.length === 0) {
      this.showFeedbackText('¡El horno está vacío!', this.ovenX, 200, '#d90429');
      return;
    }

    // Move all cookies from oven to delivery tray together
    this.cookiesInOven.forEach((cookie, index) => {
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      // Spawn a temporary cookie image for the flight animation
      const flightSprite = this.add.image(this.ovenX, this.ovenY, key)
        .setDisplaySize(50, 50)
        .setDepth(100);

      // Tween to the delivery tray position
      this.tweens.add({
        targets: flightSprite,
        x: this.deliveryTrayX,
        y: this.deliveryTrayY,
        scale: 0.8,
        duration: 350 + index * 100,
        ease: 'Cubic.out',
        onComplete: () => {
          flightSprite.destroy();
          this.deliveryTrayCookies.push(cookie);
          this.drawDeliveryTray();
        }
      });
    });

    this.cookiesInOven = [];
    this.showFeedbackText('¡Retirando galletas!', this.ovenX, 200, '#38b000');
    this.updateExtractButtonState();
  }

  drawOvenExtractBtn(enabled) {
    this.ovenExtractBtnBg.clear();
    if (enabled) {
      this.ovenExtractBtnBg.fillStyle(0xd48c47, 1); // Nice warm orange-brown
    } else {
      this.ovenExtractBtnBg.fillStyle(0x7f5539, 0.4); // Semi-transparent disabled state
    }
    this.ovenExtractBtnBg.fillRoundedRect(this.ovenStartX, this.ovenStartY + 125, 110, 30, 8);
  }

  updateExtractButtonState() {
    const enabled = !this.isBaking && this.cookiesInOven && this.cookiesInOven.length > 0;
    this.drawOvenExtractBtn(enabled);
    if (this.ovenExtractBtnText) {
      this.ovenExtractBtnText.setAlpha(enabled ? 1.0 : 0.5);
    }
  }
}
