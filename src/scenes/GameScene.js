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
      { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: [] }
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
    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;
    this.config = DAY_CONFIGS[this.day];

    // Load state from data, or fallback to Day 1 starting kit
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 0, choco: 0, glazing: 0 },
      drink: { coffee_beans: 0, milk: 0 }
    };
    this.stock.drink = this.stock.drink || { coffee_beans: 0, milk: 0 };

    // Save starting state of the day for re-tries
    this.coinsAtStart = this.coins;
    this.loanRemainingAtStart = this.loanRemaining;
    this.unlockedShapesAtStart = [...this.unlockedShapes];
    this.stockAtStart = JSON.parse(JSON.stringify(this.stock));
    
    // Core game state variables
    this.customersSpawned = 0;
    this.currentCustomer = null;
    
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
    
    // Time-based oven state
    this.isBaking = false;
    this.cookiesInOven = []; // Holds Cookie instances currently in the oven
    this.deliveryTrayCookies = []; // Holds Cookie instances currently on the delivery tray
    this.deliveryTrayDrinks = []; // Holds drinks (strings like 'coffee', 'milk', 'coffee_milk') currently on the delivery tray
    this.prepTrayCookies = []; // Holds Cookie instances currently on the preparation tray
    this.ovenTimeElapsed = 0;

    // Drink machine state
    this.machineState = 'empty'; // 'empty', 'brewing_coffee', 'brewing_milk', 'ready_coffee', 'ready_milk', 'ready_coffee_milk'
    this.machineCupSprite = null;
    this.machineTimer = null;
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
    this.updateStockTexts();

    // Create Cookie Tray (Preparation Area)
    this.createCookieTray(width, height);

    // Create Delivery Tray (Serving Area)
    this.createDeliveryTray();

    // Create Trash Bin (Disposal Area)
    this.createTrashBin();

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
      { key: 'toppingLabel', bg: this.toppingLabelImage, text: null },
      { key: 'deliveryTray', bg: this.deliveryDragZone, text: this.deliveryTrayLabel, textOffsetX: 0, textOffsetY: -33 }
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

        // Custom updates for specialized stations
        if (element.key === 'formaLabel') {
          // Move the cutters (shape buttons) dynamically!
          if (this.shapeContainers && this.shapeDragZones) {
            this.shapeContainers.forEach((container, index) => {
              const sx = dragX - 93 + index * 60;
              const sy = dragY + 58;
              container.x = sx;
              container.y = sy;
              container.setData('origX', sx);
              container.setData('origY', sy);
              
              const dragZone = this.shapeDragZones[index];
              if (dragZone) {
                dragZone.x = sx + 29;
                dragZone.y = sy + 29;
              }
            });
          }
        } else if (element.key === 'deliveryTray') {
          this.deliveryTrayX = dragX;
          this.deliveryTrayY = dragY;
          this.drawDeliveryTrayBg(0xccffcc); // Draw highlighted color while dragging
          this.drawDeliveryTray(); // Redraw cookies in new location
        }

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
    const { formaLabel } = UI_CONFIG;
    this.createShapeButtons(formaLabel.x - 88, formaLabel.y + 13);

    // Column 3: Horno (Oven minigame)
    this.createOvenStation(725, 310);

    // Column 3.5: Bebidas (Drinks Station)
    this.createDrinkStation(650, 290);

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
      { id: 'classic', label: 'Clásica', color: 0xf5ebe0 },
      { id: 'chocolate', label: 'Choco', color: 0x4f1200 },
      { id: 'oat', label: 'Avena', color: 0xd5bdaf }
    ];

    const doughSize = 105;
    const doughHoverSize = 115;
    const portionSize = 55;

    this.doughButtons = {};
    this.doughStockTexts = {};

    bases.forEach((b, index) => {
      const x = startX + 35;
      const y = startY + 45 + index * 80;

      // Dough source image
      const doughImg = this.add.image(x, y, 'dough_' + b.id)
        .setDisplaySize(doughSize, doughSize)
        .setDepth(2);
      
      this.doughButtons[b.id] = doughImg;

      // Add stock indicator text
      const stockText = this.add.text(x, y + 42, '', {
        font: '11px "Outfit", sans-serif',
        fill: '#ffffff',
        stroke: '#582f0e',
        strokeThickness: 3,
        fontWeight: '800'
      }).setOrigin(0.5).setDepth(3);
      
      this.doughStockTexts[b.id] = stockText;

      // Create an invisible drag zone on top
      const dragZone = this.add.rectangle(x, y, doughSize, doughSize, 0x000000, 0);
      dragZone.setInteractive({ useHandCursor: true });
      this.input.setDraggable(dragZone);

      let portionSprite = null;

      dragZone.on('pointerover', () => {
        const currentStock = this.stock.dough[b.id] || 0;
        if (currentStock > 0) {
          doughImg.setDisplaySize(doughHoverSize, doughHoverSize);
        }
      });
      
      dragZone.on('pointerout', () => {
        doughImg.setDisplaySize(doughSize, doughSize);
      });

      dragZone.on('dragstart', () => {
        const currentStock = this.stock.dough[b.id] || 0;
        if (currentStock <= 0) {
          this.showFeedbackText('¡Sin stock! Cómpralo en la tienda 🛒', this.trayX, 200, '#d90429');
          return;
        }

        portionSprite = this.add.image(dragZone.x, dragZone.y, 'dough_' + b.id);
        portionSprite.setDisplaySize(portionSize, portionSize);
        portionSprite.setDepth(1000);
        portionSprite.setAlpha(0.9);
        doughImg.setDisplaySize(doughSize - 10, doughSize - 10);
      });

      dragZone.on('drag', (pointer, dragX, dragY) => {
        if (portionSprite) {
          portionSprite.x = dragX;
          portionSprite.y = Math.max(180, dragY);
        }
      });

      dragZone.on('dragend', () => {
        if (!portionSprite) {
          doughImg.setDisplaySize(doughSize, doughSize);
          dragZone.x = x;
          dragZone.y = y;
          return;
        }

        const dist = Phaser.Math.Distance.Between(
          portionSprite.x, portionSprite.y,
          this.trayX, this.trayY
        );

        if (dist < 120) {
          if (this.prepTrayCookies.length < 3) {
            // Consume stock!
            this.stock.dough[b.id]--;
            this.updateStockTexts();

            const newCookie = new Cookie();
            newCookie.base = b.id;
            this.prepTrayCookies.push(newCookie);
            this.updateCookieVisuals();
            this.showFeedbackText(`¡Masa de ${b.label}!`, this.trayX, 200, '#38b000');
          } else {
            this.showFeedbackText('¡Mesa llena! (Máx 3)', this.trayX, 200, '#d90429');
          }
        }

        if (portionSprite) {
          portionSprite.destroy();
          portionSprite = null;
        }

        doughImg.setDisplaySize(doughSize, doughSize);
        dragZone.x = x;
        dragZone.y = y;
      });
    });
  }

  createShapeButtons(startX, startY) {
    const { formaLabel } = UI_CONFIG;
    this.formaLabelImage = this.add.image(formaLabel.x, formaLabel.y, 'forma_label')
      .setDisplaySize(formaLabel.width, formaLabel.height)
      .setOrigin(0.5)
      .setDepth(1);

    this.shapeContainers = [];
    this.shapeDragZones = [];

    const shapes = [
      { id: 'star', label: 'Estrella' },
      { id: 'heart', label: 'Corazón' },
      { id: 'cat', label: 'Gato' },
      { id: 'fish', label: 'Pez' }
    ];

    shapes.forEach((s, index) => {
      const isUnlocked = this.unlockedShapes.includes(s.id);

      // Horizontal layout (X spacing: 60, starting at startX - 5, Y is startY + 45)
      const x = startX - 5 + index * 60;
      const y = startY + 45;

      const container = this.add.container(x, y).setDepth(2);
      container.setData('origX', x);
      container.setData('origY', y);
      this.shapeContainers.push(container);

      // Cutter Image (116x116 texture displayed at 58x58 — 2x downscale for HiDPI)
      const shapeSprite = this.add.image(29, 29, 'shape_' + s.id).setDisplaySize(58, 58);
      if (!isUnlocked) {
        shapeSprite.setTint(0x777777);
        shapeSprite.setAlpha(0.4);
      }
      container.add(shapeSprite);

      if (isUnlocked) {
        // Create a flat transparent rectangle as the interactive drag zone
        const dragZone = this.add.rectangle(x + 29, y + 29, 58, 58, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);
        this.shapeDragZones.push(dragZone);

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
          // Find closest cookie in prepTrayCookies that doesn't have a shape yet
          let closestCookie = null;
          let minDist = 99999;
          const count = this.prepTrayCookies.length;
          const spacing = 35;
          const startX = this.trayX - ((count - 1) * spacing) / 2;

          this.prepTrayCookies.forEach((cookie, index) => {
            const cx = startX + index * spacing;
            const cy = this.trayY;
            const dist = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, cx, cy);
            if (dist < 120 && dist < minDist) {
              minDist = dist;
              closestCookie = cookie;
            }
          });

          if (closestCookie) {
            closestCookie.shape = s.id;
            this.updateCookieVisuals();
            this.showFeedbackText(`¡Forma de ${s.label}!`, this.trayX, 200, '#38b000');
          } else {
            const distToTrayCenter = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, this.trayX, this.trayY);
            if (distToTrayCenter < 120) {
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
      .setDepth(2);
    
    // Set a custom bounded hit area to prevent clicking outside the visible oven
    const hitW = 90;
    const hitH = 95;
    const hitX = (this.ovenImage.width - hitW) / 2;
    const hitY = (this.ovenImage.height - hitH) / 2;
    this.ovenImage.setInteractive(new Phaser.Geom.Rectangle(hitX, hitY, hitW, hitH), Phaser.Geom.Rectangle.Contains);
    
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
 
    this.ovenZone = this.add.rectangle(startX + 55, startY + 62, 95, 35, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(12);
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

    this.ovenExtractZone = this.add.rectangle(startX + 55, startY + 140, 95, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);

    this.ovenExtractZone.on('pointerdown', () => {
      this.handleOvenImageClick();
    });

    this.updateExtractButtonState();
  }

  createDrinkStation(startX, startY) {
    // 1. Label
    this.drinkLabelText = this.add.text(startX, startY - 68, 'CAFETERÍA', {
      font: '12px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800',
      stroke: '#fff1e6',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2);

    // 2. Espresso Machine
    this.drinkMachine = this.add.image(startX, startY, 'drink_machine')
      .setDepth(2);
    
    // Set machine interactive to provide helpful hints on tap
    this.drinkMachine.setInteractive({ useHandCursor: true });
    this.drinkMachine.on('pointerdown', () => {
      if (this.machineState === 'empty') {
        this.showFeedbackText('¡Presiona Café o Leche para preparar! ☕🥛', startX, 200, '#582f0e');
      } else if (this.machineState.startsWith('ready_')) {
        this.pickupDrink();
      } else {
        this.showFeedbackText('¡Preparando bebida...! ⏳', startX, 200, '#582f0e');
      }
    });

    // 3. Serve Button (drawn dynamically when a drink is ready)
    this.drinkServeBtnBg = this.add.graphics().setDepth(5);
    this.drinkServeBtnText = this.add.text(startX, startY + 52, 'SERVIR', {
      font: '10px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(6);
    this.drinkServeBtnText.setVisible(false);

    this.drinkServeZone = this.add.rectangle(startX, startY + 52, 70, 24, 0x000000, 0)
      .setDepth(7);
    this.drinkServeZone.on('pointerdown', () => {
      this.pickupDrink();
    });

    // 4. Ingredient Click Zones directly on the machine panel (Coffee Beans at left, Milk at center-right)
    const btnSize = 22;
    const beansX = startX - 25;
    const milkX = startX + 5;
    const btnY = startY - 29;

    // Coffee Button Click Zone and Stock Text
    this.beansStockText = this.add.text(beansX, startY - 14, '0u', {
      font: 'bold 9px "Outfit", sans-serif',
      fill: '#5c3d2e',
      stroke: '#ffffff',
      strokeThickness: 1.5
    }).setOrigin(0.5).setDepth(3);

    const beansDragZone = this.add.rectangle(beansX, btnY, btnSize, btnSize, 0x000000, 0);
    beansDragZone.setInteractive({ useHandCursor: true });

    // Milk Button Click Zone and Stock Text
    this.milkStockText = this.add.text(milkX, startY - 14, '0u', {
      font: 'bold 9px "Outfit", sans-serif',
      fill: '#0077b6',
      stroke: '#ffffff',
      strokeThickness: 1.5
    }).setOrigin(0.5).setDepth(3);

    const milkDragZone = this.add.rectangle(milkX, btnY, btnSize, btnSize, 0x000000, 0);
    milkDragZone.setInteractive({ useHandCursor: true });

    this.updateDrinkStockTexts();

    // 5. Button click events (No drag-and-drop)
    beansDragZone.on('pointerover', () => {
      this.beansStockText.setScale(1.2);
    });
    beansDragZone.on('pointerout', () => {
      this.beansStockText.setScale(1.0);
    });
    beansDragZone.on('pointerdown', () => {
      const stock = this.stock.drink.coffee_beans || 0;
      if (stock <= 0) {
        this.showFeedbackText('¡Sin stock de Café! Cómpralo en la tienda 🛒', startX, 200, '#d90429');
        return;
      }
      
      // Text bounce animation
      this.tweens.add({
        targets: this.beansStockText,
        scale: 1.4,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut'
      });

      this.handleDrinkIngredientDrop('coffee_beans', startX, startY);
    });

    milkDragZone.on('pointerover', () => {
      this.milkStockText.setScale(1.2);
    });
    milkDragZone.on('pointerout', () => {
      this.milkStockText.setScale(1.0);
    });
    milkDragZone.on('pointerdown', () => {
      const stock = this.stock.drink.milk || 0;
      if (stock <= 0) {
        this.showFeedbackText('¡Sin stock de Leche! Cómpralo en la tienda 🛒', startX, 200, '#d90429');
        return;
      }

      // Text bounce animation
      this.tweens.add({
        targets: this.milkStockText,
        scale: 1.4,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut'
      });

      this.handleDrinkIngredientDrop('milk', startX, startY);
    });
  }

  updateDrinkStockTexts() {
    if (this.beansStockText) {
      this.beansStockText.setText(`${this.stock.drink.coffee_beans || 0}u`);
    }
    if (this.milkStockText) {
      this.milkStockText.setText(`${this.stock.drink.milk || 0}u`);
    }
  }

  updateDrinkServeButtonState(startX, startY) {
    const isReady = this.machineState.startsWith('ready_');
    this.drinkServeBtnBg.clear();
    
    if (isReady) {
      this.drinkServeBtnBg.fillStyle(0x38b000, 1);
      this.drinkServeBtnBg.fillRoundedRect(startX - 35, startY + 40, 70, 24, 6);
      this.drinkServeBtnBg.lineStyle(1.5, 0xffffff, 1);
      this.drinkServeBtnBg.strokeRoundedRect(startX - 35, startY + 40, 70, 24, 6);
      
      this.drinkServeBtnText.setVisible(true);
      this.drinkServeZone.setInteractive({ useHandCursor: true });
    } else {
      this.drinkServeBtnText.setVisible(false);
      this.drinkServeZone.disableInteractive();
    }
  }

  handleDrinkIngredientDrop(type, startX, startY) {
    // Check if machine is in a state to accept ingredients
    if (this.machineState === 'empty') {
      // Deduct stock
      this.stock.drink[type]--;
      this.updateDrinkStockTexts();

      // Start brewing
      this.machineState = type === 'coffee_beans' ? 'brewing_coffee' : 'brewing_milk';
      
      // Draw progress bar above the machine (Y = startY - 60)
      const progressBg = this.add.graphics().setDepth(20);
      progressBg.fillStyle(0xdddddd, 1);
      progressBg.fillRoundedRect(startX - 30, startY - 55, 60, 6, 3);

      const progressBar = this.add.graphics().setDepth(21);
      
      // Place a faded cup on the machine
      const cupKey = type === 'coffee_beans' ? 'beverage_coffee' : 'beverage_milk';
      this.machineCupSprite = this.add.image(startX, startY + 18, cupKey)
        .setDisplaySize(40, 40)
        .setAlpha(0.4)
        .setDepth(4);

      let elapsed = 0;
      const duration = 3000; // 3 seconds brew time
      
      this.machineTimer = this.time.addEvent({
        delay: 100,
        repeat: 30,
        callback: () => {
          elapsed += 100;
          const ratio = Math.min(1, elapsed / duration);
          
          progressBar.clear();
          progressBar.fillStyle(0x38b000, 1);
          progressBar.fillRoundedRect(startX - 30, startY - 55, 60 * ratio, 6, 3);

          if (elapsed >= duration) {
            progressBg.destroy();
            progressBar.destroy();

            // Brew finished!
            this.machineState = type === 'coffee_beans' ? 'ready_coffee' : 'ready_milk';
            
            if (this.machineCupSprite) {
              this.machineCupSprite.setAlpha(1.0);
              
              // Pulsing visual effect to show it is ready
              this.tweens.add({
                targets: this.machineCupSprite,
                scale: 1.15,
                duration: 250,
                yoyo: true,
                repeat: 1,
                ease: 'Quad.easeInOut'
              });

              // Set cup interactive to click-and-pickup
              this.machineCupSprite.setInteractive({ useHandCursor: true });
              this.machineCupSprite.on('pointerdown', () => {
                this.pickupDrink();
              });
            }
            
            // Show serve button
            this.updateDrinkServeButtonState(startX, startY);
            
            this.showFeedbackText('¡Bebida lista! ☕', startX, 200, '#38b000');
          }
        }
      });
    } else if (this.machineState === 'ready_coffee' && type === 'milk') {
      // Upgrade Coffee to Coffee with Milk
      this.stock.drink.milk--;
      this.updateDrinkStockTexts();

      this.machineState = 'ready_coffee_milk';
      if (this.machineCupSprite) {
        this.machineCupSprite.setTexture('beverage_coffee_milk');
        this.tweens.add({
          targets: this.machineCupSprite,
          scale: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Bounce.easeOut'
        });
      }
      this.updateDrinkServeButtonState(startX, startY);
      this.showFeedbackText('¡Café con leche! ☕🥛', startX, 200, '#38b000');
    } else if (this.machineState === 'ready_milk' && type === 'coffee_beans') {
      // Upgrade Milk to Coffee with Milk
      this.stock.drink.coffee_beans--;
      this.updateDrinkStockTexts();

      this.machineState = 'ready_coffee_milk';
      if (this.machineCupSprite) {
        this.machineCupSprite.setTexture('beverage_coffee_milk');
        this.tweens.add({
          targets: this.machineCupSprite,
          scale: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Bounce.easeOut'
        });
      }
      this.updateDrinkServeButtonState(startX, startY);
      this.showFeedbackText('¡Café con leche! ☕🥛', startX, 200, '#38b000');
    } else {
      this.showFeedbackText('¡La máquina está ocupada! ☕', startX, 200, '#d90429');
    }
  }

  pickupDrink() {
    if (!this.machineCupSprite || !this.machineState.startsWith('ready_')) return;

    // Convert ready state to beverage string
    let drinkKey = 'coffee';
    if (this.machineState === 'ready_milk') drinkKey = 'milk';
    else if (this.machineState === 'ready_coffee_milk') drinkKey = 'coffee_milk';

    // Add to delivery tray drinks!
    this.deliveryTrayDrinks.push(drinkKey);
    this.drawDeliveryTray();

    // Destroy cup sprite on machine and reset state
    this.machineCupSprite.destroy();
    this.machineCupSprite = null;
    
    const startX = this.drinkMachine.x;
    const startY = this.drinkMachine.y;
    this.machineState = 'empty';

    // Hide serve button
    this.updateDrinkServeButtonState(startX, startY);

    let label = 'Café';
    if (drinkKey === 'milk') label = 'Leche';
    else if (drinkKey === 'coffee_milk') label = 'Café c/Leche';
    this.showFeedbackText(`¡${label} servido! ☕`, startX, 200, '#38b000');
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
      this.ovenBtnText.setText('APAGAR');
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
      { id: 'sprinkles', label: 'Chispas', color: 0xff70a6 },
      { id: 'choco', label: 'Choco', color: 0x3d0c00 },
      { id: 'glazing', label: 'Glaseado', color: 0xff0a54 }
    ];

    const jarSize = 84;
    const jarHoverSize = 92;

    this.toppingButtons = {};
    this.toppingStockTexts = {};

    toppings.forEach((t, index) => {
      const x = startX + 10 + 42; // center of jar
      const y = startY + index * 80 + 42;

      // Topping Jar sprite
      const jarSource = this.add.image(x, y, 'topping_' + t.id).setDisplaySize(jarSize, jarSize).setDepth(2);
      this.toppingButtons[t.id] = jarSource;

      // Stock indicator text
      const stockText = this.add.text(x, y + 36, '', {
        font: '11px "Outfit", sans-serif',
        fill: '#ffffff',
        stroke: '#582f0e',
        strokeThickness: 3,
        fontWeight: '800'
      }).setOrigin(0.5).setDepth(3);
      this.toppingStockTexts[t.id] = stockText;

      // Invisible drag zone
      const dragZone = this.add.rectangle(x, y, jarSize, jarSize, 0x000000, 0);
      dragZone.setInteractive({ useHandCursor: true });
      this.input.setDraggable(dragZone);

      let jarClone = null;
      let initialDist = 0;

      dragZone.on('pointerover', () => {
        const currentStock = this.stock.topping[t.id] || 0;
        if (currentStock > 0) {
          jarSource.setDisplaySize(jarHoverSize, jarHoverSize);
        }
      });
      
      dragZone.on('pointerout', () => {
        jarSource.setDisplaySize(jarSize, jarSize);
      });

      dragZone.on('dragstart', () => {
        const currentStock = this.stock.topping[t.id] || 0;
        if (currentStock <= 0) {
          this.showFeedbackText('¡Sin stock! Cómpralo en la tienda 🛒', this.trayX, 200, '#d90429');
          return;
        }

        jarClone = this.add.image(x, y, 'topping_' + t.id);
        jarClone.setDisplaySize(jarSize, jarSize);
        jarClone.setDepth(1000);
        jarSource.setAlpha(0.35);
        initialDist = Phaser.Math.Distance.Between(x, y, this.trayX, this.trayY);
      });

      dragZone.on('drag', (pointer, dragX, dragY) => {
        if (!jarClone) return;
        const clampedY = Math.max(180, dragY);
        jarClone.x = dragX;
        jarClone.y = clampedY;

        const currentDist = Phaser.Math.Distance.Between(dragX, clampedY, this.trayX, this.trayY);
        const ratio = Phaser.Math.Clamp(1 - (currentDist / initialDist), 0, 1);
        const direction = (dragX >= this.trayX) ? -1 : 1;
        jarClone.setRotation(direction * ratio * Math.PI);
      });

      dragZone.on('dragend', () => {
        if (!jarClone) {
          jarSource.setDisplaySize(jarSize, jarSize);
          dragZone.x = x;
          dragZone.y = y;
          return;
        }

        const dist = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, this.trayX, this.trayY);

        if (dist < 120) {
          // Find closest cookie on preparation tray
          let closestCookie = null;
          let minDist = 99999;
          const count = this.prepTrayCookies.length;
          const spacing = 35;
          const startXLoc = this.trayX - ((count - 1) * spacing) / 2;

          this.prepTrayCookies.forEach((cookie, index) => {
            const cx = startXLoc + index * spacing;
            const cy = this.trayY;
            const distCookie = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, cx, cy);
            if (distCookie < 120 && distCookie < minDist) {
              minDist = distCookie;
              closestCookie = cookie;
            }
          });

          if (closestCookie) {
            // Consume stock!
            this.stock.topping[t.id]--;
            this.updateStockTexts();

            closestCookie.toppings = [t.id];
            this.updateCookieVisuals();
            this.showFeedbackText(`¡Añadido ${t.label}! ✨`, this.trayX, 200, '#38b000');
          } else {
            const distToTrayCenter = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, this.trayX, this.trayY);
            if (distToTrayCenter < 120) {
              this.showFeedbackText('¡Primero selecciona la masa!', this.trayX, 200, '#d90429');
            }
          }
        }

        jarClone.destroy();
        jarClone = null;
        jarSource.setAlpha(1);
        jarSource.setDisplaySize(jarSize, jarSize);
        dragZone.x = x;
        dragZone.y = y;
      });
    });
  }

  updateStockTexts() {
    // 1. Dough Stock
    if (this.doughStockTexts) {
      Object.keys(this.doughStockTexts).forEach(id => {
        const qty = this.stock.dough[id];
        const textObj = this.doughStockTexts[id];
        const imgObj = this.doughButtons[id];
        if (textObj) {
          textObj.setText(qty === Infinity ? 'Stock: ∞' : `Stock: ${qty}`);
          // Update visual tint
          if (imgObj) {
            if (qty <= 0) {
              imgObj.setTint(0x777777);
              imgObj.setAlpha(0.5);
            } else {
              imgObj.clearTint();
              imgObj.setAlpha(1);
            }
          }
        }
      });
    }

    // 2. Topping Stock
    if (this.toppingStockTexts) {
      Object.keys(this.toppingStockTexts).forEach(id => {
        const qty = this.stock.topping[id];
        const textObj = this.toppingStockTexts[id];
        const imgObj = this.toppingButtons[id];
        if (textObj) {
          textObj.setText(`Stock: ${qty}`);
          // Update visual tint
          if (imgObj) {
            if (qty <= 0) {
              imgObj.setTint(0x777777);
              imgObj.setAlpha(0.5);
            } else {
              imgObj.clearTint();
              imgObj.setAlpha(1);
            }
          }
        }
      });
    }
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


    this.prepTraySprites = [];
  }

  drawCookie() {
    // Clear old prep tray sprites if any
    if (this.prepTraySprites) {
      this.prepTraySprites.forEach(s => s.destroy());
    }
    this.prepTraySprites = [];

    // If we have cookies in prepTrayCookies, draw them in a row
    if (this.prepTrayCookies && this.prepTrayCookies.length > 0) {
      const count = this.prepTrayCookies.length;
      const spacing = 45;
      const startX = this.trayX - ((count - 1) * spacing) / 2;

      this.prepTrayCookies.forEach((cookie, index) => {
        let key = '';
        let isShaped = !!cookie.shape;

        if (isShaped) {
          key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
          if (cookie.toppings && cookie.toppings[0]) {
            key += `_${cookie.toppings[0]}`;
          }
        } else {
          key = `dough_${cookie.base}`;
        }

        // Check if texture exists, fallback to standard dough if not
        if (!this.textures.exists(key)) {
          key = `dough_${cookie.base}`;
        }

        const x = startX + index * spacing;
        const y = this.trayY;

        const size = isShaped ? 55 : 45;
        const sprite = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(3);
        sprite.setInteractive({ useHandCursor: true });
        this.input.setDraggable(sprite);

        sprite.setData('cookieIndex', index);
        sprite.setData('origX', x);
        sprite.setData('origY', y);

        sprite.on('dragstart', () => {
          sprite.setDepth(1000);
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
          sprite.x = dragX;
          sprite.y = Math.max(180, dragY);

          // Check if hovering over trash bin
          const distToTrash = Phaser.Math.Distance.Between(dragX, Math.max(180, dragY), this.trashBinX, this.trashBinY);
          if (distToTrash < 70) {
            if (!this.trashHighlighted) {
              this.trashHighlighted = true;
              this.tweens.add({
                targets: this.trashContainer,
                scale: 1.15,
                duration: 100
              });
              if (this.trashIconText) this.trashIconText.setTint(0xff6b6b);
            }
          } else {
            if (this.trashHighlighted) {
              this.trashHighlighted = false;
              this.tweens.add({
                targets: this.trashContainer,
                scale: 1.0,
                duration: 100
              });
              if (this.trashIconText) this.trashIconText.clearTint();
            }
          }
        });

        sprite.on('dragend', () => {
          // Reset highlights
          if (this.trashHighlighted) {
            this.trashHighlighted = false;
            if (this.trashContainer) this.trashContainer.setScale(1.0);
            if (this.trashIconText) this.trashIconText.clearTint();
          }

          const distOven = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.ovenX, this.ovenY);
          const distDelivery = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.deliveryTrayX, this.deliveryTrayY);
          const distTrash = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.trashBinX, this.trashBinY);

          const cookieIdx = sprite.getData('cookieIndex');
          const cookieInstance = this.prepTrayCookies[cookieIdx];

          // 1. Drop on Trash Bin
          if (distTrash < 70) {
            this.prepTrayCookies.splice(cookieIdx, 1);
            this.updateCookieVisuals();
            this.showFeedbackText('¡Desechada! 🗑️', this.trashBinX, this.trashBinY - 50, '#d90429');

            // Play vacuum fade/shrink animation
            this.tweens.add({
              targets: sprite,
              x: this.trashBinX,
              y: this.trashBinY,
              scale: 0.1,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                sprite.destroy();
                this.updateCookieVisuals();
              }
            });
            return;
          }

          // 2. Drop on Delivery Tray
          if (distDelivery < 100) {
            if (!cookieInstance.shape) {
              this.showFeedbackText('¡Primero corta la forma!', this.trayX, 200, '#d90429');
            } else {
              this.deliveryTrayCookies.push(cookieInstance);
              this.prepTrayCookies.splice(cookieIdx, 1);
              this.drawDeliveryTray();
              this.updateCookieVisuals();
              this.showFeedbackText('¡Galleta lista para entrega! 📦', this.deliveryTrayX, 200, '#38b000');
              return;
            }
          }

          // 3. Drop on Oven (only if shaped, oven has space, and not baking)
          if (distOven < 120) {
            if (this.isBaking) {
              this.showFeedbackText('¡El horno está encendido!', this.trayX, 200, '#d90429');
            } else if (this.cookiesInOven.length >= 3) {
              this.showFeedbackText('¡El horno está lleno! (Máx 3)', this.trayX, 200, '#d90429');
            } else if (!cookieInstance.shape) {
              this.showFeedbackText('¡Primero corta la forma!', this.trayX, 200, '#d90429');
            } else {
              // Valid drop in oven!
              this.cookiesInOven.push(cookieInstance);
              this.prepTrayCookies.splice(cookieIdx, 1);
              this.updateExtractButtonState();
              this.showFeedbackText(`Galleta introducida (${this.cookiesInOven.length}/3) 🍪`, this.trayX, 200, '#38b000');

              // Play shrink and fade animation
              this.tweens.add({
                targets: sprite,
                x: this.ovenX,
                y: this.ovenY,
                scale: 0.1,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  sprite.destroy();
                  this.updateCookieVisuals();
                }
              });
              return;
            }
          }

          // Failed or non-target drop: tween back to home
          this.tweens.add({
            targets: sprite,
            x: sprite.getData('origX'),
            y: sprite.getData('origY'),
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
              sprite.setDepth(3);
              this.updateCookieVisuals();
            }
          });
        });

        this.prepTraySprites.push(sprite);
      });
    }
  }

  updateCookieVisuals() {
    this.drawCookie();
  }

  spawnCustomer() {
    if (this.customersSpawned >= this.config.maxCustomers) {
      // Day ended, check progression
      this.time.delayedCall(1000, () => {
        this.scene.start('SummaryScene', {
          day: this.day,
          coins: this.coins,
          meta: this.config.meta,
          loanRemaining: this.loanRemaining,
          loanRemainingAtStart: this.loanRemainingAtStart,
          coinsAtStart: this.coinsAtStart,
          unlockedShapesAtStart: this.unlockedShapesAtStart,
          stockAtStart: this.stockAtStart,
          unlockedShapes: this.unlockedShapes,
          stock: this.stock
        });
      });
      return;
    }

    // Get the unique customer ID
    const customerId = this.customerSequence[this.customersSpawned];
    this.customersSpawned++;

    // Filter recipes based on unlocked shapes and currently available stock (> 0)
    const availableRecipes = (this.config.recipes || []).filter(recipe => {
      if (!this.unlockedShapes.includes(recipe.shape)) return false;
      if ((this.stock.dough[recipe.base] || 0) <= 0) return false;
      if (recipe.toppings && recipe.toppings.length > 0) {
        for (const topping of recipe.toppings) {
          if ((this.stock.topping[topping] || 0) <= 0) return false;
        }
      }
      return true;
    });

    let selectedRecipe = null;
    let qty = 1;

    if (availableRecipes.length > 0) {
      // Pick a random valid recipe from the ones we have ingredients for
      selectedRecipe = Phaser.Utils.Array.GetRandom(availableRecipes);

      // Determine requested quantity based on customer personality and day limits
      const QUANTITY_RANGES = {
        1: { min: 1, max: 3 }, // Dormilón
        2: { min: 2, max: 4 }, // Oficinista
        3: { min: 3, max: 5 }, // Abuelita
        4: { min: 1, max: 2 }, // Estudiante
        5: { min: 2, max: 5 }  // Gamer
      };
      const range = QUANTITY_RANGES[customerId] || { min: 1, max: 2 };
      const capD = Math.min(5, 1 + this.day);
      let rawQty = Phaser.Math.Between(range.min, range.max);
      rawQty = Math.max(1, Math.min(rawQty, capD));

      // Clamp quantity to remaining stock of dough and toppings
      let stockLimit = this.stock.dough[selectedRecipe.base] || 0;
      if (selectedRecipe.toppings && selectedRecipe.toppings.length > 0) {
        selectedRecipe.toppings.forEach(topping => {
          stockLimit = Math.min(stockLimit, this.stock.topping[topping] || 0);
        });
      }
      qty = Math.min(rawQty, stockLimit);
      qty = Math.max(1, qty); // Ensure at least 1
    } else {
      // Fallback: no stock left, ask for 1 Classic Star (technical bankruptcy fallback)
      selectedRecipe = { name: 'Estrella Clásica', base: 'classic', shape: 'star', toppings: [] };
      qty = 1;
    }

    // Determine if they want a drink (starting Day 2, with 45% probability)
    let requestedDrink = null;
    if (this.day >= 2 && Math.random() < 0.45) {
      const hasBeans = (this.stock.drink.coffee_beans || 0) > 0;
      const hasMilk = (this.stock.drink.milk || 0) > 0;

      const drinkOptions = [];
      if (hasBeans) drinkOptions.push('coffee');
      if (hasMilk) drinkOptions.push('milk');
      if (hasBeans && hasMilk) drinkOptions.push('coffee_milk');

      if (drinkOptions.length > 0) {
        requestedDrink = Phaser.Utils.Array.GetRandom(drinkOptions);
      }
    }

    // Spawn customer in the counter area (centered at 512, 230)
    this.currentCustomer = new Customer(
      this, 
      512, 
      230, 
      this.config,
      () => this.handleCustomerTimeout(), // callback when patience runs out
      customerId,
      selectedRecipe,
      qty,
      requestedDrink
    );
  }

  getCookieValue(cookieOrRecipe) {
    if (!cookieOrRecipe) return 0;
    
    // Dough base value
    const doughValues = { classic: 20, chocolate: 35, oat: 45 };
    const baseVal = doughValues[cookieOrRecipe.base] || 20;

    // Shape value
    const shapeValues = { star: 5, heart: 10, cat: 20, fish: 30 };
    const shapeVal = shapeValues[cookieOrRecipe.shape] || 5;

    // Toppings value
    const toppingValues = { sprinkles: 10, choco: 15, glazing: 25 };
    let toppingVal = 0;
    if (cookieOrRecipe.toppings && cookieOrRecipe.toppings.length > 0) {
      cookieOrRecipe.toppings.forEach(t => {
        toppingVal += toppingValues[t] || 0;
      });
    }

    return baseVal + shapeVal + toppingVal;
  }

  deliverCookie() {
    if (!this.currentCustomer) return;

    // Check if the customer requested a drink, and if it's on the tray
    const requestedDrink = this.currentCustomer.requestedDrink;
    if (requestedDrink) {
      const drinkIndex = this.deliveryTrayDrinks.indexOf(requestedDrink);
      if (drinkIndex === -1) {
        let drinkName = 'Café';
        if (requestedDrink === 'milk') drinkName = 'Leche';
        else if (requestedDrink === 'coffee_milk') drinkName = 'Café c/Leche';
        
        this.showFeedbackText(`¡Falta la bebida: ${drinkName}! ☕`, this.trayX, 200, '#d90429');
        
        // Angry customer feedback
        const patienceLoss = this.currentCustomer.maxPatience * 0.25;
        this.currentCustomer.patience = Math.max(0, this.currentCustomer.patience - patienceLoss);
        this.currentCustomer.updatePatienceBar();

        this.tweens.add({
          targets: this.currentCustomer.container,
          x: { from: 512 - 10, to: 512 + 10 },
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            if (this.currentCustomer && this.currentCustomer.container) {
              this.currentCustomer.container.x = 512;
            }
          }
        });
        return;
      }
    }

    if (this.deliveryTrayCookies.length === 0) {
      this.showFeedbackText('¡La bandeja de entrega está vacía!', this.trayX, 200, '#d90429');
      return;
    }

    const recipe = this.currentCustomer.recipe;
    const requested = this.currentCustomer.requestedQuantity;
    const accumulated = this.currentCustomer.acceptedCookies || [];
    const newDelivered = this.deliveryTrayCookies;
    const totalCount = accumulated.length + newDelivered.length;

    // Dynamic base selling price based on ingredients
    const maxVal = this.getCookieValue(recipe);

    // Consume drink if correct
    let drinkReward = 0;
    if (requestedDrink) {
      const drinkIndex = this.deliveryTrayDrinks.indexOf(requestedDrink);
      if (drinkIndex !== -1) {
        this.deliveryTrayDrinks.splice(drinkIndex, 1);
        if (requestedDrink === 'coffee') drinkReward = 25;
        else if (requestedDrink === 'milk') drinkReward = 15;
        else if (requestedDrink === 'coffee_milk') drinkReward = 35;
      }
    }

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
        let totalReward = drinkReward;
        let anyPerfect = false;
        const allCookies = accumulated.concat(newDelivered);
        
        allCookies.forEach(cookie => {
          const sim = cookie.getSimilarityPercentage(recipe);
          if (sim === 100) anyPerfect = true;
          totalReward += Math.round(maxVal * (sim / 100));
        });

        this.coins += totalReward;
        this.coinsText.setText(`Monedas: ${this.coins}`);
        this.showFeedbackText(`¡Aceptado parcialmente! 👍 +${totalReward} Monedas`, this.trayX, 200, '#38b000');

        if (anyPerfect) {
          this.triggerConfetti();
        }

        // Clean up
        this.deliveryTrayCookies = [];
        this.deliveryTrayDrinks = [];
        this.drawDeliveryTray();
        this.currentCustomer.destroy();
        this.currentCustomer = null;

        this.time.delayedCall(1500, () => {
          this.spawnCustomer();
        });
      } else {
        // Customer rejects the partial delivery and stays
        this.currentCustomer.acceptedCookies = accumulated.concat(newDelivered);
        this.currentCustomer.updateProgress(this.currentCustomer.acceptedCookies.length);
        this.deliveryTrayCookies = [];
        this.drawDeliveryTray();

        // Reduce patience drastically (-35% of max patience)
        const patienceLoss = this.currentCustomer.maxPatience * 0.35;
        this.currentCustomer.patience = Math.max(0, this.currentCustomer.patience - patienceLoss);
        this.currentCustomer.updatePatienceBar();

        this.showFeedbackText(`¡Incompleto! Faltan ${requested - totalCount} galletas 😡`, this.trayX, 200, '#d90429');

        // Play an angry shake tween on the customer container
        this.tweens.add({
          targets: this.currentCustomer.container,
          x: { from: 512 - 10, to: 512 + 10 },
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            if (this.currentCustomer && this.currentCustomer.container) {
              this.currentCustomer.container.x = 512;
            }
          }
        });
      }
    } else {
      // Delivered quantity is equal or greater than requested (totalCount >= requested)
      const allCookies = accumulated.concat(newDelivered);

      // Sort all cookies by similarity percentage descending, to evaluate the best ones
      allCookies.sort((a, b) => b.getSimilarityPercentage(recipe) - a.getSimilarityPercentage(recipe));

      // Calculate coins for the best 'requested' cookies
      let totalReward = drinkReward;
      let anyPerfect = false;
      for (let i = 0; i < requested; i++) {
        const sim = allCookies[i].getSimilarityPercentage(recipe);
        if (sim === 100) anyPerfect = true;
        totalReward += Math.round(maxVal * (sim / 100));
      }

      // Calculate penalty for excess cookies
      const excessCount = totalCount - requested;
      const wastePenalty = excessCount * 15;

      this.coins = Math.max(0, this.coins + totalReward - wastePenalty);
      this.coinsText.setText(`Monedas: ${this.coins}`);

      if (excessCount > 0) {
        this.showFeedbackText(`¡Pedido completo! +${totalReward} (Exceso: -${wastePenalty}) 🗑️`, this.trayX, 200, '#ffb703');
      } else {
        const avgSim = (totalReward - drinkReward) / (requested * maxVal);
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
      this.deliveryTrayDrinks = [];
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
    }).setOrigin(0.5).setDepth(15000);

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
        if (element.bg.setTint) element.bg.setTint(0xffcccc);
      } else {
        if (element.key === 'deliveryTray') {
          // Keep it interactive and draggable for gameplay
          element.bg.setInteractive({ useHandCursor: true });
          this.input.setDraggable(element.bg, true);
        } else {
          element.bg.disableInteractive();
          this.input.setDraggable(element.bg, false);
        }
        if (element.bg.clearTint) element.bg.clearTint();
      }
    });

    // Update delivery tray background color
    if (this.isEditorMode) {
      this.drawDeliveryTrayBg(0xffcccc);
    } else {
      this.drawDeliveryTrayBg();
    }

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
      if (this.selectedEditorElement.bg.setTint) {
        this.selectedEditorElement.bg.setTint(0xffcccc);
      }
      if (this.selectedEditorElement.key === 'deliveryTray') {
        this.drawDeliveryTrayBg(0xffcccc);
      }
    }

    this.selectedEditorElement = element;
    if (element) {
      if (element.bg.setTint) {
        element.bg.setTint(0x38b000); // Green tint for selected element
      }
      if (element.key === 'deliveryTray') {
        this.drawDeliveryTrayBg(0xccffcc); // Green highlight for delivery tray background
      }
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
    } else if (el.key === 'deliveryTray') {
      this.deliveryTrayWidth = newWidth;
      this.deliveryTrayHeight = newHeight;
      this.drawDeliveryTrayBg(0xccffcc);
      this.drawDeliveryTray();
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
    const { deliveryTray } = UI_CONFIG;
    this.deliveryTrayX = deliveryTray ? deliveryTray.x : 512;
    this.deliveryTrayY = deliveryTray ? deliveryTray.y : 370;
    this.deliveryTrayWidth = deliveryTray ? deliveryTray.width : 200;
    this.deliveryTrayHeight = deliveryTray ? deliveryTray.height : 50;

    // Draw the wooden tray background
    this.deliveryTrayBg = this.add.graphics().setDepth(1);
    this.drawDeliveryTrayBg();

    // Text label on the tray
    this.deliveryTrayLabel = this.add.text(this.deliveryTrayX, this.deliveryTrayY - 33, 'BANDEJA DE ENTREGA', {
      font: '9px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(2);

    // Group or list to hold the rendered cookie sprites on the tray
    this.deliveryTraySprites = [];
    
    // Make the delivery tray draggable via an invisible interactive zone
    this.deliveryDragZone = this.add.rectangle(this.deliveryTrayX, this.deliveryTrayY, this.deliveryTrayWidth, this.deliveryTrayHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    this.input.setDraggable(this.deliveryDragZone);

    this.customerHighlighted = false;
    this.trashHighlighted = false;

    this.deliveryDragZone.on('dragstart', () => {
      if (this.isEditorMode) return;
      this.deliveryDragZone.setDepth(1000);
      this.deliveryTrayLabel.setDepth(1001);
      this.deliveryTraySprites.forEach(s => s.setDepth(1002));
    });

    this.deliveryDragZone.on('drag', (pointer, dragX, dragY) => {
      if (this.isEditorMode) return;
      // Limit Y-axis to counter and customer area
      const clampedY = Math.max(160, Math.min(450, dragY));
      this.deliveryDragZone.x = dragX;
      this.deliveryDragZone.y = clampedY;

      // Translate the graphics object using x/y offsets
      this.deliveryTrayBg.x = dragX - this.deliveryTrayX;
      this.deliveryTrayBg.y = clampedY - this.deliveryTrayY;

      this.deliveryTrayLabel.x = dragX;
      this.deliveryTrayLabel.y = clampedY - 33;

      // Translate all sprites on the tray (cookies and drinks combined)
      const cookiesCount = this.deliveryTrayCookies.length;
      const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
      const totalCount = cookiesCount + drinksCount;
      
      if (totalCount > 0) {
        const spacing = 35;
        const startX = dragX - ((totalCount - 1) * spacing) / 2;
        
        // Translate cookie sprites
        for (let i = 0; i < cookiesCount; i++) {
          const sprite = this.deliveryTraySprites[i];
          if (sprite) {
            sprite.x = startX + i * spacing;
            sprite.y = clampedY;
          }
        }
        
        // Translate drink sprites
        for (let i = 0; i < drinksCount; i++) {
          const sprite = this.deliveryTraySprites[cookiesCount + i];
          if (sprite) {
            sprite.x = startX + (cookiesCount + i) * spacing;
            sprite.y = clampedY - 4; // Maintain drink height offset
          }
        }
      }

      // Check distance to trash bin
      const distToTrash = Phaser.Math.Distance.Between(dragX, clampedY, this.trashBinX, this.trashBinY);
      if (distToTrash < 70) {
        if (!this.trashHighlighted) {
          this.trashHighlighted = true;
          this.tweens.add({
            targets: this.trashContainer,
            scale: 1.15,
            duration: 100
          });
          if (this.trashIconText) this.trashIconText.setTint(0xff6b6b);
        }

        // Clean customer highlight if active
        if (this.customerHighlighted) {
          this.customerHighlighted = false;
          this.tweens.add({
            targets: this.deliveryDragZone,
            scale: 1.0,
            duration: 100
          });
          if (this.currentCustomerBounceTween) {
            this.currentCustomerBounceTween.stop();
            this.currentCustomerBounceTween = null;
          }
          this.tweens.add({
            targets: this.currentCustomer.container,
            y: 230,
            duration: 150,
            ease: 'Back.easeOut'
          });
        }
      } else {
        if (this.trashHighlighted) {
          this.trashHighlighted = false;
          this.tweens.add({
            targets: this.trashContainer,
            scale: 1.0,
            duration: 100
          });
          if (this.trashIconText) this.trashIconText.clearTint();
        }

        // Check distance to the customer (centered at 512, 230)
        if (this.currentCustomer && this.currentCustomer.sprite) {
          const distToCustomer = Phaser.Math.Distance.Between(dragX, clampedY, 512, 230);
          if (distToCustomer < 130) {
            if (!this.customerHighlighted) {
              this.customerHighlighted = true;
              
              this.tweens.add({
                targets: this.deliveryDragZone,
                scale: 1.06,
                duration: 100
              });

              this.currentCustomerBounceTween = this.tweens.add({
                targets: this.currentCustomer.container,
                y: 230 - 15,
                duration: 200,
                yoyo: true,
                repeat: -1,
                ease: 'Cubic.easeOut'
              });
            }
          } else {
            if (this.customerHighlighted) {
              this.customerHighlighted = false;
              
              this.tweens.add({
                targets: this.deliveryDragZone,
                scale: 1.0,
                duration: 100
              });

              if (this.currentCustomerBounceTween) {
                this.currentCustomerBounceTween.stop();
                this.currentCustomerBounceTween = null;
              }
              this.tweens.add({
                targets: this.currentCustomer.container,
                y: 230,
                duration: 150,
                ease: 'Back.easeOut'
              });
            }
          }
        }
      }
    });

    this.deliveryDragZone.on('dragend', () => {
      if (this.isEditorMode) return;
      this.deliveryDragZone.setScale(1.0);
      this.deliveryDragZone.setDepth(15);
      this.deliveryTrayLabel.setDepth(2);

      // Clean up customer animation if dragging ends
      if (this.currentCustomerBounceTween) {
        this.currentCustomerBounceTween.stop();
        this.currentCustomerBounceTween = null;
      }
      if (this.currentCustomer && this.currentCustomer.container) {
        this.currentCustomer.container.y = 230;
      }

      // Check if dropped on trash
      if (this.trashHighlighted) {
        this.trashHighlighted = false;
        if (this.trashContainer) this.trashContainer.setScale(1.0);
        if (this.trashIconText) this.trashIconText.clearTint();

        const count = this.deliveryTrayCookies.length;
        const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
        if (count > 0 || drinksCount > 0) {
          this.deliveryTrayCookies = [];
          this.deliveryTrayDrinks = [];
          this.drawDeliveryTray();
          this.showFeedbackText('¡Bandeja Vaciada! 🗑️', this.trashBinX, this.trashBinY - 50, '#d90429');
        }
      }

      if (this.customerHighlighted) {
        this.customerHighlighted = false;
        
        // Deliver!
        this.deliverCookie();
      }

      // Tween back to counter center
      this.tweens.add({
        targets: [this.deliveryDragZone, this.deliveryTrayLabel],
        x: this.deliveryTrayX,
        y: {
          getStart: (target) => target.y,
          getEnd: (target) => (target === this.deliveryDragZone ? this.deliveryTrayY : this.deliveryTrayY - 33)
        },
        duration: 250,
        ease: 'Cubic.out',
        onUpdate: () => {
          this.deliveryTrayBg.x = this.deliveryDragZone.x - this.deliveryTrayX;
          this.deliveryTrayBg.y = this.deliveryDragZone.y - this.deliveryTrayY;
          // Redraw sprites dynamic positions
          const count = this.deliveryTrayCookies.length;
          if (count > 0) {
            const spacing = 35;
            const startX = this.deliveryDragZone.x - ((count - 1) * spacing) / 2;
            this.deliveryTraySprites.forEach((sprite, index) => {
              sprite.x = startX + index * spacing;
              sprite.y = this.deliveryDragZone.y;
            });
          }
        },
        onComplete: () => {
          // Reset offsets
          this.deliveryTrayBg.x = 0;
          this.deliveryTrayBg.y = 0;
          this.deliveryDragZone.x = this.deliveryTrayX;
          this.deliveryDragZone.y = this.deliveryTrayY;
          this.deliveryTrayLabel.x = this.deliveryTrayX;
          this.deliveryTrayLabel.y = this.deliveryTrayY - 33;
          this.drawDeliveryTray();
        }
      });
    });
  }

  drawDeliveryTrayBg(highlightColor = null) {
    this.deliveryTrayBg.clear();
    if (highlightColor !== null) {
      this.deliveryTrayBg.fillStyle(highlightColor, 1);
    } else {
      this.deliveryTrayBg.fillStyle(0xe6ccb2, 1);
    }
    this.deliveryTrayBg.lineStyle(3, 0x7f5539, 1);
    
    // Draw relative to deliveryTrayX and Y using dynamic width and height
    const w = this.deliveryTrayWidth;
    const h = this.deliveryTrayHeight;
    this.deliveryTrayBg.fillRoundedRect(this.deliveryTrayX - w / 2, this.deliveryTrayY - h / 2, w, h, 8);
    this.deliveryTrayBg.strokeRoundedRect(this.deliveryTrayX - w / 2, this.deliveryTrayY - h / 2, w, h, 8);
  }

  drawDeliveryTray() {
    // Clear old sprites
    this.deliveryTraySprites.forEach(sprite => sprite.destroy());
    this.deliveryTraySprites = [];

    const cookiesCount = this.deliveryTrayCookies.length;
    const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
    const totalItems = cookiesCount + drinksCount;
    if (totalItems === 0) return;

    const spacing = 35;
    const trayX = this.deliveryDragZone ? this.deliveryDragZone.x : this.deliveryTrayX;
    const trayY = this.deliveryDragZone ? this.deliveryDragZone.y : this.deliveryTrayY;
    const startX = trayX - ((totalItems - 1) * spacing) / 2;

    // Draw cookies
    this.deliveryTrayCookies.forEach((cookie, index) => {
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      const x = startX + index * spacing;
      const y = trayY;

      const sprite = this.add.image(x, y, key).setDisplaySize(40, 40).setDepth(14);
      this.deliveryTraySprites.push(sprite);
    });

    // Draw drinks
    if (this.deliveryTrayDrinks) {
      this.deliveryTrayDrinks.forEach((drinkType, index) => {
        let key = 'beverage_coffee';
        if (drinkType === 'milk') key = 'beverage_milk';
        else if (drinkType === 'coffee_milk') key = 'beverage_coffee_milk';

        const x = startX + (cookiesCount + index) * spacing;
        const y = trayY - 4; // Shift up slightly to fit nicely

        const sprite = this.add.image(x, y, key).setDisplaySize(32, 32).setDepth(14);
        this.deliveryTraySprites.push(sprite);
      });
    }
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

    this.prepTrayCookies = [];

    // Move all cookies from oven to prep tray together
    this.cookiesInOven.forEach((cookie, index) => {
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      // Spawn a temporary cookie image for the flight animation
      const flightSprite = this.add.image(this.ovenX, this.ovenY, key)
        .setDisplaySize(50, 50)
        .setDepth(100);

      // Tween to the preparation tray position
      this.tweens.add({
        targets: flightSprite,
        x: this.trayX,
        y: this.trayY,
        scale: 0.8,
        duration: 350 + index * 100,
        ease: 'Cubic.out',
        onComplete: () => {
          flightSprite.destroy();
          this.prepTrayCookies.push(cookie);
          this.updateCookieVisuals();
        }
      });
    });

    this.cookiesInOven = [];
    this.showFeedbackText('¡Retirando al mostrador! 🍪', this.ovenX, 200, '#38b000');
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

  createTrashBin() {
    this.trashBinX = 330;
    this.trashBinY = 470;

    // Create a container for the trash bin so we can scale the whole thing easily!
    this.trashContainer = this.add.container(this.trashBinX, this.trashBinY).setDepth(2);

    this.trashBinGraphics = this.add.graphics();
    // Draw body (around 0,0)
    this.trashBinGraphics.fillStyle(0x6c757d, 1); // Steel grey
    this.trashBinGraphics.lineStyle(3, 0x495057, 1);
    this.trashBinGraphics.fillRoundedRect(-22, -18, 44, 48, 6);
    this.trashBinGraphics.strokeRoundedRect(-22, -18, 44, 48, 6);
    
    // Draw silver lid
    this.trashBinGraphics.fillStyle(0xced4da, 1);
    this.trashBinGraphics.fillRoundedRect(-25, -25, 50, 9, 3);
    this.trashBinGraphics.strokeRoundedRect(-25, -25, 50, 9, 3);
    
    // Handle
    this.trashBinGraphics.fillStyle(0x495057, 1);
    this.trashBinGraphics.fillRect(-6, -30, 12, 5);

    this.trashContainer.add(this.trashBinGraphics);

    // Trash can text icon
    this.trashIconText = this.add.text(0, 8, '🗑️', {
      font: '18px "Outfit", sans-serif',
      fill: '#ffffff'
    }).setOrigin(0.5);
    this.trashContainer.add(this.trashIconText);

    // Label under the trash bin
    this.trashLabel = this.add.text(0, 39, 'BASURA', {
      font: '9px "Outfit", sans-serif',
      fill: '#495057',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.trashContainer.add(this.trashLabel);
  }
}
