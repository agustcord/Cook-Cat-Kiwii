import Phaser from 'phaser';
import Cookie from '../game/Cookie.js';
import Customer from '../game/Customer.js';
import UI_CONFIG from '../../ui-config.json' with { type: 'json' };
import SoundManager from '../game/SoundManager.js';
import CrazyGamesSDK from '../game/services/CrazyGamesSDK.js';
import I18nManager from '../game/services/I18nManager.js';
import { getDayConfig } from '../game/EconomyManager.js';
import SaveManager from '../game/services/SaveManager.js';
import TutorialManager from '../game/tutorial/TutorialManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    const safeData = data || {};
    this.day = safeData.day || 1;
    this.coins = safeData.coins || 0;
    this.loanRemaining = safeData.loanRemaining !== undefined ? safeData.loanRemaining : 200;
    this.config = getDayConfig(this.day);

    // Load state from data, or fallback to Day 1 starting kit
    this.unlockedShapes = safeData.unlockedShapes || ['star'];
    this.stock = safeData.stock || {
      dough: { classic: 10, chocolate: 0, oat: 0 },
      topping: { sprinkles: 2, choco: 0, glazing: 0 },
      drink: { coffee_beans: 2, milk: 2 }
    };
    if (this.day === 1) {
      if (!this.stock.topping) this.stock.topping = { sprinkles: 2, choco: 0, glazing: 0 };
      this.stock.topping.sprinkles = Math.max(2, (this.stock.topping.sprinkles || 0));
      if (!this.stock.drink) this.stock.drink = { coffee_beans: 2, milk: 2 };
      this.stock.drink.milk = Math.max(2, (this.stock.drink.milk || 0));
    }
    this.stock.drink = this.stock.drink || { coffee_beans: 2, milk: 2 };

    // Save starting state of the day for re-tries
    this.coinsAtStart = this.coins;
    this.loanRemainingAtStart = this.loanRemaining;
    this.unlockedShapesAtStart = [...this.unlockedShapes];
    this.stockAtStart = JSON.parse(JSON.stringify(this.stock));
    
    // Core game state variables
    this.customersSpawned = 0;
    this.currentCustomer = null;
    this.isHoldingItem = false;
    this.isAudioPanelOpen = false;
    this.scratchBlockedUntilPointerUp = false;
    
    // Generate unique, non-repeating customer sequence for the day
    let availablePool = [1, 2, 3, 4, 5];
    if (this.day === 1) {
      // Day 1: Exclude customer 5 (Gamer) to keep it introductory
      availablePool = [1, 2, 3, 4];
    } else if (this.day === 2) {
      // Day 2 (Muy Fácil): Solo clientes dóciles, sin Oficinista (2) ni Gamer (5)
      availablePool = [1, 3, 4];
    } else if (this.day === 3) {
      // Day 3 (Fácil): Incorpora Oficinista (2), sin Gamer (5)
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
    
    // Time-based oven state (Illustrated Multilayer Oven)
    this.isOvenPreheated = false;
    this.isBaking = false;
    this.cookiesInOven = []; // Holds Cookie instances currently in the oven
    this.deliveryTrayCookies = []; // Holds Cookie instances currently on the delivery tray
    this.deliveryTrayDrinks = []; // Holds drinks (strings like 'coffee', 'milk', 'coffee_milk') currently on the delivery tray
    this.prepTrayCookies = []; // Holds Cookie instances currently on the preparation tray
    this.ovenTimeElapsed = 0;
    this.ovenOvercookTimer = 0;
    this.alarmPlayed = false;
    this.hasOvercookedAlarm = false;
    this.knobBaseX = 177;
    this.knobMaxDeltaX = 128;

    // Drink machine state
    this.machineState = 'no_cup'; // 'no_cup', 'empty' (cup placed), 'brewing_coffee', 'brewing_milk', 'ready_coffee', 'ready_milk', 'ready_coffee_milk'
    this.machineCupSprite = null;
    this.machineTimer = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Music settings from SoundManager
    const soundMgr = SoundManager.getInstance();
    this.musicVolume = soundMgr.getVolume('bgm');
    this.musicMuted = soundMgr.isMuted('bgm') || soundMgr.isMuted('master');

    const effectiveBgm = soundMgr.getEffectiveGain('bgm');
    if (!this.sound.get('bg_music')) {
      this.bgMusic = this.sound.add('bg_music', { 
        loop: true, 
        volume: effectiveBgm
      });
      this.bgMusic.play();
    } else {
      this.bgMusic = this.sound.get('bg_music');
      if (!this.bgMusic.isPlaying) {
        this.bgMusic.play();
      }
      this.bgMusic.setVolume(effectiveBgm);
    }

    // Notify CrazyGames SDK of gameplay start
    CrazyGamesSDK.getInstance().gameplayStart();

    // Draw primary background (cream wall)
    this.drawBackground(width, height);

    // Create the customer layer container (behind the counter)
    this.customerContainer = this.add.container(0, 0);

    // Final Table Illustration Image (1920x1080 canvas with transparency)
    this.add.image(0, 0, 'bakery_counter').setOrigin(0, 0);

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

    // Tutorial Subsystem Initialization (Conditional for Day 1)
    const saveState = SaveManager.getInstance().loadGame();
    const isTutorialCompleted = Boolean(saveState?.tutorialCompleted);
    if (this.day === 1 && !isTutorialCompleted) {
      this.tutorialManager = new TutorialManager(this);
      this.tutorialManager.start();
    } else {
      this.tutorialManager = null;
    }

    // Spawn first customer
    this.time.delayedCall(1000, () => {
      this.spawnCustomer();
    });

    // Custom Cat Paw Cursor Initialization
    this.input.setDefaultCursor('none');
    this.shoulderX = width / 2;
    this.shoulderY = height + 90;
    this.pawX = width / 2;
    this.pawY = height / 2;

    this.catArmOutlineGraphics = this.add.graphics().setDepth(30000);
    this.catArmFillGraphics = this.add.graphics().setDepth(30001);
    this.catPawSprite = this.add.image(this.pawX, this.pawY, 'cat_paw_open')
      .setDepth(30002)
      .setOrigin(0.5, 0.55)
      .setDisplaySize(184, 184);

    // Track pointerdown/pointerup to trigger grab animation (texture swap)
    this.input.on('pointerdown', () => {
      if (this.catPawSprite) {
        this.catPawSprite.setTexture('cat_paw_closed');
        this.catPawSprite.setDisplaySize(184, 184);
        this.catPawSprite.setOrigin(0.5, 0.61);
      }
    });
    this.input.on('pointerup', () => {
      if (this.catPawSprite) {
        this.catPawSprite.setTexture('cat_paw_open');
        this.catPawSprite.setDisplaySize(184, 184);
        this.catPawSprite.setOrigin(0.5, 0.55);
      }
    });

    // --- UI EDITOR MODE INITIALIZATION ---
    this.isEditorMode = false;
    this.selectedEditorElement = null;

    // Create editor status text (hidden by default)
    const i18n = I18nManager.getInstance();
    this.editorIndicator = this.add.text(width / 2, 20, i18n.t('editor.indicator'), {
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
      { key: 'deliveryTray', bg: this.deliveryDragZone, text: this.deliveryTrayLabel, textOffsetX: 0, textOffsetY: -33 },
      { key: 'cupStack', bg: this.cupStackZone, text: null, textOffsetX: 0, textOffsetY: 0 },
      { key: 'musicButton', bg: this.musicBtnZone, text: this.musicButtonText, textOffsetX: 0, textOffsetY: 0 }
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
        } else if (element.key === 'cupStack') {
          if (this.cupStackImage) {
            this.cupStackImage.x = dragX;
            this.cupStackImage.y = dragY;
          }
        } else if (element.key === 'musicButton') {
          if (this.musicButtonBg) {
            this.musicButtonBg.x = dragX;
            this.musicButtonBg.y = dragY;
          }
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
    const i18n = I18nManager.getInstance();

    // Day indicator WITH DECORATIVE SIGN!
    const { daySign } = UI_CONFIG;
    this.daySignImage = this.add.image(daySign.x, daySign.y, 'day_sign_empty')
      .setDisplaySize(daySign.width, daySign.height)
      .setOrigin(0, 0.5)
      .setDepth(1);
    
    this.daySignText = this.add.text(daySign.x + daySign.width / 2, daySign.y + daySign.textOffsetY, i18n.t('hud.day', { day: this.day }), {
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
    
    this.coinsText = this.add.text(coinsSign.x, coinsSign.y + coinsSign.textOffsetY, `${this.coins}`, {
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
    this.metaText = this.add.text(textX, metaSign.y + metaSign.textOffsetY, `${this.config.meta}`, {
      font: `${metaSign.textFontSize}px "Outfit", sans-serif`,
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5, 0.5).setDepth(1);

    // Music Button (🎵)
    const { musicButton } = UI_CONFIG;
    const musicBtnX = musicButton ? musicButton.x : 195;
    const musicBtnY = musicButton ? musicButton.y : 200;
    const musicBtnW = musicButton ? musicButton.width : 38;

    this.musicButtonBg = this.add.graphics();
    this.musicButtonBg.fillStyle(0xe6ccb2, 1);
    this.musicButtonBg.lineStyle(3, 0x582f0e, 1);
    this.musicButtonBg.fillCircle(0, 0, musicBtnW / 2);
    this.musicButtonBg.strokeCircle(0, 0, musicBtnW / 2);
    this.musicButtonBg.setPosition(musicBtnX, musicBtnY);
    this.musicButtonBg.setDepth(2);

    this.musicButtonText = this.add.text(musicBtnX, musicBtnY, '🎵', {
      font: '20px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(3);

    this.musicBtnZone = this.add.circle(musicBtnX, musicBtnY, musicBtnW / 2, 0x000000, 0)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });

    this.musicBtnZone.on('pointerover', () => {
      this.musicButtonText.setScale(1.2);
    });
    this.musicBtnZone.on('pointerout', () => {
      this.musicButtonText.setScale(1.0);
    });
    this.musicBtnZone.on('pointerdown', () => {
      if (this.isEditorMode) return; // Ignore audio panel trigger if editing positions
      SoundManager.getInstance().playUiTap();
      this.openAudioPanel();
    });
  }

  createStations(width, height) {
    // Column 1: Estación de Masa (Masa) - Posición exacta Krita 1920x1080
    this.createDoughButtons();

    // Column 2: Estación de Forma (Cortadores)
    const { formaLabel } = UI_CONFIG;
    this.createShapeButtons(formaLabel.x - 165, formaLabel.y + 24);

    // Column 3: Horno (Oven minigame) - Posición exacta Krita: X centro 1494, Y centro 429
    this.createOvenStation(1391, 504);

    // Column 3.5: Bebidas (Drinks Station) - Posición exacta Krita: X centro 351, Y centro 507
    this.createDrinkStation(351, 507);

    // Column 4: Decoración (Toppings)
    this.createToppingButtons(1669, 581);
  }

  createDoughButtons() {
    // Masa inicial sin forma en coordenadas exactas de la ilustración de Krita (1920x1080)
    const bases = [
      {
        id: 'classic',
        label: 'Clásica',
        key: 'masa_vainilla',
        x: 148,
        y: 684,
        width: 168,
        height: 116
      },
      {
        id: 'chocolate',
        label: 'Choco',
        key: 'masa_chocolate',
        x: 142,
        y: 829.5,
        width: 168,
        height: 109
      },
      {
        id: 'oat',
        label: 'Avena',
        key: 'masa_avena',
        x: 135.5,
        y: 958.5,
        width: 177,
        height: 115
      }
    ];

    this.doughButtons = {};
    this.doughStockTexts = {};
    this.doughDragZones = {};

    bases.forEach((b) => {
      // Dough source image at native 1:1 scale (exact Krita illustration layer composition)
      const doughImg = this.add.image(b.x, b.y, b.key)
        .setOrigin(0.5, 0.5)
        .setDepth(2);
      
      this.doughButtons[b.id] = doughImg;

      // Add stock indicator text below the dough
      const stockText = this.add.text(b.x, b.y + b.height / 2 + 8, '', {
        font: '20px "Outfit", sans-serif',
        fill: '#ffffff',
        stroke: '#582f0e',
        strokeThickness: 5,
        fontWeight: '800'
      }).setOrigin(0.5).setDepth(3);
      
      this.doughStockTexts[b.id] = stockText;

      // Create an invisible drag zone covering the dough
      const dragZone = this.add.rectangle(b.x, b.y, b.width, b.height, 0x000000, 0);
      dragZone.setInteractive({ useHandCursor: true });
      this.input.setDraggable(dragZone);
      this.doughDragZones[b.id] = dragZone;

      let portionSprite = null;

      dragZone.on('pointerover', () => {
        const currentStock = this.stock.dough[b.id] || 0;
        if (currentStock > 0) {
          doughImg.setScale(1.08);
        }
      });
      
      dragZone.on('pointerout', () => {
        doughImg.setScale(1.0);
      });

      dragZone.on('dragstart', () => {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_DOUGH', { base: b.id })) {
          this.tutorialManager.denyAction(this, doughImg);
          return;
        }

        const currentStock = this.stock.dough[b.id] || 0;
        const i18n = I18nManager.getInstance();
        if (currentStock <= 0) {
          SoundManager.getInstance().playUiDenied();
          this.showFeedbackText(i18n.t('game.feedback.outOfStock'), this.trayX, 375, '#d90429');
          return;
        }

        this.isHoldingItem = true;
        this.events.emit('game:drag_start', { item: 'dough', base: b.id, id: b.id });
        SoundManager.getInstance().playDoughSelect();
        portionSprite = this.add.image(dragZone.x, dragZone.y, `dough_${b.id}`);
        portionSprite.setDisplaySize(84, 84);
        portionSprite.setDepth(30000);
        portionSprite.setAlpha(0.9);
        doughImg.setScale(0.95);
      });

      dragZone.on('drag', (pointer, dragX, dragY) => {
        if (portionSprite) {
          portionSprite.x = dragX;
          portionSprite.y = Math.max(338, dragY);
        }
      });

      dragZone.on('dragend', () => {
        this.isHoldingItem = false;
        if (!portionSprite) {
          doughImg.setScale(1.0);
          dragZone.x = b.x;
          dragZone.y = b.y;
          this.events.emit('game:drag_end', { item: 'dough', base: b.id, id: b.id });
          return;
        }

        const distDelivery = Phaser.Math.Distance.Between(
          portionSprite.x, portionSprite.y,
          this.deliveryTrayX, this.deliveryTrayY
        );

        const distTable = Phaser.Math.Distance.Between(
          portionSprite.x, portionSprite.y,
          this.trayX, this.trayY
        );

        const i18n = I18nManager.getInstance();

        if (distDelivery < 188) {
          if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_DOUGH', { base: b.id, destination: 'delivery_tray' })) {
            this.tutorialManager.denyAction(this, doughImg);
          } else if (this.deliveryTrayCookies.length < 3) {
            // Consume stock!
            this.stock.dough[b.id]--;
            this.updateStockTexts();

            const newCookie = new Cookie();
            newCookie.base = b.id;
            this.deliveryTrayCookies.push(newCookie);
            this.drawDeliveryTray();
            SoundManager.getInstance().playDoughPlace();
            this.showFeedbackText(i18n.t('game.feedback.cookieReadyDelivery'), this.deliveryTrayX, 375, '#38b000');
            this.events.emit('game:cookie_to_tray', { cookie: newCookie, base: b.id });
          } else {
            SoundManager.getInstance().playUiDenied();
            this.showFeedbackText(i18n.t('game.feedback.tableFull'), this.deliveryTrayX, 375, '#d90429');
          }
        } else if (distTable < 225) {
          if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_DOUGH', { base: b.id, destination: 'prep_table' })) {
            this.tutorialManager.denyAction(this, doughImg);
          } else if (this.prepTrayCookies.length < 3) {
            // Consume stock!
            this.stock.dough[b.id]--;
            this.updateStockTexts();

            const newCookie = new Cookie();
            newCookie.base = b.id;
            this.prepTrayCookies.push(newCookie);
            this.updateCookieVisuals();
            SoundManager.getInstance().playDoughPlace();
            const doughName = i18n.t(`recipes.bases.${b.id}`);
            this.showFeedbackText(i18n.t('game.feedback.doughSelected', { name: doughName }), this.trayX, 375, '#38b000');
            this.events.emit('game:dough_placed', { base: b.id });
          } else {
            SoundManager.getInstance().playUiDenied();
            this.showFeedbackText(i18n.t('game.feedback.tableFull'), this.trayX, 375, '#d90429');
          }
        } else {
          SoundManager.getInstance().playUiTap();
        }

        if (portionSprite) {
          portionSprite.destroy();
          portionSprite = null;
        }

        doughImg.setScale(1.0);
        dragZone.x = b.x;
        dragZone.y = b.y;
        this.events.emit('game:drag_end', { item: 'dough', base: b.id, id: b.id });
      });
    });
  }

  createShapeButtons(startX, startY) {
    // Forma label sign removed

    this.shapeContainers = [];
    this.shapeDragZones = [];
    this.shapeButtons = {};

    const shapes = [
      { id: 'star' },
      { id: 'heart' },
      { id: 'cat' },
      { id: 'fish' }
    ];

    shapes.forEach((s, index) => {
      const isUnlocked = this.unlockedShapes.includes(s.id);

      // Horizontal layout (X spacing: 113, starting at startX - 9, Y is startY + 84)
      const x = startX - 9 + index * 113;
      const y = startY + 84;

      const container = this.add.container(x, y).setDepth(2);
      container.setData('origX', x);
      container.setData('origY', y);
      this.shapeContainers.push(container);

      // Cutter Image (displayed at 109x109)
      const shapeSprite = this.add.image(54, 54, 'shape_' + s.id).setDisplaySize(109, 109);
      if (!isUnlocked) {
        shapeSprite.setTint(0x777777);
        shapeSprite.setAlpha(0.4);
      }
      container.add(shapeSprite);

      if (isUnlocked) {
        // Create a flat transparent rectangle as the interactive drag zone
        const dragZone = this.add.rectangle(x + 54, y + 54, 109, 109, 0x000000, 0);
        dragZone.setInteractive({ useHandCursor: true });
        this.input.setDraggable(dragZone);
        this.shapeDragZones.push(dragZone);
        this.shapeButtons[s.id] = dragZone;

        dragZone.on('pointerover', () => {
          shapeSprite.setDisplaySize(120, 120);
        });
        dragZone.on('pointerout', () => {
          shapeSprite.setDisplaySize(109, 109);
        });

        // Drag handlers
        dragZone.on('dragstart', () => {
          if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_SHAPE', { shape: s.id })) {
            this.tutorialManager.denyAction(this, container);
            return;
          }
          this.isHoldingItem = true;
          this.events.emit('game:drag_start', { item: 'shape', shape: s.id, id: s.id });
          SoundManager.getInstance().playUiTap();
          container.setDepth(30000);
          dragZone.setDepth(30000);
        });

        dragZone.on('drag', (pointer, dragX, dragY) => {
          dragZone.x = dragX;
          dragZone.y = Math.max(338, dragY);
          // Shift visual container to follow the drag zone
          container.x = dragX - 29;
          container.y = Math.max(338, dragY) - 29;
        });

        dragZone.on('dragend', () => {
          this.isHoldingItem = false;
          // Find closest cookie in prepTrayCookies that doesn't have a shape yet
          let closestCookie = null;
          let minDist = 99999;
          const count = this.prepTrayCookies.length;
          const spacing = 66;
          const startX = this.trayX - ((count - 1) * spacing) / 2;

          this.prepTrayCookies.forEach((cookie, index) => {
            const cx = startX + index * spacing;
            const cy = this.trayY;
            const dist = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, cx, cy);
            if (dist < 225 && dist < minDist) {
              minDist = dist;
              closestCookie = cookie;
            }
          });

          const i18n = I18nManager.getInstance();

          if (closestCookie) {
            if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_SHAPE', { shape: s.id, target: 'table_cookie' })) {
              this.tutorialManager.denyAction(this, container);
            } else {
              closestCookie.shape = s.id;
              this.updateCookieVisuals();
              SoundManager.getInstance().playDoughCut();
              const shapeName = i18n.t(`recipes.shapes.${s.id}`);
              this.showFeedbackText(i18n.t('game.feedback.shapeSelected', { name: shapeName }), this.trayX, 375, '#38b000');
              this.events.emit('game:shape_applied', { shape: s.id });
            }
          } else {
            const distToTrayCenter = Phaser.Math.Distance.Between(dragZone.x, dragZone.y, this.trayX, this.trayY);
            if (distToTrayCenter < 225) {
              SoundManager.getInstance().playUiDenied();
              this.showFeedbackText(i18n.t('game.feedback.selectDoughFirst'), this.trayX, 375, '#d90429');
            } else {
              SoundManager.getInstance().playUiTap();
            }
          }

          this.events.emit('game:drag_end', { item: 'shape', shape: s.id, id: s.id });

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
    this.ovenX = startX + 103; // 1462
    this.ovenY = startY - 75;  // 506
    this.ovenStartX = startX;  // 1359
    this.ovenStartY = startY;  // 581

    // Capa 1: Base física del horno (400x449 px nativo)
    this.ovenBaseSprite = this.add.image(this.ovenX, this.ovenY, 'oven_base')
      .setDepth(2);
    this.ovenImage = this.ovenBaseSprite; // Referencia de retrocompatibilidad

    // Capa 2: Cristal del horno (inicia apagado, se ilumina SOLO durante cocción activa)
    this.ovenGlassSprite = this.add.image(this.ovenX, this.ovenY, 'oven_glass_off')
      .setDepth(3);

    // Capa 3: Base analógica del indicador de tiempo (fija)
    this.ovenTimerBaseSprite = this.add.image(this.ovenX, this.ovenY, 'oven_timer_base')
      .setDepth(4);

    // Capa 4: Perilla deslizante del timer (recorre de X=177 a X=305, delta = 128 px)
    this.ovenKnobSprite = this.add.image(this.ovenX, this.ovenY, 'oven_timer_knob')
      .setDepth(5);

    // Capa 5: Botones ilustrados interactivos con anclaje centrado para hover táctil
    // Botón Encendido / Precalentamiento (bbox: 54..108, 30..84 -> centro en 81, 57)
    const btnPowerCenterX = this.ovenX - 200 + 81;   // 1343
    const btnPowerCenterY = this.ovenY - 224.5 + 57; // 338.5
    this.ovenBtnPowerSprite = this.add.image(btnPowerCenterX, btnPowerCenterY, 'oven_btn_power_off')
      .setOrigin(81 / 400, 57 / 449)
      .setDepth(6);

    // Botón Cocinar (bbox: 124..156, 41..73 -> centro en 140, 57)
    const btnBakeCenterX = this.ovenX - 200 + 140;   // 1402
    const btnBakeCenterY = this.ovenY - 224.5 + 57;  // 338.5
    this.ovenBtnBakeSprite = this.add.image(btnBakeCenterX, btnBakeCenterY, 'oven_btn_bake_off')
      .setOrigin(140 / 400, 57 / 449)
      .setDepth(6);

    // Zonas Interactivas de los botones con efecto hover táctil
    const btnPowerZone = this.add.rectangle(btnPowerCenterX, btnPowerCenterY, 50, 50, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);
    this.ovenBtnPowerZone = btnPowerZone;

    btnPowerZone.on('pointerover', () => {
      this.tweens.killTweensOf(this.ovenBtnPowerSprite);
      this.tweens.add({
        targets: this.ovenBtnPowerSprite,
        scale: 1.08,
        duration: 120,
        ease: 'Back.out'
      });
    });

    btnPowerZone.on('pointerout', () => {
      this.tweens.killTweensOf(this.ovenBtnPowerSprite);
      this.tweens.add({
        targets: this.ovenBtnPowerSprite,
        scale: 1.0,
        duration: 120,
        ease: 'Quad.out'
      });
    });

    btnPowerZone.on('pointerdown', () => {
      this.handleOvenPowerClick();
    });

    const btnBakeZone = this.add.rectangle(btnBakeCenterX, btnBakeCenterY, 50, 50, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);
    this.ovenBtnBakeZone = btnBakeZone;

    btnBakeZone.on('pointerover', () => {
      this.tweens.killTweensOf(this.ovenBtnBakeSprite);
      this.tweens.add({
        targets: this.ovenBtnBakeSprite,
        scale: 1.08,
        duration: 120,
        ease: 'Back.out'
      });
    });

    btnBakeZone.on('pointerout', () => {
      this.tweens.killTweensOf(this.ovenBtnBakeSprite);
      this.tweens.add({
        targets: this.ovenBtnBakeSprite,
        scale: 1.0,
        duration: 120,
        ease: 'Quad.out'
      });
    });

    btnBakeZone.on('pointerdown', () => {
      this.handleOvenBakeClick();
    });

    // Zona interactiva de la puerta del horno (bbox: 52..358, 146..395)
    const doorCenterX = this.ovenX - 200 + 205;     // 1467 -> 1499
    const doorCenterY = this.ovenY - 224.5 + 270.5; // 552 -> 475
    const ovenDoorZone = this.add.rectangle(doorCenterX, doorCenterY, 306, 249, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);
    this.ovenDoorZone = ovenDoorZone;

    ovenDoorZone.on('pointerdown', () => {
      this.handleOvenImageClick();
    });

    // Zona de referencia del timer del horno (perilla / slider superior)
    const timerTrackCenterX = this.ovenX - 200 + 241; // 1535
    const timerTrackCenterY = this.ovenY - 224.5 + 57; // 261.5
    this.ovenTimerZone = this.add.rectangle(timerTrackCenterX, timerTrackCenterY, 160, 60, 0x000000, 0)
      .setDepth(12);

    // Botón SACAR GALLETAS (reubicado armónicamente bajo la base del horno en startY + 185)
    const extractBtnY = startY + 185;
    const i18n = I18nManager.getInstance();
    this.ovenExtractBtnBg = this.add.graphics().setDepth(10);
    this.ovenExtractBtnText = this.add.text(startX + 103, extractBtnY + 28, i18n.t('stations.ovenExtract'), {
      font: '21px "Outfit", sans-serif',
      fill: '#fff1e6',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(11);

    this.ovenExtractZone = this.add.rectangle(startX + 103, extractBtnY + 28, 206, 56, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);

    this.ovenExtractZone.on('pointerdown', () => {
      this.handleOvenImageClick();
    });

    this.updateExtractButtonState();
  }

  createDrinkStation(startX, startY) {


    // 2. Espresso Machine (New asset: cafeteteria_base.png) - 320x320 nativo 1:1 con Krita
    this.drinkMachine = this.add.image(startX, startY, 'drink_machine')
      .setDisplaySize(320, 320)
      .setDepth(2);
    
    // Set machine interactive to provide helpful hints on tap
    this.drinkMachine.setInteractive({ useHandCursor: true });
    this.drinkMachine.on('pointerdown', () => {
      const i18n = I18nManager.getInstance();
      if (this.machineState === 'empty') {
        this.showFeedbackText(i18n.t('game.feedback.pressDrinkButton'), startX, 375, '#582f0e');
      } else if (this.machineState.startsWith('ready_')) {
        this.showFeedbackText(i18n.t('game.feedback.dragCupToTray'), startX, 375, '#582f0e');
      } else {
        this.showFeedbackText(i18n.t('game.feedback.brewingDrink'), startX, 375, '#582f0e');
      }
    });

    // 4. Ingredient Click Zones directly on the machine panel (Coffee Beans at left, Milk at center-right)
    const beansX = startX - 64;
    const milkX = startX + 34;
    const btnY = startY - 83;
    const i18nInst = I18nManager.getInstance();

    // Coffee Button Image & Stock Text (integrated inside the new asset display box)
    this.btnCoffeeImage = this.add.image(beansX, btnY, 'btn_coffee_asset')
      .setDisplaySize(83, 68)
      .setDepth(3);

    const coffeeBaseScaleX = this.btnCoffeeImage.scaleX;
    const coffeeBaseScaleY = this.btnCoffeeImage.scaleY;

    this.beansStockText = this.add.text(beansX, btnY + 11, i18nInst.t('game.stockUnit', { qty: 0 }), {
      font: 'bold 21px "Outfit", sans-serif',
      fill: '#2b2b2b'
    }).setOrigin(0.5).setDepth(4);

    const beansDragZone = this.add.rectangle(beansX, btnY, 83, 68, 0x000000, 0)
      .setDepth(5);
    beansDragZone.setInteractive({ useHandCursor: true });
    this.btnCoffeeZone = beansDragZone;

    // Milk Button Image & Stock Text (integrated inside the new asset display box)
    const milkY = btnY - 2;
    this.btnMilkImage = this.add.image(milkX, milkY, 'btn_milk_asset')
      .setDisplaySize(83, 68)
      .setDepth(3);

    const milkBaseScaleX = this.btnMilkImage.scaleX;
    const milkBaseScaleY = this.btnMilkImage.scaleY;

    this.milkStockText = this.add.text(milkX, milkY + 11, i18nInst.t('game.stockUnit', { qty: 0 }), {
      font: 'bold 21px "Outfit", sans-serif',
      fill: '#2b2b2b'
    }).setOrigin(0.5).setDepth(4);

    const milkDragZone = this.add.rectangle(milkX, milkY, 83, 68, 0x000000, 0)
      .setDepth(5);
    milkDragZone.setInteractive({ useHandCursor: true });
    this.btnMilkZone = milkDragZone;

    this.updateDrinkStockTexts();

    // 5. Button click events (No drag-and-drop)
    beansDragZone.on('pointerover', () => {
      this.btnCoffeeImage.setScale(coffeeBaseScaleX * 1.06, coffeeBaseScaleY * 1.06);
      this.beansStockText.setScale(1.06);
    });
    beansDragZone.on('pointerout', () => {
      this.btnCoffeeImage.setScale(coffeeBaseScaleX, coffeeBaseScaleY);
      this.beansStockText.setScale(1.0);
    });
    beansDragZone.on('pointerdown', () => {
      if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('CLICK_COFFEE', { drink: 'coffee', type: 'coffee_beans' })) {
        this.tutorialManager.denyAction(this, this.btnCoffeeImage);
        return;
      }

      const stock = this.stock.drink.coffee_beans || 0;
      const i18n = I18nManager.getInstance();
      if (stock <= 0) {
        this.showFeedbackText(i18n.t('game.feedback.noCoffeeStock'), startX, 375, '#d90429');
        return;
      }
      
      // Bounce animation on tap
      this.tweens.add({
        targets: [this.btnCoffeeImage, this.beansStockText],
        scaleX: '*=1.08',
        scaleY: '*=1.08',
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          this.btnCoffeeImage.setScale(coffeeBaseScaleX, coffeeBaseScaleY);
          this.beansStockText.setScale(1.0);
        }
      });

      this.handleDrinkIngredientDrop('coffee_beans', startX, startY);
    });

    milkDragZone.on('pointerover', () => {
      this.btnMilkImage.setScale(milkBaseScaleX * 1.06, milkBaseScaleY * 1.06);
      this.milkStockText.setScale(1.06);
    });
    milkDragZone.on('pointerout', () => {
      this.btnMilkImage.setScale(milkBaseScaleX, milkBaseScaleY);
      this.milkStockText.setScale(1.0);
    });
    milkDragZone.on('pointerdown', () => {
      if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('CLICK_MILK', { drink: 'coffee_milk', type: 'milk' })) {
        this.tutorialManager.denyAction(this, this.btnMilkImage);
        return;
      }

      const stock = this.stock.drink.milk || 0;
      const i18n = I18nManager.getInstance();
      if (stock <= 0) {
        this.showFeedbackText(i18n.t('game.feedback.noMilkStock'), startX, 375, '#d90429');
        return;
      }

      // Bounce animation on tap
      this.tweens.add({
        targets: [this.btnMilkImage, this.milkStockText],
        scaleX: '*=1.08',
        scaleY: '*=1.08',
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          this.btnMilkImage.setScale(milkBaseScaleX, milkBaseScaleY);
          this.milkStockText.setScale(1.0);
        }
      });

      this.handleDrinkIngredientDrop('milk', startX, startY);
    });

    // 6. Clean Cups Stack (placed on top of the machine)
    const { cupStack } = UI_CONFIG;
    const cupStackX = cupStack ? cupStack.x : (startX + 52);
    const cupStackY = cupStack ? cupStack.y : (startY - 68);
    const cupStackW = cupStack ? cupStack.width : 34;
    const cupStackH = Math.round(cupStackW * (54 / 67));

    this.cupStackImage = this.add.image(cupStackX, cupStackY, 'beverage_empty_cup')
      .setDisplaySize(cupStackW, cupStackH)
      .setDepth(3)
      .setAlpha(0.85);

    const stackBaseScaleX = this.cupStackImage.scaleX;
    const stackBaseScaleY = this.cupStackImage.scaleY;

    this.cupStackZone = this.add.rectangle(cupStackX, cupStackY, cupStackW, cupStackH, 0x000000, 0)
      .setDepth(4);
    this.cupStackZone.setInteractive({ useHandCursor: true });
    this.input.setDraggable(this.cupStackZone);

    this.cupStackZone.on('pointerover', () => {
      this.cupStackImage.setScale(stackBaseScaleX * 1.1, stackBaseScaleY * 1.1);
    });
    this.cupStackZone.on('pointerout', () => {
      this.cupStackImage.setScale(stackBaseScaleX, stackBaseScaleY);
    });

    let tempDragCup = null;
    let dragBlocked = false;

    this.cupStackZone.on('dragstart', () => {
      if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_CUP', { destination: 'drink_machine' })) {
        this.tutorialManager.denyAction(this, this.cupStackImage);
        dragBlocked = true;
        return;
      }

      const i18n = I18nManager.getInstance();
      if (this.machineState !== 'no_cup') {
        SoundManager.getInstance().playUiDenied();
        this.showFeedbackText(i18n.t('game.feedback.cupAlreadyInMachine'), startX, 375, '#d90429');
        dragBlocked = true;
        return;
      }
      this.isHoldingItem = true;
      dragBlocked = false;
      this.events.emit('game:drag_start', { item: 'cup_stack' });
      SoundManager.getInstance().playUiTap();
      tempDragCup = this.add.image(this.cupStackImage.x, this.cupStackImage.y, 'beverage_empty_cup')
        .setDisplaySize(cupStackW, cupStackH)
        .setDepth(30000)
        .setAlpha(0.85);
    });

    this.cupStackZone.on('drag', (pointer, dragX, dragY) => {
      if (dragBlocked || !tempDragCup) return;
      tempDragCup.x = dragX;
      tempDragCup.y = dragY;
    });

    this.cupStackZone.on('dragend', () => {
      this.isHoldingItem = false;
      if (dragBlocked) {
        dragBlocked = false;
        return;
      }
      if (!tempDragCup) return;

      const destX = startX;
      const destY = startY + 75;
      const dist = Phaser.Math.Distance.Between(tempDragCup.x, tempDragCup.y, destX, destY);

      if (dist < 75) {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_CUP', { destination: 'drink_machine' })) {
          this.tutorialManager.denyAction(this, this.cupStackImage);
          tempDragCup.destroy();
          tempDragCup = null;
          this.events.emit('game:drag_end', { item: 'cup_stack' });
          return;
        }

        tempDragCup.destroy();
        tempDragCup = null;

        this.machineCupSprite = this.add.image(destX, destY, 'beverage_empty_cup')
          .setDisplaySize(cupStackW, cupStackH)
          .setDepth(4);

        this.machineState = 'empty';
        const i18n = I18nManager.getInstance();
        this.showFeedbackText(i18n.t('game.feedback.cupPlaced'), startX, 375, '#38b000');
        SoundManager.getInstance().playDrinkButton();
        this.events.emit('game:cup_placed');
      } else {
        const activeCup = tempDragCup;
        tempDragCup = null;
        this.tweens.add({
          targets: activeCup,
          x: this.cupStackImage.x,
          y: this.cupStackImage.y,
          duration: 250,
          ease: 'Cubic.out',
          onComplete: () => {
            activeCup.destroy();
          }
        });
      }
      this.events.emit('game:drag_end', { item: 'cup_stack' });
    });
  }

  updateDrinkStockTexts() {
    const i18n = I18nManager.getInstance();
    if (this.beansStockText) {
      this.beansStockText.setText(i18n.t('game.stockUnit', { qty: this.stock.drink.coffee_beans || 0 }));
    }
    if (this.milkStockText) {
      this.milkStockText.setText(i18n.t('game.stockUnit', { qty: this.stock.drink.milk || 0 }));
    }
  }

  updateDrinkServeButtonState(startX, startY) {
    // Deprecated: Serving is now handled via direct cup drag-and-drop to the Delivery Tray
  }

  handleDrinkIngredientDrop(type, startX, startY) {
    const i18n = I18nManager.getInstance();
    if (this.machineState === 'no_cup') {
      SoundManager.getInstance().playUiDenied();
      this.showFeedbackText(i18n.t('game.feedback.placeCupFirst'), startX, 375, '#d90429');
      return;
    }

    // Check if machine is in a state to accept ingredients
    if (this.machineState === 'empty') {
      // Deduct stock
      this.stock.drink[type]--;
      this.updateDrinkStockTexts();

      // Start brewing (sound trigger: steam & pour)
      SoundManager.getInstance().playDrinkSteam();
      SoundManager.getInstance().playDrinkPour();
      this.machineState = type === 'coffee_beans' ? 'brewing_coffee' : 'brewing_milk';
      
      // Draw progress bar above the machine (Y = startY - 78)
      const progressBg = this.add.graphics().setDepth(20);
      progressBg.fillStyle(0xdddddd, 1);
      progressBg.fillRoundedRect(startX - 75, startY - 146, 150, 15, 8);

      const progressBar = this.add.graphics().setDepth(21);
      
      // Update texture and alpha of the existing cup
      const cupKey = type === 'coffee_beans' ? 'beverage_coffee' : 'beverage_milk';
      const { cupStack } = UI_CONFIG;
      const cupStackW = cupStack ? cupStack.width : 64;
      const cupStackH = Math.round(cupStackW * (54 / 67));
      if (this.machineCupSprite) {
        this.machineCupSprite.setTexture(cupKey).setAlpha(0.4);
      } else {
        this.machineCupSprite = this.add.image(startX, startY + 75, cupKey)
          .setDisplaySize(cupStackW, cupStackH)
          .setAlpha(0.4)
          .setDepth(4);
      }

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
          progressBar.fillRoundedRect(startX - 75, startY - 146, 150 * ratio, 15, 8);

          if (elapsed >= duration) {
            progressBg.destroy();
            progressBar.destroy();

            // Brew finished!
            this.machineState = type === 'coffee_beans' ? 'ready_coffee' : 'ready_milk';
            
            // Play ready sound
            SoundManager.getInstance().playDrinkReady();

            if (this.machineCupSprite) {
              this.machineCupSprite.setAlpha(1.0);
              
              const baseScaleX = this.machineCupSprite.scaleX;
              const baseScaleY = this.machineCupSprite.scaleY;

              // Pulsing visual effect to show it is ready
              this.tweens.add({
                targets: this.machineCupSprite,
                scaleX: baseScaleX * 1.12,
                scaleY: baseScaleY * 1.12,
                duration: 250,
                yoyo: true,
                repeat: 1,
                ease: 'Quad.easeInOut'
              });

              // Make cup draggable to delivery tray
              this.makeCupDraggable(startX, startY);
            }
            
            // Show serve button
            this.updateDrinkServeButtonState(startX, startY);
            
            const i18n = I18nManager.getInstance();
            this.showFeedbackText(i18n.t('game.feedback.drinkReady'), startX, 375, '#38b000');
            this.events.emit('game:drink_brewed', { drink: type === 'coffee_beans' ? 'coffee' : 'milk', type });
          }
        }
      });
    } else if ((this.machineState === 'ready_coffee' && type === 'milk') || (this.machineState === 'ready_milk' && type === 'coffee_beans')) {
      // Upgrade Coffee or Milk to Coffee with Milk
      if (type === 'milk') {
        this.stock.drink.milk--;
      } else {
        this.stock.drink.coffee_beans--;
      }
      this.updateDrinkStockTexts();

      // Play pouring sound & set state to brewing combined drink
      SoundManager.getInstance().playDrinkSteam();
      SoundManager.getInstance().playDrinkPour();
      this.machineState = 'brewing_coffee_milk';

      // Disable drag interaction while brewing second ingredient
      if (this.machineCupSprite) {
        this.machineCupSprite.disableInteractive();
        this.machineCupSprite.setTexture('beverage_coffee_milk').setAlpha(0.4);
      }

      // Draw progress bar above the machine (Y = startY - 146)
      const progressBg = this.add.graphics().setDepth(20);
      progressBg.fillStyle(0xdddddd, 1);
      progressBg.fillRoundedRect(startX - 75, startY - 146, 150, 15, 8);

      const progressBar = this.add.graphics().setDepth(21);

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
          progressBar.fillRoundedRect(startX - 75, startY - 146, 150 * ratio, 15, 8);

          if (elapsed >= duration) {
            progressBg.destroy();
            progressBar.destroy();

            // Upgrade finished!
            this.machineState = 'ready_coffee_milk';

            // Play ready sound
            SoundManager.getInstance().playDrinkReady();

            if (this.machineCupSprite) {
              this.machineCupSprite.setAlpha(1.0);

              const baseScaleX = this.machineCupSprite.scaleX;
              const baseScaleY = this.machineCupSprite.scaleY;

              // Pulsing visual effect to show it is ready
              this.tweens.add({
                targets: this.machineCupSprite,
                scaleX: baseScaleX * 1.12,
                scaleY: baseScaleY * 1.12,
                duration: 250,
                yoyo: true,
                repeat: 1,
                ease: 'Quad.easeInOut'
              });

              // Make cup draggable to delivery tray
              this.makeCupDraggable(startX, startY);
            }

            const i18n = I18nManager.getInstance();
            this.showFeedbackText(i18n.t('game.feedback.coffeeMilkReady'), startX, 375, '#38b000');
            this.events.emit('game:drink_brewed', { drink: 'coffee_milk', type: 'coffee_milk' });
          }
        }
      });
    } else {
      SoundManager.getInstance().playUiDenied();
      const i18n = I18nManager.getInstance();
      this.showFeedbackText(i18n.t('game.feedback.machineBusy'), startX, 375, '#d90429');
    }
  }

  makeCupDraggable(startX, startY) {
    if (!this.machineCupSprite) return;

    this.machineCupSprite.setInteractive({ useHandCursor: true });
    this.input.setDraggable(this.machineCupSprite);

    this.machineCupSprite.setData('origX', startX);
    this.machineCupSprite.setData('origY', startY + 75);
    const baseScaleX = this.machineCupSprite.scaleX;
    const baseScaleY = this.machineCupSprite.scaleY;

    this.machineCupSprite.on('dragstart', () => {
      if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_DRINK_TRAY', { destination: 'delivery_tray' })) {
        this.tutorialManager.denyAction(this, this.machineCupSprite);
        return;
      }

      this.isHoldingItem = true;
      this.events.emit('game:drag_start', { item: 'drink_cup' });
      SoundManager.getInstance().playUiTap();
      this.machineCupSprite.setDepth(30000);
      this.machineCupSprite.setScale(baseScaleX * 1.15, baseScaleY * 1.15);
    });

    this.machineCupSprite.on('drag', (pointer, dragX, dragY) => {
      this.machineCupSprite.x = dragX;
      this.machineCupSprite.y = dragY;
    });

    this.machineCupSprite.on('dragend', () => {
      this.isHoldingItem = false;
      const dist = Phaser.Math.Distance.Between(
        this.machineCupSprite.x,
        this.machineCupSprite.y,
        this.deliveryTrayX,
        this.deliveryTrayY
      );

      const halfW = (this.deliveryTrayWidth || 375) / 2 + 40;
      const halfH = (this.deliveryTrayHeight || 94) / 2 + 40;
      const inBounds = Math.abs(this.machineCupSprite.x - this.deliveryTrayX) <= halfW &&
                       Math.abs(this.machineCupSprite.y - this.deliveryTrayY) <= halfH;

      if (dist < 188 || inBounds) {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_DRINK_TRAY', { destination: 'delivery_tray' })) {
          this.tutorialManager.denyAction(this, this.machineCupSprite);
          this.tweens.add({
            targets: this.machineCupSprite,
            x: this.machineCupSprite.getData('origX'),
            y: this.machineCupSprite.getData('origY'),
            scaleX: baseScaleX,
            scaleY: baseScaleY,
            duration: 250,
            ease: 'Cubic.out',
            onComplete: () => {
              if (this.machineCupSprite) {
                this.machineCupSprite.setDepth(4);
              }
            }
          });
          this.events.emit('game:drag_end', { item: 'drink_cup' });
          return;
        }

        this.pickupDrink();
      } else {
        this.tweens.add({
          targets: this.machineCupSprite,
          x: this.machineCupSprite.getData('origX'),
          y: this.machineCupSprite.getData('origY'),
          scaleX: baseScaleX,
          scaleY: baseScaleY,
          duration: 250,
          ease: 'Cubic.out',
          onComplete: () => {
            if (this.machineCupSprite) {
              this.machineCupSprite.setDepth(4);
            }
          }
        });
      }
      this.events.emit('game:drag_end', { item: 'drink_cup' });
    });
  }

  pickupDrink() {
    if (!this.machineCupSprite || !this.machineState.startsWith('ready_')) return;
    SoundManager.getInstance().playUiTap();

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
    this.machineState = 'no_cup';

    // Hide serve button
    this.updateDrinkServeButtonState(startX, startY);

    const i18n = I18nManager.getInstance();
    const drinkName = i18n.t(`recipes.drinks.${drinkKey}`);
    this.showFeedbackText(i18n.t('game.feedback.drinkServed', { name: drinkName }), startX, 375, '#38b000');
    this.events.emit('game:drink_to_tray', { drink: drinkKey });
  }

  handleOvenClick() {
    this.handleOvenPowerClick();
  }

  handleOvenPowerClick() {
    if (this.tutorialManager?.isActive) {
      const targetState = !this.isOvenPreheated;
      if (!this.tutorialManager.isActionAllowed('CLICK_POWER', { isPreheated: targetState })) {
        this.tutorialManager.denyAction(this, this.ovenBtnPowerSprite);
        return;
      }
    }

    SoundManager.getInstance().playOvenClick();
    const i18n = I18nManager.getInstance();
    if (!this.isOvenPreheated) {
      this.isOvenPreheated = true;
      if (this.ovenBtnPowerSprite) {
        this.ovenBtnPowerSprite.setTexture('oven_btn_power_on');
      }
      this.showFeedbackText(i18n.t('game.feedback.ovenPreheating'), this.ovenX, 375, '#38b000');
      this.events.emit('game:oven_power', { isPreheated: true });
    } else {
      // Apagar horno: si estaba cocinando, se detiene
      if (this.isBaking) {
        this.isBaking = false;
        SoundManager.getInstance().stopOvenHum();
        if (this.ovenBtnBakeSprite) {
          this.ovenBtnBakeSprite.setTexture('oven_btn_bake_off');
        }
        if (this.ovenGlassSprite) {
          this.ovenGlassSprite.setTexture('oven_glass_off');
        }
        this.evaluateCookiesInOven();
      }
      this.isOvenPreheated = false;
      if (this.ovenBtnPowerSprite) {
        this.ovenBtnPowerSprite.setTexture('oven_btn_power_off');
      }
      if (this.ovenKnobSprite) {
        this.ovenKnobSprite.setX(this.ovenX);
      }
      this.ovenTimeElapsed = 0;
      this.alarmPlayed = false;
      this.ovenOvercookTimer = 0;
      this.hasOvercookedAlarm = false;
      this.showFeedbackText(i18n.t('game.feedback.ovenOff'), this.ovenX, 375, '#582f0e');
      this.events.emit('game:oven_power', { isPreheated: false });
    }
    this.updateExtractButtonState();
  }

  handleOvenBakeClick() {
    if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('CLICK_BAKE')) {
      this.tutorialManager.denyAction(this, this.ovenBtnBakeSprite);
      return;
    }

    const i18n = I18nManager.getInstance();
    if (!this.isOvenPreheated) {
      SoundManager.getInstance().playUiDenied();
      this.showFeedbackText(i18n.t('game.feedback.turnOnOvenFirst'), this.ovenX, 375, '#d90429');
      return;
    }

    if (!this.cookiesInOven || this.cookiesInOven.length === 0) {
      SoundManager.getInstance().playUiDenied();
      this.showFeedbackText(i18n.t('game.feedback.ovenEmpty'), this.ovenX, 375, '#d90429');
      return;
    }

    if (!this.isBaking) {
      // Iniciar cocción con horno precalentado y galletas dentro
      SoundManager.getInstance().playBakingStart();
      this.isBaking = true;
      this.ovenTimeElapsed = 0;
      this.alarmPlayed = false;
      this.ovenOvercookTimer = 0;
      this.hasOvercookedAlarm = false;
      if (this.ovenBtnBakeSprite) {
        this.ovenBtnBakeSprite.setTexture('oven_btn_bake_on');
      }
      if (this.ovenGlassSprite) {
        this.ovenGlassSprite.setTexture('oven_glass_on');
      }
      this.showFeedbackText(i18n.t('game.feedback.cookingCookies'), this.ovenX, 375, '#38b000');
      this.updateExtractButtonState();
      this.events.emit('game:oven_bake_start');
    } else {
      // Detener cocción manualmente
      SoundManager.getInstance().stopOvenHum();
      SoundManager.getInstance().playOvenClick();
      this.isBaking = false;
      if (this.ovenBtnBakeSprite) {
        this.ovenBtnBakeSprite.setTexture('oven_btn_bake_off');
      }
      if (this.ovenGlassSprite) {
        this.ovenGlassSprite.setTexture('oven_glass_off');
      }
      if (this.ovenKnobSprite) {
        this.ovenKnobSprite.setX(this.ovenX);
      }
      this.ovenTimeElapsed = 0;
      this.alarmPlayed = false;
      this.ovenOvercookTimer = 0;
      this.hasOvercookedAlarm = false;
      this.evaluateCookiesInOven();
      this.updateExtractButtonState();
    }
  }

  evaluateCookiesInOven() {
    const bakeMin = this.config.bakeMin || 5.0;

    this.cookiesInOven.forEach(cookie => {
      const time = cookie.bakeTime || 0;
      if (cookie.bakedState === 'burnt') {
        // Conserva quemada
      } else if (time >= bakeMin) {
        cookie.bakedState = 'baked';
      } else {
        cookie.bakedState = 'raw';
      }
    });

    let hasBurnt = false;
    let hasBaked = false;
    let hasRaw = false;

    this.cookiesInOven.forEach(cookie => {
      if (cookie.bakedState === 'burnt') hasBurnt = true;
      else if (cookie.bakedState === 'baked') hasBaked = true;
      else if (cookie.bakedState === 'raw') hasRaw = true;
    });

    const i18n = I18nManager.getInstance();
    let feedback = i18n.t('game.feedback.cookieStillRaw');
    let color = '#ffb703';

    if (hasBurnt) {
      feedback = i18n.t('game.feedback.cookieBurnt');
      color = '#d90429';
    } else if (hasBaked && !hasRaw) {
      feedback = i18n.t('game.feedback.perfectBake');
      color = '#38b000';
    } else if (hasBaked && hasRaw) {
      feedback = i18n.t('game.feedback.someReady');
      color = '#38b000';
    }

    this.showFeedbackText(feedback, this.ovenX, 375, color);
    this.updateCookieVisuals();
  }

  drawOvenBarBackground() {
    // Reemplazado por el nuevo indicador analógico artesanal
  }

  updateOvenBar() {
    // Reemplazado por el desplazamiento de this.ovenKnobSprite
  }

  updateOvenVisualEffects() {
    // Reemplazado por el cristal encendido multicapa
  }

  createToppingButtons(startX, startY) {
    // Topping label sign removed

    const toppings = [
      { id: 'sprinkles', color: 0xff70a6 },
      { id: 'choco', color: 0x3d0c00 },
      { id: 'glazing', color: 0xff0a54 }
    ];

    const jarSize = 158;
    const jarHoverSize = 173;

    this.toppingButtons = {};
    this.toppingDragZones = {};
    this.toppingStockTexts = {};

    toppings.forEach((t, index) => {
      const x = startX + 19 + 79; // center of jar
      const y = startY + index * 150 + 79;

      // Topping Jar sprite
      const jarSource = this.add.image(x, y, 'topping_' + t.id).setDisplaySize(jarSize, jarSize).setDepth(2);
      this.toppingButtons[t.id] = jarSource;

      // Stock indicator text
      const stockText = this.add.text(x, y + 68, '', {
        font: '21px "Outfit", sans-serif',
        fill: '#ffffff',
        stroke: '#582f0e',
        strokeThickness: 5,
        fontWeight: '800'
      }).setOrigin(0.5).setDepth(3);
      this.toppingStockTexts[t.id] = stockText;

      // Invisible drag zone
      const dragZone = this.add.rectangle(x, y, jarSize, jarSize, 0x000000, 0);
      dragZone.setInteractive({ useHandCursor: true });
      this.input.setDraggable(dragZone);
      this.toppingDragZones[t.id] = dragZone;

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
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_TOPPING', { topping: t.id })) {
          this.tutorialManager.denyAction(this, jarSource);
          return;
        }

        const currentStock = this.stock.topping[t.id] || 0;
        const i18n = I18nManager.getInstance();
        if (currentStock <= 0) {
          SoundManager.getInstance().playUiDenied();
          this.showFeedbackText(i18n.t('game.feedback.outOfStock'), this.trayX, 375, '#d90429');
          return;
        }

        this.events.emit('game:drag_start', { item: 'topping', topping: t.id, id: t.id });
        SoundManager.getInstance().playUiTap();
        jarClone = this.add.image(x, y, 'topping_' + t.id);
        jarClone.setDisplaySize(jarSize, jarSize);
        jarClone.setDepth(30000);
        jarSource.setAlpha(0.35);
        initialDist = Phaser.Math.Distance.Between(x, y, this.trayX, this.trayY);
      });

      dragZone.on('drag', (pointer, dragX, dragY) => {
        if (!jarClone) return;
        const clampedY = Math.max(338, dragY);
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
          this.events.emit('game:drag_end', { item: 'topping', topping: t.id, id: t.id });
          return;
        }

        const dist = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, this.trayX, this.trayY);

        if (dist < 225) {
          // Find closest cookie on preparation tray
          let closestCookie = null;
          let minDist = 99999;
          const count = this.prepTrayCookies.length;
          const spacing = 66;
          const startXLoc = this.trayX - ((count - 1) * spacing) / 2;

          this.prepTrayCookies.forEach((cookie, index) => {
            const cx = startXLoc + index * spacing;
            const cy = this.trayY;
            const distCookie = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, cx, cy);
            if (distCookie < 225 && distCookie < minDist) {
              minDist = distCookie;
              closestCookie = cookie;
            }
          });

          const i18n = I18nManager.getInstance();

          if (closestCookie) {
            if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_TOPPING', { topping: t.id, target: 'table_cookie' })) {
              this.tutorialManager.denyAction(this, jarSource);
            } else {
              // Consume stock!
              this.stock.topping[t.id]--;
              this.updateStockTexts();

              closestCookie.toppings = [t.id];
              this.updateCookieVisuals();

              // Specialized ASMR topping sound
              if (t.id === 'sprinkles') {
                SoundManager.getInstance().playToppingSprinkles();
              } else if (t.id === 'choco') {
                SoundManager.getInstance().playToppingChoco();
              } else if (t.id === 'glazing') {
                SoundManager.getInstance().playToppingGlazing();
              } else {
                SoundManager.getInstance().playUiTap();
              }

              const toppingName = i18n.t(`recipes.toppings.${t.id}`);
              this.showFeedbackText(i18n.t('game.feedback.toppingAdded', { name: toppingName }), this.trayX, 375, '#38b000');
              this.events.emit('game:topping_applied', { topping: t.id });
            }
          } else {
            const distToTrayCenter = Phaser.Math.Distance.Between(jarClone.x, jarClone.y, this.trayX, this.trayY);
            if (distToTrayCenter < 225) {
              SoundManager.getInstance().playUiDenied();
              this.showFeedbackText(i18n.t('game.feedback.selectDoughFirst'), this.trayX, 375, '#d90429');
            } else {
              SoundManager.getInstance().playUiTap();
            }
          }
        } else {
          SoundManager.getInstance().playUiTap();
        }

        jarClone.destroy();
        jarClone = null;
        jarSource.setAlpha(1);
        jarSource.setDisplaySize(jarSize, jarSize);
        dragZone.x = x;
        dragZone.y = y;
        this.events.emit('game:drag_end', { item: 'topping', topping: t.id, id: t.id });
      });
    });
  }

  updateStockTexts() {
    const i18n = I18nManager.getInstance();
    // 1. Dough Stock
    if (this.doughStockTexts) {
      Object.keys(this.doughStockTexts).forEach(id => {
        const qty = this.stock.dough[id];
        const textObj = this.doughStockTexts[id];
        const imgObj = this.doughButtons[id];
        if (textObj) {
          textObj.setText(qty === Infinity ? i18n.t('game.stockInfinite') : i18n.t('game.stock', { qty }));
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
          textObj.setText(i18n.t('game.stock', { qty }));
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
    this.trayY = height - 169;

    const trayX = this.trayX;
    const trayY = this.trayY;

    // Draw tray plate placeholder
    const trayBg = this.add.graphics().setDepth(2);
    trayBg.fillStyle(0xcccccc, 1); // Metallic tray
    trayBg.fillRoundedRect(trayX - 188, trayY - 84, 375, 169, 19);
    trayBg.lineStyle(6, 0x999999, 1);
    trayBg.strokeRoundedRect(trayX - 188, trayY - 84, 375, 169, 19);

    this.prepTrayBg = trayBg;
    this.prepTrayZone = this.add.rectangle(trayX, trayY, 375, 169, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(2.5);
    this.input.setDraggable(this.prepTrayZone);

    this.prepTraySprites = [];

    this.prepTrayZone.on('pointerdown', () => {
      if (this.isEditorMode) return;
      this.isHoldingItem = true;
    });

    this.prepTrayZone.on('dragstart', () => {
      if (this.isEditorMode) return;
      if (this.tutorialManager?.isActive) {
        const allowedActions = ['LOAD_OVEN', 'DRAG_COOKIE_TRAY', 'DRAG_TRASH'];
        const curAction = this.tutorialManager.getCurrentStep()?.allowedAction;
        if (!allowedActions.includes(curAction)) {
          this.tutorialManager.denyAction(this, this.prepTrayZone);
          return;
        }
      }
      this.isHoldingItem = true;
      this.events.emit('game:drag_start', { item: 'prep_tray' });
      SoundManager.getInstance().playUiTap();
      this.prepTrayZone.setDepth(30000);
      if (this.prepTrayBg) this.prepTrayBg.setDepth(29999);
      if (this.prepTraySprites) {
        this.prepTraySprites.forEach(s => {
          if (s && s.setDepth) s.setDepth(30001);
        });
      }
    });

    this.prepTrayZone.on('drag', (pointer, dragX, dragY) => {
      if (this.isEditorMode) return;
      const clampedY = Math.max(300, Math.min(1000, dragY));
      this.prepTrayZone.x = dragX;
      this.prepTrayZone.y = clampedY;

      if (this.prepTrayBg) {
        this.prepTrayBg.x = dragX - this.trayX;
        this.prepTrayBg.y = clampedY - this.trayY;
      }

      const count = this.prepTrayCookies ? this.prepTrayCookies.length : 0;
      if (count > 0 && this.prepTraySprites) {
        const spacing = 84;
        const startX = dragX - ((count - 1) * spacing) / 2;
        this.prepTraySprites.forEach((sprite, index) => {
          if (sprite) {
            sprite.x = startX + index * spacing;
            sprite.y = clampedY;
          }
        });
      }

      // Check distance to trash bin
      const distToTrash = Phaser.Math.Distance.Between(dragX, clampedY, this.trashBinX, this.trashBinY);
      if (distToTrash < 95) {
        if (!this.trashHighlighted) {
          this.trashHighlighted = true;
          this.tweens.add({
            targets: this.trashContainer,
            scale: 1.15,
            duration: 100
          });
          if (this.trashBinSprite) this.trashBinSprite.setTint(0xff8888);
        }
      } else {
        if (this.trashHighlighted) {
          this.trashHighlighted = false;
          this.tweens.add({
            targets: this.trashContainer,
            scale: 1.0,
            duration: 100
          });
          if (this.trashBinSprite) this.trashBinSprite.clearTint();
        }
      }

      // Check distance to oven
      const distToOven = Phaser.Math.Distance.Between(dragX, clampedY, this.ovenX, this.ovenY);
      if (distToOven < 225) {
        if (!this.ovenHighlighted) {
          this.ovenHighlighted = true;
          if (this.ovenBaseSprite) this.ovenBaseSprite.setTint(0xfffaed);
        }
      } else {
        if (this.ovenHighlighted) {
          this.ovenHighlighted = false;
          if (this.ovenBaseSprite) this.ovenBaseSprite.clearTint();
        }
      }
    });

    this.prepTrayZone.on('dragend', () => {
      this.isHoldingItem = false;
      if (this.isEditorMode) return;
      this.prepTrayZone.setScale(1.0);
      this.prepTrayZone.setDepth(2.5);
      if (this.prepTrayBg) this.prepTrayBg.setDepth(2);
      if (this.prepTraySprites) {
        this.prepTraySprites.forEach(s => {
          if (s && s.setDepth) s.setDepth(4);
        });
      }

      if (this.trashHighlighted) {
        this.trashHighlighted = false;
        if (this.trashContainer) this.trashContainer.setScale(1.0);
        if (this.trashBinSprite) this.trashBinSprite.clearTint();
      }

      if (this.ovenHighlighted) {
        this.ovenHighlighted = false;
        if (this.ovenBaseSprite) this.ovenBaseSprite.clearTint();
      }

      const distOven = Phaser.Math.Distance.Between(this.prepTrayZone.x, this.prepTrayZone.y, this.ovenX, this.ovenY);
      const distDelivery = Phaser.Math.Distance.Between(this.prepTrayZone.x, this.prepTrayZone.y, this.deliveryTrayX, this.deliveryTrayY);
      const distTrash = Phaser.Math.Distance.Between(this.prepTrayZone.x, this.prepTrayZone.y, this.trashBinX, this.trashBinY);
      const i18n = I18nManager.getInstance();

      // 1. Drop on Trash
      if (distTrash < 95) {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_TRASH', { item: 'prep_tray', destination: 'trash' })) {
          this.tutorialManager.denyAction(this, this.prepTrayZone);
        } else if (this.prepTrayCookies && this.prepTrayCookies.length > 0) {
          SoundManager.getInstance().playTrash();
          const trashedCookies = [...this.prepTrayCookies];
          this.prepTrayCookies = [];
          this.updateCookieVisuals();
          this.showFeedbackText(i18n.t('game.feedback.trayEmptied'), this.trashBinX, this.trashBinY - 50, '#d90429');
          this.events.emit('game:cookie_trashed', { item: 'prep_tray', cookies: trashedCookies, destination: 'trash' });
        }
      }
      // 2. Drop on Delivery Tray
      else if (distDelivery < 188) {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_COOKIE_TRAY', { item: 'prep_tray', destination: 'delivery_tray' })) {
          this.tutorialManager.denyAction(this, this.prepTrayZone);
        } else if (this.prepTrayCookies && this.prepTrayCookies.length > 0) {
          this.prepTrayCookies.forEach(c => this.deliveryTrayCookies.push(c));
          this.prepTrayCookies = [];
          this.drawDeliveryTray();
          this.updateCookieVisuals();
          SoundManager.getInstance().playUiTap();
          this.showFeedbackText(i18n.t('game.feedback.cookieReadyDelivery'), this.deliveryTrayX, 375, '#38b000');
          this.events.emit('game:cookie_to_tray', { item: 'prep_tray' });
        }
      }
      // 3. Drop on Oven
      else if (distOven < 225) {
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('LOAD_OVEN', { item: 'prep_tray', destination: 'oven' })) {
          this.tutorialManager.denyAction(this, this.prepTrayZone);
        } else if (this.isBaking) {
          SoundManager.getInstance().playUiDenied();
          this.showFeedbackText(i18n.t('game.feedback.ovenAlreadyOn'), this.trayX, 375, '#d90429');
        } else if (this.cookiesInOven.length >= 3) {
          SoundManager.getInstance().playUiDenied();
          this.showFeedbackText(i18n.t('game.feedback.ovenFull'), this.trayX, 375, '#d90429');
        } else if (!this.prepTrayCookies || this.prepTrayCookies.length === 0) {
          SoundManager.getInstance().playUiDenied();
          this.showFeedbackText(i18n.t('game.feedback.ovenEmpty'), this.trayX, 375, '#d90429');
        } else {
          const shapedCookies = this.prepTrayCookies.filter(c => !!c.shape);
          if (shapedCookies.length === 0) {
            SoundManager.getInstance().playUiDenied();
            this.showFeedbackText(i18n.t('game.feedback.cutShapeFirst'), this.trayX, 375, '#d90429');
          } else {
            const availableSpace = 3 - this.cookiesInOven.length;
            const cookiesToLoad = shapedCookies.slice(0, availableSpace);
            cookiesToLoad.forEach(cookieInstance => {
              this.cookiesInOven.push(cookieInstance);
              const idx = this.prepTrayCookies.indexOf(cookieInstance);
              if (idx !== -1) {
                this.prepTrayCookies.splice(idx, 1);
              }
            });
            this.updateExtractButtonState();
            SoundManager.getInstance().playOvenDoor();
            this.showFeedbackText(i18n.t('game.feedback.cookieInserted', { count: this.cookiesInOven.length, total: 3 }), this.trayX, 375, '#38b000');
            this.events.emit('game:cookie_loaded_oven', { item: 'prep_tray', cookies: cookiesToLoad, count: this.cookiesInOven.length, destination: 'oven' });
            this.updateCookieVisuals();
          }
        }
      }

      this.events.emit('game:drag_end', { item: 'prep_tray' });

      // Elastic return tween for prep tray
      this.tweens.add({
        targets: this.prepTrayZone,
        x: this.trayX,
        y: this.trayY,
        duration: 250,
        ease: 'Cubic.out',
        onUpdate: () => {
          if (this.prepTrayBg) {
            this.prepTrayBg.x = this.prepTrayZone.x - this.trayX;
            this.prepTrayBg.y = this.prepTrayZone.y - this.trayY;
          }
          const count = this.prepTrayCookies ? this.prepTrayCookies.length : 0;
          if (count > 0 && this.prepTraySprites) {
            const spacing = 84;
            const startX = this.prepTrayZone.x - ((count - 1) * spacing) / 2;
            this.prepTraySprites.forEach((sprite, index) => {
              if (sprite) {
                sprite.x = startX + index * spacing;
                sprite.y = this.prepTrayZone.y;
              }
            });
          }
        },
        onComplete: () => {
          if (this.prepTrayBg) {
            this.prepTrayBg.x = 0;
            this.prepTrayBg.y = 0;
          }
          this.prepTrayZone.x = this.trayX;
          this.prepTrayZone.y = this.trayY;
          this.updateCookieVisuals();
        }
      });
    });
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
      const spacing = 84;
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

        const size = isShaped ? 103 : 84;
        const sprite = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(4);
        sprite.setInteractive({ useHandCursor: true });
        this.input.setDraggable(sprite);

        sprite.setData('cookieIndex', index);
        sprite.setData('cookieInstance', cookie);
        sprite.setData('origX', x);
        sprite.setData('origY', y);

        sprite.on('dragstart', () => {
          const cookieInstance = sprite.getData('cookieInstance') || cookie;
          const cookieIdx = this.prepTrayCookies.indexOf(cookieInstance);

          if (this.tutorialManager?.isActive) {
            const allowedActions = ['LOAD_OVEN', 'DRAG_COOKIE_TRAY', 'DRAG_TRASH'];
            const curAction = this.tutorialManager.getCurrentStep()?.allowedAction;
            if (!allowedActions.includes(curAction)) {
              this.tutorialManager.denyAction(this, sprite);
              return;
            }
          }

          this.isHoldingItem = true;
          this.events.emit('game:drag_start', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });
          SoundManager.getInstance().playUiTap();
          sprite.setDepth(30000);
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
          sprite.x = dragX;
          sprite.y = Math.max(338, dragY);

          // Check if hovering over trash bin
          const distToTrash = Phaser.Math.Distance.Between(dragX, Math.max(338, dragY), this.trashBinX, this.trashBinY);
          if (distToTrash < 95) {
            if (!this.trashHighlighted) {
              this.trashHighlighted = true;
              this.tweens.add({
                targets: this.trashContainer,
                scale: 1.15,
                duration: 100
              });
              if (this.trashBinSprite) this.trashBinSprite.setTint(0xff8888);
            }
          } else {
            if (this.trashHighlighted) {
              this.trashHighlighted = false;
              this.tweens.add({
                targets: this.trashContainer,
                scale: 1.0,
                duration: 100
              });
              if (this.trashBinSprite) this.trashBinSprite.clearTint();
            }
          }

          // Check if hovering over oven
          const distToOven = Phaser.Math.Distance.Between(dragX, Math.max(338, dragY), this.ovenX, this.ovenY);
          if (distToOven < 225) {
            if (!this.ovenHighlighted) {
              this.ovenHighlighted = true;
              if (this.ovenBaseSprite) this.ovenBaseSprite.setTint(0xfffaed);
            }
          } else {
            if (this.ovenHighlighted) {
              this.ovenHighlighted = false;
              if (this.ovenBaseSprite) this.ovenBaseSprite.clearTint();
            }
          }
        });

        sprite.on('dragend', () => {
          this.isHoldingItem = false;
          // Reset highlights
          if (this.trashHighlighted) {
            this.trashHighlighted = false;
            if (this.trashContainer) this.trashContainer.setScale(1.0);
            if (this.trashBinSprite) this.trashBinSprite.clearTint();
          }
          if (this.ovenHighlighted) {
            this.ovenHighlighted = false;
            if (this.ovenBaseSprite) this.ovenBaseSprite.clearTint();
          }

          const distOven = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.ovenX, this.ovenY);
          const distDelivery = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.deliveryTrayX, this.deliveryTrayY);
          const distTrash = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.trashBinX, this.trashBinY);

          const cookieInstance = sprite.getData('cookieInstance') || cookie;
          const cookieIdx = this.prepTrayCookies.indexOf(cookieInstance);
          const i18n = I18nManager.getInstance();

          // 1. Drop on Trash Bin
          if (distTrash < 95) {
            if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_TRASH', { item: 'table_cookie', destination: 'trash', cookie: cookieInstance })) {
              this.tutorialManager.denyAction(this, sprite);
              this.tweens.add({
                targets: sprite,
                x: sprite.getData('origX'),
                y: sprite.getData('origY'),
                duration: 250,
                ease: 'Back.out',
                onComplete: () => {
                  sprite.setDepth(4);
                }
              });
              this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });
              return;
            }

            SoundManager.getInstance().playTrash();
            const realIdx = this.prepTrayCookies.indexOf(cookieInstance);
            if (realIdx !== -1) {
              this.prepTrayCookies.splice(realIdx, 1);
            }
            this.updateCookieVisuals();
            this.showFeedbackText(i18n.t('game.feedback.discarded'), this.trashBinX, this.trashBinY - 50, '#d90429');
            this.events.emit('game:cookie_trashed', { item: 'table_cookie', cookie: cookieInstance, destination: 'trash' });
            this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });

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

          // 2. Drop on Delivery Tray (allows raw unshaped dough as well)
          if (distDelivery < 188) {
            if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_COOKIE_TRAY', { destination: 'delivery_tray', cookie: cookieInstance })) {
              this.tutorialManager.denyAction(this, sprite);
              this.tweens.add({
                targets: sprite,
                x: sprite.getData('origX'),
                y: sprite.getData('origY'),
                duration: 250,
                ease: 'Back.out',
                onComplete: () => {
                  sprite.setDepth(3);
                }
              });
              this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });
              return;
            }

            this.deliveryTrayCookies.push(cookieInstance);
            const realIdx = this.prepTrayCookies.indexOf(cookieInstance);
            if (realIdx !== -1) {
              this.prepTrayCookies.splice(realIdx, 1);
            }
            this.drawDeliveryTray();
            this.updateCookieVisuals();
            SoundManager.getInstance().playUiTap();
            this.showFeedbackText(i18n.t('game.feedback.cookieReadyDelivery'), this.deliveryTrayX, 375, '#38b000');
            this.events.emit('game:cookie_to_tray', { cookie: cookieInstance });
            this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });
            return;
          }

          // 3. Drop on Oven (only if shaped, oven has space, and not baking)
          if (distOven < 225) {
            if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('LOAD_OVEN', { destination: 'oven', cookie: cookieInstance })) {
              this.tutorialManager.denyAction(this, sprite);
              this.tweens.add({
                targets: sprite,
                x: sprite.getData('origX'),
                y: sprite.getData('origY'),
                duration: 250,
                ease: 'Back.out',
                onComplete: () => {
                  sprite.setDepth(3);
                }
              });
              this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });
              return;
            }

            if (this.isBaking) {
              SoundManager.getInstance().playUiDenied();
              this.showFeedbackText(i18n.t('game.feedback.ovenAlreadyOn'), this.trayX, 375, '#d90429');
            } else if (this.cookiesInOven.length >= 3) {
              SoundManager.getInstance().playUiDenied();
              this.showFeedbackText(i18n.t('game.feedback.ovenFull'), this.trayX, 375, '#d90429');
            } else if (!cookieInstance.shape) {
              SoundManager.getInstance().playUiDenied();
              this.showFeedbackText(i18n.t('game.feedback.cutShapeFirst'), this.trayX, 375, '#d90429');
            } else {
              // Valid drop in oven!
              this.cookiesInOven.push(cookieInstance);
              const realIdx = this.prepTrayCookies.indexOf(cookieInstance);
              if (realIdx !== -1) {
                this.prepTrayCookies.splice(realIdx, 1);
              }
              this.updateExtractButtonState();
              SoundManager.getInstance().playOvenDoor();
              this.showFeedbackText(i18n.t('game.feedback.cookieInserted', { count: this.cookiesInOven.length, total: 3 }), this.trayX, 375, '#38b000');
              this.events.emit('game:cookie_loaded_oven', { cookie: cookieInstance, count: this.cookiesInOven.length });
              this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });

              const spriteIdx = this.prepTraySprites.indexOf(sprite);
              if (spriteIdx !== -1) {
                this.prepTraySprites.splice(spriteIdx, 1);
              }

              // Play shrink and fade animation into the oven door window
              this.tweens.add({
                targets: sprite,
                x: this.ovenX,
                y: this.ovenY + 46,
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

          this.events.emit('game:drag_end', { item: 'table_cookie', cookie: cookieInstance, index: cookieIdx });

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
      // Day ended, notify CrazyGames SDK of gameplay stop
      CrazyGamesSDK.getInstance().gameplayStop();

      // Check progression
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
    const customerIndex = this.customersSpawned;
    const customerId = this.customerSequence[this.customersSpawned];
    this.customersSpawned++;

    let selectedRecipe = null;
    let qty = 1;
    let requestedDrink = null;

    if (this.day === 1) {
      const i18n = I18nManager.getInstance();
      // Day 1 Fixed Tutorial Sequence
      if (customerIndex === 0) {
        // Customer 1: 1 Vanilla Cookie + Coffee
        selectedRecipe = { name: `${i18n.t('recipes.bases.classic')} ${i18n.t('recipes.shapes.star')}`, base: 'classic', shape: 'star', toppings: [] };
        qty = 1;
        requestedDrink = 'coffee';
      } else if (customerIndex === 1) {
        // Customer 2: 1 Vanilla Cookie with Sprinkles + Coffee with Milk
        selectedRecipe = { name: `${i18n.t('recipes.bases.classic')} ${i18n.t('recipes.shapes.star')} ${i18n.t('recipes.toppings.sprinkles')}`, base: 'classic', shape: 'star', toppings: ['sprinkles'] };
        qty = 1;
        requestedDrink = 'coffee_milk';
      } else {
        // Customer 3+: 1 Vanilla Cookie with Sprinkles + Coffee with Milk
        selectedRecipe = { name: `${i18n.t('recipes.bases.classic')} ${i18n.t('recipes.shapes.star')} ${i18n.t('recipes.toppings.sprinkles')}`, base: 'classic', shape: 'star', toppings: ['sprinkles'] };
        qty = 1;
        requestedDrink = 'coffee_milk';
      }
    } else {
      const i18n = I18nManager.getInstance();
      // Days 2+ Procedural Order Generation
      const availableRecipes = [];
      const availableBases = Object.keys(this.stock.dough).filter(base => (Number(this.stock.dough[base]) || 0) > 0);
      const availableToppings = Object.keys(this.stock.topping).filter(t => (Number(this.stock.topping[t]) || 0) > 0);

      const baseNames = {
        classic: i18n.t('recipes.bases.classic'),
        chocolate: i18n.t('recipes.bases.chocolate'),
        oat: i18n.t('recipes.bases.oat')
      };
      const shapeNames = {
        star: i18n.t('recipes.shapes.star'),
        heart: i18n.t('recipes.shapes.heart'),
        cat: i18n.t('recipes.shapes.cat'),
        fish: i18n.t('recipes.shapes.fish')
      };
      const toppingNames = {
        sprinkles: i18n.t('recipes.toppings.sprinkles'),
        choco: i18n.t('recipes.toppings.choco'),
        glazing: i18n.t('recipes.toppings.glazing')
      };

      if (this.unlockedShapes) {
        this.unlockedShapes.forEach(shape => {
          availableBases.forEach(base => {
            const plainName = `${baseNames[base] || base} ${shapeNames[shape] || shape}`;
            availableRecipes.push({
              name: plainName,
              base: base,
              shape: shape,
              toppings: []
            });

            availableToppings.forEach(topping => {
              const toppedName = `${baseNames[base] || base} ${shapeNames[shape] || shape} ${toppingNames[topping] || topping}`;
              availableRecipes.push({
                name: toppedName,
                base: base,
                shape: shape,
                toppings: [topping]
              });
            });
          });
        });
      }

      // Filter strictly for recipes with stock available right now
      const validRecipes = availableRecipes.filter(recipe => {
        const baseStock = Number(this.stock.dough[recipe.base]) || 0;
        if (baseStock <= 0) return false;
        if (recipe.toppings && recipe.toppings.length > 0) {
          for (const t of recipe.toppings) {
            if ((Number(this.stock.topping[t]) || 0) <= 0) return false;
          }
        }
        return true;
      });

      if (validRecipes.length > 0) {
        selectedRecipe = Phaser.Utils.Array.GetRandom(validRecipes);

        const QUANTITY_RANGES = {
          1: { min: 1, max: 3 },
          2: { min: 2, max: 4 },
          3: { min: 3, max: 5 },
          4: { min: 1, max: 2 },
          5: { min: 2, max: 5 }
        };
        const range = QUANTITY_RANGES[customerId] || { min: 1, max: 2 };
        
        let capD;
        if (this.day === 2) {
          capD = 1;
        } else if (this.day === 3) {
          capD = 2;
        } else if (this.day === 4) {
          capD = 3;
        } else {
          capD = Math.min(5, Math.max(1, this.day - 1));
        }

        let rawQty = Phaser.Math.Between(range.min, range.max);
        rawQty = Math.max(1, Math.min(rawQty, capD));

        let stockLimit = Number(this.stock.dough[selectedRecipe.base]) || 0;
        if (selectedRecipe.toppings && selectedRecipe.toppings.length > 0) {
          selectedRecipe.toppings.forEach(topping => {
            stockLimit = Math.min(stockLimit, Number(this.stock.topping[topping]) || 0);
          });
        }
        if (stockLimit > 0) {
          qty = Math.max(1, Math.min(rawQty, stockLimit));
        } else {
          selectedRecipe = null;
          qty = 0;
        }
      } else {
        const hasBeans = (Number(this.stock.drink?.coffee_beans) || 0) > 0;
        const hasMilk = (Number(this.stock.drink?.milk) || 0) > 0;
        if (this.day >= 2 && (hasBeans || hasMilk)) {
          selectedRecipe = null;
          qty = 0;
        } else {
          selectedRecipe = { name: `${i18n.t('recipes.bases.classic')} ${i18n.t('recipes.shapes.star')}`, base: 'classic', shape: 'star', toppings: [] };
          qty = 1;
        }
      }

      const hasBeans = (Number(this.stock.drink?.coffee_beans) || 0) > 0;
      const hasMilk = (Number(this.stock.drink?.milk) || 0) > 0;
      if (qty === 0 && !selectedRecipe && !hasBeans && !hasMilk) {
        selectedRecipe = { name: `${i18n.t('recipes.bases.classic')} ${i18n.t('recipes.shapes.star')}`, base: 'classic', shape: 'star', toppings: [] };
        qty = 1;
      }

      const forceDrink = (qty === 0);
      let drinkChance = 0.50;
      if (this.day === 2) drinkChance = 0.20;
      else if (this.day === 3) drinkChance = 0.35;
      else if (this.day === 4) drinkChance = 0.45;

      if (this.day >= 2 && (forceDrink || Math.random() < drinkChance)) {
        const drinkOptions = [];
        if (hasBeans) drinkOptions.push('coffee');
        if (hasMilk) drinkOptions.push('milk');
        if (this.day >= 3 && hasBeans && hasMilk) drinkOptions.push('coffee_milk');

        if (drinkOptions.length > 0) {
          requestedDrink = Phaser.Utils.Array.GetRandom(drinkOptions);
        }
      }
    }

    // Spawn customer in the counter area (centered at 960, 431)
    this.currentCustomer = new Customer(
      this, 
      960, 
      431, 
      this.config,
      () => this.handleCustomerTimeout(),
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

    const i18n = I18nManager.getInstance();
    const cookiesCount = this.deliveryTrayCookies.length;
    const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;

    if (cookiesCount === 0 && drinksCount === 0) {
      this.showFeedbackText(i18n.t('customer.feedback.emptyTray'), this.trayX, 375, '#d90429');
      return;
    }

    const requested = this.currentCustomer.requestedQuantity;
    const requestedDrink = this.currentCustomer.requestedDrink;

    if (requested === 0) {
      // Customer only requested a drink!
      let drinkReward = 0;
      const drinkIndex = this.deliveryTrayDrinks.indexOf(requestedDrink);
      if (drinkIndex !== -1) {
        this.deliveryTrayDrinks.splice(drinkIndex, 1);
        if (requestedDrink === 'coffee') drinkReward = 25;
        else if (requestedDrink === 'milk') drinkReward = 15;
        else if (requestedDrink === 'coffee_milk') drinkReward = 35;
      }

      // Penalty for any excess cookies on the tray
      const excessCount = this.deliveryTrayCookies.length;
      const wastePenalty = excessCount * 15;

      this.coins = Math.max(0, this.coins + drinkReward - wastePenalty);
      this.coinsText.setText(`${this.coins}`);

      if (excessCount > 0) {
        this.showFeedbackText(i18n.t('customer.feedback.orderExcess', { reward: drinkReward, penalty: wastePenalty }), this.trayX, 375, '#ffb703');
      } else {
        this.showFeedbackText(i18n.t('customer.feedback.perfectDrink', { reward: drinkReward }), this.trayX, 375, '#38b000');
        this.triggerConfetti();
        CrazyGamesSDK.getInstance().happytime();
      }

      this.events.emit('game:tray_delivered', { rejected: false, success: true });
      this.events.emit('game:order_delivered', { requestedDrink });

      // Clean up and spawn next
      this.deliveryTrayCookies = [];
      this.deliveryTrayDrinks = [];
      this.drawDeliveryTray();
      this.currentCustomer.destroy();
      this.currentCustomer = null;

      this.time.delayedCall(1500, () => {
        this.spawnCustomer();
      });
      return;
    }

    if (cookiesCount === 0) {
      this.showFeedbackText(i18n.t('customer.feedback.emptyTray'), this.trayX, 375, '#d90429');
      return;
    }

    const recipe = this.currentCustomer.recipe;
    const threshold = this.currentCustomer.toleranceThreshold || 80;
    const newDelivered = this.deliveryTrayCookies;

    // Check if any of the delivered cookies are below the customer's tolerance threshold
    let rejected = false;
    let rejectReason = i18n.t('customer.feedback.wrongOrder');

    for (const cookie of newDelivered) {
      const sim = cookie.getSimilarityPercentage(recipe);
      if (sim < threshold) {
        rejected = true;
        if (cookie.bakedState === 'raw') {
          rejectReason = i18n.t('customer.feedback.rawCookie');
        } else if (cookie.bakedState === 'burnt') {
          rejectReason = i18n.t('customer.feedback.burntCookie');
        } else if (recipe && recipe.toppings && recipe.toppings.length > 0 && (!cookie.toppings || !cookie.toppings.includes(recipe.toppings[0]))) {
          rejectReason = i18n.t('customer.feedback.missingTopping');
        } else if (recipe && cookie.shape !== recipe.shape) {
          rejectReason = i18n.t('customer.feedback.wrongShape');
        } else if (recipe && cookie.base !== recipe.base) {
          rejectReason = i18n.t('customer.feedback.wrongBase');
        }
        break;
      }
    }

    if (rejected) {
      this.showFeedbackText(rejectReason, this.trayX, 375, '#d90429');

      // Angry customer feedback shake
      SoundManager.getInstance().playCustomerAngry();
      if (!this.tutorialManager?.isPatienceProtected()) {
        const patienceLoss = this.currentCustomer.maxPatience * 0.25;
        this.currentCustomer.patience = Math.max(0, this.currentCustomer.patience - patienceLoss);
        this.currentCustomer.updatePatienceBar();
      }
      this.events.emit('game:tray_delivered', { rejected: true, success: false, reason: rejectReason });

      this.tweens.add({
        targets: this.currentCustomer.container,
        x: { from: 960 - 19, to: 960 + 19 },
        duration: 50,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          if (this.currentCustomer && this.currentCustomer.container) {
            this.currentCustomer.container.x = 960;
          }
        }
      });
      return;
    }

    // Check if the customer requested a drink, and if it's on the tray
    if (requestedDrink) {
      const drinkIndex = this.deliveryTrayDrinks.indexOf(requestedDrink);
      if (drinkIndex === -1) {
        const drinkName = i18n.t(`recipes.drinks.${requestedDrink}`);
        
        this.showFeedbackText(i18n.t('game.feedback.missingDrink', { drink: drinkName }), this.trayX, 375, '#d90429');
        
        // Angry customer feedback
        if (!this.tutorialManager?.isPatienceProtected()) {
          const patienceLoss = this.currentCustomer.maxPatience * 0.25;
          this.currentCustomer.patience = Math.max(0, this.currentCustomer.patience - patienceLoss);
          this.currentCustomer.updatePatienceBar();
        }

        this.events.emit('game:tray_delivered', { rejected: true, success: false, reason: 'missing_drink' });

        this.tweens.add({
          targets: this.currentCustomer.container,
          x: { from: 960 - 19, to: 960 + 19 },
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            if (this.currentCustomer && this.currentCustomer.container) {
              this.currentCustomer.container.x = 960;
            }
          }
        });
        return;
      }
    }

    const accumulated = this.currentCustomer.acceptedCookies || [];
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
        this.coinsText.setText(`${this.coins}`);
        this.showFeedbackText(`+${totalReward} 🪙`, this.trayX, 375, '#38b000');

        if (anyPerfect) {
          SoundManager.getInstance().playCatPurr();
          SoundManager.getInstance().playCoinCollect();
          this.triggerConfetti();
        } else {
          SoundManager.getInstance().playCoinCollect();
        }

        this.events.emit('game:tray_delivered', { rejected: false, success: true, partial: true });
        this.events.emit('game:order_delivered', { cookies: allCookies.length, requestedDrink });

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
        SoundManager.getInstance().playCustomerAngry();
        this.currentCustomer.acceptedCookies = accumulated.concat(newDelivered);
        this.currentCustomer.updateProgress(this.currentCustomer.acceptedCookies.length);
        this.deliveryTrayCookies = [];
        this.drawDeliveryTray();

        // Keep patience as-is (no patience penalty for partial rejection)

        this.showFeedbackText(i18n.t('customer.feedback.incomplete', { missing: requested - totalCount }), this.trayX, 375, '#d90429');
        this.events.emit('game:tray_delivered', { rejected: true, success: false, reason: 'incomplete' });

        // Play an angry shake tween on the customer container
        this.tweens.add({
          targets: this.currentCustomer.container,
          x: { from: 960 - 19, to: 960 + 19 },
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            if (this.currentCustomer && this.currentCustomer.container) {
              this.currentCustomer.container.x = 960;
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
      this.coinsText.setText(`${this.coins}`);

      if (excessCount > 0) {
        SoundManager.getInstance().playCoinCollect();
        this.showFeedbackText(i18n.t('customer.feedback.orderExcess', { reward: totalReward, penalty: wastePenalty }), this.trayX, 375, '#ffb703');
      } else {
        const avgSim = (totalReward - drinkReward) / (requested * maxVal);
        let feedback = i18n.t('customer.feedback.orderCompleted');
        let color = '#38b000';
        if (anyPerfect && avgSim >= 0.95) {
          feedback = i18n.t('customer.feedback.perfectDelivery');
          SoundManager.getInstance().playCatPurr();
          SoundManager.getInstance().playPerfect();
          SoundManager.getInstance().playCoinCollect();
          this.triggerConfetti();
          CrazyGamesSDK.getInstance().happytime();
        } else {
          SoundManager.getInstance().playCoinCollect();
          if (avgSim < 0.6) {
            feedback = i18n.t('customer.feedback.acceptable');
            color = '#ffb703';
          }
        }
        this.showFeedbackText(`${feedback} +${totalReward} 🪙`, this.trayX, 375, color);
      }

      this.events.emit('game:tray_delivered', { rejected: false, success: true });
      this.events.emit('game:order_delivered', { cookies: totalCount, requestedDrink });

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
    SoundManager.getInstance().playCatSad();
    const i18n = I18nManager.getInstance();
    this.showFeedbackText(i18n.t('customer.feedback.timeout'), this.trayX, 375, '#d90429');
    
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

  scratchCustomer() {
    if (!this.currentCustomer || !this.currentCustomer.isActive) return;

    if (this.tutorialManager?.isActive) {
      this.scratchBlockedUntilPointerUp = true;

      SoundManager.getInstance().playScratch();
      SoundManager.getInstance().playCatMeow('curious');

      const cx = this.currentCustomer.container.x;
      const cy = this.currentCustomer.container.y + 75;

      const i18n = I18nManager.getInstance();
      this.showFeedbackText(i18n.t('customer.scratchWarningTutorial'), cx, cy - 244, '#ffb703');

      const scratchGraphics = this.add.graphics().setDepth(20);
      scratchGraphics.lineStyle(8, 0xd90429, 1);

      scratchGraphics.lineBetween(cx - 56, cy - 56, cx - 19, cy + 56);
      scratchGraphics.lineBetween(cx - 19, cy - 66, cx + 19, cy + 47);
      scratchGraphics.lineBetween(cx + 19, cy - 56, cx + 56, cy + 56);

      this.tweens.add({
        targets: scratchGraphics,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          scratchGraphics.destroy();
        }
      });

      const originalX = this.currentCustomer.container.x;
      const originalY = this.currentCustomer.container.y;
      this.tweens.add({
        targets: this.currentCustomer.container,
        x: originalX + Phaser.Math.Between(-8, 8),
        y: originalY + Phaser.Math.Between(-6, 6),
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (this.currentCustomer && this.currentCustomer.container) {
            this.currentCustomer.container.setPosition(originalX, originalY);
          }
        }
      });

      return;
    }

    this.currentCustomer.isActive = false;

    SoundManager.getInstance().playScratch();
    SoundManager.getInstance().playCustomerAngry();

    const i18n = I18nManager.getInstance();
    const dialogues = i18n.t('customer.scratchDialogues');
    const chosenText = Array.isArray(dialogues) ? dialogues[Math.floor(Math.random() * dialogues.length)] : dialogues;
    this.showFeedbackText(chosenText, this.currentCustomer.container.x, this.currentCustomer.container.y - 244, '#d90429');

    const cx = this.currentCustomer.container.x;
    const cy = this.currentCustomer.container.y + 75;
    const scratchGraphics = this.add.graphics().setDepth(20);
    scratchGraphics.lineStyle(8, 0xd90429, 1);

    scratchGraphics.lineBetween(cx - 56, cy - 56, cx - 19, cy + 56);
    scratchGraphics.lineBetween(cx - 19, cy - 66, cx + 19, cy + 47);
    scratchGraphics.lineBetween(cx + 19, cy - 56, cx + 56, cy + 56);

    this.tweens.add({
      targets: scratchGraphics,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        scratchGraphics.destroy();
      }
    });

    this.tweens.add({
      targets: this.currentCustomer.container,
      x: cx + Phaser.Math.Between(-23, 23),
      y: this.currentCustomer.container.y + Phaser.Math.Between(-19, 19),
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (this.currentCustomer && this.currentCustomer.container) {
          this.tweens.add({
            targets: this.currentCustomer.container,
            x: -300,
            alpha: 0,
            duration: 650,
            ease: 'Power2.easeIn',
            onComplete: () => {
              if (this.currentCustomer) {
                this.currentCustomer.destroy();
                this.currentCustomer = null;
              }
              this.time.delayedCall(1500, () => {
                this.spawnCustomer();
              });
            }
          });
        }
      }
    });
  }

  showFeedbackText(text, x, y, color) {
    // Lower the Y coordinate to be right above the preparation table
    const targetY = (y === 375) ? (this.trayY - 225) : y;

    const feedbackText = this.add.text(x, targetY, text, {
      font: '26px "Outfit", sans-serif',
      fill: color,
      fontWeight: '800',
      stroke: '#ffffff',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(15000);

    // Simple tween animation (fly up and fade out)
    this.tweens.add({
      targets: feedbackText,
      y: targetY - 75,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }

  triggerConfetti() {
    const particles = this.add.particles(this.trayX, 375, '__WHITE', {
      x: { min: this.trayX - 375, max: this.trayX + 375 },
      y: 188,
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
    const centerX = 960;
    const centerMaxY = 403; // Highest reach in the middle (lowest Y)
    const edgeMaxY = 619;   // Lowest reach at the edges (highest Y)
    const deltaY = edgeMaxY - centerMaxY;
    const dx = x - centerX;
    const limitY = centerMaxY + deltaY * (dx * dx) / (centerX * centerX);
    return Math.max(limitY, targetY);
  }

  update(time, delta) {
    // Time-based oven baking calculation (speed up by 15% as requested)
    if (this.isBaking) {
      const elapsed = (delta / 1000) * 1.15;
      this.ovenTimeElapsed += elapsed;
      
      const bakeDuration = this.config.bakeMin || 5.0;

      // Increment bakeTime individually for all cookies currently in the oven
      if (this.cookiesInOven) {
        this.cookiesInOven.forEach(cookie => {
          cookie.bakeTime = (cookie.bakeTime || 0) + elapsed;
          if (cookie.bakeTime >= bakeDuration && cookie.bakedState !== 'burnt') {
            cookie.bakedState = 'baked';
          }
        });
      }

      // Desplazamiento de la perilla analógica de X=177 a X=305 (delta = 128px)
      const progress = Math.min(1.0, this.ovenTimeElapsed / bakeDuration);
      if (this.ovenKnobSprite) {
        this.ovenKnobSprite.setX(this.ovenX + (this.knobMaxDeltaX || 128) * progress);
      }

      // Alarma sonora al completar el recorrido la perilla
      if (progress >= 1.0 && !this.alarmPlayed) {
        this.alarmPlayed = true;
        this.ovenOvercookTimer = 0;
        SoundManager.getInstance().stopOvenHum();
        SoundManager.getInstance().playOvenBellReady();
        if (this.ovenBtnBakeSprite) {
          this.ovenBtnBakeSprite.setTexture('oven_btn_bake_off');
        }
        if (this.ovenGlassSprite) {
          this.ovenGlassSprite.setTexture('oven_glass_off');
        }
        const i18n = I18nManager.getInstance();
        this.showFeedbackText(i18n.t('game.feedback.cookiesReady'), this.ovenX, 375, '#38b000');
        this.updateExtractButtonState();
        this.events.emit('game:oven_bell');
      }

      // Ventana de gracia de 5 segundos antes de quemarse (inicia tras sonar la alarma)
      else if (this.alarmPlayed) {
        this.ovenOvercookTimer += (delta / 1000);
        if (this.ovenOvercookTimer >= 5.0 && !this.hasOvercookedAlarm) {
          this.hasOvercookedAlarm = true;
          this.isBaking = false;
          SoundManager.getInstance().stopOvenHum();
          if (this.ovenBtnBakeSprite) {
            this.ovenBtnBakeSprite.setTexture('oven_btn_bake_off');
          }
          if (this.ovenGlassSprite) {
            this.ovenGlassSprite.setTexture('oven_glass_off');
          }
          if (this.cookiesInOven) {
            this.cookiesInOven.forEach(cookie => {
              cookie.bakedState = 'burnt';
            });
          }
          SoundManager.getInstance().playOvenBurnAlert();
          SoundManager.getInstance().playCookieBurnt();
          const i18n = I18nManager.getInstance();
          this.showFeedbackText(i18n.t('game.feedback.cookieBurnt'), this.ovenX, 375, '#d90429');
          this.cameras.main.shake(200, 0.005);
          this.updateExtractButtonState();
          this.events.emit('game:cookie_burnt', { cookies: this.cookiesInOven });
        }
      }
    }

    // Call update on active customer to decrease patience
    if (this.currentCustomer) {
      this.currentCustomer.update(time, delta);
    }

    // Custom Cat Paw Cursor Update
    if (this.isAudioPanelOpen) return;

    const pointer = this.input.activePointer;
    if (pointer && !pointer.isDown) {
      this.scratchBlockedUntilPointerUp = false;
    }

    if (pointer && this.catPawSprite && this.catArmOutlineGraphics && this.catArmFillGraphics) {
      // Lerp paw position to pointer position with a Y clamp limit allowing access to oven buttons
      const clampedTargetY = Math.max(220, pointer.y);
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
      this.catArmOutlineGraphics.clear();
      this.catArmFillGraphics.clear();

      // Generate Bezier Curve points
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(this.shoulderX, this.shoulderY),
        new Phaser.Math.Vector2(controlX, controlY),
        new Phaser.Math.Vector2(this.pawX, this.pawY)
      );
      
      // Shorten the arm by a fixed 47 pixels to prevent detaching as the paw moves up
      const curveLength = curve.getLength();
      const shortenPixels = 47;
      const tMax = curveLength > shortenPixels ? (curveLength - shortenPixels) / curveLength : 1.0;

      const points = [];
      const segments = 24;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * tMax;
        points.push(curve.getPoint(t));
      }

      // Outer outline (matching the sprite's exact dark brown #553523) - drawn behind paw
      this.catArmOutlineGraphics.lineStyle(75, 0x553523);
      this.catArmOutlineGraphics.strokePoints(points);

      // Inner fill (matching the sprite's exact cream fur #f4e7d4) - drawn on top of paw
      this.catArmFillGraphics.lineStyle(68, 0xf4e7d4);
      this.catArmFillGraphics.strokePoints(points);

      // Check if scratching the active customer
      if (
        this.currentCustomer &&
        this.currentCustomer.isActive &&
        pointer.isDown &&
        !this.scratchBlockedUntilPointerUp &&
        !this.isHoldingItem &&
        this.currentCustomer.container
      ) {
        const distToCustomer = Phaser.Math.Distance.Between(
          this.pawX,
          this.pawY,
          this.currentCustomer.container.x,
          this.currentCustomer.container.y + 75
        );
        if (distToCustomer < 178) {
          this.scratchCustomer();
        }
      }
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

    const i18n = I18nManager.getInstance();
    this.showFeedbackText(
      this.isEditorMode ? i18n.t('editor.active') : i18n.t('editor.inactive'),
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
      const i18n = I18nManager.getInstance();
      this.showFeedbackText(i18n.t('editor.selected', { key: element.key }), this.cameras.main.width / 2, 188, '#38b000');
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
    // Generate config matching ui-config.json format, preserving all original keys
    const newConfig = { ...UI_CONFIG };

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
    const i18n = I18nManager.getInstance();

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        this.showFeedbackText(i18n.t('editor.copied'), this.cameras.main.width / 2, 188, '#38b000');
        console.log('--- NUEVO UI CONFIG (COPIADO) ---');
        console.log(jsonStr);
      }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        this.showFeedbackText(i18n.t('editor.copyError'), this.cameras.main.width / 2, 188, '#d90429');
        console.log('--- NUEVO UI CONFIG (Copia manual) ---');
        console.log(jsonStr);
      });
    } else {
      this.showFeedbackText(i18n.t('editor.copyError'), this.cameras.main.width / 2, 188, '#d90429');
      console.log('--- NUEVO UI CONFIG ---');
      console.log(jsonStr);
    }
  }

  createDeliveryTray() {
    const { deliveryTray } = UI_CONFIG;
    this.deliveryTrayX = deliveryTray ? deliveryTray.x : 960;
    this.deliveryTrayY = deliveryTray ? deliveryTray.y : 694;
    this.deliveryTrayWidth = deliveryTray ? deliveryTray.width : 375;
    this.deliveryTrayHeight = deliveryTray ? deliveryTray.height : 94;

    // Draw the wooden tray background
    this.deliveryTrayBg = this.add.graphics().setDepth(1);
    this.drawDeliveryTrayBg();

    // Text label on the tray
    const i18n = I18nManager.getInstance();
    this.deliveryTrayLabel = this.add.text(this.deliveryTrayX, this.deliveryTrayY - 62, i18n.t('hud.labels.delivery'), {
      font: '17px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '800'
    }).setOrigin(0.5).setDepth(2);

    // Group or list to hold the rendered cookie sprites on the tray
    this.deliveryTraySprites = [];
    
    // Make the delivery tray draggable via an expanded interactive zone (height + 24px for easy bottom/top grabs)
    const hitHeight = this.deliveryTrayHeight + 24;
    this.deliveryDragZone = this.add.rectangle(this.deliveryTrayX, this.deliveryTrayY, this.deliveryTrayWidth, hitHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);
    this.input.setDraggable(this.deliveryDragZone);

    this.customerHighlighted = false;
    this.trashHighlighted = false;

    let isDraggingTray = false;

    this.deliveryDragZone.on('pointerdown', () => {
      if (this.isEditorMode) return;
      this.isHoldingItem = true;
      isDraggingTray = false;
    });

    this.deliveryDragZone.on('dragstart', () => {
      if (this.isEditorMode) return;
      if (this.tutorialManager?.isActive) {
        const allowedTrayActions = ['DELIVER_ORDER', 'DRAG_TRASH'];
        const curAction = this.tutorialManager.getCurrentStep()?.allowedAction;
        if (!allowedTrayActions.includes(curAction)) {
          this.tutorialManager.denyAction(this, this.deliveryDragZone);
          return;
        }
      }
      isDraggingTray = true;
      this.isHoldingItem = true;
      this.events.emit('game:drag_start', { item: 'delivery_tray' });
      SoundManager.getInstance().playUiTap();
      this.deliveryDragZone.setDepth(30000);
      this.deliveryTrayLabel.setDepth(30001);
      this.deliveryTraySprites.forEach(s => s.setDepth(30002));
    });

    this.deliveryDragZone.on('pointerup', () => {
      if (this.isEditorMode) return;
      if (!isDraggingTray) {
        if (this.deliveryTrayCookies.length > 0 || (this.deliveryTrayDrinks && this.deliveryTrayDrinks.length > 0)) {
          if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DELIVER_ORDER', { destination: 'customer' })) {
            this.tutorialManager.denyAction(this, this.deliveryDragZone);
            return;
          }
          this.deliverCookie();
        }
      }
    });

    this.deliveryDragZone.on('drag', (pointer, dragX, dragY) => {
      if (this.isEditorMode) return;
      // Limit Y-axis to counter and customer area
      const clampedY = Math.max(300, Math.min(844, dragY));
      this.deliveryDragZone.x = dragX;
      this.deliveryDragZone.y = clampedY;

      // Translate the graphics object using x/y offsets
      this.deliveryTrayBg.x = dragX - this.deliveryTrayX;
      this.deliveryTrayBg.y = clampedY - this.deliveryTrayY;

      this.deliveryTrayLabel.x = dragX;
      this.deliveryTrayLabel.y = clampedY - 62;

      // Translate all sprites on the tray (cookies and drinks combined)
      const cookiesCount = this.deliveryTrayCookies.length;
      const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
      const totalCount = cookiesCount + drinksCount;
      
      if (totalCount > 0) {
        const spacing = 66;
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
            sprite.y = clampedY - 8; // Maintain drink height offset
          }
        }
      }

      // Check distance to trash bin
      const distToTrash = Phaser.Math.Distance.Between(dragX, clampedY, this.trashBinX, this.trashBinY);
      if (distToTrash < 95) {
        if (!this.trashHighlighted) {
          this.trashHighlighted = true;
          this.tweens.add({
            targets: this.trashContainer,
            scale: 1.15,
            duration: 100
          });
          if (this.trashBinSprite) this.trashBinSprite.setTint(0xff8888);
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
            y: 431,
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
          if (this.trashBinSprite) this.trashBinSprite.clearTint();
        }

        // Check distance to the customer (centered at 960, 431)
        if (this.currentCustomer && this.currentCustomer.sprite) {
          const distToCustomer = Phaser.Math.Distance.Between(dragX, clampedY, 960, 431);
          if (distToCustomer < 188) {
            if (!this.customerHighlighted) {
              this.customerHighlighted = true;
              
              this.tweens.add({
                targets: this.deliveryDragZone,
                scale: 1.06,
                duration: 100
              });

              this.currentCustomerBounceTween = this.tweens.add({
                targets: this.currentCustomer.container,
                y: 431 - 28,
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
                y: 431,
                duration: 150,
                ease: 'Back.easeOut'
              });
            }
          }
        }
      }
    });

    this.deliveryDragZone.on('dragend', () => {
      this.isHoldingItem = false;
      if (this.isEditorMode) return;
      setTimeout(() => { isDraggingTray = false; }, 50);
      this.deliveryDragZone.setScale(1.0);
      this.deliveryDragZone.setDepth(15);
      this.deliveryTrayLabel.setDepth(2);

      // Clean up customer animation if dragging ends
      if (this.currentCustomerBounceTween) {
        this.currentCustomerBounceTween.stop();
        this.currentCustomerBounceTween = null;
      }
      if (this.currentCustomer && this.currentCustomer.container) {
        this.currentCustomer.container.y = 431;
      }

      // Check if dropped on trash
      if (this.trashHighlighted) {
        this.trashHighlighted = false;
        if (this.trashContainer) this.trashContainer.setScale(1.0);
        if (this.trashBinSprite) this.trashBinSprite.clearTint();

        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DRAG_TRASH', { item: 'delivery_tray', destination: 'trash' })) {
          this.tutorialManager.denyAction(this, this.deliveryDragZone);
        } else {
          const count = this.deliveryTrayCookies.length;
          const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
          if (count > 0 || drinksCount > 0) {
            SoundManager.getInstance().playTrash();
            this.deliveryTrayCookies = [];
            this.deliveryTrayDrinks = [];
            this.drawDeliveryTray();
            this.showFeedbackText(I18nManager.getInstance().t('game.feedback.trayEmptied'), this.trashBinX, this.trashBinY - 50, '#d90429');
            this.events.emit('game:tray_trashed');
          }
        }
      }

      if (this.customerHighlighted) {
        this.customerHighlighted = false;
        if (this.tutorialManager?.isActive && !this.tutorialManager.isActionAllowed('DELIVER_ORDER', { destination: 'customer' })) {
          this.tutorialManager.denyAction(this, this.deliveryDragZone);
        } else {
          // Deliver!
          this.deliverCookie();
        }
      }

      this.events.emit('game:drag_end', { item: 'delivery_tray' });

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
            const spacing = 66;
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
    this.deliveryTrayBg.lineStyle(6, 0x7f5539, 1);
    
    // Draw relative to deliveryTrayX and Y using dynamic width and height
    const w = this.deliveryTrayWidth;
    const h = this.deliveryTrayHeight;
    this.deliveryTrayBg.fillRoundedRect(this.deliveryTrayX - w / 2, this.deliveryTrayY - h / 2, w, h, 15);
    this.deliveryTrayBg.strokeRoundedRect(this.deliveryTrayX - w / 2, this.deliveryTrayY - h / 2, w, h, 15);
  }

  drawDeliveryTray() {
    // Clear old sprites
    this.deliveryTraySprites.forEach(sprite => sprite.destroy());
    this.deliveryTraySprites = [];

    const cookiesCount = this.deliveryTrayCookies.length;
    const drinksCount = this.deliveryTrayDrinks ? this.deliveryTrayDrinks.length : 0;
    const totalItems = cookiesCount + drinksCount;
    if (totalItems === 0) return;

    const spacing = 66;
    const trayX = this.deliveryDragZone ? this.deliveryDragZone.x : this.deliveryTrayX;
    const trayY = this.deliveryDragZone ? this.deliveryDragZone.y : this.deliveryTrayY;
    const startX = trayX - ((totalItems - 1) * spacing) / 2;

    // Draw cookies
    this.deliveryTrayCookies.forEach((cookie, index) => {
      let key = '';
      const isShaped = Boolean(cookie.shape);
      if (isShaped) {
        key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
        if (cookie.toppings && cookie.toppings[0]) {
          key += `_${cookie.toppings[0]}`;
        }
      } else {
        key = `dough_${cookie.base || 'classic'}`;
      }

      if (this.textures && typeof this.textures.exists === 'function' && !this.textures.exists(key)) {
        key = `dough_${cookie.base || 'classic'}`;
      }

      const x = startX + index * spacing;
      const y = trayY;

      const size = isShaped ? 75 : 65;
      const sprite = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(14);
      this.deliveryTraySprites.push(sprite);
    });

    // Draw drinks
    if (this.deliveryTrayDrinks) {
      this.deliveryTrayDrinks.forEach((drinkType, index) => {
        let key = 'beverage_coffee';
        if (drinkType === 'milk') key = 'beverage_milk';
        else if (drinkType === 'coffee_milk') key = 'beverage_coffee_milk';

        const x = startX + (cookiesCount + index) * spacing;
        const y = trayY - 8; // Shift up slightly to fit nicely

        const sprite = this.add.image(x, y, key).setDisplaySize(60, 60).setDepth(14);
        this.deliveryTraySprites.push(sprite);
      });
    }
  }


  handleOvenImageClick() {
    if (this.tutorialManager?.isActive) {
      if (!this.tutorialManager.isActionAllowed('CLICK_EXTRACT', { cookies: this.cookiesInOven })) {
        this.tutorialManager.denyAction(this, this.ovenExtractZone || this.ovenGlassSprite);
        return;
      }
    }

    if (!this.cookiesInOven || this.cookiesInOven.length === 0) {
      SoundManager.getInstance().playUiDenied();
      this.showFeedbackText(I18nManager.getInstance().t('game.feedback.ovenEmpty'), this.ovenX, 375, '#d90429');
      return;
    }

    // Si estaba horneando, se detiene la cocción inmediatamente
    if (this.isBaking) {
      this.isBaking = false;
      SoundManager.getInstance().stopOvenHum();
      if (this.ovenBtnBakeSprite) {
        this.ovenBtnBakeSprite.setTexture('oven_btn_bake_off');
      }
      if (this.ovenGlassSprite) {
        this.ovenGlassSprite.setTexture('oven_glass_off');
      }
    }

    // Reset de perilla a posición de reposo y temporizadores
    if (this.ovenKnobSprite) {
      this.ovenKnobSprite.setX(this.ovenX);
    }
    this.ovenTimeElapsed = 0;
    this.alarmPlayed = false;
    this.ovenOvercookTimer = 0;
    this.hasOvercookedAlarm = false;

    // Mover todas las galletas del horno a la bandeja de preparación
    this.cookiesInOven.forEach((cookie, index) => {
      let key = `cookie_${cookie.shape}_${cookie.base}_${cookie.bakedState}`;
      if (cookie.toppings && cookie.toppings[0]) {
        key += `_${cookie.toppings[0]}`;
      }

      // Animación de vuelo desde el cristal del horno hacia la bandeja
      const flightSprite = this.add.image(this.ovenX, this.ovenY + 46, key)
        .setDisplaySize(50, 50)
        .setDepth(100);

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

    const extractedCookies = [...this.cookiesInOven];
    this.cookiesInOven = [];
    SoundManager.getInstance().playOvenDoor();
    SoundManager.getInstance().playUiTap();
    const i18n = I18nManager.getInstance();
    this.showFeedbackText(i18n.t('game.feedback.takingToCounter'), this.ovenX, 375, '#38b000');
    this.updateExtractButtonState();
    this.events.emit('game:cookie_extracted', { cookies: extractedCookies });
  }

  drawOvenExtractBtn(enabled) {
    if (!this.ovenExtractBtnBg) return;
    this.ovenExtractBtnBg.clear();
    if (enabled) {
      this.ovenExtractBtnBg.fillStyle(0xd48c47, 1); // Nice warm orange-brown
    } else {
      this.ovenExtractBtnBg.fillStyle(0x7f5539, 0.4); // Semi-transparent disabled state
    }
    this.ovenExtractBtnBg.fillRoundedRect(this.ovenStartX, this.ovenStartY + 185, 206, 56, 15);
  }

  updateExtractButtonState() {
    const enabled = Boolean(this.cookiesInOven && this.cookiesInOven.length > 0);
    this.drawOvenExtractBtn(enabled);
    if (this.ovenExtractBtnText) {
      this.ovenExtractBtnText.setAlpha(enabled ? 1.0 : 0.5);
    }
  }

  createTrashBin() {
    this.trashBinX = 619;
    this.trashBinY = 911;

    // Create a container for the trash bin so we can scale/hover the whole thing easily
    this.trashContainer = this.add.container(this.trashBinX, this.trashBinY).setDepth(2);

    // New trash bin image asset (234x164) in native 1:1 scale, with "BASURA" integrated in texture
    this.trashBinSprite = this.add.image(0, 0, 'basurero')
      .setOrigin(0.5, 0.5);

    this.trashContainer.add(this.trashBinSprite);
    this.trashBinZone = this.trashContainer;
  }

  /**
   * Retorna el GameObject interactivo o representativo correspondiente a un targetKey del tutorial.
   * Utilizado por TutorialManager para la resolución dinámica precisa de bounds.
   * 
   * @param {string} targetKey - Clave del elemento (ej: 'oven_power', 'shape_star', 'customer', etc.)
   * @returns {Phaser.GameObjects.GameObject|null}
   */
  getTutorialTarget(targetKey) {
    switch (targetKey) {
      case 'customer':
        return this.currentCustomer?.sprite || this.currentCustomer?.container || this.customerContainer;
      case 'dough_classic':
        return this.doughDragZones?.classic || this.doughButtons?.classic;
      case 'dough_chocolate':
        return this.doughDragZones?.chocolate || this.doughButtons?.chocolate;
      case 'dough_oat':
        return this.doughDragZones?.oat || this.doughButtons?.oat;
      case 'stock_dough_classic':
        return this.doughStockTexts?.classic;
      case 'stock_dough_chocolate':
        return this.doughStockTexts?.chocolate;
      case 'stock_dough_oat':
        return this.doughStockTexts?.oat;
      case 'shape_star':
        return this.shapeButtons?.star || this.shapeDragZones?.[0] || this.shapeContainers?.[0];
      case 'shape_heart':
        return this.shapeButtons?.heart || this.shapeDragZones?.[1] || this.shapeContainers?.[1];
      case 'shape_cat':
        return this.shapeButtons?.cat || this.shapeDragZones?.[2] || this.shapeContainers?.[2];
      case 'shape_fish':
        return this.shapeButtons?.fish || this.shapeDragZones?.[3] || this.shapeContainers?.[3];
      case 'oven_power':
        return this.ovenBtnPowerZone || this.ovenBtnPowerSprite;
      case 'oven_bake':
        return this.ovenBtnBakeZone || this.ovenBtnBakeSprite;
      case 'oven_door':
        return this.ovenDoorZone || this.ovenGlassSprite;
      case 'oven_timer':
        return this.ovenTimerZone || this.ovenKnobSprite || this.ovenTimerBaseSprite;
      case 'oven_extract':
        return this.ovenExtractZone || this.ovenExtractBtnBg || this.ovenExtractBtnText;
      case 'trash_bin':
        return this.trashBinZone || this.trashContainer || this.trashBinSprite;
      case 'cup_stack':
        return this.cupStackZone || this.cupStackImage;
      case 'btn_coffee':
        return this.btnCoffeeZone || this.btnCoffeeImage;
      case 'btn_milk':
        return this.btnMilkZone || this.btnMilkImage;
      case 'drink_machine':
        return this.drinkMachine;
      case 'delivery_tray':
        return this.deliveryDragZone || this.deliveryTrayBg;
      case 'table_cookie':
      case 'prep_cookie':
        return this.prepTraySprites?.[0] || this.prepTrayZone || this.prepTrayBg;
      case 'prep_table':
      case 'prep_tray':
        return this.prepTrayZone || this.prepTrayBg;
      case 'drink_cup':
        return this.machineCupSprite || this.cupStackZone;
      case 'topping_sprinkles':
        return this.toppingDragZones?.sprinkles || this.toppingButtons?.sprinkles;
      case 'topping_choco':
        return this.toppingDragZones?.choco || this.toppingButtons?.choco;
      case 'topping_glazing':
        return this.toppingDragZones?.glazing || this.toppingButtons?.glazing;
      default:
        return null;
    }
  }

  openAudioPanel() {
    if (this.audioPanelContainer) return;

    this.isAudioPanelOpen = true;
    this.input.setDefaultCursor('default');

    if (this.catPawSprite) this.catPawSprite.setVisible(false);
    if (this.catArmOutlineGraphics) this.catArmOutlineGraphics.clear();
    if (this.catArmFillGraphics) this.catArmFillGraphics.clear();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const i18n = I18nManager.getInstance();

    // 1. Create container
    this.audioPanelContainer = this.add.container(0, 0).setDepth(20000);

    // 2. Translucent dark overlay to prevent clicks behind
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setInteractive();
    this.audioPanelContainer.add(overlay);

    // 3. Panel Container Box
    const boxW = 638;
    const boxH = 470;
    const boxX = width / 2;
    const boxY = height / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0xf5ebe0, 1);
    panelBg.lineStyle(8, 0x582f0e, 1);
    panelBg.fillRoundedRect(boxX - boxW / 2, boxY - boxH / 2, boxW, boxH, 30);
    panelBg.strokeRoundedRect(boxX - boxW / 2, boxY - boxH / 2, boxW, boxH, 30);
    this.audioPanelContainer.add(panelBg);

    // 4. Title
    const titleText = this.add.text(boxX, boxY - 170, i18n.t('settings.title'), {
      font: '36px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(titleText);

    // 5. Volume control bar indicator
    const volumeBarBg = this.add.graphics();
    volumeBarBg.fillStyle(0xe6ccb2, 1);
    volumeBarBg.fillRoundedRect(boxX - 131, boxY - 95, 263, 26, 8);
    this.audioPanelContainer.add(volumeBarBg);

    const volumeFill = this.add.graphics();
    this.audioPanelContainer.add(volumeFill);

    const drawVolumeBar = () => {
      volumeFill.clear();
      if (this.musicMuted) return;
      volumeFill.fillStyle(0x38b000, 1); // Green fill
      volumeFill.fillRoundedRect(boxX - 128, boxY - 91, 255 * this.musicVolume, 19, 6);
    };
    drawVolumeBar();

    // 6. Volume Percentage Text
    const volumePercentText = this.add.text(boxX, boxY - 45, i18n.t('audio.volume', { percent: Math.round(this.musicVolume * 100) }), {
      font: '24px "Outfit", sans-serif',
      fill: '#7f5539',
      fontWeight: '700'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(volumePercentText);

    // 7. Interactive volume adjustment buttons (+ and -)
    const btnSize = 60;

    // Minus Button
    const minusBtnBg = this.add.graphics();
    minusBtnBg.fillStyle(0xddb892, 1);
    minusBtnBg.lineStyle(4, 0x582f0e, 1);
    minusBtnBg.fillCircle(boxX - 178, boxY - 82, btnSize / 2);
    minusBtnBg.strokeCircle(boxX - 178, boxY - 82, btnSize / 2);
    this.audioPanelContainer.add(minusBtnBg);

    const minusText = this.add.text(boxX - 178, boxY - 82, '-', {
      font: '38px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(minusText);

    const minusZone = this.add.circle(boxX - 178, boxY - 82, btnSize / 2, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.audioPanelContainer.add(minusZone);

    // Plus Button
    const plusBtnBg = this.add.graphics();
    plusBtnBg.fillStyle(0xddb892, 1);
    plusBtnBg.lineStyle(4, 0x582f0e, 1);
    plusBtnBg.fillCircle(boxX + 178, boxY - 82, btnSize / 2);
    plusBtnBg.strokeCircle(boxX + 178, boxY - 82, btnSize / 2);
    this.audioPanelContainer.add(plusBtnBg);

    const plusText = this.add.text(boxX + 178, boxY - 82, '+', {
      font: '38px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(plusText);

    const plusZone = this.add.circle(boxX + 178, boxY - 82, btnSize / 2, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.audioPanelContainer.add(plusZone);

    // 8. Mute / Unmute Button
    const muteBtnX = boxX;
    const muteBtnY = boxY + 25;

    const muteBtnBg = this.add.graphics();
    muteBtnBg.fillStyle(0xb7b7a4, 1);
    muteBtnBg.lineStyle(5, 0x582f0e, 1);
    muteBtnBg.fillRoundedRect(muteBtnX - 131, muteBtnY - 30, 263, 60, 15);
    muteBtnBg.strokeRoundedRect(muteBtnX - 131, muteBtnY - 30, 263, 60, 15);
    this.audioPanelContainer.add(muteBtnBg);

    const getMuteLabel = () => this.musicMuted ? i18n.t('audio.muted') : i18n.t('audio.unmuted');
    const muteText = this.add.text(muteBtnX, muteBtnY, getMuteLabel(), {
      font: '26px "Outfit", sans-serif',
      fill: '#582f0e',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(muteText);

    const muteZone = this.add.rectangle(muteBtnX, muteBtnY, 263, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.audioPanelContainer.add(muteZone);

    // 9. Language Switcher Row
    const langRowY = boxY + 120;
    const langLabelText = this.add.text(boxX - 65, langRowY, i18n.t('settings.language'), {
      font: 'bold 22px "Outfit", sans-serif',
      fill: '#582f0e'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(langLabelText);

    const langBtnBg = this.add.graphics();
    langBtnBg.fillStyle(0xddb892, 1);
    langBtnBg.lineStyle(4, 0x582f0e, 1);
    langBtnBg.fillRoundedRect(boxX + 55, langRowY - 24, 140, 48, 15);
    langBtnBg.strokeRoundedRect(boxX + 55, langRowY - 24, 140, 48, 15);
    this.audioPanelContainer.add(langBtnBg);

    const langBtnText = this.add.text(boxX + 125, langRowY, i18n.t('settings.langButton'), {
      font: 'bold 20px "Outfit", sans-serif',
      fill: '#582f0e'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(langBtnText);

    const langBtnZone = this.add.rectangle(boxX + 125, langRowY, 140, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.audioPanelContainer.add(langBtnZone);

    // 10. Close Button (X)
    const closeBtnX = boxX + boxW / 2 - 35;
    const closeBtnY = boxY - boxH / 2 + 35;

    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0xd90429, 1);
    closeBtnBg.lineStyle(4, 0xffffff, 1);
    closeBtnBg.fillCircle(closeBtnX, closeBtnY, 24);
    closeBtnBg.strokeCircle(closeBtnX, closeBtnY, 24);
    this.audioPanelContainer.add(closeBtnBg);

    const closeText = this.add.text(closeBtnX, closeBtnY, 'X', {
      font: '24px "Outfit", sans-serif',
      fill: '#ffffff',
      fontWeight: '800'
    }).setOrigin(0.5);
    this.audioPanelContainer.add(closeText);

    const closeZone = this.add.circle(closeBtnX, closeBtnY, 24, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.audioPanelContainer.add(closeZone);

    // --- Interactive Logic ---
    const soundMgr = SoundManager.getInstance();

    // Minus Button Interaction
    minusZone.on('pointerdown', () => {
      soundMgr.playUiTap();
      this.musicVolume = Math.max(0.0, parseFloat((this.musicVolume - 0.05).toFixed(2)));
      soundMgr.setVolume('bgm', this.musicVolume);

      // If we decrease and it's muted, let's unmute so the change is felt
      if (this.musicMuted && this.musicVolume > 0) {
        this.musicMuted = false;
        soundMgr.setMuted('bgm', false);
        muteText.setText(getMuteLabel());
      }

      if (this.bgMusic) {
        this.bgMusic.setVolume(soundMgr.getEffectiveGain('bgm'));
      }

      volumePercentText.setText(i18n.t('audio.volume', { percent: Math.round(this.musicVolume * 100) }));
      drawVolumeBar();
    });

    // Plus Button Interaction
    plusZone.on('pointerdown', () => {
      soundMgr.playUiTap();
      this.musicVolume = Math.min(1.0, parseFloat((this.musicVolume + 0.05).toFixed(2)));
      soundMgr.setVolume('bgm', this.musicVolume);

      // Auto unmute when increasing volume
      if (this.musicMuted) {
        this.musicMuted = false;
        soundMgr.setMuted('bgm', false);
        muteText.setText(getMuteLabel());
      }

      if (this.bgMusic) {
        this.bgMusic.setVolume(soundMgr.getEffectiveGain('bgm'));
      }

      volumePercentText.setText(i18n.t('audio.volume', { percent: Math.round(this.musicVolume * 100) }));
      drawVolumeBar();
    });

    // Mute/Unmute Interaction
    muteZone.on('pointerdown', () => {
      soundMgr.playUiTap();
      this.musicMuted = !this.musicMuted;
      soundMgr.setMuted('bgm', this.musicMuted);

      if (this.bgMusic) {
        this.bgMusic.setVolume(soundMgr.getEffectiveGain('bgm'));
      }

      muteText.setText(getMuteLabel());
      drawVolumeBar();
    });

    // Language Toggle Interaction
    langBtnZone.on('pointerdown', () => {
      const nextLang = i18n.getLanguage() === 'en' ? 'es' : 'en';
      i18n.setLanguage(nextLang);
      soundMgr.playUiTap();
      this.refreshLocalizedTexts();

      titleText.setText(i18n.t('settings.title'));
      volumePercentText.setText(i18n.t('audio.volume', { percent: Math.round(this.musicVolume * 100) }));
      muteText.setText(getMuteLabel());
      langLabelText.setText(i18n.t('settings.language'));
      langBtnText.setText(i18n.t('settings.langButton'));
    });

    // Close Button Interaction
    closeZone.on('pointerdown', () => {
      soundMgr.playUiTap();
      this.isAudioPanelOpen = false;
      this.scratchBlockedUntilPointerUp = true; // Block scratching until user releases the mouse button
      this.input.setDefaultCursor('none');
      if (this.catPawSprite) this.catPawSprite.setVisible(true);

      this.audioPanelContainer.destroy();
      this.audioPanelContainer = null;
    });

    // Soft scale on hover for buttons
    minusZone.on('pointerover', () => minusText.setScale(1.2));
    minusZone.on('pointerout', () => minusText.setScale(1.0));
    plusZone.on('pointerover', () => plusText.setScale(1.2));
    plusZone.on('pointerout', () => plusText.setScale(1.0));
    muteZone.on('pointerover', () => muteText.setScale(1.05));
    muteZone.on('pointerout', () => muteText.setScale(1.0));
    langBtnZone.on('pointerover', () => langBtnText.setScale(1.08));
    langBtnZone.on('pointerout', () => langBtnText.setScale(1.0));
    closeZone.on('pointerover', () => closeText.setScale(1.2));
    closeZone.on('pointerout', () => closeText.setScale(1.0));
  }

  refreshLocalizedTexts() {
    const i18n = I18nManager.getInstance();
    if (this.daySignText) {
      this.daySignText.setText(i18n.t('hud.day', { day: this.day }));
    }
    if (this.deliveryTrayLabel) {
      this.deliveryTrayLabel.setText(i18n.t('hud.labels.delivery'));
    }
    if (this.ovenExtractBtnText) {
      this.ovenExtractBtnText.setText(i18n.t('stations.ovenExtract'));
    }
    if (this.editorIndicator) {
      this.editorIndicator.setText(i18n.t('editor.indicator'));
    }
    this.updateStockTexts();
    this.updateDrinkStockTexts();
    if (this.currentCustomer) {
      this.currentCustomer.updateProgress(this.currentCustomer.acceptedCookies ? this.currentCustomer.acceptedCookies.length : 0);
    }
  }

  acknowledgeTutorialDialog() {
    this.events.emit('game:dialog_acknowledged');
  }
}
